import { supabase } from "../../lib/supabase";
import type { Endorsement, EndorsementWithRoast } from "../../lib/types";
import { unwrap } from "../../lib/unwrap";

export const ENDORSEMENT_SELECT =
  "*, bro:bros(id, first_name, last_name, email), roast:roasts!inner(*, roaster:roasters(*))";

export type EndorsementFilter =
  | { roastId: string }
  | { roasterId: string }
  | { broId: string }
  | { brewId: string };

/** Endorsements for a roast, roaster, bro or brew, newest first. */
export async function fetchEndorsements(filter: EndorsementFilter) {
  const query = supabase.from("endorsements").select(ENDORSEMENT_SELECT);
  const filtered =
    "roastId" in filter
      ? query.eq("roast_id", filter.roastId)
      : "roasterId" in filter
        ? query.eq("roast.roaster_id", filter.roasterId)
        : "broId" in filter
          ? query.eq("bro_id", filter.broId)
          : query.eq("brew_id", filter.brewId);
  return unwrap<EndorsementWithRoast[]>(await filtered.order("created_at", { ascending: false }));
}

type EndorsementFields = Pick<Endorsement, "method" | "rating" | "note">;

export async function createEndorsement(
  input: EndorsementFields & Pick<Endorsement, "bro_id" | "roast_id" | "brew_id">,
) {
  return unwrap<Endorsement>(await supabase.from("endorsements").insert(input).select().single());
}

export async function updateEndorsement(
  id: string,
  fields: EndorsementFields & Partial<Pick<Endorsement, "roast_id">>,
) {
  unwrap(await supabase.from("endorsements").update(fields).eq("id", id));
}
