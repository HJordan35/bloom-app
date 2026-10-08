import type { Roaster } from "../roasters/roasters.types";

export type RoastLevel = "light" | "medium" | "dark";

export type Roast = {
  id: string;
  roaster_id: string;
  name: string;
  roast_level: RoastLevel;
  region: string | null;
  /** Storage path of the bag photo as uploaded, in the roast-photos bucket. */
  photo_original_path: string | null;
  /** The studio version, made from the original by the studio-photo Edge Function. */
  photo_path: string | null;
  photo_status: "processing" | "ready" | "failed" | null;
  created_by: string;
  created_at: string;
};

export type RoastWithRoaster = Roast & { roaster: Roaster };

export type NewRoast = Pick<Roast, "roaster_id" | "name" | "roast_level" | "region" | "created_by">;
