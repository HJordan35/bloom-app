import { DefaultChatTransport } from "ai";
import { supabase } from "../../lib/supabase";
import { unwrap } from "../api.utils";
import type { CoachChat, CoachMessage } from "./coach.types";

/** A chat's messages as the coach last saved them; empty for a chat that hasn't started. */
export async function fetchCoachChat(id: string) {
  const chat = unwrap<{ messages: CoachMessage[] } | null>(
    await supabase.from("coach_chats").select("messages").eq("id", id).maybeSingle(),
  );
  return chat?.messages ?? [];
}

/** Your latest chats, newest first. */
export async function fetchCoachChats() {
  return unwrap<CoachChat[]>(
    await supabase
      .from("coach_chats")
      .select("id, title, updated_at, roast:roasts(name)")
      .order("updated_at", { ascending: false })
      .limit(30),
  );
}

type TransportOptions = {
  /** A roast already settled, e.g. picked in the launcher; read as each message goes. */
  roastId: () => string | null | undefined;
  /** Runs before each message goes, e.g. to save the brewing card's pending edit. */
  beforeSend?: () => Promise<void>;
};

/** Sends only the newest message to the coach function; it keeps the rest of the chat itself. */
export function coachTransport({ roastId, beforeSend }: TransportOptions) {
  return new DefaultChatTransport<CoachMessage>({
    api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coach`,
    async prepareSendMessagesRequest({ id, messages }) {
      await beforeSend?.();
      const { data } = await supabase.auth.getSession();
      return {
        headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: { chat_id: id, message: messages.at(-1), roast_id: roastId() ?? undefined },
      };
    },
  });
}
