import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { Bro } from "../../api/bros/bros.types";
import { messageMutations } from "../../api/messages/messages.queries";
import { type Emoji, type Message, REACTIONS } from "../../api/messages/messages.types";
import { Button } from "../../components/Button";
import { Dialog } from "../../components/Dialog";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { broLabel } from "../../lib/bros";
import { colors, fonts, space } from "../../theme/tokens.stylex";

type Props = {
  message: Message;
  bros: Bro[];
  /** Toggles your reaction; the sheet closes after. */
  onReact: (emoji: Emoji) => void;
  /** Only for your own messages. */
  onEdit?: () => void;
  onClose: () => void;
};

/** A long-press on a message: the six reactions and who's used them, plus Edit and Delete on yours. */
export function MessageActions({ message, bros, onReact, onEdit, onClose }: Props) {
  const me = useCurrentBro();
  const remove = useMutation(messageMutations.remove());
  const [confirming, setConfirming] = useState(false);
  const mine = (emoji: Emoji) =>
    message.reactions.some((r) => r.bro_id === me.id && r.emoji === emoji);

  // "☕ Sam, You · 🔥 Ali"
  const who = REACTIONS.flatMap((emoji) => {
    const names = message.reactions
      .filter((r) => r.emoji === emoji)
      .flatMap((r) => bros.find((bro) => bro.id === r.bro_id) ?? [])
      .map((bro) => broLabel(bro, me.id));
    return names.length ? [`${emoji} ${names.join(", ")}`] : [];
  }).join("  ·  ");

  async function confirmDelete() {
    await remove.mutateAsync(message);
    onClose();
  }

  if (confirming) {
    return (
      <Dialog
        title="Delete this message?"
        message="It goes from the board for everyone."
        onClose={onClose}
      >
        <Button variant="ghost" onClick={confirmDelete} disabled={remove.isPending}>
          {remove.isPending ? "Deleting…" : "Delete"}
        </Button>
        <Button variant="text" onClick={onClose} disabled={remove.isPending}>
          Cancel
        </Button>
      </Dialog>
    );
  }

  return (
    <Sheet title="Message" onClose={onClose}>
      {message.body && <p {...stylex.props(styles.quote)}>{message.body}</p>}

      <div {...stylex.props(styles.reactionsBlock)}>
        <div {...stylex.props(styles.reactions)}>
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-pressed={mine(emoji)}
              onClick={() => {
                onReact(emoji);
                onClose();
              }}
              {...stylex.props(styles.reaction, mine(emoji) && styles.reacted)}
            >
              {emoji}
            </button>
          ))}
        </div>
        {who && <p {...stylex.props(styles.who)}>{who}</p>}
      </div>

      {onEdit && (
        <div {...stylex.props(styles.actions)}>
          <Button variant="ghost" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="text" onClick={() => setConfirming(true)}>
            Delete
          </Button>
        </div>
      )}
    </Sheet>
  );
}

const styles = stylex.create({
  // Which message this is, kept short
  quote: {
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    fontSize: 14,
    color: colors.muted,
    whiteSpace: "pre-wrap",
  },
  reactionsBlock: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
  },
  reactions: {
    display: "flex",
    justifyContent: "space-between",
  },
  reaction: {
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    borderRadius: "50%",
    fontSize: 22,
    cursor: "pointer",
  },
  reacted: {
    borderColor: colors.brass,
  },
  who: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.faint,
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
  },
});
