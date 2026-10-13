/** One set of the month's numbers, for the group or for one bro (see monthly_stats). */
export type MonthNumbers = {
  brews: number;
  volume_ml: number;
  beans_g: number;
  dialed_in: number;
  roasters: number;
  roasts: number;
  endorsements: number;
  roasts_tried: number;
  first_tries: number;
};

/** The `monthly_stats` RPC's JSON. Bros are ordered by brews, most first. */
export type MonthlyStats = {
  month: string;
  totals: MonthNumbers;
  bros: (MonthNumbers & { bro_id: string; first_name: string })[];
  methods: { method: string; brews: number; by_bro: { bro_id: string; brews: number }[] }[];
};

export type InsightType = "did_you_know" | "pattern" | "recommendation" | "fact" | "jab";

export type Insight = {
  position: number;
  type: InsightType;
  content: string;
  sources: { title: string; url: string }[];
};
