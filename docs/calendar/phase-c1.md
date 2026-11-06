# Phase C1 — Calendar design

**Status:** ✅ Done

## Goal
Settle the calendar's look on mock data, before it's wired into Brew now.

## Pieces
- **`calendar.ts`** (no UI):
  - `DayBrews` (`{ brews, dialed }`);
  - `dayKey(date)`, a local "yyyy-MM-dd";
  - `monthGrid(month)`, the month in Sunday-first weeks, with null for the days of other months.
- **`BrewCalendar`:** presentational, taking `month`, `days` (`Map<dayKey, DayBrews>`), `view` / `onViewChange` (`"quality"` or `"quantity"`), `selected`, `onSelect` and `onMonthChange`.
  - **Header (one row):** "‹ November 2026 ›" on the left (display font, 15px, muted arrows, the title wide enough that the arrows don't shift), and a `Quality · Quantity` `TextToggle` on the right.
  - **Weekdays:** faint mono, 10px.
  - **Days:** squares that fill their column up to 42px, with mono 14px numbers in text colour on days with brews (muted otherwise).
  - **Future days:** faint and disabled. Days from the months either side are blank.
  - **Today:** a 1px brass outline ring.
  - **Selected:** a 2px text-colour bar under the day.
  - **Quality:** `Pips`, a row of 6px diamonds under the number, one per brew up to four. Dialed-in ones come first and are filled. The row is always there, so numbers line up.
  - **Quantity:** `LevelMark` fills the day behind the number (SVG, 1px non-scaling brass outlines): the lower half, then the whole, then the whole with a solid core. Below ascended, the number sits on a patch of page colour so an outline never runs through it.
  - **Legend:** one centred line for the view: "brewed · dialed in", or the four levels with their marks.
- **Demo page (`/brew/calendar-demo`):**
  - one slim line, the greeting (15px italic) with "+ Start a brew" on the right, then the calendar and the Recent brews header, all pinned together like Browse's filters;
  - your real recent brews, doubled, scrolling under it.

## Explored and dropped
- Brass tints.
- Triangle, square and circle shapes.
- A dulled-brass fill.
- Fading the unselected days.
- Underlining the number.
- A slim, centred CTA on its own line.
- A floating, app-wide brew button.

## Verification
- `npx tsc --noEmit -p .`, `npx biome check src` and `npm run build` pass.
- At phone width:
  - both views read cleanly;
  - today and the selected day read differently;
  - the legend fits on one line;
  - rows scroll under the pinned calendar.
