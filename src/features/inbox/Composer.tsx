import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { broQueries } from "../../api/bros/bros.queries";
import { messageMutations } from "../../api/messages/messages.queries";
import type { Message } from "../../api/messages/messages.types";
import { Avatar } from "../../components/Avatar";
import { useAutoHeight } from "../../components/Field";
import { HeaderAction } from "../../components/HeaderAction";
import { useCurrentBro } from "../../lib/auth";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { EVERYONE, mentionQuery, parseMentions } from "./mentions";

type Props = {
  /** Your message being edited: its text loads in, and Send saves it instead. */
  editing: Message | null;
  onEditDone: () => void;
  /** The keyboard is up: no room needed for the home indicator. */
  raised: boolean;
};

type Suggestion = { id: string; name: string; bro?: { first_name: string; last_name: string } };

/** Pinned under the thread: write, @mention, send. Also edits one of yours. */
export function Composer({ editing, onEditDone, raised }: Props) {
  const me = useCurrentBro();
  const { data: bros = [] } = useQuery(broQueries.list());
  const send = useMutation(messageMutations.send());
  const edit = useMutation(messageMutations.edit());
  const [text, setText] = useState("");
  const [caret, setCaret] = useState(0);
  const input = useRef<HTMLTextAreaElement>(null);
  useAutoHeight(input, text);

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
  const busy = send.isPending || edit.isPending;

  async function submit() {
    if (!body || busy) return;
    const mentions = parseMentions(body, bros, me.id);
    if (editing) {
      await edit.mutateAsync({ id: editing.id, body, ...mentions });
      onEditDone();
    } else {
      await send.mutateAsync({ bro_id: me.id, body, ...mentions });
    }
    setText("");
    setCaret(0);
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
          disabled={!body || busy}
          onPointerDown={(event) => event.preventDefault()}
        >
          {editing ? "Save" : "Send"}
        </HeaderAction>
      </form>
    </div>
  );
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
