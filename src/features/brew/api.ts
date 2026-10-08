import { LIVE_WINDOW_MS } from "../../api/brews/brews.service";
import type { Brew } from "../../api/brews/brews.types";

/** Open and started within the last 2 hours — what counts as "brewing now". */
export function isLive(brew: Pick<Brew, "finished_at" | "started_at">) {
  return !brew.finished_at && Date.parse(brew.started_at) > Date.now() - LIVE_WINDOW_MS;
}

/** Finished, but no results or dialed-in yet ("I'll do it later"). */
export function resultsPending(brew: Pick<Brew, "finished_at" | "brew_results" | "dialed_in">) {
  return !!brew.finished_at && !brew.brew_results && !brew.dialed_in;
}
