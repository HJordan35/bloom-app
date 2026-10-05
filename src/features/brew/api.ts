import { supabase } from "../../lib/supabase";
import type { Brew, BrewWithRoast } from "../../lib/types";
import { unwrap } from "../../lib/unwrap";

export const BREW_SELECT =
  "*, roast:roasts(*, roaster:roasters(*)), bro:bros(id, first_name, last_name, email)";
const LIVE_WINDOW_MS = 2 * 60 * 60 * 1000;

/** Open and started within the last 2 hours — what counts as "brewing now". */
export function isLive(brew: Pick<Brew, "finished_at" | "started_at">) {
  return !brew.finished_at && Date.parse(brew.started_at) > Date.now() - LIVE_WINDOW_MS;
}

export type Recipe = Pick<Brew, "dose_g" | "grind_size" | "grinder" | "temp" | "temp_unit">;
/** Captured when finishing: how it was brewed. */
export type BrewProcess = Pick<Brew, "brew_time_s" | "volume_ml" | "brew_notes">;
/** Captured in the follow-up (or later): how it turned out. */
export type BrewOutcome = Pick<Brew, "brew_results" | "dialed_in">;

/** Finished, but no results or dialed-in yet ("I'll do it later"). */
export function resultsPending(brew: Pick<Brew, "finished_at" | "brew_results" | "dialed_in">) {
  return !!brew.finished_at && !brew.brew_results && !brew.dialed_in;
}

/** Your open brew, however old — so a forgotten brew can still be finished. */
export async function fetchMyOpenBrew(broId: string) {
  return unwrap<BrewWithRoast | null>(
    await supabase
      .from("brews")
      .select(BREW_SELECT)
      .eq("bro_id", broId)
      .is("finished_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

/** Other bros' open brews started in the last 2 hours. */
export async function fetchLiveBrews(broId: string) {
  return (await fetchBrewingNow()).filter((b) => b.bro_id !== broId);
}

/** Every bro's live brew, including yours. */
export async function fetchBrewingNow() {
  return unwrap<BrewWithRoast[]>(
    await supabase
      .from("brews")
      .select(BREW_SELECT)
      .is("finished_at", null)
      .gt("started_at", new Date(Date.now() - LIVE_WINDOW_MS).toISOString())
      .order("started_at", { ascending: false }),
  );
}

export async function fetchRecentBrews(broId: string) {
  return unwrap<BrewWithRoast[]>(
    await supabase
      .from("brews")
      .select(BREW_SELECT)
      .eq("bro_id", broId)
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false })
      .limit(20),
  );
}

export async function fetchBrew(id: string) {
  return unwrap<BrewWithRoast>(
    await supabase.from("brews").select(BREW_SELECT).eq("id", id).single(),
  );
}

/** Recipe from your last brew of this roast + method, if any. */
export async function fetchLastRecipe(broId: string, roastId: string, method: string) {
  return unwrap<Recipe | null>(
    await supabase
      .from("brews")
      .select("dose_g, grind_size, grinder, temp, temp_unit")
      .eq("bro_id", broId)
      .eq("roast_id", roastId)
      .eq("method", method)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

/** Roast ids and grinders from your recent brews, most recent first. */
export async function fetchMyBrewHistory(broId: string) {
  const rows = unwrap<Pick<Brew, "roast_id" | "grinder">[]>(
    await supabase
      .from("brews")
      .select("roast_id, grinder")
      .eq("bro_id", broId)
      .order("started_at", { ascending: false })
      .limit(100),
  );
  return {
    roastIds: [...new Set(rows.map((r) => r.roast_id))],
    grinders: [...new Set(rows.map((r) => r.grinder).filter((g): g is string => !!g))],
  };
}

export async function startBrew(
  input: Recipe & { bro_id: string; roast_id: string; method: string },
) {
  return unwrap<Brew>(await supabase.from("brews").insert(input).select().single());
}

export async function updateBrew(id: string, fields: Partial<Omit<Brew, "id" | "bro_id">>) {
  unwrap(await supabase.from("brews").update(fields).eq("id", id));
}

export async function finishBrew(id: string, process: BrewProcess) {
  await updateBrew(id, { ...process, finished_at: new Date().toISOString() });
}

export async function discardBrew(id: string) {
  unwrap(await supabase.from("brews").delete().eq("id", id));
}
