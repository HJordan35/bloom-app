import { supabase } from "../../lib/supabase";
import type { Roast } from "../../lib/types";
import { unwrap } from "../../lib/unwrap";

const BUCKET = "roast-photos";

/** Upload a bag photo and make it the roast's photo. Each upload gets a fresh path. */
export async function uploadRoastPhoto(roastId: string, file: File) {
  const ext = file.type.split("/")[1] ?? "jpg";
  const path = `${roastId}/original-${Date.now()}.${ext}`;
  unwrap(await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type }));
  unwrap(await supabase.from("roasts").update({ photo_original_path: path }).eq("id", roastId));
}

/** Public URL of the roast's photo, or null if it has none. */
export function roastPhotoUrl(roast: Pick<Roast, "photo_original_path">) {
  const path = roast.photo_original_path;
  return path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null;
}
