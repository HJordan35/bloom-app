import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { messageMutations } from "../../api/messages/messages.queries";
import type { Message } from "../../api/messages/messages.types";
import { Button } from "../../components/Button";
import { Dialog } from "../../components/Dialog";
import { Sheet } from "../../components/Sheet";
import { colors, space } from "../../theme/tokens.stylex";

type Props = {
  message: Message;
  onEdit: () => void;
  onClose: () => void;
};

/** What a long-press on your message offers: edit it, or delete it for everyone. */
export function MessageActions({ message, onEdit, onClose }: Props) {
  const remove = useMutation(messageMutations.remove());
  const [confirming, setConfirming] = useState(false);

  async function confirmDelete() {
    await remove.mutateAsync(message.id);
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
      <p {...stylex.props(styles.quote)}>{message.body}</p>
      <div {...stylex.props(styles.actions)}>
        <Button variant="ghost" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="text" onClick={() => setConfirming(true)}>
          Delete
        </Button>
      </div>
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
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
  },
});
