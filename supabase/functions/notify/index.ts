// Sends a push to every other bro when someone brews, adds a roaster or roast, or endorses (Push, phase P2),
// and to every bro when a month's Brewsletter is published (Monthly Summary, phase S4).
// Called by Database Webhooks (insert on brews, roasters, roasts, endorsements, monthly_reports) with an
// x-notify-secret header.
// Deploy: npx supabase functions deploy notify --no-verify-jwt --project-ref <ref>
import { createClient } from "npm:@supabase/supabase-js@2";
// @deno-types="npm:@types/web-push@3"
import webpush from "npm:web-push@3";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

type Row = Record<string, string | number | null>;
type Message = { title: string; body: string; url: string; /** seconds; default an hour */ ttl?: number };

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "",
  Deno.env.get("VAPID_PUBLIC_KEY") ?? "",
  Deno.env.get("VAPID_PRIVATE_KEY") ?? "",
);

Deno.serve(async (req) => {
  // Only our webhooks (the gateway JWT check is off, see the deploy line)
  if (req.headers.get("x-notify-secret") !== Deno.env.get("NOTIFY_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { table, record } = await req.json();
  EdgeRuntime.waitUntil(
    notify(table, record).catch((e) => console.error(`notify failed for ${table}:`, e)),
  );
  return new Response(null, { status: 202 });
});

/** Build the message for this insert and send it to every device but the actor's (all, with no actor). */
async function notify(table: string, record: Row) {
  const actorId = record.bro_id ?? record.created_by;
  const actor = actorId ? await firstName(String(actorId)) : "";
  const { ttl = 3600, ...message } = await MESSAGES[table](record, actor);

  let devices = supabase.from("push_subscriptions").select("endpoint, p256dh, auth");
  if (actorId) devices = devices.neq("bro_id", actorId);
  const { data: subscriptions, error } = await devices;
  if (error) throw error;

  await Promise.allSettled(
    subscriptions.map(async ({ endpoint, p256dh, auth }) => {
      try {
        await webpush.sendNotification(
          { endpoint, keys: { p256dh, auth } },
          JSON.stringify(message),
          { TTL: ttl, urgency: "high" }, // a stale "is brewing" isn't worth delivering
        );
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // The device unsubscribed or the app was removed
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
        } else {
          console.error(`push failed (${status}) for ${endpoint}:`, e);
        }
      }
    }),
  );
}

const MESSAGES: Record<string, (r: Row, actor: string) => Promise<Message>> = {
  brews: async (r, actor) => {
    const roast = await roastWithRoaster(String(r.roast_id));
    return {
      title: `${actor} is brewing`,
      body: join(r.method, `${roast.name} — ${roast.roaster}`),
      url: `/brews/${r.id}`,
    };
  },
  roasters: async (r, actor) => ({
    title: `${actor} added a roaster`,
    body: join(r.name, r.location),
    url: `/library/roasters/${r.id}`,
  }),
  roasts: async (r, actor) => {
    const roast = await roastWithRoaster(String(r.id));
    return {
      title: `${actor} added a roast`,
      body: `${roast.name} — ${roast.roaster}`,
      url: `/library/roasts/${r.id}`,
    };
  },
  monthly_reports: async (r) => {
    const month = String(r.month).slice(0, 7); // "2026-09-01" → "2026-09"
    const name = new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "long" });
    return {
      title: `The ${name} Brewsletter is in`,
      body: "Showcase, stats and everyone's insights",
      url: `/reports/${month}`,
      ttl: 86400, // unlike "is brewing", still worth reading tomorrow
    };
  },
  endorsements: async (r, actor) => {
    const roast = await roastWithRoaster(String(r.roast_id));
    const note = r.note ? `"${clip(String(r.note), 60)}"` : null;
    return {
      title: `${actor} endorsed ${roast.name}`,
      body: join(r.rating != null ? `${r.rating}/10` : null, r.method, note),
      url: `/library/roasts/${r.roast_id}`,
    };
  },
};

async function firstName(broId: string) {
  const { data } = await supabase.from("bros").select("first_name").eq("id", broId).single();
  return data?.first_name ?? "A bro";
}

async function roastWithRoaster(roastId: string) {
  const { data } = await supabase
    .from("roasts")
    .select("name, roasters(name)")
    .eq("id", roastId)
    .single<{ name: string; roasters: { name: string } }>();
  return { name: data?.name ?? "a roast", roaster: data?.roasters.name ?? "" };
}

/** The parts that are present, joined with " · ". */
function join(...parts: (string | number | null | undefined)[]) {
  return parts.filter((p) => p != null && p !== "").join(" · ");
}

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
