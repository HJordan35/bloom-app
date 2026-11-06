# Phase C2 — Wiring

**Status:** ✅ Done

## Goal
The calendar from C1 goes live on Brew now, reading your real brews, and picking a day narrows Recent brews to it.

## Brew now (`BrewNowPage`)
- **Not brewing:** a pinned block at the top, with only the rows below scrolling:
  - the slim greeting line, with "+ Start a brew" on the right (opens the launcher, as the big button did; that button goes);
  - **Brewing now**, when other bros are brewing (usually a row or none);
  - the calendar;
  - the list header: "Recent brews" with Browse, or the picked day ("Tuesday", "12 Oct") with "× Clear".
- **Brewing:** no calendar and no CTA. The greeting, the brewing card, Brewing now and Recent brews, as before. Finishing brings the calendar back with today's new diamond.
- **State:** the month, the selected day and the view (Quality by default) are local state.
  - **Today starts selected,** so the list opens on today's brews and picking a day is plain to see.
  - Clearing it (× or tapping it again) shows Recent brews. Changing month clears it.

## Data (filtered in the database)
- **`brewQueries.calendar(broId, month)`:** your finished brews in the month, `finished_at` in `[startOfMonth, next month)` in local time and sent as ISO bounds, selecting only `finished_at, dialed_in`. A `select` buckets them into `Map<dayKey, DayBrews>`. That's tens of rows at most; the database does the filtering, the client only counts. Uses `keepPreviousData` between months.
- **`brewQueries.day(broId, day)`:** your finished brews with `finished_at` in that local day, newest first, `BREW_SELECT`.
- Both keys sit under `brewKeys.all`, so finishing, editing or discarding a brew (and realtime) refreshes them.
- The day is the brew's `finished_at`, the same time Recent brews shows and sorts by.

## Removed
- The demo page and its route.

## Verification
- `npx tsc --noEmit -p .`, `npx biome check src` and `npm run build` pass.
- Not brewing:
  - the calendar shows this month's real brews, with dialed-in ones filled;
  - Quantity shows the right levels;
  - ‹ › change months, and › stops at this month;
  - only the rows scroll.
- The page opens on today, labelled "Today", with today's bar. Tap another day: only that day's brews, with the day as the label; tap it again or × to clear. A day with none reads "No brews that day."
- "+ Start a brew" opens the launcher.
- Start a brew: the calendar and CTA go, and the card shows. Finish it: the calendar returns, and today has one more diamond.
- A brew finished late in the evening lands on that local day.
