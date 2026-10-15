// Photographs the month's new coffees together in the locked studio (Brewsletter, phase B1).
// POST { month: "2026-09" } with an x-insights-secret header → 202, then generates and saves it,
// and tries to publish the month's Brewsletter (phase S4).
// Deploy: npx supabase functions deploy showcase --no-verify-jwt --project-ref <ref>
import { decodeBase64, encodeBase64 } from "jsr:@std/encoding@1/base64";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PROMPT_VERSION, SHOWCASE_PROMPT } from "./prompt.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

// The same model and studio as studio-photo, so the showcase matches the gallery
const MODEL = "gemini-3.1-flash-image";
const SEED = 1;
const BUCKET = "roast-photos";
const PLATE_PATH = "_studio/studio-plate.png";
// The model keeps up to 10 products faithful; 8 also keeps the lineup readable on a phone
const MAX_ROASTS = 8;
const SECRET = Deno.env.get("INSIGHTS_SECRET");

const PLATE_LABEL =
  "STUDIO PLATE — the locked studio set, empty. Photograph the group in exactly this set: same background, tabletop, lighting, camera position and color grade. Nothing from this image is a product.";

type NewRoast = {
  roast_id: string;
  name: string;
  roaster: string;
  photo_path: string | null;
  brews: number;
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  // Only callers with the secret (the gateway JWT check is off, see the deploy line)
  if (!SECRET || req.headers.get("x-insights-secret") !== SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { month } = await req.json();
  if (!/^\d{4}-\d{2}$/.test(month ?? "")) return json({ error: "month must be YYYY-MM" }, 400);

  EdgeRuntime.waitUntil(
    run(month)
      .then(() => publish(month))
      .catch((e) => console.error(`showcase failed for ${month}:`, e)),
  );
  return json({ status: "started" }, 202);
});

/** Publishes the month if the showcase was its last missing piece; the new row's webhook sends the push. */
async function publish(month: string) {
  const { error } = await supabase.rpc("publish_report", { p_month: `${month}-01` });
  if (error) throw error;
}

/** Record a run, photograph the new roasts that have studio photos, and save the image. */
async function run(month: string) {
  const day = `${month}-01`;
  const { data: row, error } = await supabase
    .from("showcase_runs")
    .insert({ month: day, model: MODEL, prompt_version: PROMPT_VERSION })
    .select("id")
    .single();
  if (error) throw error;
  const finish = (fields: Record<string, unknown>) =>
    supabase
      .from("showcase_runs")
      .update({ ...fields, finished_at: new Date().toISOString() })
      .eq("id", row.id);

  try {
    const { data, error } = await supabase.rpc("month_new_roasts", { p_month: day });
    if (error) throw error;
    // Most brewed first (the function's order), so the cap keeps the month's favourites
    const roasts = (data as NewRoast[]).filter((r) => r.photo_path).slice(0, MAX_ROASTS);
    if (roasts.length === 0) {
      await finish({ status: "skipped", error: "No new roasts with a studio photo" });
      return;
    }

    const [plate, ...photos] = await Promise.all([
      download(PLATE_PATH),
      ...roasts.map((r) => download(r.photo_path ?? "")),
    ]);
    const image = await generate([
      { type: "text", text: SHOWCASE_PROMPT },
      { type: "text", text: PLATE_LABEL },
      plate,
      ...roasts.flatMap((r, i) => [
        {
          type: "text" as const,
          text: `PACKAGE ${i + 1} of ${roasts.length} — ${r.name} by ${r.roaster}. Product reference only; photograph it in the group.`,
        },
        photos[i],
      ]),
    ]);

    const path = `_showcase/${month}/showcase-${Date.now()}.jpg`;
    const upload = await supabase.storage
      .from(BUCKET)
      .upload(path, decodeBase64(image.data), { contentType: image.mime_type });
    if (upload.error) throw upload.error;
    await finish({
      status: "succeeded",
      image_path: path,
      roast_ids: roasts.map((r) => r.roast_id),
    });
  } catch (e) {
    await finish({ status: "failed", error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}

type ImagePart = { type: "image"; mime_type: string; data: string };
type Part = ImagePart | { type: "text"; text: string };

async function download(path: string): Promise<ImagePart> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw error;
  return {
    type: "image",
    mime_type: data.type || "image/jpeg",
    data: encodeBase64(new Uint8Array(await data.arrayBuffer())),
  };
}

async function generate(input: Part[]): Promise<ImagePart> {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "x-goog-api-key": Deno.env.get("GEMINI_API_KEY") ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input,
      response_format: {
        type: "image",
        mime_type: "image/jpeg",
        aspect_ratio: "4:5",
        // 2K so each bag in a group of 8 keeps its detail (single bags use 1K)
        image_size: "2K",
      },
      generation_config: { seed: SEED },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const interaction = await res.json();
  const image = (interaction.steps ?? [])
    .flatMap((step: { content?: ImagePart[] }) => step.content ?? [])
    .find((part: ImagePart) => part.type === "image" && part.data);
  if (!image) throw new Error(`No image from Gemini: ${JSON.stringify(interaction).slice(0, 500)}`);
  return image;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
