import { type InfiniteData, infiniteQueryOptions, mutationOptions } from "@tanstack/react-query";
import { queryClient } from "../queryClient";
import {
  deleteMessage,
  editMessage,
  fetchMessages,
  MESSAGE_PAGE,
  sendMessage,
  toggleReaction,
} from "./messages.service";
import type { Message, ReactionToggle } from "./messages.types";

export const messageKeys = {
  all: ["messages"] as const,
  list: () => [...messageKeys.all, "list"] as const,
};

/** Someone posted, edited, deleted or reacted: refresh the board. */
export function invalidateMessages() {
  return queryClient.invalidateQueries({ queryKey: messageKeys.all });
}

export const messageQueries = {
  /** The board, newest first, 50 at a time; each next page is older. */
  list: () =>
    infiniteQueryOptions({
      queryKey: messageKeys.list(),
      queryFn: ({ pageParam }) => fetchMessages(pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (page) =>
        page.length < MESSAGE_PAGE ? undefined : page[page.length - 1].created_at,
    }),
};

/** Your reaction added to or taken from the cached board, so the mark shows at once. */
function applyReaction({ message_id, bro_id, emoji, on }: ReactionToggle) {
  queryClient.setQueryData<InfiniteData<Message[]>>(messageKeys.list(), (board) => {
    if (!board) return board;
    const toggle = (message: Message): Message => {
      if (message.id !== message_id) return message;
      const others = message.reactions.filter((r) => r.bro_id !== bro_id || r.emoji !== emoji);
      return { ...message, reactions: on ? [...others, { bro_id, emoji }] : others };
    };
    return { ...board, pages: board.pages.map((page) => page.map(toggle)) };
  });
}

export const messageMutations = {
  send: () => mutationOptions({ mutationFn: sendMessage, onSuccess: invalidateMessages }),
  edit: () => mutationOptions({ mutationFn: editMessage, onSuccess: invalidateMessages }),
  remove: () => mutationOptions({ mutationFn: deleteMessage, onSuccess: invalidateMessages }),
  react: () =>
    mutationOptions({
      mutationFn: toggleReaction,
      onMutate: applyReaction,
      onSettled: invalidateMessages,
    }),
};
