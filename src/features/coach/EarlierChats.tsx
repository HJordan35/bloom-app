import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { coachMutations } from "../../api/coach/coach.queries";
import type { CoachChat } from "../../api/coach/coach.types";
import { Button } from "../../components/Button";
import { Dialog } from "../../components/Dialog";
import { CloseIcon } from "../../components/icons";
import { relativeDate } from "../../lib/format";
import { colors, space } from "../../theme/tokens.stylex";

type Props = {
  chats: CoachChat[];
  /** The chat that's open, marked in the list. */
  currentId: string;
  onOpen: (id: string) => void;
  onDeleted: (id: string) => void;
};

/** Your earlier chats, newest first: what you asked, about which roast, and when. */
export function EarlierChats({ chats, currentId, onOpen, onDeleted }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const remove = useMutation(coachMutations.remove());

  async function confirm(id: string) {
    await remove.mutateAsync(id);
    setDeleting(null);
    onDeleted(id);
  }

  return (
    <div>
      {chats.map((chat) => (
        <div key={chat.id} {...stylex.props(styles.row)}>
          <button type="button" onClick={() => onOpen(chat.id)} {...stylex.props(styles.open)}>
            <span {...stylex.props(styles.title, chat.id === currentId && styles.current)}>
              {chat.title ?? "Untitled"}
            </span>
            <span {...stylex.props(styles.meta)}>
              {[chat.roast?.name, relativeDate(chat.updated_at)].filter(Boolean).join(" · ")}
            </span>
          </button>
          <button
            type="button"
            aria-label="Delete this conversation"
            onClick={() => setDeleting(chat.id)}
            {...stylex.props(styles.remove)}
          >
            <CloseIcon />
          </button>
        </div>
      ))}

      {deleting && (
        <Dialog
          title="Would you like to delete this conversation?"
          onClose={() => setDeleting(null)}
        >
          <Button variant="ghost" onClick={() => confirm(deleting)} disabled={remove.isPending}>
            {remove.isPending ? "Deleting…" : "Delete"}
          </Button>
          <Button variant="text" onClick={() => setDeleting(null)} disabled={remove.isPending}>
            Cancel
          </Button>
        </Dialog>
      )}
    </div>
  );
}

const styles = stylex.create({
  row: {
    display: "flex",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
  },
  open: {
    flex: 1,
    minWidth: 0,
    minHeight: 60,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 2,
    paddingInline: 0,
    paddingBlock: space.sm,
    backgroundColor: "transparent",
    borderWidth: 0,
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
  // Small and faint, but a full-height target; pulled right so the x lines up with the edge
  remove: {
    width: 40,
    alignSelf: "stretch",
    marginRight: -13,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    paddingInline: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    color: colors.faint,
    cursor: "pointer",
  },
});
