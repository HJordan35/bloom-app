# Phase B3 — One insight per new coffee

**Status:** ✅ Done

## Goal
Each of the month's new coffees (from `month_new_roasts`, B1) gets one short insight about the coffee itself. It's written by the same research agent as S1, with Google Search, and shown under that coffee's row in the showcase breakdown.

## Data: `supabase/migrations/014_roast_insights.sql`
- **`roast_insights`:** one row per run, since a run writes a single insight. The run fields and the insight live together:
  - `roast_id`, `month`
  - `status` (`running` · `succeeded` · `failed`)
  - `type` (the S1 types), `content`, `sources`
  - `model`, `prompt_version`, `usage`, `trace`, `error`, `started_at`, `finished_at`
- **A coffee's insight for a month** is its latest `succeeded` row. Every run is kept, as in S1.
- **RLS:** every bro can read. There are no write policies; the function writes with the service role.

## Edge Function: the `insights` function gains roasts
It reuses S1's agent loop, lookup tools and Google Search. Rather than a second function, it gets a **roast job** next to the bro job.

| Body | Behaviour |
|---|---|
| `{ month }` | 202, then runs every bro **and** every new coffee (one call each) |
| `{ month, scope: "bros" }` / `{ month, scope: "roasts" }` | 202, runs only that half |
| `{ month, roast_id }` | 202, runs that coffee and saves its insight |
| `{ month, roast_id, dry_run: true }` | Runs that coffee and returns `{ insight, usage, trace }`; saves nothing |

- **The agent loop is generalised:** `agent(job)` takes a job made of its system prompt, tools, opening snapshot and submission handling. The bro job is S1's, unchanged. The roast job is new.
- **Roast snapshot** (`buildRoastSnapshot`), all gathered by code:
  - the coffee: name, roaster and location, region, roast level, when it was added and by whom
  - its group ranking
  - every brew of it this month, by any bro, with recipes, notes and tasting results
  - every endorsement of it
  - the other new coffees this month, so the agent doesn't write the same fact twice
- **Tools:** S1's `get_brews`, `get_endorsements`, `get_roast` and Google Search, plus `submit_roast_insight`. It takes a single `{ type, content, sources }`, checked with the same per-insight rules as S1: a valid type and at most 600 characters.
- **Prompt** (`ROAST_SYSTEM_PROMPT`, `ROAST_PROMPT_VERSION = "b3-1"`):
  - the same columnist voice as S1
  - write about the coffee: its origin, producer or roaster (via search), how the group took to it, recipe patterns across bros, and notes against ratings
  - one insight, 150–350 characters, grounded, with web facts sourced
  - a jab is allowed, but aimed at how the bros treated the coffee, never at the coffee's makers

## UI
- **In the showcase breakdown:** each coffee's insight sits under its row. It's a compact `InsightCard` with no card chrome: the brass type label, 13px text and source links, indented to line up with the coffee's name.
- **Data:** `fetchRoastInsights(month)` returns a map of roast id to its latest successful insight, through `reportQueries.roastInsights(month)`.
- **Demo:** `mock.ts` gains one insight per mock coffee.

## You provide
1. **Run** `014_roast_insights.sql` in the SQL editor.
2. **Redeploy** `insights`: `npx supabase functions deploy insights --no-verify-jwt --project-ref <ref>`.

## Verification
1. **Dry run one coffee** (a `roast_id` from `month_new_roasts('2026-10-01')`):
   `curl … -d '{"month":"2026-10","roast_id":"<id>","dry_run":true}'`. Expect one grounded insight, plus usage and a trace.
2. **Run the coffees:** `-d '{"month":"2026-10","scope":"roasts"}'`. Then:
   `select roast_id, status, type, content, error from roast_insights order by started_at desc;` should show one `succeeded` row per new coffee.
3. **The report** (`/reports/2026-10`): each new coffee's row shows its insight.
4. **The bro job is unchanged:** a bro dry run still returns 3 insights.
