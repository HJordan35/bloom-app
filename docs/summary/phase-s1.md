# Phase S1 — Insight agent

**Status:** 🔨 Built — awaiting your setup and test

**Built differently from the plan:**
- **No `get_bros` tool.** The snapshot already lists every bro's id and first name, so the tool would only repeat it.
- **Gemini instead of Claude.** It reuses the Gemini key and billing `studio-photo` already has. The Claude-only parts of the original plan are gone: the refusal fallback, strict tool schemas and explicit prompt caching.
- **Type-checked with Deno, not run.** The month boundaries were tested in Deno, including the daylight-saving changes. The agent itself has only run once you've deployed it.

## Goal
For a given month, each bro gets 3 insights written by a research agent and saved to the database. The insights are grounded in their brews, notes, endorsements and history, plus web research where it's worth it, and each has a type. There's no UI yet: runs are triggered by hand and read in SQL.

See [PLAN.md](PLAN.md) for the decisions this phase builds on (model, runtime, insight types, visibility).

## Data model: `supabase/migrations/010_insights.sql`

```sql
create table insight_runs (
  id uuid primary key default gen_random_uuid(),
  bro_id uuid not null references bros (id) on delete cascade,
  month date not null,                         -- first day of the month
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  model text not null,
  prompt_version text not null,                -- bumped by hand when prompt.ts changes
  usage jsonb,                                 -- input/output/thought/cached tokens, searches, turns, ms
  trace jsonb,                                 -- tool calls made (name + input, results trimmed) for review
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table insights (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references insight_runs (id) on delete cascade,
  bro_id uuid not null references bros (id) on delete cascade,
  month date not null,
  position smallint not null check (position between 1 and 3),
  type text not null check (type in ('did_you_know', 'pattern', 'recommendation', 'fact', 'jab')),
  content text not null,
  sources jsonb not null default '[]',         -- [{ title, url }] for web-backed claims
  created_at timestamptz not null default now(),
  unique (run_id, position)
);

create index on insight_runs (bro_id, month, started_at desc);
create index on insights (month, bro_id);
```

- **RLS:** enabled on both tables, with a single `bros can read` select policy on each, using the same condition as `003_auth.sql`: `(select current_bro_id()) is not null`. There are no insert, update or delete policies; only the service role writes.
- **Not in realtime:** S1 has no UI, so neither table is added to the realtime publication.

## Edge Function: `supabase/functions/insights/`

| File | Contents |
|---|---|
| `index.ts` | Request handling, fan-out, run bookkeeping, the agent loop and DB writes |
| `snapshot.ts` | Builds the bro's month snapshot (text plus a small JSON block) from the service-role client |
| `tools.ts` | Tool declarations (Gemini function format), their handlers, and the submission check |
| `prompt.ts` | `SYSTEM_PROMPT` and `PROMPT_VERSION`, like `studio-photo/prompt.ts` |

**Request** (POST, header `x-insights-secret: <INSIGHTS_SECRET>`):

| Body | Behaviour |
|---|---|
| `{ month: "2026-09" }` | Replies 202, then POSTs `{ month, bro_id }` back to itself once per bro |
| `{ month, bro_id }` | Replies 202; runs that bro in `waitUntil` and saves the results |
| `{ month, bro_id, dry_run: true }` | Runs synchronously and returns `{ insights, usage, trace }`; writes nothing (for tuning the prompt) |

**Per-bro run:**
1. Insert an `insight_runs` row (skipped in a dry run).
2. `buildSnapshot(broId, month)`.
3. Run the agent loop (below).
4. On a valid `submit_insights`: insert 3 `insights` rows, then update the run to `succeeded` with `usage`, `trace` and `finished_at`.
5. On any thrown error: mark the run `failed` with the message. There's no retry; rerun by hand.

**Snapshot** (code, not the LLM). It's the first input, so the system prompt and tools stay identical across bros:
- **The bro:** first name, and when they joined.
- **This month's brews:** local date, weekday and time, plus roast, roaster, region, roast level, method, dose, grind, grinder, temperature, brew time, volume, dialed in, brew notes and tasting results.
- **This month's endorsements:** roast, method, rating and note.
- **Roasters and roasts they added this month.**
- **The month at a glance:** counts, volume, grams, dial-ins and a method breakdown, for the bro and for each other bro. These give the agent comparisons.
- **Their insights from last month,** so the agent doesn't repeat itself.
- **A thin month** (0 or 1 brews) is flagged, so the agent leans on history, or jabs about the drought.

**Tools** (read-only lookups run with the service-role client, plus Google Search and the submission):

| Tool | Input | Returns |
|---|---|---|
| `get_brews` | `bro_id?`, `from?`, `to?`, `roast_id?`, `method?`, `limit` (≤100) | Brews with roast and roaster, newest first, times in local time |
| `get_endorsements` | `bro_id?`, `roast_id?`, `from?`, `to?`, `limit` | Endorsements with roast, rating and note |
| `get_roast` | `roast_id` | The roast, its roaster, its rank (`roast_rankings`), who has brewed it and how often |
| `google_search` | Gemini's built-in tool | Search results; the agent lists the pages it used in `sources` |
| `submit_insights` | `{ insights: [{ type, content, sources: [{ title, url }] }] }` | Checked in code (shape and rules): exactly 3, valid types, at least 2 types, at most 1 jab, each ≤600 characters. On failure it returns `is_error` with the reason |

**Agent loop (`index.ts`):**
- **The call:** `POST https://generativelanguage.googleapis.com/v1beta/interactions` (the same endpoint as `studio-photo`) with:
  - `model: "gemini-3.8-flash"`
  - `system_instruction` (the prompt) and `tools`, sent every turn
  - `generation_config: { thinking_level: "medium" }`
- **The loop:**
  1. The first turn's input is the snapshot.
  2. Gemini keeps the history: each later turn sends only what's new, with `previous_interaction_id` set to the last interaction's `id`.
  3. When the response has `function_call` steps, run them in parallel and send all of their `function_result`s back as the next input.
  4. Stop when `submit_insights` passes the check, or after **10 turns**. In that case the run fails with "no submission".
- **Steering, not forcing:** a turn with no function call gets a nudge to call `submit_insights`.
- **Before trusting a response:** any status other than `completed` or `requires_action` fails the run.
- **Recorded on the run:** usage (input, output, thought and cached tokens, and the number of searches, summed over turns), the turn count and the elapsed time.

**Prompt (`prompt.ts`)**, in outline:
- **Role:** the group's coffee columnist. Witty, snarky and playful, never cruel. Short "quick hits", not summaries.
- **Task:** for the named bro and month, write 3 insights that surprise them. Use the snapshot first, then dig with tools: history, other bros, roasts. Use the web only for facts worth adding (origin, roaster, method, coffee stats).
- **The five types,** each with a definition and one example, taken from your spec:
  - **did you know:** "All coffees this month were Colombian."
  - **pattern:** "Brews more on Mondays."
  - **recommendation:** a concrete technique tweak drawn from their notes, results or recipe drift.
  - **fact:** "Colombia is the #1 exporter…".
  - **jab:** "post-coffee poops…".
- **Grounding rules:**
  - Every claim about a bro must be checkable in the data; no invented numbers.
  - Web facts include their source.
  - Prefer specifics: names, counts, days.
- **Format rules:**
  - Third person, by first name.
  - 150–350 characters, 500 at most.
  - 3 insights, at least 2 types, at most 1 jab.
  - Don't repeat last month's insights.
- **Jab limits:** about their coffee behaviour this month, not their looks or anything personal outside coffee.
- **Finish** by calling `submit_insights`.

## Platform notes
- **Time limit:**
  - The function's wall-clock limit (including `waitUntil` work) depends on the Supabase plan; check it in the dashboard.
  - One bro per invocation is the main protection.
  - The S1 checkpoint measures real run times. If they're too close to the limit, the levers in order are: a lower `thinking_level`, fewer turns, and asking for fewer searches in the prompt.
- **Cost:** with only a few bros a month, it's small. Each run logs its tokens, so the checkpoint reports the actual cost per bro.
- **Stored interactions:** chaining with `previous_interaction_id` relies on Google storing each interaction (the default), so the month's data passes through Google's API storage, as `studio-photo`'s photos already do.

## You provide
1. **Run** `010_insights.sql` in the SQL editor.
2. **Add secrets** (Edge Functions → Secrets):
   - `INSIGHTS_SECRET`: any long random string, e.g. from `openssl rand -hex 24`.
   - `GEMINI_API_KEY` is already there for `studio-photo`.
3. **Deploy:** `npx supabase functions deploy insights --no-verify-jwt --project-ref <ref>`.

## Verification
1. **Dry run one bro** for last month:
   `curl -X POST https://<ref>.supabase.co/functions/v1/insights -H "x-insights-secret: $SECRET" -d '{"month":"2026-09","bro_id":"<id>","dry_run":true}'`
   - **Expect:** 3 insights with valid types, plus usage and a trace.
   - **Check:** the claims against the app's data.
   - **Iterate on the prompt** this way, bumping `PROMPT_VERSION` each time.
2. **Full run:** `-d '{"month":"2026-09"}'` returns 202. Then check in SQL:
   - `select bro_id, status, usage, error, finished_at - started_at from insight_runs order by started_at desc;`: one `succeeded` row per bro.
   - `select bro_id, position, type, content, sources from insights where month = '2026-09-01' order by bro_id, position;`: 3 rows per bro.
3. **RLS:** signed in as a bro in the app, run `supabase.from("insights").select()` in the console. It should return rows, and an insert should be rejected.
4. **Edge cases worth one manual try each:**
   - A bro with no brews this month.
   - A rerun of the same month: a second run is kept, and its insights are the latest.
5. **Checkpoint review:**
   - Are the insights grounded, varied, fun and the right length?
   - Run time and cost per bro.
   - Whether the thinking level, the model (Flash or Pro) or the tools need tuning before S2.
