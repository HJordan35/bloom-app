import { supabase } from "../../lib/supabase";
import { unwrap } from "../api.utils";
import type { BloomEvent } from "./events.types";

export async function fetchEvents(limit = 60) {
  return unwrap<BloomEvent[]>(
    await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}
