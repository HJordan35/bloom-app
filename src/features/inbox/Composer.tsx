import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { broQueries } from "../../api/bros/bros.queries";
import { messageMutations } from "../../api/messages/messages.queries";
import { uploadMessagePhoto } from "../../api/messages/messages.service";
import type { Message, NewMessage } from "../../api/messages/messages.types";
import { Avatar } from "../../components/Avatar";
import { useAutoHeight } from "../../components/Field";
import { HeaderAction } from "../../components/HeaderAction";
import { CloseIcon, PlusIcon } from "../../components/icons";
import { useCurrentBro } from "../../lib/auth";
import { resizeImage } from "../../lib/resizeImage";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";
import { EVERYONE, mentionQuery, parseMentions } from "./mentions";
import { type Shared, ShareSheet, sharedLine } from "./ShareSheet";

type Props = {
  /** Your message being edited: its text loads in, and Send saves it instead. */
  editing: Message | null;
  onEditDone: () => void;
  /** The keyboard is up: no room needed for the home indicator. */
  raised: boolean;
};

type Suggestion = { id: string; name: string; bro?: { first_name: string; last_name: string } };

/** What goes with the text: a photo, or a shared recipe or brew. One per message. */
type Attachment = { kind: "photo"; file: File } | Shared;

/** Pinned under the thread: write, @mention, send. Also edits one of yours. */
export function Composer({ editing, onEditDone, raised }: Props) {
  const me = useCurrentBro();
  const { data: bros = [] } = useQuery(broQueries.list());
  const send = useMutation(messageMutations.send());
  const edit = useMutation(messageMutations.edit());
  const [text, setText] = useState("");
  const [caret, setCaret] = useState(0);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [adding, setAdding] = useState(false); // "Photo · Recipe" showing
  const [sharing, setSharing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  useAutoHeight(input, text);
  const preview = usePreview(attachment?.kind === "photo" ? attachment.file : null);

  useEffect(() => {
    if (!editing) return;
    setText(editing.body);
    input.current?.focus();
  }, [editing]);

  // Typing "@He" suggests the bros it could be, and everyone
  const query = mentionQuery(text, caret);
  const suggestions: Suggestion[] =
    query == null
      ? []
      : [
          ...bros
            .filter((bro) => bro.id !== me.id)
            .map((bro) => ({ id: bro.id, name: bro.first_name, bro })),
          { id: EVERYONE, name: EVERYONE },
        ].filter((s) => s.name.toLowerCase().startsWith(query));

  function insertMention(name: string) {
    if (query == null) return;
    const start = caret - query.length - 1; // the "@"
    const next = `${text.slice(0, start)}@${name} ${text.slice(caret)}`;
    const at = start + name.length + 2;
    setText(next);
    setCaret(at);
    requestAnimationFrame(() => input.current?.setSelectionRange(at, at));
  }

  const body = text.trim();
  const busy = uploading || send.isPending || edit.isPending;
  // An edit changes only the text; a new message can be just its attachment
  const ready = editing ? !!body : !!body || !!attachment;

  async function submit() {
    if (!ready || busy) return;
    const mentions = parseMentions(body, bros, me.id);
    if (editing) {
      await edit.mutateAsync({ id: editing.id, body, ...mentions });
      onEditDone();
    } else {
      await send.mutateAsync({ bro_id: me.id, body, ...mentions, ...(await attached()) });
      setAttachment(null);
    }
    setText("");
    setCaret(0);
  }

  /** The attachment's columns; a photo is resized and uploaded first. */
  async function attached(): Promise<Partial<NewMessage>> {
    if (attachment?.kind === "recipe") return { recipe_id: attachment.recipe.id };
    if (attachment?.kind === "brew") return { brew_id: attachment.brew.id };
    if (attachment?.kind !== "photo") return {};
    setUploading(true);
    try {
      const { blob, width, height } = await resizeImage(attachment.file);
      const path = await uploadMessagePhoto(me.id, blob);
      return { photo_path: path, photo_w: width, photo_h: height };
    } finally {
      setUploading(false);
    }
  }

  function cancelEdit() {
    setText("");
    onEditDone();
  }

  // Enter sends; Shift+Enter is a new line
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  }

  return (
    <div {...stylex.props(styles.wrap, raised && styles.raised)}>
      {suggestions.length > 0 && (
        <div {...stylex.props(styles.suggestions)}>
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              // Keep the textarea focused, so the keyboard stays up
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => insertMention(s.name)}
              {...stylex.props(styles.suggestion)}
            >
              {s.bro && <Avatar bro={s.bro} size="xs" />}
              {s.name}
            </button>
          ))}
        </div>
      )}

      {attachment && !editing && (
        <div {...stylex.props(styles.attachment)}>
          {attachment.kind === "photo" ? (
            <>
              {preview && <img src={preview} alt="" {...stylex.props(styles.thumb)} />}
              <span {...stylex.props(styles.kind)}>Photo</span>
            </>
          ) : (
            <>
              <span {...stylex.props(styles.kind)}>{attachment.kind}</span>
              <span {...stylex.props(styles.line)}>{sharedLine(attachment, me.id, me.id)}</span>
            </>
          )}
          <button
            type="button"
            aria-label="Remove"
            onClick={() => setAttachment(null)}
            {...stylex.props(styles.remove)}
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {adding && !editing && !attachment && (
        <div {...stylex.props(styles.adding)}>
          <label {...stylex.props(styles.option)}>
            Photo
            <input
              type="file"
              accept="image/*"
              {...stylex.props(styles.file)}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = ""; // the same photo can be picked again
                if (!file) return;
                setAttachment({ kind: "photo", file });
                setAdding(false);
              }}
            />
          </label>
          <span {...stylex.props(styles.dot)}>·</span>
          <button
            type="button"
            onClick={() => {
              setSharing(true);
              setAdding(false);
            }}
            {...stylex.props(styles.option)}
          >
            Recipe
          </button>
        </div>
      )}

      {editing && (
        <div {...stylex.props(styles.editing)}>
          <span>Editing</span>
          <HeaderAction onPointerDown={(event) => event.preventDefault()} onClick={cancelEdit}>
            Cancel
          </HeaderAction>
        </div>
      )}

      <form
        {...stylex.props(styles.form)}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {!editing && (
          <button
            type="button"
            aria-label="Add a photo or recipe"
            aria-expanded={adding}
            onClick={() => setAdding((open) => !open)}
            {...stylex.props(styles.plus, adding && styles.plusOpen)}
          >
            <PlusIcon />
          </button>
        )}
        <textarea
          ref={input}
          rows={1}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setCaret(event.target.selectionStart);
          }}
          onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
          onKeyDown={onKeyDown}
          placeholder="Message the bros"
          enterKeyHint="send"
          aria-label="Message"
          {...stylex.props(styles.input)}
        />
        <HeaderAction
          type="submit"
          disabled={!ready || busy}
          onPointerDown={(event) => event.preventDefault()}
        >
          {busy ? "Sending…" : editing ? "Save" : "Send"}
        </HeaderAction>
      </form>

      {sharing && (
        <ShareSheet
          onShare={(shared) => {
            setAttachment(shared);
            setSharing(false);
          }}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}

/** An object URL for the picked photo while it's attached. */
function usePreview(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setUrl(null);
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

const styles = stylex.create({
  wrap: {
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
    paddingInline: space.md,
    paddingTop: space.sm,
    paddingBottom: `calc(env(safe-area-inset-bottom) + ${space.sm})`,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.hairline,
  },
  raised: {
    paddingBottom: space.sm,
  },
  suggestions: {
    display: "flex",
    gap: space.md,
    overflowX: "auto",
    scrollbarWidth: "none",
  },
  suggestion: {
    flexShrink: 0,
    minHeight: 36,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: "0.08em",
    color: colors.muted,
    cursor: "pointer",
  },
  attachment: {
    display: "flex",
    alignItems: "center",
    gap: space.sm,
    minWidth: 0,
  },
  thumb: {
    width: 32,
    height: 40,
    objectFit: "cover",
    borderRadius: radius.sm,
  },
  kind: {
    flexShrink: 0,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.faint,
  },
  line: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 13,
    color: colors.muted,
  },
  remove: {
    marginLeft: "auto",
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    color: colors.faint,
    cursor: "pointer",
  },
  adding: {
    display: "flex",
    alignItems: "center",
    gap: space.sm,
  },
  option: {
    minHeight: 36,
    display: "inline-flex",
    alignItems: "center",
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
    cursor: "pointer",
  },
  file: {
    display: "none",
  },
  dot: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.faint,
  },
  plus: {
    flexShrink: 0,
    width: 32,
    height: 42,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    color: colors.muted,
    cursor: "pointer",
    transition: "color 150ms, transform 150ms",
  },
  plusOpen: {
    color: colors.brass,
    transform: "rotate(45deg)",
  },
  editing: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.faint,
  },
  form: {
    display: "flex",
    alignItems: "flex-end",
    gap: space.md,
  },
  input: {
    flex: 1,
    minWidth: 0,
    // About five lines, then it scrolls
    maxHeight: 128,
    paddingBlock: 10,
    resize: "none",
    backgroundColor: "transparent",
    borderWidth: 0,
    outline: "none",
    fontSize: 16, // 16px prevents iOS zoom on focus
    lineHeight: 1.4,
    "::placeholder": { color: colors.faint },
  },
});
