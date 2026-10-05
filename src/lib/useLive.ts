import { useEffect } from "react";
import { supabase } from "./supabase";

/** Call `onChange` on any Realtime insert, update or delete in these tables. */
export function useLive(tables: string[], onChange: () => void) {
  const key = tables.join();
  useEffect(() => {
    const channel = supabase.channel(`live-${crypto.randomUUID()}`);
    for (const table of key.split(",")) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, onChange);
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [key, onChange]);
}
