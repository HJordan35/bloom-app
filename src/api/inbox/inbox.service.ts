import { supabase } from "../../lib/supabase";
import { unwrap } from "../api.utils";
import type { InboxTab, InboxUnread } from "./inbox.types";

export async function fetchInboxUnread() {
  return unwrap<InboxUnread>(await supabase.rpc("inbox_unread").single());
}

/** Stamp the tab as seen now (server time). */
export async function markInboxSeen(tab: InboxTab) {
  unwrap(await supabase.rpc("mark_inbox_seen", { tab }));
}
