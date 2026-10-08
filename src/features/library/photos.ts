import { PHOTO_BUCKET } from "../../api/roasts/roasts.service";
import type { Roast } from "../../api/roasts/roasts.types";
import { supabase } from "../../lib/supabase";

// Upload moved to src/api/roasts; re-exported until every caller migrates (docs/query/PLAN.md)
export { uploadRoastPhoto } from "../../api/roasts/roasts.service";

/** The photo to show: the studio version once it's ready, otherwise the original. */
export function roastPhoto(
  roast: Pick<Roast, "photo_original_path" | "photo_path" | "photo_status">,
) {
  const path =
    roast.photo_status === "ready" && roast.photo_path
      ? roast.photo_path
      : roast.photo_original_path;
  return {
    url: path ? supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl : null,
    developing: roast.photo_status === "processing",
  };
}
