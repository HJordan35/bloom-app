export type RoastLevel = "light" | "medium" | "dark";
export type TempUnit = "C" | "F";

export type Bro = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export type Roaster = {
  id: string;
  name: string;
  location: string | null;
  created_by: string;
  created_at: string;
};

export type Roast = {
  id: string;
  roaster_id: string;
  name: string;
  roast_level: RoastLevel;
  region: string | null;
  created_by: string;
  created_at: string;
};

export type Brew = {
  id: string;
  bro_id: string;
  roast_id: string;
  method: string;
  dose_g: number | null;
  grind_size: string | null;
  grinder: string | null;
  temp: number | null;
  temp_unit: TempUnit;
  brew_time_s: number | null;
  volume_ml: number | null;
  result: string | null;
  dialed_in: boolean;
  started_at: string;
  finished_at: string | null;
  created_at: string;
};

export type Endorsement = {
  id: string;
  bro_id: string;
  roast_id: string;
  method: string | null;
  rating: number | null;
  note: string | null;
  created_at: string;
};

export type Ranking = {
  brew_count: number;
  avg_rating: number | null;
  rating_count: number;
  score: number;
};

export type RoastRanking = Ranking & { roast_id: string; roaster_id: string };
export type RoasterRanking = Ranking & { roaster_id: string };

export type EndorsementWithRoast = Endorsement & { bro: Bro; roast: RoastWithRoaster };

export type BloomEvent = {
  type: "brew" | "roaster" | "roast" | "endorsement";
  ref_id: string;
  bro_id: string;
  roast_id: string | null;
  roaster_id: string | null;
  method: string | null;
  rating: number | null;
  note: string | null;
  created_at: string;
};

export type RoastWithRoaster = Roast & { roaster: Roaster };

export type BrewWithRoast = Brew & {
  roast: RoastWithRoaster;
  bro: Bro;
};
