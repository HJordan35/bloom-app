import { supabase } from "../../lib/supabase";
import { unwrap } from "../api.utils";
import type { NewRoast, RoastWithRoaster } from "./roasts.types";

export const ROAST_SELECT = "*, roaster:roasters(*)";
export const PHOTO_BUCKET = "roast-photos";

export async function fetchRoasts() {
  return unwrap<RoastWithRoaster[]>(
    await supabase.from("roasts").select(ROAST_SELECT).order("name"),
  );
}

export async function fetchRoast(id: string) {
  return unwrap<RoastWithRoaster>(
    await supabase.from("roasts").select(ROAST_SELECT).eq("id", id).single(),
  );
}

export async function createRoast(input: NewRoast) {
  return unwrap<RoastWithRoaster>(
    await supabase.from("roasts").insert(input).select(ROAST_SELECT).single(),
  );
}

/** Upload a bag photo, make it the roast's photo, and start the studio re-shoot. */
export async function uploadRoastPhoto(roastId: string, file: File) {
  const ext = file.type.split("/")[1] ?? "jpg";
  const path = `${roastId}/original-${Date.now()}.${ext}`;
  unwrap(await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type }));
  unwrap(await supabase.from("roasts").update({ photo_original_path: path }).eq("id", roastId));
  unwrap(await supabase.functions.invoke("studio-photo", { body: { roast_id: roastId } }));
}
