import { supabase } from "../../lib/supabase";
import { unwrap } from "../api.utils";
import type { Message, MessageEdit, NewMessage, ReactionToggle } from "./messages.types";

export const MESSAGE_PAGE = 50;

/** A page of the board, newest first: the latest, or those before `before` (a created_at). */
export async function fetchMessages(before?: string) {
  let query = supabase
    .from("messages")
    .select("*, reactions:message_reactions(bro_id, emoji)")
    .order("created_at", { ascending: false })
    .limit(MESSAGE_PAGE);
  if (before) query = query.lt("created_at", before);
  return unwrap<Message[]>(await query);
}

export async function sendMessage(input: NewMessage) {
  unwrap(await supabase.from("messages").insert(input));
}

export async function editMessage({ id, ...edit }: MessageEdit) {
  unwrap(
    await supabase
      .from("messages")
      .update({ ...edit, edited_at: new Date().toISOString() })
      .eq("id", id),
  );
}

export async function deleteMessage(id: string) {
  unwrap(await supabase.from("messages").delete().eq("id", id));
}

export async function toggleReaction({ on, ...reaction }: ReactionToggle) {
  if (on) {
    unwrap(await supabase.from("message_reactions").upsert(reaction, { ignoreDuplicates: true }));
  } else {
    unwrap(await supabase.from("message_reactions").delete().match(reaction));
  }
}
