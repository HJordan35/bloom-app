import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Bro } from "../../api/bros/bros.types";
import { messagePhotoUrl } from "../../api/messages/messages.service";
import { type Emoji, type Message, REACTIONS } from "../../api/messages/messages.types";
import { Avatar } from "../../components/Avatar";
import { Lightbox } from "../../components/Lightbox";
import { clockTime } from "../../lib/format";
import { useLongPress } from "../../lib/useLongPress";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";
import { PreferredRecipeViewer } from "../recipes/PreferredRecipeViewer";
import { MessageText } from "./mentions";
import { type Shared, sharedLine } from "./ShareSheet";

/** A photo's thumbnail fits in this square, keeping its shape. */
const THUMB = 160;

function thumbSize(width: number | null, height: number | null) {
  if (!width || !height) return { width: THUMB, height: THUMB };
  const scale = Math.min(THUMB / width, THUMB / height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function sharedOf(message: Message): Shared | null {
  if (message.recipe) return { kind: "recipe", recipe: message.recipe };
  if (message.brew) return { kind: "brew", brew: message.brew };
  return null;
}

type Props = {
  message: Message;
  /** Who sent it (missing for Bloom posts, or a bro no longer listed). */
  sender: Bro | undefined;
  bros: Bro[];
  meId: string;
  mine: boolean;
  /** The first of a run: shows the avatar, name and time. */
  runStart: boolean;
  /** Long-press (or right-click) opens the message's actions. */
  onActions?: () => void;
  /** Tapping a reaction pill toggles yours. */
  onReact: (emoji: Emoji) => void;
};

/** One message: yours on the right, everyone else's on the left with their avatar. */
export function MessageBubble({
  message,
  sender,
  bros,
  meId,
  mine,
  runStart,
  onActions,
  onReact,
}: Props) {
  const press = useLongPress(onActions);
  const navigate = useNavigate();
  const [viewing, setViewing] = useState<"photo" | "recipe" | null>(null);
  const time = clockTime(message.created_at);
  const shared = sharedOf(message);
  const photo = message.photo_path ? messagePhotoUrl(message.photo_path) : null;
  // A share whose recipe or brew has since been deleted leaves nothing to show
  const gone = !message.body && !shared && !photo;

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
        {/* Long-press works anywhere on the message, its photo included */}
        <div
          {...press}
          // No iOS callout or text selection on a long-press, when it opens the actions
          style={onActions ? { WebkitTouchCallout: "none" } : undefined}
          {...stylex.props(
            styles.content,
            mine && styles.mineColumn,
            !!onActions && styles.pressable,
          )}
        >
          {photo && (
            <button
              type="button"
              aria-label="Open photo"
              onClick={() => setViewing("photo")}
              {...stylex.props(styles.photoButton)}
            >
              <img
                src={photo}
                alt=""
                loading="lazy"
                draggable={false}
                style={thumbSize(message.photo_w, message.photo_h)}
                {...stylex.props(styles.photo)}
              />
            </button>
          )}

          {(message.body || shared || gone) && (
            <div {...stylex.props(styles.bubble, mine && styles.mine)}>
              {message.body && (
                <span>
                  <MessageText body={message.body} bros={bros} />
                  {message.edited_at && <span {...stylex.props(styles.edited)}> edited</span>}
                </span>
              )}
              {shared && (
                <button
                  type="button"
                  onClick={() =>
                    shared.kind === "recipe"
                      ? setViewing("recipe")
                      : navigate(`/brews/${shared.brew.id}`)
                  }
                  {...stylex.props(styles.shared, !!message.body && styles.sharedRuled)}
                >
                  <span {...stylex.props(styles.sharedKind)}>{shared.kind}</span>
                  <span {...stylex.props(styles.sharedLine)}>
                    {sharedLine(shared, message.bro_id ?? "", meId)}
                  </span>
                </button>
              )}
              {gone && <span {...stylex.props(styles.gone)}>No longer shared</span>}
            </div>
          )}
        </div>
        <ReactionPills message={message} meId={meId} onReact={onReact} />
      </div>

      {viewing === "photo" && photo && <Lightbox src={photo} onClose={() => setViewing(null)} />}
      {viewing === "recipe" && message.recipe && (
        <PreferredRecipeViewer recipe={message.recipe} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}

/** The marks a message has, each once with its count from 2; yours edged in brass. */
export function ReactionPills({
  message,
  meId,
  onReact,
}: {
  message: Message;
  meId: string;
  onReact: (emoji: Emoji) => void;
}) {
  const used = REACTIONS.flatMap((emoji) => {
    const of = message.reactions.filter((r) => r.emoji === emoji);
    return of.length ? [{ emoji, count: of.length, mine: of.some((r) => r.bro_id === meId) }] : [];
  });
  if (used.length === 0) return null;

  return (
    <div {...stylex.props(styles.pills)}>
      {used.map(({ emoji, count, mine }) => (
        <button
          key={emoji}
          type="button"
          aria-pressed={mine}
          onClick={() => onReact(emoji)}
          {...stylex.props(styles.pill, mine && styles.pillMine)}
        >
          {emoji}
          {count > 1 && (
            <span {...stylex.props(styles.count, mine && styles.countMine)}>{count}</span>
          )}
        </button>
      ))}
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
  content: {
    minWidth: 0,
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 3,
  },
  photoButton: {
    display: "block",
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    cursor: "zoom-in",
  },
  photo: {
    display: "block",
    objectFit: "cover",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: radius.md,
  },
  shared: {
    display: "flex",
    alignItems: "baseline",
    gap: space.sm,
    maxWidth: "100%",
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    textAlign: "left",
    cursor: "pointer",
  },
  sharedRuled: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.hairline,
  },
  sharedKind: {
    flexShrink: 0,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.faint,
  },
  sharedLine: {
    minWidth: 0,
    fontSize: 14,
    color: colors.text,
    textDecorationLine: "underline",
    textDecorationColor: colors.faint,
    textUnderlineOffset: 3,
  },
  gone: {
    fontStyle: "italic",
    fontSize: 13,
    color: colors.faint,
  },
  pressable: {
    userSelect: "none",
    cursor: "default",
  },
  pills: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.xs,
  },
  pill: {
    minHeight: 22,
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    paddingBlock: 0,
    paddingInline: 6,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: 999,
    fontSize: 12,
    lineHeight: 1,
    cursor: "pointer",
  },
  pillMine: {
    borderColor: colors.brassFaint,
  },
  count: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
  },
  countMine: {
    color: colors.brass,
  },
  edited: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.faint,
  },
});
