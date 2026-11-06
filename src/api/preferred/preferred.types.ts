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
  created_at: string;
  updated_at: string;
};

export type PreferredRecipeWithRoast = PreferredRecipe & {
  roast: RoastWithRoaster;
  bro: Bro;
};

export type NewPreferredRecipe = Recipe &
  BrewProcess &
  BrewNotes &
  Pick<PreferredRecipe, "bro_id" | "roast_id" | "method" | "label">;
/** Narrows the list in the query itself; every part is optional. */
export type PreferredFilter = {
  /** Any of these bros; empty or missing means every bro. */
  broIds?: readonly string[];
  roastId?: string;
  /** Any of these; empty or missing means every method. */
  methods?: readonly string[];
};

export type PreferredRecipeUpdate = Partial<Omit<NewPreferredRecipe, "bro_id">>;
