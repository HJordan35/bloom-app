import { supabase } from "../../lib/supabase";
import type { BloomEvent, BrewWithRoast, Bro } from "../../lib/types";
import { unwrap } from "../../lib/unwrap";
import { BREW_SELECT, fetchBrewingNow } from "../brew/api";
import { fetchRoasters, fetchRoasts } from "../library/api";

const BRO_SELECT = "id, first_name, last_name, email";

export async function fetchBros() {
  return unwrap<Bro[]>(await supabase.from("bros").select(BRO_SELECT).order("first_name"));
}

export async function fetchBro(id: string) {
  return unwrap<Bro>(await supabase.from("bros").select(BRO_SELECT).eq("id", id).single());
}

export async function fetchEvents(limit = 60) {
  return unwrap<BloomEvent[]>(
    await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}

export async function fetchBroBrews(broId: string) {
  return unwrap<BrewWithRoast[]>(
    await supabase
      .from("brews")
      .select(BREW_SELECT)
      .eq("bro_id", broId)
      .order("started_at", { ascending: false }),
  );
}

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
