import type { Ranking } from "./types";

// Mirrors the roast_rankings / roaster_rankings views in
// supabase/migrations/001_init.sql — keep the two in sync.
export const NEUTRAL_RATING = 5;

/** Nothing brewed and nothing rated: no score yet. */
export function isRanked(ranking?: Ranking): ranking is Ranking {
  return !!ranking && (ranking.brew_count > 0 || ranking.rating_count > 0);
}

export function ratingPart(ranking: Ranking) {
  return ranking.avg_rating ?? NEUTRAL_RATING;
}

export function brewPart(ranking: Ranking) {
  return Math.min(10, 3 * Math.log(1 + ranking.brew_count));
}

export function formatScore(ranking?: Ranking) {
  return isRanked(ranking) ? ranking.score.toFixed(1) : "—";
}

type Sortable = { id: string; name: string };

/** Highest score first, unranked last, ties by name. */
export function byRank<T extends Sortable>(scores: Map<string, Ranking>) {
  const score = (item: T) => {
    const ranking = scores.get(item.id);
    return isRanked(ranking) ? ranking.score : -1;
  };
  return (a: T, b: T) => score(b) - score(a) || a.name.localeCompare(b.name);
}

/** 1-based rank position for each ranked item; unranked items are absent. */
export function rankPositions<T extends Sortable>(items: T[], scores: Map<string, Ranking>) {
  const ranked = items.filter((item) => isRanked(scores.get(item.id)));
  ranked.sort(byRank(scores));
  return new Map(ranked.map((item, i) => [item.id, i + 1]));
}
