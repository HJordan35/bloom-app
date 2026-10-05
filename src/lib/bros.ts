import { supabase } from "./supabase";
import type { Bro } from "./types";
import { unwrap } from "./unwrap";

const BRO_SELECT = "id, first_name, last_name, email";

export async function fetchBros() {
  return unwrap<Bro[]>(await supabase.from("bros").select(BRO_SELECT).order("first_name"));
}

/** All bros keyed by id, for turning bro ids (e.g. `brewed_by`) into names. */
export async function fetchBrosById() {
  return new Map((await fetchBros()).map((b) => [b.id, b]));
}

export async function fetchBro(id: string) {
  return unwrap<Bro>(await supabase.from("bros").select(BRO_SELECT).eq("id", id).single());
}
