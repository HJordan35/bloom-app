import { supabase } from "../../lib/supabase";
import { unwrap } from "../api.utils";
import { BREW_SELECT } from "../brews/brews.service";
import type {
  NewPreferredRecipe,
  PreferredRecipe,
  PreferredRecipeUpdate,
  PreferredRecipeWithRoast,
} from "./preferred.types";

// Same joins as a brew: both have roast_id and bro_id
const PREFERRED_SELECT = BREW_SELECT;

export async function fetchPreferredRecipe(id: string) {
  return unwrap<PreferredRecipeWithRoast>(
    await supabase.from("preferred_recipes").select(PREFERRED_SELECT).eq("id", id).single(),
  );
}

/** Every bro's preferred recipes, newest first: a small list, filtered on the client. */
export async function fetchPreferredRecipes() {
  return unwrap<PreferredRecipeWithRoast[]>(
    await supabase
      .from("preferred_recipes")
      .select(PREFERRED_SELECT)
      .order("created_at", { ascending: false }),
  );
}

export async function fetchPreferredForRoast(roastId: string) {
  return unwrap<PreferredRecipeWithRoast[]>(
    await supabase
      .from("preferred_recipes")
      .select(PREFERRED_SELECT)
      .eq("roast_id", roastId)
      .order("created_at", { ascending: false }),
  );
}

export async function createPreferredRecipe(input: NewPreferredRecipe) {
  return unwrap<PreferredRecipe>(
    await supabase.from("preferred_recipes").insert(input).select().single(),
  );
}

export async function updatePreferredRecipe(id: string, fields: PreferredRecipeUpdate) {
  unwrap(
    await supabase
      .from("preferred_recipes")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id),
  );
}

export async function deletePreferredRecipe(id: string) {
  unwrap(await supabase.from("preferred_recipes").delete().eq("id", id));
}
