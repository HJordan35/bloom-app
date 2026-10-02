import { supabase } from "../../lib/supabase";
import type { Endorsement, Roaster, RoastLevel, RoastWithRoaster } from "../../lib/types";
import { unwrap } from "../../lib/unwrap";

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
