// The coach's tools: lookups, web search, a question for the bro (answered in the app),
// and its one card: a complete recipe, given as a base and what changes from it.

import type { GoogleProvider } from "npm:@ai-sdk/google@4";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { tool } from "npm:ai@7";
import { z } from "npm:zod@4";
import { BREW_SELECT, type BrewRow, brewForAgent } from "../_shared/brews.ts";
import { json, type OpenBrew, roastBlock } from "./context.ts";

// The same list as src/lib/constants.ts
const BREW_METHODS = [
  "BeeHouse",
  "Espresso",
  "V60",
  "Chemex",
  "Pulsar",
  "AeroPress",
  "French Press",
  "Moka",
  "Kalita",
] as const;

const FIELDS = [
  "method",
  "dose_g",
  "grind_size",
  "grinder",
  "temp",
  "brew_time_s",
  "volume_ml",
  "brew_notes",
] as const;
type Field = (typeof FIELDS)[number];

/** A recipe as the card carries it: a preferred recipe's fields. Time and volume are targets. */
export type CardRecipe = {
  roast_id: string;
  method: string;
  label: string | null;
  dose_g: number | null;
  grind_size: string | null;
  grinder: string | null;
  temp: number | null;
  temp_unit: string;
  brew_time_s: number | null;
  volume_ml: number | null;
  brew_notes: string | null;
};

const RECIPE_SELECT =
  "roast_id, method, label, dose_g, grind_size, grinder, temp, temp_unit, brew_time_s, volume_ml, brew_notes";
// A brew's time and volume are what happened, not targets, so they're left behind
const BREW_SELECT_BASE =
  "roast_id, method, dose_g, grind_size, grinder, temp, temp_unit, brew_notes";

/** What the turn knows beyond the request: the roast once settled, and this chat's last card. */
export type Seen = { roastId: string | null; lastCard: CardRecipe | null };

export function coachTools(
  db: SupabaseClient,
  google: GoogleProvider,
  bro: { id: string },
  open: OpenBrew | null,
  seen: Seen,
) {
  return {
    google_search: google.tools.googleSearch({}),

    find_roasts: tool({
      description:
        "Search the group's library for a roast by name or roaster, when the one the bro means isn't in the context. Returns roast ids.",
      inputSchema: z.object({ query: z.string().describe("Part of the roast or roaster name") }),
      execute: async ({ query }) => {
        const { data, error } = await db
          .from("roasts")
          .select("id, name, region, roast_level, roaster:roasters(name)");
        if (error) throw error;
        const words = query.toLowerCase().split(/\s+/).filter(Boolean);
        const rows = data as unknown as { name: string; roaster: { name: string } }[];
        return json(
          rows
            .filter((r) => {
              const text = `${r.name} ${r.roaster.name}`.toLowerCase();
              return words.every((w) => text.includes(w));
            })
            .slice(0, 8),
        );
      },
    }),

    get_roast_brews: tool({
      description:
        "Everything the group knows about brewing a roast: its details, every bro's bookmarked recipes, the latest finished brews and the endorsements. Call it once a roast is settled, unless the context already has that roast.",
      inputSchema: z.object({ roast_id: z.string() }),
      execute: async ({ roast_id }) => {
        const block = await roastBlock(db, roast_id);
        if (!block)
          throw new Error(`No roast ${roast_id}. Use an id from the context or find_roasts.`);
        seen.roastId = roast_id;
        return block;
      },
    }),

    get_my_brews: tool({
      description:
        "The bro's own brews beyond the context, newest first, with recipe, brew notes and tasting results. Filter by roast, method or grinder, e.g. every brew on a grinder to anchor a grind setting.",
      inputSchema: z.object({
        roast_id: z.string().optional(),
        method: z.string().optional().describe("e.g. V60, Espresso"),
        grinder: z.string().optional(),
        limit: z.number().int().optional().describe("Max rows, up to 40 (default 15)"),
      }),
      execute: async ({ roast_id, method, grinder, limit }) => {
        let query = db.from("brews").select(BREW_SELECT).eq("bro_id", bro.id);
        if (roast_id) query = query.eq("roast_id", roast_id);
        if (method) query = query.ilike("method", method);
        if (grinder) query = query.ilike("grinder", grinder);
        const { data, error } = await query
          .order("started_at", { ascending: false })
          .limit(Math.min(limit ?? 15, 40));
        if (error) throw error;
        return json((data as unknown as BrewRow[]).map(brewForAgent));
      },
    }),

    // No execute: the app shows the chips and sends back the answer, which ends the turn
    ask_user: tool({
      description:
        "Ask the bro one question and wait for the answer. Use it whenever the answer changes what you'd suggest: which roast, which method, how the last cup tasted, how far along the brew is. The app shows the options as chips; the bro can also type. Don't write the question in text as well.",
      inputSchema: z.object({
        question: z.string().describe("Under 90 characters"),
        options: z
          .array(
            z.object({
              label: z.string().describe("Chip text, 1–4 words"),
              value: z.string().optional().describe("An id the chip stands for, e.g. a roast_id"),
            }),
          )
          .min(2)
          .max(4),
      }),
      outputSchema: z.object({ answer: z.string(), value: z.string().optional() }),
    }),

    propose_recipe: tool({
      description:
        "Your one card: a complete recipe the bro can brew, apply or save. You give a base and only what changes from it; the app fills in the rest from the base and shows the whole recipe with your changes marked. Say why in a text line before calling it. With base none (nothing to start from) every field comes from you.",
      inputSchema: z.object({
        base: z.object({
          kind: z
            .enum(["open_brew", "last_card", "recipe", "brew", "none"])
            .describe(
              "open_brew: the brew in progress. last_card: the recipe from your previous card in this conversation (use it when iterating on one). recipe / brew: one of the context's bookmarked recipes or past brews, by id. none: a recipe from scratch.",
            ),
          id: z.string().optional().describe("recipe_id or brew id, for kind recipe or brew"),
        }),
        roast_id: z.string().optional().describe("Only with base none"),
        temp_unit: z
          .enum(["F", "C"])
          .optional()
          .describe("Only with base none; otherwise the base's"),
        label: z
          .string()
          .optional()
          .describe("Only to tell it apart from another recipe, e.g. Iced"),
        changes: z
          .array(
            z.object({
              field: z.enum(FIELDS),
              to: z
                .string()
                .describe(
                  "The new value. Numbers for dose_g, temp, volume_ml (espresso: yield) and brew_time_s (seconds). grind_size: the grinder's own setting, or an empty string to leave it blank. brew_notes: the full steps, one short line each, at most 8 lines; repeat the lines you're keeping exactly.",
                ),
              why: z
                .string()
                .optional()
                .describe(
                  "Under 80 characters, tied to what the bro tasted or to a brew. Required unless base is none",
                ),
            }),
          )
          .min(1),
        summary: z
          .string()
          .optional()
          .describe("Why this recipe, under 140 characters. Required with base none"),
        next: z.string().describe("What to taste for, and the next move. Under 140 characters"),
      }),
      execute: async ({ base, roast_id, temp_unit, label, changes, summary, next }) => {
        const scratch = base.kind === "none";
        const from = await loadBase(db, base, open, seen, { roast_id, temp_unit });
        if (base.kind === "open_brew" && changes.some((c) => isTarget(c.field))) {
          throw new Error(
            "A brew in progress has no target fields. Put a time or volume target in a brew_notes line or in next.",
          );
        }
        if (scratch && !summary) throw new Error("Give a summary with base none.");

        const recipe: CardRecipe = { ...from, label: label ?? from.label };
        const marked = changes.map((change) => {
          if (!scratch && !change.why) throw new Error(`Say why ${change.field} changes.`);
          const before = from[change.field];
          const to = fieldValue(change.field, change.to, recipe.temp_unit);
          if (!scratch && to === before) throw new Error(`${change.field} is already ${before}.`);
          Object.assign(recipe, { [change.field]: to });
          return { field: change.field, from: before, to, why: change.why ?? null };
        });

        if (recipe.dose_g == null || recipe.temp == null || !recipe.brew_notes) {
          throw new Error("A recipe needs at least dose_g, temp and brew_notes.");
        }
        if (recipe.volume_ml != null) {
          const ratio = recipe.volume_ml / recipe.dose_g;
          if (ratio < 1 || ratio > 22) {
            throw new Error(`A 1:${ratio.toFixed(1)} ratio is off. Check dose and volume.`);
          }
        }
        seen.roastId = recipe.roast_id;
        seen.lastCard = recipe;
        // From scratch there's no before to show: the card is just the recipe
        return { base, recipe, changes: scratch ? [] : marked, summary: summary ?? null, next };
      },
    }),
  };
}

const isTarget = (field: Field) => field === "brew_time_s" || field === "volume_ml";

/** The recipe a card starts from. From scratch it's empty but for its roast and unit. */
async function loadBase(
  db: SupabaseClient,
  base: { kind: "open_brew" | "last_card" | "recipe" | "brew" | "none"; id?: string },
  open: OpenBrew | null,
  seen: Seen,
  scratch: { roast_id?: string; temp_unit?: string },
): Promise<CardRecipe> {
  const blank = { label: null, brew_time_s: null, volume_ml: null };

  if (base.kind === "none") {
    const { data: roast } = await db
      .from("roasts")
      .select("id")
      .eq("id", scratch.roast_id ?? "")
      .maybeSingle();
    if (!roast) throw new Error(`No roast ${scratch.roast_id}. Pass a roast_id from the context.`);
    if (!scratch.temp_unit) throw new Error("Pass temp_unit with base none.");
    return {
      ...blank,
      roast_id: roast.id,
      method: "",
      dose_g: null,
      grind_size: null,
      grinder: null,
      temp: null,
      temp_unit: scratch.temp_unit,
      brew_notes: null,
    };
  }
  if (base.kind === "open_brew") {
    if (!open) throw new Error("No brew is open. Base it on last_card, a recipe or a past brew.");
    return {
      ...blank,
      roast_id: open.roast.id,
      method: open.method,
      dose_g: open.dose_g,
      grind_size: open.grind_size,
      grinder: open.grinder,
      temp: open.temp,
      temp_unit: open.temp_unit,
      brew_notes: open.brew_notes,
    };
  }
  if (base.kind === "last_card") {
    if (!seen.lastCard) throw new Error("There's no earlier card in this conversation.");
    return seen.lastCard;
  }
  if (!base.id) throw new Error("Pass the base's id.");
  const { data } = await db
    .from(base.kind === "recipe" ? "preferred_recipes" : "brews")
    .select(base.kind === "recipe" ? RECIPE_SELECT : BREW_SELECT_BASE)
    .eq("id", base.id)
    .maybeSingle();
  if (!data) throw new Error(`No ${base.kind} ${base.id}. Use an id from the context.`);
  return { ...blank, ...(data as unknown as CardRecipe) };
}

/** A change's new value, typed for its field and checked. */
function fieldValue(field: Field, to: string, unit: string) {
  const text = to.trim();
  if (field === "method") {
    const method = BREW_METHODS.find((m) => m.toLowerCase() === text.toLowerCase());
    if (!method) throw new Error(`method is one of: ${BREW_METHODS.join(", ")}.`);
    return method;
  }
  if (field === "grind_size" || field === "grinder") {
    if (text.length > 40) throw new Error(`${field} is a short value, e.g. 18.`);
    // Empty clears it: a grind setting from someone else's grinder mustn't carry over
    return text || null;
  }
  if (field === "brew_notes") {
    if (!text || text.split("\n").length > 8) throw new Error("brew_notes is 1 to 8 short lines.");
    return text;
  }
  const value = Number(text);
  if (!Number.isFinite(value)) throw new Error(`${field} needs a number, got "${to}".`);
  if (field === "dose_g" && (value < 5 || value > 100))
    throw new Error(`A ${value} g dose is off.`);
  if (field === "temp") {
    const [low, high] = unit === "C" ? [1, 100] : [34, 212];
    if (value < low || value > high)
      throw new Error(`${value}°${unit} is off; the unit is °${unit}.`);
  }
  if (field === "brew_time_s" && (value < 5 || value > 3600))
    throw new Error("brew_time_s is in seconds.");
  if (field === "volume_ml" && value <= 0) throw new Error("volume_ml is off.");
  return value;
}
