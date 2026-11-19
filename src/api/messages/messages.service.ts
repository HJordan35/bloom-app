import { supabase } from "../../lib/supabase";
import { unwrap } from "../api.utils";
import { BREW_SELECT } from "../brews/brews.service";
import type { Message, MessageEdit, NewMessage, ReactionToggle } from "./messages.types";

export const MESSAGE_PAGE = 50;
export const MESSAGE_PHOTO_BUCKET = "message-photos";

// Shared recipes and brews come with the same joins as a brew (roast, roaster, bro)
const MESSAGE_SELECT = `*, reactions:message_reactions(bro_id, emoji), recipe:preferred_recipes(${BREW_SELECT}), brew:brews(${BREW_SELECT})`;

/** A page of the board, newest first: the latest, or those before `before` (a created_at). */
export async function fetchMessages(before?: string) {
  let query = supabase
    .from("messages")
    .select(MESSAGE_SELECT)
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

/** Deletes the message, then its photo. */
export async function deleteMessage(message: Pick<Message, "id" | "photo_path">) {
  unwrap(await supabase.from("messages").delete().eq("id", message.id));
  if (message.photo_path) {
    unwrap(await supabase.storage.from(MESSAGE_PHOTO_BUCKET).remove([message.photo_path]));
  }
}

/** Upload a (resized) photo under your own folder; returns its storage path. */
export async function uploadMessagePhoto(broId: string, photo: Blob) {
  const path = `${broId}/${crypto.randomUUID()}.jpg`;
  unwrap(
    await supabase.storage
      .from(MESSAGE_PHOTO_BUCKET)
      .upload(path, photo, { contentType: "image/jpeg" }),
  );
  return path;
}

export function messagePhotoUrl(path: string) {
  return supabase.storage.from(MESSAGE_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function toggleReaction({ on, ...reaction }: ReactionToggle) {
  if (on) {
    unwrap(await supabase.from("message_reactions").upsert(reaction, { ignoreDuplicates: true }));
  } else {
    unwrap(await supabase.from("message_reactions").delete().match(reaction));
  }
}
