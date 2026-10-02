import { supabase } from "../../lib/supabase";
import type { Brew, BrewWithRoast } from "../../lib/types";
import { unwrap } from "../../lib/unwrap";

const BREW_SELECT =
  "*, roast:roasts(*, roaster:roasters(*)), bro:bros(id, first_name, last_name, email)";
const LIVE_WINDOW_MS = 2 * 60 * 60 * 1000;

export type Recipe = Pick<Brew, "dose_g" | "grind_size" | "grinder" | "temp_c">;
export type BrewResult = Pick<Brew, "brew_time_s" | "volume_ml" | "result" | "dialed_in">;

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
  return unwrap<BrewWithRoast[]>(
    await supabase
      .from("brews")
      .select(BREW_SELECT)
      .neq("bro_id", broId)
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
      .select("dose_g, grind_size, grinder, temp_c")
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

export async function finishBrew(id: string, result: BrewResult) {
  unwrap(
    await supabase
      .from("brews")
      .update({ ...result, finished_at: new Date().toISOString() })
      .eq("id", id),
  );
}

export async function discardBrew(id: string) {
  unwrap(await supabase.from("brews").delete().eq("id", id));
}
