import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import type { Bro } from "../../api/bros/bros.types";
import { messagePhotoUrl } from "../../api/messages/messages.service";
import type { Emoji, Message } from "../../api/messages/messages.types";
import { Lightbox } from "../../components/Lightbox";
import { clockTime } from "../../lib/format";
import { useLongPress } from "../../lib/useLongPress";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";
import { ReactionPills } from "./MessageBubble";
import { MessageText } from "./mentions";

type Props = {
  message: Message;
  bros: Bro[];
  meId: string;
  onActions: () => void;
  onReact: (emoji: Emoji) => void;
};

/**
 * Bloom's own post (release notes, insights): a note between hairlines rather than a bubble,
 * with a brass eyebrow and the body in the display serif.
 */
export function BloomPost({ message, bros, meId, onActions, onReact }: Props) {
  const press = useLongPress(onActions);
  const [viewing, setViewing] = useState(false);
  const photo = message.photo_path ? messagePhotoUrl(message.photo_path) : null;
  const eyebrow = message.label ? `Bloom · ${message.label}` : "Bloom";

  return (
    <article {...stylex.props(styles.post)}>
      <div {...press} style={{ WebkitTouchCallout: "none" }} {...stylex.props(styles.pressable)}>
        <header {...stylex.props(styles.header)}>
          <span {...stylex.props(styles.eyebrow)}>{eyebrow}</span>
          <span {...stylex.props(styles.time)}>{clockTime(message.created_at)}</span>
        </header>
        {message.body && (
          <p {...stylex.props(styles.body)}>
            <MessageText body={message.body} bros={bros} />
          </p>
        )}
        {photo && (
          <button
            type="button"
            aria-label="Open photo"
            onClick={() => setViewing(true)}
            {...stylex.props(styles.photoButton)}
          >
            <img
              src={photo}
              alt=""
              loading="lazy"
              draggable={false}
              {...stylex.props(styles.photo)}
            />
          </button>
        )}
      </div>
      <ReactionPills message={message} meId={meId} onReact={onReact} />
      {viewing && photo && <Lightbox src={photo} onClose={() => setViewing(false)} />}
    </article>
  );
}

const styles = stylex.create({
  post: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
    marginTop: space.md,
    paddingBlock: space.md,
    borderBlockWidth: 1,
    borderBlockStyle: "solid",
    borderBlockColor: colors.hairline,
  },
  pressable: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
    userSelect: "none",
  },
  header: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: space.md,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  time: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.08em",
    color: colors.faint,
  },
  body: {
    fontFamily: fonts.display,
    fontSize: 16,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },
  photoButton: {
    alignSelf: "flex-start",
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    cursor: "zoom-in",
  },
  photo: {
    display: "block",
    maxWidth: 220,
    maxHeight: 220,
    objectFit: "cover",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: radius.md,
  },
});
