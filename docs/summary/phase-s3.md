# Phase S3 — Report UI

**Status:** 🔨 Built — awaiting your setup and test

**Built differently from the plan:**
- **Shorter stat labels:** `Tried`, `Firsts` and `New roasts`. "Roasts tried" and "First tries" don't fit a quarter of a phone's width at the strip's label size.
- **`StatStrip`** (`src/components/StatStrip.tsx`) is taken out of `BroProfilePage`, which now uses it too.
- **The masthead's bro count** is the bros who brewed that month, not all bros.

## Visual pass (draft)
A first take on an infographic layout, in its own commit so it can be dropped. Charts use TanStack Charts (`@tanstack/charts`), and the report routes are lazy-loaded so the library stays out of the app's first load.
- **Masthead:** the month in large display type.
- **Headline mosaic:** Brews as a hero tile with a 6-month area sparkline, and Volume and New roasts with 6-month bar sparklines (the latest month in brass). Each also gets a "vs last month" delta. The other numbers are plain tiles, one of them in mahogany.
- **Who did what:** a 100% stacked bar per metric, split by bro in each bro's colour, with the total at the right.
- **Methods:** bars stacked by bro.
- **A report card per bro:** a rank caption, 4 small number tiles, and the insights as a swipeable carousel.
- **Bro colours:** wood tones from the theme, assigned by first name, so a bro keeps the same colour every month (`broColors.ts`).
- **`/reports/demo`** renders the page from `mock.ts`. Both are deleted once the look is agreed.

## Goal
A month's report is a page in the app, laid out like a newsletter:
- the group's numbers
- the method ranking
- a section per bro, with their numbers and their 3 insights

It reads live data: `monthly_stats` for the numbers and the latest successful insight run per bro. S4 later swaps the live numbers for the snapshot saved when the report is published. There's no push or cron in this phase.

You get to reports from a newspaper icon in the top bar. It carries a badge while the newest report is unread; the badge goes once you open that report, and the icon always leads to every past report.

## Top-bar icon (`AppShell`)
- **Where:** a `NewspaperIcon` button at the far right of the top bar, on every page, after the page title. The title stays where it is; the icon sits to its right with a `space.md` gap.
  - It's 22px, `colors.muted`, with a 44px tap area, the same as the back button's.
  - It links to `/reports`.
- **The badge:** a small `colors.ember` dot (8px, ringed in `colors.bg`) on the icon's top-right corner.
  - It shows when the newest report month is **not** in this bro's `report_views`.
  - It's only about the newest month. Unread older months don't badge the icon, so a new bro isn't greeted by a backlog.
  - There's no badge, and no icon, when there are no reports yet.
- **Clearing it:** opening `/reports/:month` records a view for that month. The views query is updated in place, so the dot goes as soon as the page opens, not on the next refetch.
- **Across devices:** views are stored per bro in the database, so reading the report on the phone clears the badge on the laptop too.

## Route: `/reports`
- A simple list of every month with a report, newest first, as rows: `September 2026` and a `→`.
- **Unread months** have the same ember dot at the start of the row. Read ones don't.
- **No reports yet:** `EmptyState` ("No reports yet. The first lands on the 1st.").
- **AppShell:** it's a detail route (back button), so add `["/reports", "Reports"]` to `DETAIL_TITLES`.

## Route: `/reports/:month`
- `:month` is `YYYY-MM` (`/reports/2026-09`), the same format the `insights` function takes. The page turns it into `2026-09-01` for the RPC.
- **AppShell:** add `["/reports/", "Report"]` to `DETAIL_TITLES`, before the `/reports` entry, so the page gets the back button and the title "Report".
- **Marks it read:** on load, it upserts `{ bro_id: me, month }` into `report_views` once (a mutation in a mount effect; repeat views are a no-op).
- **Months with no report** (no successful run and no brews) show `EmptyState` ("No report for August.").

## Page layout (`src/features/reports/ReportPage.tsx`)
Top to bottom, in the app's existing patterns:

1. **Masthead:** `DetailHeader` with eyebrow `MONTHLY REPORT`, title `September 2026`, and meta `4 bros · 41 brews`.
2. **The group's numbers:** the stat strip from `BroProfilePage` (mono value over a small-caps label, hairlines above and below), in two rows of four:
   - Brews · Volume · Beans · Dial-ins
   - Tried · Firsts · New roasts · Endorsed
   - Volume is shown in litres once it reaches 1 L (`9.9 L`, else `850 ml`). Beans are shown in grams (`702 g`), or kilograms once they reach 1 kg.
   - New roasters are left off the strip; they're usually 0 or 1. They're mentioned in the meta line when there are any ("· 2 new roasters").
3. **Methods** (`Section`): one row per method, most brews first. Each row has:
   - the method name, its brew count, and a thin bar for its share of the month's brews
   - the bros' shares as avatars with counts (`HR 10 · SB 7`)
4. **One section per bro:** in the order `monthly_stats` returns them (most brews first), so the month's top brewer leads. Each section has:
   - **Header:** `Avatar` and first name, linking to `/bros/:id`. The logged-in bro's avatar gets the `self` ring, as elsewhere.
   - **Their numbers:** the same stat strip, one row of four: Brews · Volume · Dial-ins · Firsts.
   - **Their 3 insights,** as cards (below), in `position` order.
   - **No activity:** a bro who sat the month out still gets a section. Their stats are zeros, and their insights are shown if a run exists (the agent jabs about droughts).
   - **No insights yet** (run missing or failed): just the numbers, plus a muted line "No insights this month."

### Insight card (`src/features/reports/InsightCard.tsx`)
- `Card` (surface, hairline border).
- **The type** as a small brass mono label: `DID YOU KNOW`, `PATTERN`, `RECOMMENDATION`, `FACT`, `JAB`.
- **The content** in body text, 15px.
- **Sources,** if any: small muted links under the content (`↗ Coffee exports — ICO`), opening in a new tab. There's at most one line each, truncated with an ellipsis.

## Data model: `supabase/migrations/012_report_views.sql`
```sql
create table report_views (
  bro_id uuid not null references bros (id) on delete cascade,
  month date not null, -- first day of the month
  viewed_at timestamptz not null default now(),
  primary key (bro_id, month)
);

alter table report_views enable row level security;

create policy "read your own" on report_views
  for select to authenticated using (bro_id = (select current_bro_id()));
create policy "add as yourself" on report_views
  for insert to authenticated with check (bro_id = (select current_bro_id()));
```
- Only your own views are visible. Nobody needs to know who read what.
- No update or delete policies. The upsert uses `ignoreDuplicates`, so a repeat view is an `insert … on conflict do nothing` and needs no update policy.

## Data: `src/api/reports/`
Same layout as the other `src/api/*` folders.

**`reports.types.ts`**
- `MonthlyStats`, matching the S2 JSON: `totals`, `bros[]` and `methods[]`.
- `Insight`: `{ position, type, content, sources }`.
- `InsightType`.

**`reports.service.ts`**
- `fetchMonthlyStats(month)`: `supabase.rpc("monthly_stats", { p_month: "2026-09-01" })`.
- `fetchInsights(month)`: one query that returns a map of bro id to that bro's insights:
  ```ts
  supabase
    .from("insight_runs")
    .select("bro_id, started_at, insights(position, type, content, sources)")
    .eq("month", day)
    .eq("status", "succeeded")
    .order("started_at", { ascending: false });
  ```
  The code keeps the first run per bro, which is the latest, and sorts its insights by `position`.
- `fetchReportMonths()`: the distinct months of the successful runs, newest first (from `insight_runs` with `select("month")` and `status = succeeded`). It's deduplicated in code, which is fine at a few rows per month.
- `fetchReportViews()`: this bro's viewed months, from `report_views` (RLS limits it to them).
- `markReportViewed(broId, month)`: `upsert({ bro_id, month }, { ignoreDuplicates: true })`.

**`reports.queries.ts`**
- `reportKeys`, and `reportQueries.stats(month)`, `.insights(month)`, `.months()` and `.views()`.
- `reportMutations.markViewed()`: on success, adds the month to the cached `views` list with `setQueryData`, which clears the badge immediately.
- The default `staleTime` is fine. Neither table is in realtime, and a report doesn't change once its runs are done.

**The list page's "4 bros · 41 brews" line** would need `monthly_stats` per month. Instead, the list shows just the month name and the unread dot. (One stats call per row isn't worth it.)

**Small helpers** go in `lib/format.ts`:
- `monthTitle("2026-09")` gives "September 2026".
- `volume(ml)` and `weight(g)` for the unit switching.

## Not in this phase
- **Push and the cron:** S4.
- **The frozen snapshot:** S4. Until then, editing an old brew changes that month's numbers.
- **"Published" months:** until S4, a month counts as having a report as soon as one bro has a successful insight run. S4 switches `fetchReportMonths` to `monthly_reports`.
- **Month-over-month changes** ("+12 on August"), reactions, sharing as an image: these are already in [Follow-ups](PLAN.md#follow-ups).

## You provide
1. **Run** `012_report_views.sql` in the SQL editor.
2. The UI ships with a normal deploy. Your September insight runs and `monthly_stats` (011) are already in place.

## Verification
1. **The badge:**
   - On first load, the top-bar icon shows the ember dot.
   - Tapping it opens `/reports`, where September has the dot too.
   - Opening September clears both dots straight away.
   - Reloading on another device shows no dot.
   - To reset it for another test: `delete from report_views where month = '2026-09-01';`.
2. **Numbers:** the group strip and each bro's strip match `select jsonb_pretty(monthly_stats('2026-09-01'));`.
3. **Insights:** each bro shows the 3 insights from their latest successful run, in order. A rerun's newer insights replace the older ones.
4. **Edge cases:**
   - A bro with no brews: zeros, plus insights or "No insights this month."
   - `/reports/2026-01` (no data): the empty state.
   - Sources open in a new tab.
5. **Phone check:** on your device, the stat strips fit at phone width with no horizontal scroll, the method bars line up, and long insights wrap cleanly.
