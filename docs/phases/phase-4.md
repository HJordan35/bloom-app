# Phase 4 — Library

**Status:** ✅ Built — awaiting review on a phone

## Goal
Browse, search and add roasters and roasts, and drill into any of them for the full picture: who's brewed it, how it rates, what recipes work, and a one-tap "Brew now".

## Library page (`/library`)
- **Search** at the top: filters by roaster name, roast name, region and location.
- **Roasters | Roasts** switch, remembered in the URL (`?view=roasts`) so Back returns to the same view.
- **Mosaic:** a 2-column grid of square-ish tiles with hairline borders. No images; type and lines carry the look.
  - **Roaster tile:** name (Playfair), location, number of roasts, ranking score.
  - **Roast tile:** name, a roast-level mark (a short line in light / medium / dark tone), region, brew count, ranking score.
  - Roasts view is **grouped by roaster**: a small-caps roaster heading, then that roaster's tiles.
  - Tiles for anything **you've brewed** get a small brass corner mark, so "your library" stands out within the shared catalogue.
- **Order:** by ranking score, highest first; ties by name. Phase 6 adds more sort options.
- **+ Add:** opens a sheet with the Phase 3 `AddRoasterForm` or `AddRoastForm`, depending on the current view.
- **Empty states:** e.g. "The shelf is empty — add your first roaster."

## Roaster detail (`/library/roasters/:id`)
1. **Header:** name, location, score block (score · brews · avg rating · number of ratings).
2. **Brew now:** opens Brew Now's start sheet.
3. **Roasts:**
   - **Yours** (roasts from this roaster you've brewed) and **Bros'** (the rest).
   - Each row links to roast detail and shows brews and score.
   - **+ Add roast**, with this roaster preselected.
4. **Brews:** **Yours** and **Bros'**, latest 10 each, using the existing `BrewRow` with the roast name and bro name shown.
5. **Endorsements:** newest first, across all this roaster's roasts. Each shows bro, roast, method, rating (if any) and note.

## Roast detail (`/library/roasts/:id`)
1. **Header:** name, roaster (link), level, region, score block.
2. **Brew now** → `/?roast=<id>` (start sheet preselected; already supported).
3. **By method:** one row per method this roast has been brewed with:
   - brew count and average rating for that method
   - the latest **dialed-in recipe** (dose · grind · grinder · temp · time), if any
   This is where "endorse per method" pays off: espresso may be a 5 while Chemex is a 9.
4. **Endorsements** + **Endorse** button → `EndorseSheet` (method chips, optional; rating 1–10, optional; note). Same fields as the endorsement on the Finish panel.
5. **Brews:** **Yours** and **Bros'**, as on the roaster page.

## Small follow-ups from Phase 3
- Brew detail: roast and roaster names become links to these pages.
- `AddRoastForm` takes an optional `initialRoasterId`.

## Code

### Data (`src/features/library/api.ts`)
Extends the existing file:
- `fetchRoaster(id)`, `fetchRoast(id)`
- `fetchRoasterRankings()`, `fetchRoastRankings()` (from the ranking views; merged with roasts/roasters client-side)
- `fetchBrewsForRoast(roastId)`, `fetchBrewsForRoaster(roasterId)`
  - The roaster version filters through the joined roast: `roast:roasts!inner(...)` with `roast.roaster_id = id`.
- `fetchEndorsements({ roastId } | { roasterId })` with bro and roast joined.
- Reuse `fetchMyBrewHistory` (brew api) for "roasts you've brewed".

All lists are small (3–5 bros), so each page loads everything it needs in one go and does grouping and splitting in the component. No pagination.

### Shared brew pieces
- Move `BREW_SELECT` into `features/brew/api.ts` exports so library queries reuse it.
- `BrewRow` gains an option to show the bro's name.

### New components
- `Mosaic` + `Tile` (2-column grid; tile with title, meta lines, score, optional brass corner mark).
- `SegmentedControl` (Roasters | Roasts).
- `Score` (large mono number with a "brews · rating" caption).
- `EndorsementRow`.
- `features/library/EndorseSheet`.

### Pages and routes
- `LibraryPage`, `RoasterPage`, `RoastPage`.
- Routes: `/library/roasters/:id`, `/library/roasts/:id`.
- `AppShell` `DETAIL_TITLES` gets `/library/roasters/` → "Roaster" and `/library/roasts/` → "Roast".

## Out of scope
- Editing or deleting roasters and roasts.
- Photos or bag images.
- Roast sorting options and an explanation of the ranking (Phase 6).
- Bro profiles (Phase 5).

## Verification
- Add a roaster and a roast from the Library; they appear in both views and in search.
- Roasts view groups under the right roaster headings, ordered by score.
- After brewing a roast, its tile gets the brass mark; the "Yours" / "Bros'" split is correct when checked as two different bros.
- Roast detail:
  - The by-method rows match the brews and ratings.
  - The dialed-in recipe shown is the latest dialed-in brew for that method.
- Endorsing from the roast page shows it immediately and moves the score as expected.
- **Brew now** on a roast opens the start sheet with that roast chosen.
- Brew detail links through to roast and roaster.
- Check at 375px: tiles don't overflow with long names.
- `run check` and `run build` pass.

## Checkpoint (user)
- Does the mosaic look and read right?
- Is the per-method breakdown useful?
- Should the Library default to everything, or to "my library"?

## Open questions
- **Default scope:** the Library shows the whole shared catalogue, with your brewed items marked. Alternative: an **All / Mine** filter. Easy to add if wanted.
- **Roaster "Brew now":** opens the start sheet with no roast chosen. It could instead filter the roast picker to that roaster.

## Build notes
- Open questions resolved as planned:
  - The Library shows the full catalogue, with a brass diamond on anything you've brewed.
  - The roaster's **Brew now** opens the start sheet with no roast chosen (`/?start`).
- New shared pieces:
  - `components/DetailHeader.tsx`
  - roast-level colors (`levelLight` / `levelMedium` / `levelDark`) in tokens
  - `EndorsementWithRoast` type
  - `features/library/LibraryRows.tsx` (`RoastRow`, `EndorsementRow`, `BrewLists`)
- Adding a roast from a roaster page jumps straight to the new roast.
- Verified against the live Supabase project with temporary data, deleted afterwards:
  - roaster-filtered brews and endorsements (inner join) return only that roaster's rows
  - "my roasts" split is correct per bro
  - latest-rating-wins scoring: 6 then 9 from the same bro → avg 9, score 5.5
  - roaster score aggregates across roasts
- `run check` and `run build` pass. Not yet checked by eye in a browser.

## Revision: shared LibraryBrowser (after review)
The page body moved into `features/library/LibraryBrowser.tsx`, so Brew Now's roast drawer reuses it. `LibraryPage` is now a thin wrapper that keeps the view in the URL.

`LibraryBrowser` has two modes:
- **Browse** (default): tiles link to the detail pages.
- **Pick** (`onPick`): tiles select a roast, a Recent row shows first, and roaster tiles filter to that roaster.

`Tile` now takes `to` or `onClick`. `Sheet` has a `tall` option.
