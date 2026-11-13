import { useChat } from "@ai-sdk/react";
import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { coachQueries } from "../../api/coach/coach.queries";
import { coachTransport } from "../../api/coach/coach.service";
import type { CoachMessage, CoachRecipe } from "../../api/coach/coach.types";
import { queryClient } from "../../api/queryClient";
import { roastQueries } from "../../api/roasts/roasts.queries";
import { Chips } from "../../components/Chips";
import { HeaderAction } from "../../components/HeaderAction";
import { HistoryIcon, PlusIcon } from "../../components/icons";
import { Loader } from "../../components/Loader";
import { Sheet } from "../../components/Sheet";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";
import { PreferredRecipeSheet, type PreferredStart } from "../recipes/PreferredRecipeSheet";
import { type CardAction, RecipeCard } from "./CoachCards";
import { currentChatId, newChatId, openChat, touchChat } from "./chatId";
import { EarlierChats } from "./EarlierChats";

/** What the coach's cards do where the sheet is open: before a brew, or on the open one. */
export type CoachActions = {
  /** The main button: "Apply" on the open brew, "Brew this" before one. */
  label: string;
  done: string;
  onRecipe: (card: CoachRecipe) => void | Promise<void>;
};

type Props = {
  /** A roast already settled, e.g. picked in the launcher. */
  roastId?: string | null;
  brewing: boolean;
  actions: CoachActions;
  /** Said for you in a new chat, at once: the after-brew way in. */
  opening?: string;
  /** Runs before each message goes: the brewing card saves its pending edit. */
  beforeSend?: () => Promise<void>;
  onClose: () => void;
};

/** Something to say in an empty chat, for where the coach was opened. */
function starters(brewing: boolean, roastSettled: boolean) {
  if (brewing) return ["Check my settings", "Last cup was off"];
  if (roastSettled) return ["How should I brew this?", "Improve my last cup of it"];
  return ["What should I brew?", "Improve my last cup"];
}

/** The brew coach: one conversation, carried from before a brew into it. */
export function CoachSheet({ roastId, brewing, actions, opening, beforeSend, onClose }: Props) {
  // An opening line starts its own chat; otherwise the current one carries on
  const [chatId, setChatId] = useState(() => (opening ? newChatId() : currentChatId()));
  const { data: saved } = useQuery(coachQueries.chat(chatId));
  const { data: chats = [], refetch: refetchChats } = useQuery(coachQueries.list());
  const [earlier, setEarlier] = useState(false);

  // The latest props, for a transport that's made once
  const latest = useRef({ roastId, beforeSend });
  latest.current = { roastId, beforeSend };
  const transport = useMemo(
    () =>
      coachTransport({
        roastId: () => latest.current.roastId,
        beforeSend: () => latest.current.beforeSend?.() ?? Promise.resolve(),
      }),
    [],
  );

  const { messages, status, error, sendMessage, addToolOutput, clearError, setMessages } =
    useChat<CoachMessage>({
      id: chatId,
      transport,
      // Only an answered question goes back on its own; a card never does
      sendAutomaticallyWhen: ({ messages }) => {
        const part = messages.at(-1)?.parts.at(-1);
        return part?.type === "tool-ask_user" && part.state === "output-available";
      },
    });
  const busy = status === "submitted" || status === "streaming";

  // A chat joins the list (and takes its title) when its first turn is saved, so the list is
  // read again as each reply ends
  useEffect(() => {
    if (!busy) refetchChats();
  }, [busy, refetchChats]);

  // The conversation starts from the saved chat, once per chat: the sheet is already open by
  // then, and a later refetch mustn't replace what's been said since
  const loaded = useRef<string | null>(null);
  const opened = useRef(false);
  useEffect(() => {
    if (!saved || loaded.current === chatId) return;
    loaded.current = chatId;
    setMessages(saved);
    if (opening && !opened.current) {
      opened.current = true;
      sendMessage({ text: opening });
    }
  }, [saved, chatId, setMessages, opening, sendMessage]);
  const ready = !!saved;

  // Back in the app after a reply was missed (the phone locked mid-stream): show what the
  // server finished and saved
  const live = useRef({ busy, parts: 0 });
  live.current = { busy, parts: countParts(messages) };
  useEffect(() => {
    async function catchUp() {
      if (document.visibilityState !== "visible" || live.current.busy) return;
      const fresh = await queryClient.fetchQuery(coachQueries.chat(chatId));
      if (live.current.busy || countParts(fresh) <= live.current.parts) return;
      clearError();
      setMessages(fresh);
    }
    document.addEventListener("visibilitychange", catchUp);
    return () => document.removeEventListener("visibilitychange", catchUp);
  }, [chatId, setMessages, clearError]);

  const [text, setText] = useState("");
  const [saving, setSaving] = useState<PreferredStart | null>(null);

  // The coach's open question, if it's waiting on one
  const asked = messages
    .at(-1)
    ?.parts.find((part) => part.type === "tool-ask_user" && part.state === "input-available");

  function answer(label: string, value?: string) {
    if (asked?.type !== "tool-ask_user") return;
    clearError();
    touchChat(chatId);
    following.current = true;
    addToolOutput({
      tool: "ask_user",
      toolCallId: asked.toolCallId,
      output: { answer: label, value },
    });
  }

  function say(line: string) {
    if (!line || busy || !ready) return;
    // A typed line answers the open question: the coach can't go on without that answer
    if (asked) return answer(line);
    clearError();
    touchChat(chatId);
    following.current = true;
    sendMessage({ text: line });
  }

  function send() {
    say(text.trim());
    setText("");
  }

  async function saveAsRecipe({ recipe }: CoachRecipe) {
    const roast = await queryClient.fetchQuery(roastQueries.detail(recipe.roast_id));
    setSaving({ roast, method: recipe.method, values: recipe });
  }

  // Follow the newest line while you're at the bottom; scrolling up to reread stays put
  const thread = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  useEffect(() => {
    const scroller = thread.current?.parentElement;
    if (!scroller) return;
    const onScroll = () => {
      following.current = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 80;
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: on every change to the thread
  useEffect(() => {
    if (following.current) end.current?.scrollIntoView({ block: "end" });
  }, [messages, status, error, earlier]);

  function switchTo(id: string) {
    following.current = true;
    setEarlier(false);
    setChatId(id);
  }

  const main = { label: actions.label, done: actions.done };
  const others = chats.some((chat) => chat.id !== chatId);
  // The header's controls: your earlier chats, and a fresh one once this chat has begun
  const headerActions = (
    <>
      {(others || earlier) && (
        <button
          type="button"
          aria-label="Earlier chats"
          aria-pressed={earlier}
          onClick={() => {
            // The reply's save can land just after the reply itself; read the list once more
            refetchChats();
            setEarlier(!earlier);
          }}
          {...stylex.props(styles.iconAction, earlier && styles.iconActionOn)}
        >
          <HistoryIcon />
        </button>
      )}
      {(messages.length > 0 || earlier) && (
        <button
          type="button"
          aria-label="New chat"
          onClick={() => switchTo(newChatId())}
          {...stylex.props(styles.iconAction)}
        >
          <PlusIcon />
        </button>
      )}
    </>
  );

  if (earlier) {
    return (
      <Sheet title="Earlier" tall actions={headerActions} onClose={onClose}>
        <EarlierChats
          chats={chats}
          currentId={chatId}
          onOpen={(id) => switchTo(openChat(id))}
          onDeleted={(id) => {
            // Deleting the open chat leaves a fresh one in its place
            if (id === chatId) setChatId(newChatId());
            if (chats.length <= 1) setEarlier(false);
          }}
        />
      </Sheet>
    );
  }

  return (
    <Sheet
      title="Dial in"
      tall
      actions={headerActions}
      onClose={onClose}
      footer={
        <form
          {...stylex.props(styles.composer)}
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={asked ? "Or type an answer" : "Ask about a coffee or a brew"}
            enterKeyHint="send"
            aria-label="Message"
            {...stylex.props(styles.input)}
          />
          <HeaderAction type="submit" disabled={!text.trim() || busy || !ready}>
            Send
          </HeaderAction>
        </form>
      }
    >
      <div ref={thread} {...stylex.props(styles.thread)}>
        {!ready ? (
          <div {...stylex.props(styles.loading)}>
            <Loader />
          </div>
        ) : messages.length === 0 ? (
          <div {...stylex.props(styles.opening)}>
            <p {...stylex.props(styles.openingLine)}>
              {brewing
                ? "Ask about this brew, or say how the last cup tasted."
                : "Ask what to brew, or how to get more from a coffee."}
            </p>
            {!opening && (
              <Chips asWritten options={starters(brewing, !!roastId)} value={null} onChange={say} />
            )}
          </div>
        ) : null}

        {messages.map((message) =>
          message.role === "user" ? (
            <p key={message.id} {...stylex.props(styles.mine)}>
              {message.parts.map((part) => (part.type === "text" ? part.text : "")).join("")}
            </p>
          ) : (
            <Reply
              key={message.id}
              message={message}
              open={message === messages.at(-1) && !busy}
              onAnswer={answer}
              cardActions={(card) => [
                {
                  label: "Save as recipe",
                  done: "Save as recipe",
                  run: () => saveAsRecipe(card),
                },
                { ...main, run: () => actions.onRecipe(card) },
              ]}
            />
          ),
        )}

        {busy && (
          <p {...stylex.props(styles.working)}>
            <Loader label="Working" />
            {working(messages.at(-1))}
          </p>
        )}
        {error && <p {...stylex.props(styles.error)}>{errorLine(error)}</p>}
        <div ref={end} />
      </div>

      {saving && (
        <PreferredRecipeSheet
          from={saving}
          onClose={() => setSaving(null)}
          onSaved={() => setSaving(null)}
        />
      )}
    </Sheet>
  );
}

/** How much has been said, to tell a fuller saved chat from the one on screen. */
function countParts(messages: CoachMessage[]) {
  return messages.reduce((count, message) => count + message.parts.length, 0);
}

type ReplyProps = {
  message: CoachMessage;
  /** The newest message, with nothing streaming: its question can still be answered. */
  open: boolean;
  onAnswer: (label: string, value?: string) => void;
  cardActions: (card: CoachRecipe) => CardAction[];
};

/** One reply from the coach: its lines, questions and cards, in the order it gave them. */
function Reply({ message, open, onAnswer, cardActions }: ReplyProps) {
  const sources = message.parts.filter((part) => part.type === "source-url");
  // Sources sit under the reply's last line, above any open question
  const lastLine = message.parts
    .map((part) => part.type === "text" && !!part.text.trim())
    .lastIndexOf(true);
  const sourceLinks = sources.length > 0 && (
    <p key={`${message.id}-sources`} {...stylex.props(styles.sources)}>
      {sources.map((source) => (
        <a
          key={source.sourceId}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          {...stylex.props(styles.source)}
        >
          {source.title ?? new URL(source.url).hostname}
        </a>
      ))}
    </p>
  );

  return (
    <>
      {message.parts.map((part, index) => {
        // Parts never reorder, so their place is their key
        const key = `${message.id}-${index}`;

        if (part.type === "text") {
          if (!part.text.trim()) return null;
          const line = (
            <p key={key} {...stylex.props(styles.line)}>
              {part.text}
            </p>
          );
          return index === lastLine ? [line, sourceLinks] : line;
        }

        if (part.type === "tool-ask_user" && part.input?.question) {
          const options = (part.input.options ?? []).flatMap((option) => option ?? []);
          return (
            <div key={key} {...stylex.props(styles.question)}>
              <p {...stylex.props(styles.line)}>{part.input.question}</p>
              {part.state === "output-available" ? (
                <p {...stylex.props(styles.mine)}>{part.output.answer}</p>
              ) : (
                open &&
                part.state === "input-available" && (
                  <Chips
                    asWritten
                    options={options.map((option) => option.label ?? "")}
                    value={null}
                    onChange={(label) =>
                      onAnswer(label, options.find((option) => option.label === label)?.value)
                    }
                  />
                )
              )}
            </div>
          );
        }

        if (part.type === "tool-propose_recipe" && part.state === "output-available") {
          return <RecipeCard key={key} card={part.output} actions={cardActions(part.output)} />;
        }

        return null;
      })}

      {lastLine === -1 && sourceLinks}
    </>
  );
}

/** What the coach is doing right now, from the last thing it started. */
function working(message?: CoachMessage) {
  const part = message?.role === "assistant" ? message.parts.at(-1) : undefined;
  if (part?.type.includes("search")) return "Searching…";
  if (part?.type === "tool-get_my_brews" || part?.type === "tool-get_roast_brews") {
    return "Looking at the brews…";
  }
  if (part?.type === "tool-find_roasts") return "Looking through the library…";
  return "Thinking…";
}

/** The coach's own line when it has one (the daily limit), otherwise a plain one. */
function errorLine(error: Error) {
  try {
    const { error: line } = JSON.parse(error.message);
    if (typeof line === "string") return line;
  } catch {
    // Not one of the coach's own errors
  }
  return "That hit a snag. Send it again.";
}

const styles = stylex.create({
  thread: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: space.md,
  },
  opening: {
    marginBlock: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: space.lg,
  },
  openingLine: {
    textAlign: "center",
    fontFamily: fonts.display,
    fontStyle: "italic",
    fontSize: 15,
    lineHeight: 1.5,
    color: colors.muted,
  },
  iconAction: {
    width: 40,
    height: 44,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    paddingInline: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    color: colors.muted,
    cursor: "pointer",
    transition: "color 150ms",
  },
  iconActionOn: {
    color: colors.brass,
  },

  // The coach speaks in plain lines; only yours are set in a block
  line: {
    maxWidth: "92%",
    fontSize: 15,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  },
  mine: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    paddingBlock: space.sm,
    paddingInline: 12,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: radius.md,
    fontSize: 15,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  question: {
    display: "flex",
    flexDirection: "column",
    gap: space.md,
  },
  loading: {
    marginBlock: "auto",
    display: "flex",
    justifyContent: "center",
  },
  working: {
    display: "flex",
    alignItems: "center",
    gap: space.md,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.faint,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
  },
  sources: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: space.md,
    rowGap: space.xs,
  },
  source: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.08em",
    color: colors.muted,
    textDecorationLine: "underline",
    textDecorationColor: colors.hairline,
    textUnderlineOffset: 3,
  },
  composer: {
    display: "flex",
    alignItems: "center",
    gap: space.md,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: { default: colors.hairline, ":focus-within": colors.brass },
    transition: "border-color 150ms",
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 44,
    backgroundColor: "transparent",
    borderWidth: 0,
    outline: "none",
    fontSize: 16, // 16px prevents iOS zoom on focus
    "::placeholder": { color: colors.faint },
  },
});
