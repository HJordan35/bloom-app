import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { inboxMutations, inboxQueries } from "../../api/inbox/inbox.queries";
import type { InboxTab } from "../../api/inbox/inbox.types";
import type { Message } from "../../api/messages/messages.types";
import { FadeIn } from "../../components/FadeIn";
import { TextToggle } from "../../components/TextToggle";
import { useKeyboardInset } from "../../lib/useKeyboardInset";
import { space } from "../../theme/tokens.stylex";
import { Composer } from "./Composer";
import { MessagesThread } from "./MessagesThread";
import { NotificationsList } from "./NotificationsList";

/**
 * Messages (the shared board) and Notifications (every bro's activity), each with its own dot.
 * It fills the shell's content area and scrolls its own parts.
 */
export function InboxPage() {
  const [params, setParams] = useSearchParams();
  const tab: InboxTab = params.get("tab") === "notifications" ? "notifications" : "messages";
  const { data: unread } = useQuery(inboxQueries.unread());
  const { mutate: markSeen } = useMutation(inboxMutations.markSeen());
  const keyboard = useKeyboardInset(tab === "messages");

  // The open tab is seen: on arrival, and again whenever something lands while it's open
  const openUnread = unread?.[tab];
  useEffect(() => {
    if (openUnread) markSeen(tab);
  }, [openUnread, tab, markSeen]);

  return (
    <FadeIn xstyle={styles.page}>
      <div {...stylex.props(styles.tabs)}>
        <TextToggle
          options={[
            { value: "messages", label: "Messages", dot: unread?.messages },
            { value: "notifications", label: "Notifications", dot: unread?.notifications },
          ]}
          value={tab}
          // Replace, so Back leaves the Inbox instead of stepping through tabs
          onChange={(next) =>
            setParams(next === "messages" ? {} : { tab: next }, { replace: true })
          }
        />
      </div>
      {tab === "messages" ? (
        // Lifted above the on-screen keyboard, like a sheet's footer
        <div {...stylex.props(styles.messages)} style={{ paddingBottom: keyboard }}>
          <Messages raised={keyboard > 0} />
        </div>
      ) : (
        <div {...stylex.props(styles.notifications)}>
          <NotificationsList />
        </div>
      )}
    </FadeIn>
  );
}

/** The thread with the composer pinned under it; a long-press Edit hands the message across. */
function Messages({ raised }: { raised: boolean }) {
  const [editing, setEditing] = useState<Message | null>(null);
  return (
    <>
      <MessagesThread onEdit={setEditing} />
      <Composer editing={editing} onEditDone={() => setEditing(null)} raised={raised} />
    </>
  );
}

const styles = stylex.create({
  page: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
  tabs: {
    flexShrink: 0,
    paddingInline: space.md,
    paddingTop: space.lg,
    paddingBottom: space.sm,
  },
  messages: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
  notifications: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    overscrollBehaviorY: "contain",
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
    paddingInline: space.md,
    paddingTop: space.md,
    paddingBottom: `calc(env(safe-area-inset-bottom) + ${space.lg})`,
  },
});
