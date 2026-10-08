import { supabase } from "../../lib/supabase";
import { unwrap } from "../api.utils";
import type { Bro } from "./bros.types";

export const BRO_SELECT = "id, first_name, last_name, email";

export async function fetchBros() {
  return unwrap<Bro[]>(await supabase.from("bros").select(BRO_SELECT).order("first_name"));
}

export async function fetchBro(id: string) {
  return unwrap<Bro>(await supabase.from("bros").select(BRO_SELECT).eq("id", id).single());
}
