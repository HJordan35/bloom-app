import type { CoachRecipeFields } from "../../api/coach/coach.types";
import { mmss, volume } from "../../lib/format";

/** A recipe's target time and volume on one line: "3:15 · 250 ml", or null without either. */
export function targetLine(recipe: Pick<CoachRecipeFields, "brew_time_s" | "volume_ml">) {
  const targets = [
    recipe.brew_time_s != null && mmss(recipe.brew_time_s),
    recipe.volume_ml != null && volume(recipe.volume_ml),
  ].filter(Boolean);
  return targets.length > 0 ? targets.join(" · ") : null;
}

/**
 * A coach's recipe as a brew can hold it. A brew's time and volume are what happened, so the
 * recipe's targets go at the top of its notes instead.
 */
export function recipeForBrew(recipe: CoachRecipeFields) {
  const target = targetLine(recipe);
  return {
    ...recipe,
    brew_time_s: null,
    volume_ml: null,
    brew_notes:
      [target && `Target ${target}`, recipe.brew_notes].filter(Boolean).join("\n") || null,
  };
}
