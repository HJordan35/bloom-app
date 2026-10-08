import { fetchMyBrewHistory } from "../../api/brews/brews.service";
import { fetchRoasterRankings, fetchRoastRankings } from "../../api/rankings/rankings.service";
import { fetchRoasters } from "../../api/roasters/roasters.service";
import { fetchRoasts } from "../../api/roasts/roasts.service";
import { fetchBrosById } from "../../lib/bros";

// Fetching moved to src/api; re-exported until every caller migrates (docs/query/PLAN.md)
export { fetchBrewsForRoast, fetchBrewsForRoaster } from "../../api/brews/brews.service";
export { fetchRoasterRankings, fetchRoastRankings } from "../../api/rankings/rankings.service";
export { createRoaster, fetchRoaster, fetchRoasters } from "../../api/roasters/roasters.service";
export {
  createRoast,
  fetchRoast,
  fetchRoasts,
  ROAST_SELECT,
} from "../../api/roasts/roasts.service";

/** Everything the Library page needs, in one round of requests. */
export async function fetchLibrary(broId: string) {
  const [roasters, roasts, roasterRankings, roastRankings, brosById, history] = await Promise.all([
    fetchRoasters(),
    fetchRoasts(),
    fetchRoasterRankings(),
    fetchRoastRankings(),
    fetchBrosById(),
    fetchMyBrewHistory(broId),
  ]);
  return {
    roasters,
    roasts,
    roasterScores: new Map(roasterRankings.map((r) => [r.roaster_id, r])),
    roastScores: new Map(roastRankings.map((r) => [r.roast_id, r])),
    brosById,
    recentRoastIds: history.roastIds, // most recent first, for the drawer's Recent row
  };
}
