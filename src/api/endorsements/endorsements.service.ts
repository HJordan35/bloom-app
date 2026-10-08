import { supabase } from "../../lib/supabase";
import { unwrap } from "../api.utils";
import type {
  Endorsement,
  EndorsementFilter,
  EndorsementUpdate,
  EndorsementWithRoast,
  NewEndorsement,
} from "./endorsements.types";

export const ENDORSEMENT_SELECT =
  "*, bro:bros(id, first_name, last_name, email), roast:roasts!inner(*, roaster:roasters(*))";

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

export async function createEndorsement(input: NewEndorsement) {
  return unwrap<Endorsement>(await supabase.from("endorsements").insert(input).select().single());
}

export async function updateEndorsement(id: string, fields: EndorsementUpdate) {
  unwrap(await supabase.from("endorsements").update(fields).eq("id", id));
}
