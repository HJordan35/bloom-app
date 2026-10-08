// Moved to src/api/bros; kept until every caller migrates (docs/query/PLAN.md)
import { byId } from "../api/api.utils";
import { fetchBros } from "../api/bros/bros.service";

export { fetchBro, fetchBros } from "../api/bros/bros.service";

/** All bros keyed by id. New code: `useQuery({ ...broQueries.list(), select: byId })`. */
export async function fetchBrosById() {
  return byId(await fetchBros());
}
