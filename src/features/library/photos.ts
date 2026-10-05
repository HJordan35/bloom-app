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
  unwrap(await supabase.functions.invoke("studio-photo", { body: { roast_id: roastId } }));
}

/** The photo to show: the studio version once it's ready, otherwise the original. */
export function roastPhoto(
  roast: Pick<Roast, "photo_original_path" | "photo_path" | "photo_status">,
) {
  const path =
    roast.photo_status === "ready" && roast.photo_path
      ? roast.photo_path
      : roast.photo_original_path;
  return {
    url: path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null,
    developing: roast.photo_status === "processing",
  };
}
