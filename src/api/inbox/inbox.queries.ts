import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { queryClient } from "../queryClient";
import { fetchInboxUnread, markInboxSeen } from "./inbox.service";
import type { InboxTab, InboxUnread } from "./inbox.types";

export const inboxKeys = {
  all: ["inbox"] as const,
  unread: () => [...inboxKeys.all, "unread"] as const,
};

/** Something landed (a message or an event): refresh the dots. */
export function invalidateUnread() {
  return queryClient.invalidateQueries({ queryKey: inboxKeys.unread() });
}

export const inboxQueries = {
  unread: () => queryOptions({ queryKey: inboxKeys.unread(), queryFn: fetchInboxUnread }),
};

export const inboxMutations = {
  /** Clears the tab's dot in the cache straight away, then stamps it on the server. */
  markSeen: () =>
    mutationOptions({
      mutationFn: markInboxSeen,
      onMutate: (tab: InboxTab) =>
        queryClient.setQueryData<InboxUnread>(inboxKeys.unread(), (unread) =>
          unread ? { ...unread, [tab]: false } : unread,
        ),
    }),
};
