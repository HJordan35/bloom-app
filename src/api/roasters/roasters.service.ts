import { supabase } from "../../lib/supabase";
import { unwrap } from "../api.utils";
import type { NewRoaster, Roaster } from "./roasters.types";

export async function fetchRoasters() {
  return unwrap<Roaster[]>(await supabase.from("roasters").select("*").order("name"));
}

export async function fetchRoaster(id: string) {
  return unwrap<Roaster>(await supabase.from("roasters").select("*").eq("id", id).single());
}

export async function createRoaster(input: NewRoaster) {
  return unwrap<Roaster>(await supabase.from("roasters").insert(input).select().single());
}
