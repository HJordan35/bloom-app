import * as stylex from "@stylexjs/stylex";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { broQueries } from "../../api/bros/bros.queries";
import { messageMutations, messageQueries } from "../../api/messages/messages.queries";
import type { Emoji, Message } from "../../api/messages/messages.types";
import { EmptyState } from "../../components/EmptyState";
import { Loader } from "../../components/Loader";
import { useCurrentBro } from "../../lib/auth";
import { dayHeading } from "../../lib/format";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { MessageActions } from "./MessageActions";
import { MessageBubble } from "./MessageBubble";

/** Consecutive messages from one bro closer together than this read as one run. */
const RUN_GAP_MS = 5 * 60_000;

type Item = { message: Message; day: string | null; runStart: boolean };

/** Newest-first messages → newest-first items, each knowing if it opens a day or a run. */
function arrange(newestFirst: Message[]): Item[] {
  const items: Item[] = [];
  let prev: Message | undefined;
  for (const message of [...newestFirst].reverse()) {
    const day = dayHeading(message.created_at);
    const newDay = !prev || dayHeading(prev.created_at) !== day;
    const sameRun =
      !!prev &&
      !newDay &&
      prev.kind === "bro" &&
      message.kind === "bro" &&
      prev.bro_id === message.bro_id &&
      Date.parse(message.created_at) - Date.parse(prev.created_at) < RUN_GAP_MS;
    items.push({ message, day: newDay ? day : null, runStart: !sameRun });
    prev = message;
  }
  return items.reverse();
}

/**
 * The board. It scrolls in column-reverse, so it opens at the newest message (scrollTop 0 is
 * the bottom) and older pages added above never move what you're reading.
 */
export function MessagesThread({ onEdit }: { onEdit: (message: Message) => void }) {
  const me = useCurrentBro();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    messageQueries.list(),
  );
  const { data: bros } = useQuery(broQueries.list());
  const scroller = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [fresh, setFresh] = useState(false);
  const [acting, setActing] = useState<Message | null>(null);
  const { mutate: toggle } = useMutation(messageMutations.react());
  const react = (message: Message, emoji: Emoji) =>
    toggle({
      message_id: message.id,
      bro_id: me.id,
      emoji,
      on: !message.reactions.some((r) => r.bro_id === me.id && r.emoji === emoji),
    });

  const messages = data?.pages.flat() ?? [];
  const newest = messages[0];

  // Nearing the top loads the next 50 older ones
  useEffect(() => {
    const el = top.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && !isFetchingNextPage && fetchNextPage(),
      { root: scroller.current, rootMargin: "300px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Something new at the bottom: yours scrolls down to it; another bro's flags it if you're up
  const seenNewest = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!newest) return;
    const before = seenNewest.current;
    seenNewest.current = newest.id;
    if (!before || before === newest.id) return;
    if (newest.bro_id === me.id) scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
    else if (!atBottom) setFresh(true);
  }, [newest, me.id, atBottom]);

  function scrollToBottom() {
    scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
    setFresh(false);
  }

  if (!data || !bros) {
    return (
      <div {...stylex.props(styles.loading)}>
        <Loader />
      </div>
    );
  }

  return (
    <div {...stylex.props(styles.frame)}>
      <div
        ref={scroller}
        onScroll={(event) => {
          const bottom = Math.abs(event.currentTarget.scrollTop) < 40;
          setAtBottom(bottom);
          if (bottom) setFresh(false);
        }}
        {...stylex.props(styles.scroller)}
      >
        {messages.length === 0 && (
          <div {...stylex.props(styles.empty)}>
            <EmptyState title="Nothing on the board yet.">Start the conversation.</EmptyState>
          </div>
        )}

        {arrange(messages).map(({ message, day, runStart }) => {
          const mine = message.bro_id === me.id;
          return (
            <div key={message.id}>
              {day && <p {...stylex.props(styles.day)}>{day}</p>}
              <MessageBubble
                message={message}
                sender={bros.find((bro) => bro.id === message.bro_id)}
                bros={bros}
                meId={me.id}
                mine={mine}
                runStart={runStart}
                onActions={() => setActing(message)}
                onReact={(emoji) => react(message, emoji)}
              />
            </div>
          );
        })}

        {/* Last in the DOM, so first on screen: the top of the thread */}
        <div ref={top} {...stylex.props(styles.top)}>
          {isFetchingNextPage && <Loader />}
        </div>
      </div>

      {fresh && (
        <button type="button" onClick={scrollToBottom} {...stylex.props(styles.fresh)}>
          New ↓
        </button>
      )}

      {acting && (
        <MessageActions
          message={acting}
          bros={bros}
          onReact={(emoji) => react(acting, emoji)}
          onEdit={
            acting.bro_id === me.id
              ? () => {
                  onEdit(acting);
                  setActing(null);
                }
              : undefined
          }
          onClose={() => setActing(null)}
        />
      )}
    </div>
  );
}

const styles = stylex.create({
  frame: {
    position: "relative",
    flex: 1,
    minHeight: 0,
    display: "flex",
  },
  scroller: {
    flex: 1,
    display: "flex",
    flexDirection: "column-reverse",
    overflowY: "auto",
    overscrollBehaviorY: "contain",
    paddingInline: space.md,
    paddingBottom: space.md,
  },
  loading: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    marginBlock: "auto",
  },
  top: {
    minHeight: 1,
    display: "flex",
    justifyContent: "center",
    paddingBlock: space.sm,
  },
  day: {
    paddingTop: space.lg,
    textAlign: "center",
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.faint,
  },
  fresh: {
    position: "absolute",
    bottom: space.md,
    left: "50%",
    transform: "translateX(-50%)",
    paddingBlock: 6,
    paddingInline: 12,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.brassFaint,
    borderRadius: 999,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: colors.brass,
    cursor: "pointer",
  },
});
