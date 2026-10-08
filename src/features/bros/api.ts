import { fetchBrewingNow } from "../../api/brews/brews.service";
import { fetchBros } from "../../api/bros/bros.service";
import { fetchEvents } from "../../api/events/events.service";
import { fetchRoasters } from "../../api/roasters/roasters.service";
import { fetchRoasts } from "../../api/roasts/roasts.service";

// Fetching moved to src/api; re-exported until every caller migrates (docs/query/PLAN.md)
export { fetchBroBrews } from "../../api/brews/brews.service";
export { fetchEvents } from "../../api/events/events.service";

/** Everything the board needs, with lookup maps to turn event ids into names. */
export async function fetchBoard() {
  const [events, bros, roasts, roasters, brewing] = await Promise.all([
    fetchEvents(),
    fetchBros(),
    fetchRoasts(),
    fetchRoasters(),
    fetchBrewingNow(),
  ]);
  return {
    events,
    bros,
    brosById: new Map(bros.map((b) => [b.id, b])),
    roastsById: new Map(roasts.map((r) => [r.id, r])),
    roastersById: new Map(roasters.map((r) => [r.id, r])),
    brewingBroIds: new Set(brewing.map((b) => b.bro_id)),
    brewingIds: new Set(brewing.map((b) => b.id)),
  };
}

export type Board = Awaited<ReturnType<typeof fetchBoard>>;
