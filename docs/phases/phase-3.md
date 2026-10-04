# Phase 3 — Brew Now

**Status:** ✅ Built — awaiting review on a phone

## Goal
Make the home tab work end to end: see which bros are brewing live, start a brew, finish it with results (optionally endorsing the roast), and look back over recent brews.

## Brew Now page (`/`)
Top to bottom:

1. **Your brew**
   - If you have an open brew, an `ActiveBrewCard` shows: roast, roaster, method, recipe line (dose · grind · temp), and a live elapsed timer. Buttons: **Finish** and **Discard**.
   - Your own open brew shows here **however old it is**, so a forgotten brew can still be finished ("Started 5h ago").
   - With no open brew, a large **Start a brew** button shows instead.
2. **Brewing now:** other bros' open brews started in the last 2 hours. Each row: ember `LiveDot`, bro first name, roast · method, elapsed time. Updates live through Supabase Realtime. Hidden when nobody else is brewing.
3. **Recent brews:** your last 20 finished brews. Each row: roast, roaster, method, date, a ✦ mark if dialed in → tap for brew detail.

## Start a brew (bottom sheet)
- **Roast:** searchable list of all roasts, grouped by roaster; your recently brewed roasts first.
  - **+ New roast** inline: name, roast level (Light / Medium / Dark chips), region, and roaster.
  - The roaster is picked from the list, or **+ New roaster** inline (name, location).
  - These small add forms are built here and reused by the Library in Phase 4.
- **Method:** chip row from `BREW_METHODS`.
- **Recipe** (all optional): dose (g), grind size, grinder, temp (°C).
  - When roast and method are chosen, the recipe prefills from your last brew of that roast + method, so repeating a daily driver is two taps.
  - The grinder field suggests grinders you've used before.
- **Start** inserts a `brews` row with `started_at = now()`.
- Pre-selected roast via `/?roast=<id>`, so the Library's "Brew now" can launch straight into it.

## Finish a brew (bottom sheet)
- Brew time (mm:ss, entered by hand, separate from the start/finish timestamps), total volume (ml), result notes, **Dialed in** toggle.
- **Endorse** (optional, collapsed by default): rating 1–10 and/or a note, with the brew's method filled in. Saved as an `endorsements` row.
- **Finish** sets `finished_at = now()` plus the result fields.
- **Discard** (on the active card) deletes the open brew after a confirm.

## Brew detail (`/brews/:id`)
- Bro, date, roast, roaster, roast level, method.
- Full recipe and result, plus the dialed-in badge.
- Back arrow in the top bar.
- Roast and roaster names become links once the Phase 4 pages exist.

## Code

### Data (`src/features/brew/api.ts`)
Plain async functions over `supabase`, using table joins: `brews` with `roast:roasts(*, roaster:roasters(*))` and `bro:bros(id, first_name, last_name)`.
- `fetchMyOpenBrew`, `fetchLiveBrews` (open, < 2h, not me), `fetchRecentBrews`, `fetchBrew`
- `startBrew`, `finishBrew`, `discardBrew`, `fetchLastRecipe`
- `fetchRoasts`, `createRoaster`, `createRoast`, `createEndorsement`

### Shared helpers
- `src/lib/useData.ts`: a tiny `useData(fn, deps)` hook returning `{ data, reload }`. No caching library.
- `src/lib/format.ts`: elapsed time, relative dates, mm:ss.

### New components
- `Sheet`: bottom sheet with backdrop that slides up and closes on backdrop tap.
- `Chips`: single-select chip row.
- `LiveDot`: pulsing ember dot.
- `RatingInput`: 1–10 segmented row.
- `Toggle`
- `TextArea`
- `Section`: small-caps label + hairline.
- `useNow`: ticks every second for timers.

### Realtime
`BrewNowPage` subscribes to `postgres_changes` on `brews` and reloads the open/live/recent lists on any change.

### Other changes
- `AppShell`: optional back button and title for detail routes.
- `types.ts`: joined types (`BrewWithRoast`, `RoastWithRoaster`).

## Out of scope
- Editing past brews.
- Logging a past brew without the start/finish flow.
- A full brew history (Phase 5 bro profile).
- Library pages (Phase 4).

## Verification
- Start a brew → it appears as your active brew with the timer running.
- In a second browser logged in as another bro, it shows under "Brewing now" without refreshing.
- Finish with results + endorsement:
  - It leaves "Brewing now" in both browsers and appears in Recent brews.
  - The endorsement row exists, and `roast_rankings` shows brew_count 1 and the rating.
- Start the same roast + method again → recipe is prefilled.
- Add a new roaster and roast inline from the start sheet → selectable immediately.
- Discard removes an open brew.
- Brew detail shows all fields.
- Check at 375px: sheets scroll and the keyboard doesn't hide the main button.
- `run check` and `run build` pass.

## Checkpoint (user)
- Brew for real for a day or two, and adjust which fields are captured.
- Check whether the start → finish flow feels right on a phone.

## Build notes
- Add-roaster and add-roast forms live in `src/features/library/` (`AddRoasterForm`, `AddRoastForm`, `api.ts`) so Phase 4 can reuse them.
- Extra shared pieces:
  - `lib/unwrap.ts` (throws Supabase errors)
  - `lib/useNow.ts`
  - `TextAreaField` / `SelectField` in `components/Field.tsx`
  - a `text` variant on `Button`
- Brew detail works for any bro's brew, so Phase 5 profiles can link to it.
- Verified against the live Supabase project with temporary data, deleted afterwards:
  - start → shows live for another bro → finish → no longer live
  - endorsement saved
  - `roast_rankings` / `roaster_rankings` score 5.0 for one brew rated 8
  - `events` shows all four event types
  - recipe prefill query works
  - Realtime delivers `brews` inserts
- `run check` and `run build` pass. Not yet checked by eye in a browser.

## Revision: two-step start (after review)
The inline roast picker didn't scale, so starting a brew is now two steps:
1. **Choose a roast:** a tall drawer that shows the Library itself (`LibraryBrowser` in pick mode).
   - Search plus the Roasters | Roasts switch.
   - A **Recent** row of your last 4 brewed roasts at the top.
   - Tapping a roaster tile drills into that roaster's roasts.
   - **+ Add** creates a roast and picks it straight away.
2. **Brew details:** the chosen roast, with **Change**, then method and recipe as before.

Arriving with `?roast=<id>` skips step 1. `RoastPicker.tsx` was removed; the Library page and the drawer share one component.

## Revision: brew time and temperature units (after phone testing)
- **Brew time:** the iOS number pad has no colon, so the single "3:30" field became two numeric inputs, **Min : Sec**.
  - They're combined with `toSeconds()` into the existing `brew_time_s` column.
  - `parseDuration` was removed.
- **Temperature:** recorded in **°F or °C**.
  - A borderless `UnitToggle` sits inside the Temp field, through the new `Field` `suffix` prop. New brews start on °F.
  - The recipe prefill also carries over the last brew's unit.
  - Brews show in their own unit everywhere, through `formatTemp()` (detail page, active card, dialed-in recipes).
  - Migration `004_temp_unit.sql`: `temp_c` → `temp`, adds `temp_unit` (existing rows `'C'`, new default `'F'`), and drops the unused `active_brews` view.
