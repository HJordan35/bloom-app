import { supabase } from "../../lib/supabase";
import type { Roast } from "../../lib/types";
import { unwrap } from "../../lib/unwrap";

const BUCKET = "roast-photos";

/** Upload a bag photo, make it the roast's photo, and start the studio re-shoot. */
export async function uploadRoastPhoto(roastId: string, file: File) {
  const ext = file.type.split("/")[1] ?? "jpg";
  const path = `${roastId}/original-${Date.now()}.${ext}`;
  unwrap(await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type }));
  unwrap(await supabase.from("roasts").update({ photo_original_path: path }).eq("id", roastId));
  await developRoastPhoto(roastId);
}

/** Run the roast's original through the studio (the studio-photo Edge Function). */
export async function developRoastPhoto(roastId: string) {
  unwrap(await supabase.functions.invoke("studio-photo", { body: { roast_id: roastId } }));
}

export function photoUrl(path: string | null) {
  return path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null;
}

/** The photo to show: the studio version once it's ready, otherwise the original. */
export function roastPhoto(
  roast: Pick<Roast, "photo_original_path" | "photo_path" | "photo_status">,
) {
  const ready = roast.photo_status === "ready" && roast.photo_path;
  return {
    url: photoUrl(ready ? roast.photo_path : roast.photo_original_path),
    developing: roast.photo_status === "processing",
  };
}
