import { infiniteQueryOptions, mutationOptions } from "@tanstack/react-query";
import { queryClient } from "../queryClient";
import {
  deleteMessage,
  editMessage,
  fetchMessages,
  MESSAGE_PAGE,
  sendMessage,
} from "./messages.service";

export const messageKeys = {
  all: ["messages"] as const,
  list: () => [...messageKeys.all, "list"] as const,
};

/** Someone posted, edited or deleted: refresh the board. */
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

export const messageMutations = {
  send: () => mutationOptions({ mutationFn: sendMessage, onSuccess: invalidateMessages }),
  edit: () => mutationOptions({ mutationFn: editMessage, onSuccess: invalidateMessages }),
  remove: () => mutationOptions({ mutationFn: deleteMessage, onSuccess: invalidateMessages }),
};
