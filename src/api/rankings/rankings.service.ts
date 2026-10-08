import { supabase } from "../../lib/supabase";
import { unwrap } from "../api.utils";
import type { RoasterRanking, RoastRanking } from "./rankings.types";

export async function fetchRoastRankings() {
  return unwrap<RoastRanking[]>(await supabase.from("roast_rankings").select("*"));
}

export async function fetchRoasterRankings() {
  return unwrap<RoasterRanking[]>(await supabase.from("roaster_rankings").select("*"));
}
