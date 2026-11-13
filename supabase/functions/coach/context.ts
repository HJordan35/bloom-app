// What the coach knows at the start of a turn, gathered by code (no LLM): whether you're
// brewing, the brew as it stands, your gear and recipes, and the roast if one is settled.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { BREW_SELECT, type BrewRow, brewForAgent, localTime } from "../_shared/brews.ts";

export const json = (value: unknown) => JSON.stringify(value, null, 1);

const RECIPE_SELECT =
  "id, bro_id, roast_id, method, label, dose_g, grind_size, grinder, temp, temp_unit, " +
  "brew_time_s, volume_ml, brew_notes, updated_at, " +
  "roast:roasts(name, roaster:roasters(name)), bro:bros(first_name)";

export type RecipeRow = {
  id: string;
  bro_id: string;
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
  roast: { name: string; roaster: { name: string } };
  bro: { first_name: string };
};

export type OpenBrew = BrewRow & { preferred_recipe_id: string | null };

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** A preferred recipe as compact JSON for the coach. Time and volume are the bro's estimates. */
export function recipeForAgent(r: RecipeRow) {
  return {
    recipe_id: r.id,
    bro: r.bro.first_name,
    roast: r.roast.name,
    roast_id: r.roast_id,
    roaster: r.roast.roaster.name,
    method: r.method,
    label: r.label,
    dose_g: r.dose_g,
    grind: r.grind_size,
    grinder: r.grinder,
    temp: r.temp == null ? null : `${r.temp}°${r.temp_unit}`,
    est_brew_time: r.brew_time_s == null ? null : mmss(r.brew_time_s),
    est_volume_ml: r.volume_ml,
    brew_notes: r.brew_notes,
  };
}

/** The bro's brew in progress, if there is one. */
export async function fetchOpenBrew(db: SupabaseClient, broId: string) {
  const { data, error } = await db
    .from("brews")
    .select(`${BREW_SELECT}, preferred_recipe_id`)
    .eq("bro_id", broId)
    .is("finished_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as OpenBrew | null;
}

/** A roast with what the group knows about brewing it: bookmarked recipes, recent brews, endorsements. */
export async function roastBlock(db: SupabaseClient, roastId: string) {
  const [roast, recipes, brews, endorsements] = await Promise.all([
    db
      .from("roasts")
      .select("id, name, region, roast_level, roaster:roasters(name, location)")
      .eq("id", roastId)
      .maybeSingle(),
    db
      .from("preferred_recipes")
      .select(RECIPE_SELECT)
      .eq("roast_id", roastId)
      .order("updated_at", { ascending: false })
      .limit(12),
    db
      .from("brews")
      .select(BREW_SELECT)
      .eq("roast_id", roastId)
      .not("finished_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(8),
    db
      .from("endorsements")
      .select("rating, method, note, created_at, bro:bros(first_name)")
      .eq("roast_id", roastId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  for (const r of [roast, recipes, brews, endorsements]) if (r.error) throw r.error;
  if (!roast.data) return null;
  return [
    `## The roast\n${json(roast.data)}`,
    `## Bookmarked recipes for it, any bro (the strongest signal)\n${json((recipes.data as unknown as RecipeRow[]).map(recipeForAgent))}`,
    `## Latest finished brews of it, any bro\n${json((brews.data as unknown as BrewRow[]).map(brewForAgent))}`,
    `## Endorsements of it (rating out of 10)\n${json(endorsements.data)}`,
  ].join("\n\n");
}

/** The context block for this turn. `roastId` is the roast settled so far, if any. */
export async function buildContext(
  db: SupabaseClient,
  bro: { id: string; first_name: string },
  open: OpenBrew | null,
  roastId: string | null,
) {
  const [history, recipes, target] = await Promise.all([
    db
      .from("brews")
      .select(BREW_SELECT)
      .eq("bro_id", bro.id)
      .order("started_at", { ascending: false })
      .limit(150),
    db
      .from("preferred_recipes")
      .select(RECIPE_SELECT)
      .eq("bro_id", bro.id)
      .order("updated_at", { ascending: false })
      .limit(30),
    open?.preferred_recipe_id
      ? db
          .from("preferred_recipes")
          .select(RECIPE_SELECT)
          .eq("id", open.preferred_recipe_id)
          .maybeSingle()
      : null,
  ]);
  if (history.error) throw history.error;
  if (recipes.error) throw recipes.error;
  const brews = (history.data as unknown as BrewRow[]).filter((b) => b.id !== open?.id);
  const mine = recipes.data as unknown as RecipeRow[];

  const sections = [`# ${bro.first_name} — the state right now (rebuilt every turn)`];

  if (open) {
    const minutes = Math.round((Date.now() - new Date(open.started_at).getTime()) / 60000);
    sections.push(
      `MODE: DURING. ${bro.first_name} has a brew open, started ${minutes} min ago. These are its settings as saved right now:\n${json(brewForAgent(open))}`,
    );
    if (target?.data) {
      sections.push(
        `It was started from this bookmarked recipe (its time and volume are the target):\n${json(recipeForAgent(target.data as unknown as RecipeRow))}`,
      );
    }
  } else {
    sections.push(
      `MODE: BEFORE. No brew is open. ${roastId ? "The roast is settled (below)." : "No roast is settled yet."}`,
    );
  }

  sections.push(
    `## Gear: grinders, and the grind settings used on each per method (newest first)\n${json(gear(brews))}`,
  );
  sections.push(
    `## ${bro.first_name}'s bookmarked recipes (${mine.length})\n${json(mine.map(recipeForAgent))}`,
  );

  const settled = open?.roast.id ?? roastId;
  if (settled) {
    sections.push((await roastBlock(db, settled)) ?? `No roast ${settled}`);
    const followUp = await lastSuggestion(db, bro, settled);
    if (followUp) sections.push(followUp);
    const own = brews.filter((b) => b.roast.id === settled).slice(0, 5);
    sections.push(
      `## ${bro.first_name}'s own latest brews of it (${own.length})\n${json(own.map(brewForAgent))}`,
    );
  } else {
    sections.push(
      `## Roasts ${bro.first_name} brewed most recently (offer these as chips; value = roast_id)\n${json(recentRoasts(brews, mine))}`,
    );
  }
  return sections.join("\n\n");
}

type Turn = { created_at: string; trace: { tool: string; input: unknown }[] | null };

/**
 * The last card the coach gave this bro for this roast, and the brews of it since: what the
 * coach follows up on. Null when it hasn't suggested anything for the roast yet.
 */
async function lastSuggestion(
  db: SupabaseClient,
  bro: { id: string; first_name: string },
  roastId: string,
) {
  const { data: chats } = await db
    .from("coach_chats")
    .select("id")
    .eq("bro_id", bro.id)
    .eq("roast_id", roastId)
    .order("updated_at", { ascending: false })
    .limit(10);
  if (!chats?.length) return null;

  const { data: turns } = await db
    .from("coach_turns")
    .select("created_at, trace")
    .in(
      "chat_id",
      chats.map((chat) => chat.id),
    )
    .order("created_at", { ascending: false })
    .limit(30);
  const cards = ["propose_recipe"];
  const turn = (turns as Turn[] | null)?.find((t) => t.trace?.some((c) => cards.includes(c.tool)));
  // A turn's last card is the one that passed its checks
  const card = turn?.trace?.findLast((c) => cards.includes(c.tool));
  if (!turn || !card) return null;

  const { data: since } = await db
    .from("brews")
    .select(BREW_SELECT)
    .eq("bro_id", bro.id)
    .eq("roast_id", roastId)
    .gt("started_at", turn.created_at)
    .order("started_at", { ascending: true })
    .limit(3);
  const brews = (since ?? []) as unknown as BrewRow[];
  return [
    `## Your last suggestion to ${bro.first_name} for this roast (a base and what you changed from it; given ${localTime(turn.created_at)})\n${json(card.input)}`,
    brews.length > 0
      ? `## ${bro.first_name}'s brews of it since then (did they use it, and how did it turn out?)\n${json(brews.map(brewForAgent))}`
      : `${bro.first_name} hasn't brewed it since.`,
  ].join("\n\n");
}

/** Each grinder → each method → the distinct grind settings used, newest first. */
function gear(brews: BrewRow[]) {
  const out: Record<string, Record<string, string[]>> = {};
  for (const b of brews) {
    if (!b.grinder || !b.grind_size) continue;
    out[b.grinder] ??= {};
    out[b.grinder][b.method] ??= [];
    const sizes = out[b.grinder][b.method];
    if (sizes.length < 5 && !sizes.includes(b.grind_size)) sizes.push(b.grind_size);
  }
  return out;
}

/** The last 6 roasts brewed, with the methods brewed and bookmarked for each. */
function recentRoasts(brews: BrewRow[], recipes: RecipeRow[]) {
  const roasts = new Map<string, Record<string, unknown> & { methods_brewed: string[] }>();
  for (const b of brews) {
    let roast = roasts.get(b.roast.id);
    if (!roast) {
      if (roasts.size === 6) continue;
      roast = {
        roast_id: b.roast.id,
        name: b.roast.name,
        roaster: b.roast.roaster.name,
        roast_level: b.roast.roast_level,
        methods_brewed: [],
        methods_bookmarked: [
          ...new Set(recipes.filter((r) => r.roast_id === b.roast.id).map((r) => r.method)),
        ],
      };
      roasts.set(b.roast.id, roast);
    }
    if (!roast.methods_brewed.includes(b.method)) roast.methods_brewed.push(b.method);
  }
  return [...roasts.values()];
}
