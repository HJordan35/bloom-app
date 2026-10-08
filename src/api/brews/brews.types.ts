import type { Bro } from "../bros/bros.types";
import type { RoastWithRoaster } from "../roasts/roasts.types";

export type TempUnit = "C" | "F";

export type Brew = {
  id: string;
  bro_id: string;
  roast_id: string;
  method: string;
  dose_g: number | null;
  grind_size: string | null;
  grinder: string | null;
  temp: number | null;
  temp_unit: TempUnit;
  brew_time_s: number | null;
  volume_ml: number | null;
  brew_notes: string | null;
  brew_results: string | null;
  dialed_in: boolean;
  started_at: string;
  finished_at: string | null;
  created_at: string;
};

export type BrewWithRoast = Brew & {
  roast: RoastWithRoaster;
  bro: Bro;
};

export type Recipe = Pick<Brew, "dose_g" | "grind_size" | "grinder" | "temp" | "temp_unit">;
/** Captured when finishing: how it was brewed. */
export type BrewProcess = Pick<Brew, "brew_time_s" | "volume_ml" | "brew_notes">;
/** Captured in the follow-up (or later): how it turned out. */
export type BrewOutcome = Pick<Brew, "brew_results" | "dialed_in">;

export type NewBrew = Recipe & Pick<Brew, "bro_id" | "roast_id" | "method">;
export type BrewUpdate = Partial<Omit<Brew, "id" | "bro_id">>;

/** Roast ids and grinders from a bro's recent brews, most recent first. */
export type BrewHistory = { roastIds: string[]; grinders: string[] };
