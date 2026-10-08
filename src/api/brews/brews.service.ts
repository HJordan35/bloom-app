import { supabase } from "../../lib/supabase";
import { unwrap } from "../api.utils";
import type {
  Brew,
  BrewHistory,
  BrewProcess,
  BrewUpdate,
  BrewWithRoast,
  NewBrew,
  Recipe,
} from "./brews.types";

export const BREW_SELECT =
  "*, roast:roasts(*, roaster:roasters(*)), bro:bros(id, first_name, last_name, email)";
export const LIVE_WINDOW_MS = 2 * 60 * 60 * 1000;

export async function fetchBrew(id: string) {
  return unwrap<BrewWithRoast>(
    await supabase.from("brews").select(BREW_SELECT).eq("id", id).single(),
  );
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

/** Every bro's open brew started in the last 2 hours, including yours. */
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

export async function fetchBrewsForRoast(roastId: string) {
  return unwrap<BrewWithRoast[]>(
    await supabase
      .from("brews")
      .select(BREW_SELECT)
      .eq("roast_id", roastId)
      .order("started_at", { ascending: false }),
  );
}

export async function fetchBrewsForRoaster(roasterId: string) {
  return unwrap<BrewWithRoast[]>(
    await supabase
      .from("brews")
      .select(BREW_SELECT.replace("roast:roasts(", "roast:roasts!inner("))
      .eq("roast.roaster_id", roasterId)
      .order("started_at", { ascending: false }),
  );
}

export async function fetchBroBrews(broId: string) {
  return unwrap<BrewWithRoast[]>(
    await supabase
      .from("brews")
      .select(BREW_SELECT)
      .eq("bro_id", broId)
      .order("started_at", { ascending: false }),
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
export async function fetchMyBrewHistory(broId: string): Promise<BrewHistory> {
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

export async function startBrew(input: NewBrew) {
  return unwrap<Brew>(await supabase.from("brews").insert(input).select().single());
}

export async function updateBrew(id: string, fields: BrewUpdate) {
  unwrap(await supabase.from("brews").update(fields).eq("id", id));
}

export async function finishBrew(id: string, process: BrewProcess) {
  await updateBrew(id, { ...process, finished_at: new Date().toISOString() });
}

export async function discardBrew(id: string) {
  unwrap(await supabase.from("brews").delete().eq("id", id));
}
