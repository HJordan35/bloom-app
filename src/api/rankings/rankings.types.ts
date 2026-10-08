export type Ranking = {
  brew_count: number;
  avg_rating: number | null;
  rating_count: number;
  score: number;
  /** Ids of every bro who has brewed it. */
  brewed_by: string[];
};

export type RoastRanking = Ranking & { roast_id: string; roaster_id: string };
export type RoasterRanking = Ranking & { roaster_id: string };
