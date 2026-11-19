import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { inboxMutations, inboxQueries } from "../../api/inbox/inbox.queries";
import type { InboxTab } from "../../api/inbox/inbox.types";
import { EmptyState } from "../../components/EmptyState";
import { FadeIn } from "../../components/FadeIn";
import { TextToggle } from "../../components/TextToggle";
import { space } from "../../theme/tokens.stylex";
import { NotificationsList } from "./NotificationsList";

/** Messages (the shared board) and Notifications (every bro's activity), each with its own dot. */
export function InboxPage() {
  const [params, setParams] = useSearchParams();
  const tab: InboxTab = params.get("tab") === "notifications" ? "notifications" : "messages";
  const { data: unread } = useQuery(inboxQueries.unread());
  const { mutate: markSeen } = useMutation(inboxMutations.markSeen());

  // The open tab is seen: on arrival, and again whenever something lands while it's open
  const openUnread = unread?.[tab];
  useEffect(() => {
    if (openUnread) markSeen(tab);
  }, [openUnread, tab, markSeen]);

  return (
    <FadeIn xstyle={styles.page}>
      <TextToggle
        options={[
          { value: "messages", label: "Messages", dot: unread?.messages },
          { value: "notifications", label: "Notifications", dot: unread?.notifications },
        ]}
        value={tab}
        // Replace, so Back leaves the Inbox instead of stepping through tabs
        onChange={(next) => setParams(next === "messages" ? {} : { tab: next }, { replace: true })}
      />
      {tab === "messages" ? (
        <EmptyState title="The board opens soon.">One thread, every bro.</EmptyState>
      ) : (
        <NotificationsList />
      )}
    </FadeIn>
  );
}

const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
  },
});
