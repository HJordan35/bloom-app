import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { invalidateBrews } from "./brews/brews.queries";
import { invalidateEndorsements } from "./endorsements/endorsements.queries";
import { invalidateUnread } from "./inbox/inbox.queries";
import { invalidatePreferred } from "./preferred/preferred.queries";
import { invalidateReportMonths } from "./reports/reports.queries";
import { invalidateRoasters } from "./roasters/roasters.queries";
import { invalidateRoasts } from "./roasts/roasts.queries";

/**
 * Every table in the supabase_realtime publication, and the cached queries a change to it
 * makes stale. Only queries on screen refetch; the rest refetch when next shown.
 * The event tables also feed the Inbox's Notifications dot.
 */
const INVALIDATE_ON_CHANGE: Record<string, (() => Promise<unknown>)[]> = {
  brews: [invalidateBrews, invalidateUnread],
  roasters: [invalidateRoasters, invalidateUnread],
  roasts: [invalidateRoasts, invalidateUnread], // includes studio photos finishing in the background
  endorsements: [invalidateEndorsements, invalidateUnread],
  preferred_recipes: [invalidatePreferred],
  monthly_reports: [invalidateReportMonths], // a Brewsletter just published
};

/** One Realtime subscription for the signed-in app: any bro's change refreshes the cache. */
export function useRealtimeSync() {
  useEffect(() => {
    // Unique name: StrictMode remounts before the old channel has finished closing
    const channel = supabase.channel(`cache-sync-${crypto.randomUUID()}`);
    for (const [table, invalidators] of Object.entries(INVALIDATE_ON_CHANGE)) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        for (const invalidate of invalidators) invalidate();
      });
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
