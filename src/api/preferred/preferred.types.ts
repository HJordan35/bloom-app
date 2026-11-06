import type { BrewNotes, BrewProcess, Recipe, TempUnit } from "../brews/brews.types";
import type { Bro } from "../bros/bros.types";
import type { RoastWithRoaster } from "../roasts/roasts.types";

/** A bro's go-to recipe for a roast + method. Time and volume are estimates. */
export type PreferredRecipe = {
  id: string;
  bro_id: string;
  roast_id: string;
  method: string;
  label: string | null;
  dose_g: number | null;
  grind_size: string | null;
  grinder: string | null;
  temp: number | null;
  temp_unit: TempUnit;
  brew_time_s: number | null;
  volume_ml: number | null;
  brew_notes: string | null;
  /** The brew it was copied from, if any. */
  source_brew_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PreferredRecipeWithRoast = PreferredRecipe & {
  roast: RoastWithRoaster;
  bro: Bro;
  /** The brew it was copied from, for the credit line. */
  source: { id: string; started_at: string; bro: Pick<Bro, "id" | "first_name"> } | null;
};

export type NewPreferredRecipe = Recipe &
  BrewProcess &
  BrewNotes &
  Pick<PreferredRecipe, "bro_id" | "roast_id" | "method" | "label" | "source_brew_id">;
export type PreferredRecipeUpdate = Partial<Omit<NewPreferredRecipe, "bro_id">>;
