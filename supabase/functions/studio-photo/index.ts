// Re-shoots a roast's bag photo in the locked studio (Roast Gallery, phase G2).
// Deploy: npx supabase functions deploy studio-photo --no-verify-jwt --project-ref <ref>
import { decodeBase64, encodeBase64 } from "jsr:@std/encoding@1/base64";
import { createClient } from "npm:@supabase/supabase-js@2";
import { STUDIO_PROMPT } from "./prompt.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

// Pinned so every bag goes through the same settings
const MODEL = "gemini-3.1-flash-image";
const SEED = 1;
const BUCKET = "roast-photos";
const PLATE_PATH = "_studio/studio-plate.png";

const PLATE_LABEL =
  "STUDIO PLATE — the locked studio set, empty. Photograph the bag in exactly this set: same background, tabletop, lighting, camera position, framing and color grade. Nothing from this image is the product.";
const SOURCE_LABEL =
  "SOURCE PHOTOGRAPH — the coffee package to photograph. Use it only as the product reference: ignore its angle. " +
  "Keep its packaging type exactly: a box stays a box, a tin stays a tin, a bag stays a bag. " +
  "Orientation is locked: front panel turned about 15 degrees toward camera-left, the package's left edge (as seen) slightly farther away, " +
  "a thin sliver of side panel visible on the right. Never straight on, never toward camera-right. " +
  "Never mirror or flip the package — its text must read correctly.";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  // Only signed-in bros (the gateway JWT check is off, see the deploy line)
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data: auth } = await supabase.auth.getUser(token);
  const { data: bro } = await supabase
    .from("bros")
    .select("id")
    .eq("auth_id", auth.user?.id ?? "")
    .maybeSingle();
  if (!bro) return json({ error: "Not a bro" }, 401);

  const { roast_id } = await req.json();
  const { data: roast, error } = await supabase
    .from("roasts")
    .update({ photo_status: "processing" })
    .eq("id", roast_id)
    .select("photo_original_path")
    .single();
  if (error || !roast?.photo_original_path) return json({ error: "No photo to develop" }, 400);

  EdgeRuntime.waitUntil(
    develop(roast_id, roast.photo_original_path).catch(async (e) => {
      console.error(`studio-photo failed for ${roast_id}:`, e);
      await supabase.from("roasts").update({ photo_status: "failed" }).eq("id", roast_id);
    }),
  );
  return json({ status: "processing" }, 202);
});

/** Original + plate → Gemini → studio photo saved on the roast. */
async function develop(roastId: string, originalPath: string) {
  const [original, plate] = await Promise.all([download(originalPath), download(PLATE_PATH)]);
  const image = await generate(original, plate);
  const path = `${roastId}/studio-${Date.now()}.jpg`;
  const upload = await supabase.storage
    .from(BUCKET)
    .upload(path, decodeBase64(image.data), { contentType: image.mime_type });
  if (upload.error) throw upload.error;
  const update = await supabase
    .from("roasts")
    .update({ photo_path: path, photo_status: "ready" })
    .eq("id", roastId);
  if (update.error) throw update.error;
}

type ImagePart = { type: "image"; mime_type: string; data: string };

async function download(path: string): Promise<ImagePart> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw error;
  return {
    type: "image",
    mime_type: data.type || "image/jpeg",
    data: encodeBase64(new Uint8Array(await data.arrayBuffer())),
  };
}

async function generate(original: ImagePart, plate: ImagePart): Promise<ImagePart> {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "x-goog-api-key": Deno.env.get("GEMINI_API_KEY") ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        { type: "text", text: STUDIO_PROMPT },
        { type: "text", text: PLATE_LABEL },
        plate,
        { type: "text", text: SOURCE_LABEL },
        original,
      ],
      response_format: {
        type: "image",
        mime_type: "image/jpeg",
        aspect_ratio: "4:5",
        image_size: "1K",
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
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
