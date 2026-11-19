import * as stylex from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import type { Bro } from "../../api/bros/bros.types";
import type { Message } from "../../api/messages/messages.types";
import { Avatar } from "../../components/Avatar";
import { clockTime } from "../../lib/format";
import { useLongPress } from "../../lib/useLongPress";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";
import { MessageText } from "./mentions";

type Props = {
  message: Message;
  /** Who sent it (missing for Bloom posts, or a bro no longer listed). */
  sender: Bro | undefined;
  bros: Bro[];
  mine: boolean;
  /** The first of a run: shows the avatar, name and time. */
  runStart: boolean;
  /** Long-press (or right-click) opens the message's actions. */
  onActions?: () => void;
};

/** One message: yours on the right, everyone else's on the left with their avatar. */
export function MessageBubble({ message, sender, bros, mine, runStart, onActions }: Props) {
  const press = useLongPress(onActions);
  const time = clockTime(message.created_at);

  return (
    <div {...stylex.props(styles.row, mine && styles.mineRow, runStart && styles.runStart)}>
      {!mine &&
        (runStart && sender ? (
          <Link to={`/bros/${sender.id}`} aria-label={sender.first_name}>
            <Avatar bro={sender} />
          </Link>
        ) : (
          <span {...stylex.props(styles.avatarSpace)} />
        ))}

      <div {...stylex.props(styles.column, mine && styles.mineColumn)}>
        {runStart && (
          <span {...stylex.props(styles.meta)}>
            {mine || !sender ? time : `${sender.first_name} · ${time}`}
          </span>
        )}
        <div
          {...press}
          // No iOS callout or text selection on a long-press, when it opens the actions
          style={onActions ? { WebkitTouchCallout: "none" } : undefined}
          {...stylex.props(styles.bubble, mine && styles.mine, !!onActions && styles.pressable)}
        >
          <MessageText body={message.body} bros={bros} />
          {message.edited_at && <span {...stylex.props(styles.edited)}> edited</span>}
        </div>
      </div>
    </div>
  );
}

const styles = stylex.create({
  row: {
    display: "flex",
    alignItems: "flex-start",
    gap: space.sm,
    paddingTop: 3,
  },
  mineRow: {
    justifyContent: "flex-end",
  },
  runStart: {
    paddingTop: space.md,
  },
  // Keeps a run's later messages in line with its first, beside the avatar
  avatarSpace: {
    flexShrink: 0,
    width: 30,
  },
  column: {
    minWidth: 0,
    maxWidth: "80%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 3,
  },
  mineColumn: {
    alignItems: "flex-end",
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.08em",
    color: colors.faint,
  },
  bubble: {
    paddingBlock: 7,
    paddingInline: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: radius.md,
    fontSize: 15,
    lineHeight: 1.45,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },
  mine: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.brassFaint,
  },
  pressable: {
    userSelect: "none",
    cursor: "default",
  },
  edited: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.faint,
  },
});
