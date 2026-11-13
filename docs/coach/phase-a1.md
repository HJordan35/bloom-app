# Phase A1 — Engine

**Status:** 🔨 Built — deployed, conversing over curl; awaiting review

## Goal
A `coach` Edge Function you can hold a streamed conversation with over `curl`, before and during a brew. No UI; nothing in the app changes.

## Web search with our own tools
`insights` already mixes Google Search with function tools on Gemini's Interactions API, so the coach uses the AI SDK's Interactions mode (`google.interactions("gemini-3.8-flash")`) with `store: false`: Gemini keeps nothing, and the chat in `coach_chats` is the only history. This is the first thing to confirm once deployed (step 2 below). If it fails, the fallback is a `search_web(query)` tool of ours that makes one grounded call.

## Data: `supabase/migrations/018_coach.sql`
- **`coach_chats`:** one conversation. `id` (the client's chat id, text), `bro_id`, `roast_id` and `brew_id` (nullable, filled in as they become known, `on delete set null`), `messages jsonb` (the chat as the UI shows it), `created_at`, `updated_at`.
- **`coach_turns`:** one request. `chat_id`, `bro_id`, `mode` (`before` / `during`), `model`, `prompt_version`, `knowledge_version`, `usage jsonb` (tokens, steps, ms), `trace jsonb` (the tool calls and their inputs), `error`, `created_at`. Every turn is kept so prompt versions can be compared, and the daily cap counts these.
- **RLS:** you read your own. Only the service role writes.
- Not in the realtime publication.

## Function: `supabase/functions/coach/`
- **`index.ts`**
  - CORS and auth as in `studio-photo`: user JWT → `bros`. Or `x-coach-secret` + `bro_id`, for `curl` and the A3 replay script.
  - Body, one of:
    - `{ chat_id, message }`: the newest UI message from `useChat`. It replaces the stored message with the same id (an answered question comes back as the same assistant message) or is added.
    - `{ chat_id, text, roast_id? }`: a typed line. If the coach's last message has an open question, the line answers it (matching a chip's label picks up its value); otherwise it's a new user message.
  - Daily cap: 80 turns per bro in the last 24 hours; over it, a 429 with a plain line.
  - `streamText`: system prompt + primer + this turn's context, the tools, low thinking, at most 6 steps, a 60s abort.
  - Returns the UI message stream. The turn also runs to its end under `EdgeRuntime.waitUntil`, so it saves if the client goes away.
  - Lookup results (`find_roasts`, `get_roast_brews`, `get_my_brews`) are for the model within the turn: they're left out of the stream to the app and out of the saved chat. Later turns get the settled roast from the context and can look anything else up again.
  - At the end: upsert the chat, insert the turn. A failed turn inserts a turn row with the error.
- **`context.ts`** — the context block, rebuilt each turn with no LLM:
  - **Mode:** the bro's open brew (`finished_at is null`) → `DURING`, else `BEFORE`.
  - **DURING:** the brew through `brewForAgent`, minutes since it started, and the bookmarked recipe it was started from (its time and volume are the target).
  - **Always:** gear (each grinder → each method → the last 5 distinct grind settings), and the bro's bookmarked recipes.
  - **Roast settled** (the open brew's, the request's `roast_id`, or the chat's): the roast, every bro's bookmarked recipes for it, the latest 8 finished brews of it, its endorsements, and the bro's own last 5 brews of it.
  - **No roast yet:** the 6 roasts the bro brewed most recently, each with the methods brewed and bookmarked, for the roast chips.
- **`tools.ts`** (zod schemas)
  - `google_search`: the provider's tool. Once per turn, by instruction.
  - `find_roasts({ query })`: the group's library by roast or roaster name, for a roast that isn't in the recent six.
  - `get_roast_brews({ roast_id })`: the same roast block as the context, for a roast settled mid-chat.
  - `get_my_brews({ roast_id?, method?, grinder?, limit })`: the bro's own brews.
  - `ask_user({ question, options: [{ label, value? }] })`: no `execute`; the answer is `{ answer, value? }`.
  - `suggest_tweak({ base: { kind: "open_brew" | "recipe" | "brew", id? }, changes: [{ field, to, why }], next })`: 1–2 changes to `dose_g`, `grind_size`, `temp` or `brew_notes` (one added line). `execute` loads the base, reads each `from` off it (the model doesn't supply it), types and checks each `to`, and returns `{ base, changes: [{ field, from, to, why }], next, result }`, where `result` is the base's recipe with the changes made.
  - `propose_recipe({ roast_id, method, label?, dose_g, grind_size?, grinder?, temp, temp_unit, brew_time_s?, volume_ml?, brew_notes, summary, next })`: `execute` checks the roast exists, and that dose, temp and ratio are sane and the notes are at most 6 lines.
  - A failed check throws its reason, which goes back to the model to fix in the same turn.
- **`prompt.ts`** — `SYSTEM_PROMPT`, `PROMPT_VERSION = "a1-1"`: how to coach (diagnose first, smallest change, always a why, what to taste for next, talking is fine, never open with a card), the two modes, grind is grinder-relative, the order of evidence, and voice.
- **`knowledge.ts`** — the primer, `KNOWLEDGE_VERSION = "k1"`: what the cup tells you, which lever first, roast level, and a page per method. **Needs a read by someone who brews:** the named techniques (Hoffmann's V60, AeroPress and French press, Kasuya's 4:6, Hedrick on the Pulsar) are from memory, not checked against the sources.

Time and volume aren't tweak fields: a brew's are what happened, written at Finish. A target goes in the tweak's `next` line, or in a full recipe.

## Shared: `supabase/functions/_shared/brews.ts`
`TIME_ZONE`, `BREW_SELECT`, `BrewRow`, `localTime` and `brewForAgent` moved here from `insights/snapshot.ts`; `insights` imports them. No other change to `insights`.

## You provide
1. Run `018_coach.sql` in the SQL editor.
2. Set the secret: `npx supabase secrets set COACH_SECRET=<random> --project-ref <ref>`.
3. Deploy both (insights for the moved import):
   `npx supabase functions deploy coach --no-verify-jwt --project-ref <ref>`
   `npx supabase functions deploy insights --no-verify-jwt --project-ref <ref>`

## Verification
Done here: `deno check` passes for `coach/index.ts` (in a copy outside the repo, since the root `package.json` hides `npm:ai` from Deno) and for `insights/index.ts`. Nothing has been run against Gemini or the database.

To talk to it, set these once per terminal:
```
export COACH_SECRET=<the secret you set>
export BRO_ID=<your bros.id>
export CHAT=t1
```

Then send a line (change only the `text`):
```
curl -N https://seybnzionbnyfwoqijcq.supabase.co/functions/v1/coach \
  -H "x-coach-secret: $COACH_SECRET" -H "content-type: application/json" \
  -d "{\"chat_id\":\"$CHAT\",\"bro_id\":\"$BRO_ID\",\"text\":\"Pulsar\"}"
```
- The same `CHAT` continues the conversation, and a line sent while the coach is waiting on a question is taken as the answer. A chip's exact label (`Pulsar`) also carries the chip's value.
- `export CHAT=t2` starts a new chat.
- Avoid double quotes inside the text; apostrophes are fine.

1. An `insights` dry run still works after the redeploy (`docs/summary/phase-s1.md`).
2. Search and tools together: "what does the roaster recommend for <a roast>?" streams a reply, and the turn's `trace` shows `google_search` next to our tools with no error.
3. With no open brew:
   - "what should I brew?" → an `ask_user` with your recent roasts;
   - answer with a roast's chip label → an `ask_user` for the method;
   - answer with a method you've brewed it with → a question about how that's been tasting, not a card;
   - "a bit bitter" → a short why and a `suggest_tweak` based on your recipe or last brew, with one or two changes;
   - a roast and method you've never brewed → a `propose_recipe` on your grinder, with its why.
4. Start a brew in the app, then: "last cup of this was sour" → no roast or method question, and a `suggest_tweak` on `open_brew` whose `from` values are the brew's current ones (e.g. temp only).
   - "why would hotter help?" → a text answer, no card.
   - "help" with nothing else → a question, not a card.
5. Edit the grind in the app, ask again: the reply uses the new value.
6. Drop the `curl` mid-stream: `coach_chats` still holds the full turn, and `coach_turns` has its usage and trace.
7. `select mode, usage, trace, error from coach_turns order by created_at desc limit 10;` reads sensibly.
