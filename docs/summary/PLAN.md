# Monthly Summary — Plan

On the 1st of each month, every bro gets a notification. It opens a newsletter-style report for the month just ended, with two parts:
- **The numbers:** the same metrics every month, for the group and for each bro.
- **Three insights per bro:** written by a research agent that reads more than the numbers. It looks at brew notes, tasting results, endorsement notes and history, and can search the web.
- **The showcase (B-phases):** one studio photograph of the month's new coffees together, in the same locked studio as the Roast Gallery. Each new coffee also gets a breakdown and an insight.

In the app, the report is called the **Brewsletter**, with three tabs: **Showcase · Stats · Insights** (B4).

**Principles** (same as `docs/push/PLAN.md`):
- Happy path only, no tests, minimal abstraction.
- Every edge case goes to [Follow-ups](#follow-ups).

The spec mentions "activity during the week" in one place; this plan treats every period as a **calendar month**.

## Status

| Phase | Scope | Status | Plan |
|---|---|---|---|
| S1 | Insight agent: data model, prompt, tools, 3 insights per bro saved to the DB, manual trigger | ✅ Done — insights verified (dc6b381) | [phase-s1.md](phase-s1.md) |
| S2 | Standard metrics: one SQL function for the month's numbers, overall and per bro | ✅ Done (53a1b44) | [phase-s2.md](phase-s2.md) |
| S3 | Report UI: the newsletter page, with metric tiles and insight cards | ✅ Done (5c70bfa); infographic draft in review (09af766) | [phase-s3.md](phase-s3.md) |
| B1 | Showcase image: the month's new roasts, photographed together by a `showcase` Edge Function | ✅ Done | [phase-b1.md](phase-b1.md) |
| B2 | New-coffee breakdown: each new roast's thumbnail, brews, volume and who brewed it | — | — |
| B3 | One insight per new coffee: an agent pass with Google Search, saved per roast and month | — | — |
| B4 | Tabs and rename: "Brewsletter", with Showcase · Stats · Insights tabs | — | — |
| S4 | Monthly trigger and push: cron on the 1st runs `insights` and `showcase`, then a notification that opens the Brewsletter | — | — |

Each phase is planned in `docs/summary/` before it's built, and ends with a checkpoint review.

## How it works (end state)

```
1st of the month, 9am (pg_cron, S4)
        │  POST /functions/v1/insights  { month: "2026-09" }   x-insights-secret
        ▼
Edge Function `insights`
  ├─ replies 202, then fans out: calls itself once per bro (each run has its own time limit)
  │     per bro:
  │       1. insert insight_runs row (status running)
  │       2. build the bro's month snapshot (code, no LLM)
  │       3. agent loop: Gemini + data tools + Google Search → submit_insights
  │       4. insert 3 insights rows, mark the run succeeded (tokens, searches, time)
  └─ (S4) when every bro's run is done → monthly_reports row → push "Your September report is in"

App (S3): /reports/2026-09 → monthly_stats('2026-09') tiles + latest insights per bro
```

## Decisions (proposed, confirm at each phase)

- **Model:** `gemini-3.8-flash` with `thinking_level: "medium"`, on the same `GEMINI_API_KEY` and billing as `studio-photo`, so no new provider. Both are tuned at the S1 checkpoint against run time and quality; `gemini-3.1-pro-preview` is the step up if the writing falls flat.
- **Where it runs:** a new Edge Function `supabase/functions/insights/`.
  - It's a Deno function calling Gemini's **Interactions API** with a plain `fetch`, like `studio-photo`.
  - It uses the same patterns as `studio-photo` and `notify`: the service-role client, a 202 reply with the work in `EdgeRuntime.waitUntil`, and a shared-secret header with JWT verification off.
- **One bro per invocation:**
  - An agent run with web search can take a minute or more.
  - A call for the whole month fans out by having the function call itself once per bro, so each bro's run gets its own wall-clock limit.
- **Data access:**
  - Code preloads the bro's month into the first message (the "snapshot").
  - A few read-only tools let the agent look further back or at other bros.
  - There's no free-form SQL.
- **Web research:** Gemini's built-in `google_search` tool, alongside our own functions in the same request (Gemini 3 supports mixing them). Facts from the web carry their source URLs.
- **Output:**
  - The agent finishes by calling a `submit_insights` function.
  - Gemini doesn't guarantee the arguments match the schema, so the function checks the shape as well as the rules.
  - Invalid submissions (wrong count, too long, too many jabs) go back to the agent as an error tool result, so it fixes them in the same run.
- **Insight types:** `did_you_know`, `pattern`, `recommendation`, `fact`, `jab`.
  - Each bro gets 3 insights covering at least 2 different types, with at most 1 jab.
  - Content is written in the third person, by first name ("Henry…"), because everyone can see it.
  - Aim for 150–350 characters, with 500 as a soft ceiling (rejected above 600).
- **Visibility:** every bro can read every insight (RLS read for bros, as with the other tables). Only the function (service role) writes.
- **Reruns:** every run is kept, and each insight belongs to a run. The "current" insights for a bro and month are the latest succeeded run's. That lets you compare prompt versions during S1.
- **Time zone:** months are calendar months in `America/Chicago`. Brew times are shown to the agent in local time, with the weekday, so patterns like "Mondays" or "after 3pm" are real.

## Phases

### S1 — Insight agent
- **Database:** migration `010_insights.sql` adds `insight_runs` and `insights`, with RLS.
- **Edge Function `insights`:** snapshot builder, tools, prompt, agent loop, and writes to the DB.
- **Trigger:** manual curl for one bro or all bros, plus a `dry_run` mode that returns the insights without saving them (for tuning the prompt).
- **Proof:** for a past month, every bro has 3 insights that are valid, varied and grounded in data, and each run finishes within the function's time limit.
- **You provide:**
  - Run 010.
  - Secret: `INSIGHTS_SECRET` (`GEMINI_API_KEY` is already set for `studio-photo`).
  - Deploy `insights` with JWT verification off.
  - Run the test calls, and read and judge the insights.

### S2 — Standard metrics
- **SQL function `monthly_stats(month date)`.** It returns, overall and per bro:
  - brews
  - volume brewed (sum of `volume_ml`)
  - beans ground (sum of `dose_g`)
  - dial-ins
  - new roasters
  - new roasts
  - new endorsements
  - roasts tried (distinct roasts brewed) and first tries (roasts that bro had never brewed before)
  - a ranking of brew methods by count
- **Live, not snapshotted:** computed when read, so it always reflects edits. The point-in-time snapshot is S4's `monthly_reports.stats`.
- **Snapshot reuse:** the S1 snapshot already builds a few of these numbers in TypeScript. S2 moves them to the SQL function, and the snapshot can then call it.
- **Proof:** the numbers for a past month match hand-checked SQL.

### S3 — Report UI
- **Report page:** a `/reports/:month` route laid out as a newsletter.
  - A group header with the overall numbers.
  - A section per bro, with their numbers (using the same tiles and stats patterns as the rest of the app) and their 3 insight cards.
  - Each card shows its type as a small brass label ("DID YOU KNOW", "JAB") over the content, plus any source links.
- **Queries:**
  - `src/api/reports/` with `reports.service.ts` and `reports.queries.ts`, matching the existing `src/api/*` layout.
  - Two queries: `monthly_stats(month)`, and the latest succeeded run's insights per bro.
- **Finding it:** a newspaper icon in the top bar, with a badge while the newest report is unread (views stored per bro in `report_views`). It opens a list of every past report.
- **Proof:** a past month's report renders well on a phone.

### B1 — Showcase image
- **SQL `month_new_roasts(month date)`:** the roasts the group brewed for the first time this month (the same rule as `monthly_stats`' group `first_tries`), with brews, volume and who brewed them.
- **Edge Function `showcase`:** sends up to 8 of those roasts' studio photos (most brewed first) plus the studio plate to Gemini, with a group-shot version of the locked studio prompt. It saves the result to `roast-photos/_showcase/{month}/`.
  - Roasts without a photo are left out of the image.
- **`showcase_runs`:** every run is kept; the month's image is the latest succeeded run's.
- **Trigger:** manual curl, with the same secret as `insights`.
- **Proof:** the image looks like the gallery's studio, and every bag in it is faithful and readable.

### B2 — New-coffee breakdown
- **For each new roast:** its studio thumbnail, brews, volume and the avatars of who brewed it, from `month_new_roasts`.
- **Placement:** under the showcase image, on the report page, until B4's tabs exist.

### B3 — One insight per new coffee
- **An agent pass, like S1's,** over the month's new roasts: one short insight each (origin, roaster, how the group took to it), with Google Search for facts.
- **Data model:** saved per roast and month.

### B4 — Tabs and rename
- **"Brewsletter" everywhere:** the top-bar icon label, the list page, the masthead and the page titles.
- **Tabs with `SegmentedControl`:**
  - **Showcase:** the image, breakdown and per-coffee insights.
  - **Stats:** the headline mosaic, share chart and methods.
  - **Insights:** the per-bro cards.

### S4 — Monthly trigger and push
- **Cron:** a `pg_cron` job at 9am Chicago time on the 1st POSTs to `insights` and to `showcase` with the previous month. It uses `pg_net` and the secret, which is stored in Vault rather than in git.
- **`monthly_reports` table:** one row per month, with a `stats` jsonb snapshot of `monthly_stats` and a `published_at`.
  - The function writes it once every bro's run has succeeded.
  - The report page reads this snapshot rather than live stats.
- **Push:** once the report is published, every subscribed device gets "Your September report is in", which opens `/reports/2026-09`. This reuses the send code in `notify`, either through a new message type or a shared helper.
- **Failed runs:** rerun the bro by hand (the S1 curl), then publish.
- **Proof:** a forced cron run for last month produces the report and the notification on a phone.

## Follow-ups
0. **Prompt refinements:** the S1 insights work; tailoring the tone, types and rules is deliberately left until the other phases are built. Bump `PROMPT_VERSION` with each change, so runs can be compared.
1. **Feedback on insights:** 👍/👎 per insight, to steer prompt tuning (an `insight_reactions` table).
2. **Regenerate:** an in-app button that reruns one bro's insights.
3. **Evals:** a fixed set of past months with a grading rubric, to compare prompt versions instead of judging by eye.
4. **Deploy with the CLI:** the same follow-up as for `notify` and `studio-photo`.
5. **Weekly variant:** the same function with a `period` argument, if monthly feels too slow.
6. **Spend cap:** a monthly token budget the function checks before running.
7. **Shareable image:** export a bro's section as an image card for group chats.
