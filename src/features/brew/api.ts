import { fetchBrewingNow, LIVE_WINDOW_MS } from "../../api/brews/brews.service";
import type { Brew } from "../../api/brews/brews.types";

// Fetching moved to src/api/brews; re-exported until every caller migrates (docs/query/PLAN.md)
export {
  BREW_SELECT,
  discardBrew,
  fetchBrew,
  fetchBrewingNow,
  fetchLastRecipe,
  fetchMyBrewHistory,
  fetchMyOpenBrew,
  fetchRecentBrews,
  finishBrew,
  startBrew,
  updateBrew,
} from "../../api/brews/brews.service";
export type { BrewOutcome, BrewProcess, Recipe } from "../../api/brews/brews.types";

/** Open and started within the last 2 hours — what counts as "brewing now". */
export function isLive(brew: Pick<Brew, "finished_at" | "started_at">) {
  return !brew.finished_at && Date.parse(brew.started_at) > Date.now() - LIVE_WINDOW_MS;
}

/** Finished, but no results or dialed-in yet ("I'll do it later"). */
export function resultsPending(brew: Pick<Brew, "finished_at" | "brew_results" | "dialed_in">) {
  return !!brew.finished_at && !brew.brew_results && !brew.dialed_in;
}

/** Other bros' open brews started in the last 2 hours. New code: `brewQueries.live`. */
export async function fetchLiveBrews(broId: string) {
  return (await fetchBrewingNow()).filter((b) => b.bro_id !== broId);
}
