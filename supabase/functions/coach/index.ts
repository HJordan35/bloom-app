// The brew coach: one streamed chat turn per request, before or during a brew (Brew Coach, phase A1).
// Deploy: npx supabase functions deploy coach --no-verify-jwt --project-ref <ref>
// Called by the app with the bro's JWT, or with x-coach-secret + bro_id (curl, the replay script):
//   { chat_id, message }            the newest UI message from useChat
//   { chat_id, text, roast_id? }    a typed line; it answers the coach's open question if there is one
import { createGoogle, type GoogleLanguageModelInteractionsOptions } from "npm:@ai-sdk/google@4";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
  type UIMessageChunk,
  validateUIMessages,
} from "npm:ai@7";
import { buildContext, fetchOpenBrew } from "./context.ts";
import { KNOWLEDGE, KNOWLEDGE_VERSION } from "./knowledge.ts";
import { PROMPT_VERSION, SYSTEM_PROMPT } from "./prompt.ts";
import { type CardRecipe, coachTools, type Seen } from "./tools.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

// Gemini, on the same API key as insights. The Interactions API takes Google Search and our
// own tools in one call; store is off, so the chat in coach_chats is the only history.
const MODEL = "gemini-3.8-flash";
const THINKING_LEVEL = "low";
const MAX_STEPS = 6;
const TURN_TIMEOUT_MS = 60_000;
const DAILY_TURNS = 80;
// Lookup results are for the model, within the turn: they're not sent to the app or kept in the
// chat. Later turns get the settled roast from the context, and can look anything else up again.
const LOOKUPS = ["find_roasts", "get_roast_brews", "get_my_brews"];
// A search's result is Google's own markup, which the SDK's check for a saved chat rejects
// (it expects an object, the Interactions API sends a list). The search is dropped from the
// chat altogether; its sources stay, as their own parts.
const SEARCH = "tool-google_search";
const LOOKED_UP = "Looked up earlier; the result wasn't kept. Call the tool again if you need it.";
const SECRET = Deno.env.get("COACH_SECRET");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);
const google = createGoogle({ apiKey: Deno.env.get("GEMINI_API_KEY") ?? "" });

type Bro = { id: string; first_name: string };
type Part = UIMessage["parts"][number];
type AskPart = Part & {
  state: string;
  input?: { options?: { label: string; value?: string }[] };
  output?: unknown;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  // A failure before the stream starts still answers with CORS headers and its reason;
  // otherwise the browser reports it as a CORS error and hides the cause
  try {
    return await turn(req);
  } catch (e) {
    console.error("coach failed before streaming:", reason(e));
    return json({ error: "That hit a snag. Send it again.", detail: reason(e) }, 500);
  }
});

/** One chat turn: who's asking, the chat so far, the state right now, then the streamed reply. */
async function turn(req: Request) {
  const { chat_id, message, text, roast_id, bro_id } = await req.json();
  const bro = await whoIs(req, bro_id);
  if (!bro) return json({ error: "Not a bro" }, 401);
  if (!chat_id || (!message && !text)) return json({ error: "Needs chat_id and a message" }, 400);

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("coach_turns")
    .select("id", { count: "exact", head: true })
    .eq("bro_id", bro.id)
    .gte("created_at", dayAgo);
  if ((count ?? 0) >= DAILY_TURNS) {
    return json({ error: "That's the limit for today. Back tomorrow." }, 429);
  }

  const { data: chat } = await supabase
    .from("coach_chats")
    .select("bro_id, roast_id, title, messages")
    .eq("id", chat_id)
    .maybeSingle();
  if (chat && chat.bro_id !== bro.id) return json({ error: "Not your chat" }, 403);

  const started = Date.now();
  const open = await fetchOpenBrew(supabase, bro.id);
  const seen: Seen = { roastId: roast_id ?? chat?.roast_id ?? null, lastCard: null };
  const mode = open ? "during" : "before";
  const tools = coachTools(supabase, google, bro, open, seen);

  const messages = await validateUIMessages({
    messages: withNewest((chat?.messages ?? []) as UIMessage[], message, text)
      .map(trimmed)
      .map(settled),
    tools,
  });

  // The recipe on this chat's latest card, for a card that iterates on it
  const lastCard = messages
    .flatMap((m) => m.parts)
    .findLast(
      (part) =>
        part.type === "tool-propose_recipe" && (part as AskPart).state === "output-available",
    ) as { output?: { recipe?: CardRecipe } } | undefined;
  seen.lastCard = lastCard?.output?.recipe ?? null;

  const result = streamText({
    model: google.interactions(MODEL),
    system: `${SYSTEM_PROMPT}\n\n${KNOWLEDGE}\n\n${await buildContext(supabase, bro, open, seen.roastId)}`,
    messages: await convertToModelMessages(messages, { tools }),
    tools,
    stopWhen: isStepCount(MAX_STEPS),
    abortSignal: AbortSignal.timeout(TURN_TIMEOUT_MS),
    providerOptions: {
      google: {
        store: false,
        thinkingLevel: THINKING_LEVEL,
      } satisfies GoogleLanguageModelInteractionsOptions,
    },
  });

  const turn = {
    chat_id,
    bro_id: bro.id,
    mode,
    model: MODEL,
    prompt_version: PROMPT_VERSION,
    knowledge_version: KNOWLEDGE_VERSION,
  };

  /** Saves the chat as the UI has it, then the turn's usage and tool calls. */
  async function save(saved: UIMessage[]) {
    const { error } = await supabase.from("coach_chats").upsert({
      id: chat_id,
      bro_id: turn.bro_id,
      roast_id: open?.roast.id ?? seen.roastId,
      brew_id: open?.id ?? null,
      title: chat?.title ?? firstLine(saved),
      messages: saved.map(trimmed),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    const [usage, steps] = await Promise.all([result.totalUsage, result.steps]);
    await supabase.from("coach_turns").insert({
      ...turn,
      usage: { ...usage, steps: steps.length, ms: Date.now() - started },
      trace: steps.flatMap((step) =>
        step.toolCalls.map((call) => ({ tool: call.toolName, input: call.input })),
      ),
    });
  }

  // Run to the end and save even if the phone drops the connection
  EdgeRuntime.waitUntil(
    Promise.resolve(result.consumeStream()).catch((e) => console.error("coach failed", e)),
  );

  return createUIMessageStreamResponse({
    headers: CORS,
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      sendSources: true,
      onEnd: ({ messages: saved }) => save(saved),
      onError: (e) => {
        console.error("coach failed:", reason(e));
        supabase
          .from("coach_turns")
          // A chat that failed on its first turn was never saved, so there's no row to point at
          .insert({ ...turn, chat_id: chat ? chat_id : null, error: reason(e) })
          .then(() => {});
        return "That hit a snag. Send it again.";
      },
    }).pipeThrough(lookupsTrimmed()),
  });
}

/** The stream to the app, with lookup and search results left out. */
function lookupsTrimmed() {
  const lookups = new Map<string, unknown>();
  return new TransformStream<UIMessageChunk, UIMessageChunk>({
    transform(chunk, controller) {
      if (chunk.type === "tool-input-available") {
        if (LOOKUPS.includes(chunk.toolName)) lookups.set(chunk.toolCallId, LOOKED_UP);
        if (`tool-${chunk.toolName}` === SEARCH) lookups.set(chunk.toolCallId, {});
      }
      const cut = chunk.type === "tool-output-available" && lookups.has(chunk.toolCallId);
      controller.enqueue(cut ? { ...chunk, output: lookups.get(chunk.toolCallId) } : chunk);
    },
  });
}

/** A message as it's kept: no searches, and lookups without their results. */
function trimmed(message: UIMessage): UIMessage {
  const parts = message.parts
    .filter((part) => part.type !== SEARCH)
    .map((part) =>
      LOOKUPS.some((name) => part.type === `tool-${name}`) && "output" in part && part.output
        ? ({ ...part, output: LOOKED_UP } as Part)
        : part,
    );
  return { ...message, parts };
}

/**
 * A message with every tool call settled, as the model requires of a chat's history. A turn
 * that was cut short (a timeout, an error mid-reply) can leave a call without its result, and
 * a second question asked alongside the first never gets its answer: either would make every
 * later turn fail. A question left open is marked unanswered; any other open call is dropped.
 */
function settled(message: UIMessage): UIMessage {
  const open = (part: Part) =>
    part.type.startsWith("tool-") &&
    ["input-streaming", "input-available"].includes((part as AskPart).state);
  const parts = message.parts
    .filter((part) => part.type === "tool-ask_user" || !open(part))
    .map((part) =>
      open(part)
        ? ({ ...part, state: "output-available", output: { answer: "(not answered)" } } as Part)
        : part,
    );
  return { ...message, parts };
}

/** Why a turn failed, with the model API's own reply when there is one (its message is just "Bad Request"). */
function reason(e: unknown) {
  const { statusCode, responseBody } = e as { statusCode?: number; responseBody?: string };
  return [String(e), statusCode, responseBody?.slice(0, 2000)].filter(Boolean).join(" | ");
}

/** The signed-in bro, or the bro named by a caller holding the secret. */
async function whoIs(req: Request, broId?: string): Promise<Bro | null> {
  const query = supabase.from("bros").select("id, first_name");
  if (SECRET && req.headers.get("x-coach-secret") === SECRET) {
    const { data } = await query.eq("id", broId ?? "").maybeSingle();
    return data;
  }
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data: auth } = await supabase.auth.getUser(token);
  const { data } = await query.eq("auth_id", auth.user?.id ?? "").maybeSingle();
  return data;
}

/**
 * The chat with this request's message in place. A UI message replaces the stored one with
 * its id (an answered question comes back as the same assistant message) or is added. A typed
 * line answers the coach's open question if there is one, since the model can't go on without
 * that answer; otherwise it's a new user message.
 */
function withNewest(history: UIMessage[], message?: UIMessage, text?: string): UIMessage[] {
  const line = text ?? typedText(message);
  const last = history.at(-1);
  const asked = last?.parts.find(
    (part) => part.type === "tool-ask_user" && (part as AskPart).state === "input-available",
  ) as AskPart | undefined;

  if (asked && last && line != null) {
    const option = asked.input?.options?.find(
      (o) => o.label.toLowerCase() === line.trim().toLowerCase(),
    );
    const answered = {
      ...asked,
      state: "output-available",
      output: { answer: option?.label ?? line, value: option?.value },
    } as Part;
    const parts = last.parts.map((part) => (part === asked ? answered : part));
    return [...history.slice(0, -1), { ...last, parts }];
  }
  if (message) {
    const at = history.findIndex((m) => m.id === message.id);
    return at === -1 ? [...history, message] : history.with(at, message);
  }
  return [
    ...history,
    { id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text: text ?? "" }] },
  ];
}

/** The first thing the bro said, as the chat's title. */
function firstLine(messages: UIMessage[]) {
  const text = typedText(messages.find((message) => message.role === "user"));
  return text?.trim().slice(0, 80) || null;
}

/** A user message's text, or null for anything else. */
function typedText(message?: UIMessage) {
  if (message?.role !== "user") return null;
  return message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
