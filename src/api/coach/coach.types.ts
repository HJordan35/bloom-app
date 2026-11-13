import type { UIMessage } from "ai";
import type { Brew, BrewNotes, BrewProcess, Recipe } from "../brews/brews.types";

// What the coach's tools produce (supabase/functions/coach/tools.ts)

/** A question for the bro, with chips; a chip can stand for an id, e.g. a roast. */
export type CoachAsk = { question: string; options: { label: string; value?: string }[] };
export type CoachAnswer = { answer: string; value?: string };

type RoastAndMethod = Pick<Brew, "roast_id" | "method">;

export type CoachChange = {
  field:
    | "method"
    | "dose_g"
    | "grind_size"
    | "grinder"
    | "temp"
    | "brew_time_s"
    | "volume_ml"
    | "brew_notes";
  from: string | number | null;
  to: string | number | null;
  why: string | null;
};

/** The recipe on a card: a preferred recipe's fields. Time and volume are targets. */
export type CoachRecipeFields = Recipe &
  BrewProcess &
  BrewNotes &
  RoastAndMethod & { label: string | null };

/**
 * The coach's one card: a complete recipe, built from a base (the open brew, the chat's last
 * card, a recipe or brew of yours, or nothing) and what the coach changed from it.
 */
export type CoachRecipe = {
  base: { kind: "open_brew" | "last_card" | "recipe" | "brew" | "none"; id?: string };
  recipe: CoachRecipeFields;
  /** Empty for a recipe from scratch. */
  changes: CoachChange[];
  /** Why this recipe, when it's from scratch; a changed one says why per change. */
  summary: string | null;
  /** What to taste for, and the next move. */
  next: string;
};

/** A chat in the list of earlier ones. */
export type CoachChat = {
  id: string;
  /** The first thing you said. */
  title: string | null;
  updated_at: string;
  roast: { name: string } | null;
};

type Lookup = { input: unknown; output: string };

export type CoachMessage = UIMessage<
  never,
  never,
  {
    ask_user: { input: CoachAsk; output: CoachAnswer };
    propose_recipe: { input: unknown; output: CoachRecipe };
    find_roasts: Lookup;
    get_roast_brews: Lookup;
    get_my_brews: Lookup;
  }
>;
