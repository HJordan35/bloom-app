import { queryOptions } from "@tanstack/react-query";
import { fetchRoasterRankings, fetchRoastRankings } from "./rankings.service";
import type { RoasterRanking, RoastRanking } from "./rankings.types";

export const rankingKeys = {
  all: ["rankings"] as const,
  roasts: () => [...rankingKeys.all, "roasts"] as const,
  roasters: () => [...rankingKeys.all, "roasters"] as const,
};

export const rankingQueries = {
  roasts: () => queryOptions({ queryKey: rankingKeys.roasts(), queryFn: fetchRoastRankings }),
  roasters: () => queryOptions({ queryKey: rankingKeys.roasters(), queryFn: fetchRoasterRankings }),
};

/** `select` helpers: rankings keyed by roast / roaster id, as `byRank` expects. */
export const byRoastId = (rows: RoastRanking[]) => new Map(rows.map((r) => [r.roast_id, r]));
export const byRoasterId = (rows: RoasterRanking[]) => new Map(rows.map((r) => [r.roaster_id, r]));
