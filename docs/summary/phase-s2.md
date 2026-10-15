# Phase S2 — Standard metrics

**Status:** ✅ Done (53a1b44)

**Tested before handoff:** the function was run in PGlite (Postgres in WebAssembly) against sample data with hand-worked answers: two active bros and an idle one, a roast brewed before the month, brews minutes either side of midnight on the 1st and on the last day (Chicago time), and an empty month. Every number matched. The snapshot change was type-checked with Deno.

## Goal
One database function returns a month's standard numbers, both for the whole group and for each bro, so every metric can be shown as "the total, and who contributed what". The S3 report page, S4's point-in-time snapshot and the S1 insight agent all read these numbers from this one function, so they always agree.

There's no UI in this phase. The proof is the function's output in the SQL editor, checked by hand against the raw tables.

## Metrics
All of them cover one calendar month in `America/Chicago`, the same month boundaries as S1.

| Metric | Key | Definition |
|---|---|---|
| Brews | `brews` | Brews **started** in the month. Unfinished ones count too: a forgotten brew was still brewed. |
| Volume brewed | `volume_ml` | Sum of `volume_ml` (the brewed output, so espresso counts its yield). Brews without a volume add nothing. |
| Beans ground | `beans_g` | Sum of `dose_g`. Brews without a dose add nothing. |
| Dial-ins | `dialed_in` | Brews in the month marked dialed in. |
| New roasters | `roasters` | Roasters added in the month (`created_at`), credited to `created_by`. |
| New roasts | `roasts` | Roasts added in the month, credited to `created_by`. |
| New endorsements | `endorsements` | Endorsements created in the month, credited to `bro_id`. |
| Roasts tried | `roasts_tried` | Distinct roasts brewed in the month. |
| First tries | `first_tries` | Of those, the roasts that bro had never brewed before the month. For the group total, the roasts **no bro** had brewed before the month. |
| Method ranking | `methods` | Brews per method in the month, most first, with each bro's share. |

- **"Overall" isn't always the sum of the bros.** For `roasts_tried` and `first_tries`, two bros brewing the same roast count it once in the total. Every other total is the sum of the bros.
- **Volume and beans** are only as complete as what bros record. The report can show the totals as-is; nothing is estimated.

## Database function: `supabase/migrations/011_monthly_stats.sql`

`monthly_stats(p_month date) returns jsonb`, where `p_month` is the first day of the month (`'2026-09-01'`).

**Returns:**
```json
{
  "month": "2026-09-01",
  "totals": {
    "brews": 41, "volume_ml": 9850, "beans_g": 702.5, "dialed_in": 6,
    "roasters": 2, "roasts": 5, "endorsements": 9,
    "roasts_tried": 11, "first_tries": 4
  },
  "bros": [
    {
      "bro_id": "…", "first_name": "Henry",
      "brews": 18, "volume_ml": 4400, "beans_g": 315, "dialed_in": 3,
      "roasters": 1, "roasts": 3, "endorsements": 4,
      "roasts_tried": 6, "first_tries": 3
    }
  ],
  "methods": [
    { "method": "V60", "brews": 17, "by_bro": [{ "bro_id": "…", "brews": 10 }] }
  ]
}
```

- **Every bro is listed,** including ones with no activity (all zeros), so the report can show who sat the month out. Bros are ordered by brews, most first, then by first name.
- **Methods** are ordered by brews, most first, then by name. Only methods used in the month appear.
- **How it works:**
  - `language sql stable`, built from CTEs into `jsonb_build_object`.
  - The month's boundaries are `p_month::timestamp at time zone 'America/Chicago'`, and the same plus one month. That's local midnight, with daylight saving handled by Postgres.
  - Each metric is grouped by bro in its own CTE, then joined onto the full bro list.
  - First tries use `not exists`: no brew by that bro of that roast (or, for the total, by anyone) started before the month.
- **Security:**
  - `security invoker`, so it runs under the caller's RLS. Bros can already read every row it touches, so they get the full numbers.
  - Execute is revoked from `public` and `anon` and granted to `authenticated`, the same pattern as `current_bro_id()`. The service role (the insights function) can always call it.
- **Live:** it's computed when called, so it reflects later edits. S4 saves a snapshot of it when the report is published; the app reads that snapshot rather than calling this live.

## The insight agent uses it (S1 change)
The S1 snapshot builds its "month at a glance" in TypeScript (`snapshot.ts`, the `glance` block). That's replaced by one call:
```ts
const { data: stats, error } = await db.rpc("monthly_stats", { p_month: day });
```
- **The agent sees the same numbers the report will show,** including roasts tried and first tries, which are good insight material.
- **Less code:** the TypeScript sums and method counts go away. The snapshot still loads the bro's own brews, endorsements and additions for detail.
- **Bump `PROMPT_VERSION`** to `s1-2`, so runs made with the new snapshot can be told apart from earlier ones.

## You provide
1. **Run** `011_monthly_stats.sql` in the SQL editor.
2. **Deploy** `insights` again for the snapshot change: `npx supabase functions deploy insights --no-verify-jwt --project-ref <ref>`.

## Verification
1. **The output:** `select jsonb_pretty(monthly_stats('2026-09-01'));` in the SQL editor. Every bro is listed, and the totals look plausible.
2. **Hand checks** for the same month, each compared with the function:
   ```sql
   -- Brews, volume, beans and dial-ins per bro
   select bro_id, count(*), sum(volume_ml), sum(dose_g), count(*) filter (where dialed_in)
   from brews
   where started_at >= '2026-09-01 00:00 America/Chicago'
     and started_at <  '2026-10-01 00:00 America/Chicago'
   group by bro_id;

   -- Endorsements per bro (repeat with roasts/roasters and created_by)
   select bro_id, count(*) from endorsements
   where created_at >= '2026-09-01 00:00 America/Chicago'
     and created_at <  '2026-10-01 00:00 America/Chicago'
   group by bro_id;
   ```
3. **A boundary check:** a brew logged late on the last evening of the month (Chicago time) counts in that month, not the next. If there isn't one, compare `monthly_stats('2026-10-01')` before and after logging a test brew at 11pm on the 31st, then delete it.
4. **From the app:** signed in as a bro, `supabase.rpc("monthly_stats", { p_month: "2026-09-01" })` in the browser console returns the same JSON.
5. **The agent:** a dry run for one bro still produces 3 insights. The trace or the insights may now mention roasts tried or first tries.

## Follow-ups
- **More metrics** from the brainstorm, if wanted later: top roast of the month, average rating given, and brew rhythm (busiest weekday, earliest and latest brew, longest streak).
- **Month-over-month change** ("+12 brews on August"): calling the function for the previous month as well is enough. It's a presentation choice for S3.
