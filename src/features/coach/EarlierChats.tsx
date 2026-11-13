import * as stylex from "@stylexjs/stylex";
import type { CoachChat } from "../../api/coach/coach.types";
import { relativeDate } from "../../lib/format";
import { colors, space } from "../../theme/tokens.stylex";

type Props = {
  chats: CoachChat[];
  /** The chat that's open, marked in the list. */
  currentId: string;
  onOpen: (id: string) => void;
};

/** Your earlier chats, newest first: what you asked, about which roast, and when. */
export function EarlierChats({ chats, currentId, onOpen }: Props) {
  return (
    <div>
      {chats.map((chat) => (
        <button
          key={chat.id}
          type="button"
          onClick={() => onOpen(chat.id)}
          {...stylex.props(styles.row)}
        >
          <span {...stylex.props(styles.title, chat.id === currentId && styles.current)}>
            {chat.title ?? "Untitled"}
          </span>
          <span {...stylex.props(styles.meta)}>
            {[chat.roast?.name, relativeDate(chat.updated_at)].filter(Boolean).join(" · ")}
          </span>
        </button>
      ))}
    </div>
  );
}

const styles = stylex.create({
  row: {
    width: "100%",
    minHeight: 60,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 2,
    paddingInline: 0,
    paddingBlock: space.sm,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
    color: colors.text,
    font: "inherit",
    textAlign: "left",
    cursor: "pointer",
  },
  title: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 15,
  },
  current: {
    color: colors.brass,
  },
  meta: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 12,
    color: colors.muted,
  },
});
