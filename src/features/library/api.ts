import { supabase } from "../../lib/supabase";
import type {
  BrewWithRoast,
  Endorsement,
  EndorsementWithRoast,
  Roaster,
  RoasterRanking,
  RoastLevel,
  RoastRanking,
  RoastWithRoaster,
} from "../../lib/types";
import { unwrap } from "../../lib/unwrap";
import { BREW_SELECT, fetchMyBrewHistory } from "../brew/api";

export const ROAST_SELECT = "*, roaster:roasters(*)";

export async function fetchRoasts() {
  return unwrap<RoastWithRoaster[]>(
    await supabase.from("roasts").select(ROAST_SELECT).order("name"),
  );
}

export async function fetchRoasters() {
  return unwrap<Roaster[]>(await supabase.from("roasters").select("*").order("name"));
}

export async function createRoaster(input: {
  name: string;
  location: string | null;
  created_by: string;
}) {
  return unwrap<Roaster>(await supabase.from("roasters").insert(input).select().single());
}

export async function createRoast(input: {
  roaster_id: string;
  name: string;
  roast_level: RoastLevel;
  region: string | null;
  created_by: string;
}) {
  return unwrap<RoastWithRoaster>(
    await supabase.from("roasts").insert(input).select(ROAST_SELECT).single(),
  );
}

export async function createEndorsement(input: {
  bro_id: string;
  roast_id: string;
  method: string | null;
  rating: number | null;
  note: string | null;
}) {
  return unwrap<Endorsement>(await supabase.from("endorsements").insert(input).select().single());
}

export async function fetchRoaster(id: string) {
  return unwrap<Roaster>(await supabase.from("roasters").select("*").eq("id", id).single());
}

export async function fetchRoast(id: string) {
  return unwrap<RoastWithRoaster>(
    await supabase.from("roasts").select(ROAST_SELECT).eq("id", id).single(),
  );
}

export async function fetchRoastRankings() {
  return unwrap<RoastRanking[]>(await supabase.from("roast_rankings").select("*"));
}

export async function fetchRoasterRankings() {
  return unwrap<RoasterRanking[]>(await supabase.from("roaster_rankings").select("*"));
}

export async function fetchBrewsForRoast(roastId: string) {
  return unwrap<BrewWithRoast[]>(
    await supabase
      .from("brews")
      .select(BREW_SELECT)
      .eq("roast_id", roastId)
      .order("started_at", { ascending: false }),
  );
}

export async function fetchBrewsForRoaster(roasterId: string) {
  return unwrap<BrewWithRoast[]>(
    await supabase
      .from("brews")
      .select(BREW_SELECT.replace("roast:roasts(", "roast:roasts!inner("))
      .eq("roast.roaster_id", roasterId)
      .order("started_at", { ascending: false }),
  );
}

export const ENDORSEMENT_SELECT =
  "*, bro:bros(id, first_name, last_name, email), roast:roasts!inner(*, roaster:roasters(*))";

export async function fetchEndorsements(filter: { roastId: string } | { roasterId: string }) {
  const query = supabase.from("endorsements").select(ENDORSEMENT_SELECT);
  const filtered =
    "roastId" in filter
      ? query.eq("roast_id", filter.roastId)
      : query.eq("roast.roaster_id", filter.roasterId);
  return unwrap<EndorsementWithRoast[]>(await filtered.order("created_at", { ascending: false }));
}

/** Everything the Library page needs, in one round of requests. */
export async function fetchLibrary(broId: string) {
  const [roasters, roasts, roasterRankings, roastRankings, history] = await Promise.all([
    fetchRoasters(),
    fetchRoasts(),
    fetchRoasterRankings(),
    fetchRoastRankings(),
    fetchMyBrewHistory(broId),
  ]);
  return {
    roasters,
    roasts,
    roasterScores: new Map(roasterRankings.map((r) => [r.roaster_id, r])),
    roastScores: new Map(roastRankings.map((r) => [r.roast_id, r])),
    myRoastIds: new Set(history.roastIds),
    recentRoastIds: history.roastIds, // most recent first
  };
}
