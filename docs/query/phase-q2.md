# Phase Q2 — Library

**Status:** ✅ Done (569a302)

## Goal
Library pages read from the query cache instead of loading everything up front. Moving between the Library, a roaster and a roast reuses the cached lists instead of fetching them again.

## Changes
- **`LibraryBrowser`:**
  - `fetchLibrary` is gone. The browser now uses separate queries for roasters, roasts and both rankings.
  - Your brew history, used for the Recent row, is only fetched in pick mode (the Brew Now drawer). The Library page no longer requests it.
  - Adding a roaster or roast just closes the sheet. The mutation refreshes the lists.
- **`RoasterPage` / `RoastPage`:**
  - The page `load()` functions are gone. Each piece of data is its own query.
  - Rank position comes from the cached list and rankings.
  - Photo upload uses `roastMutations.uploadPhoto`, and `isPending` drives the busy state.
- **`BrewedBy`:** reads the bros from `broQueries.list()` + `byId` itself. The `brosById` prop is gone.
- **`AddRoasterForm` / `AddRoastForm`:** use the create and upload mutations. The roaster `<select>` reads `roasterQueries.list()`, so a new roaster shows up without a manual reload.
- **Realtime:** `useLive(["roasts"], invalidateRoasts)` refreshes the roast queries when a studio photo finishes. Before, it reloaded the whole page bundle.
- **Endorsement edits:** call `invalidateEndorsements`, which also refreshes rankings and events, until Q4 moves the sheet onto mutations.
- **Shims pruned:**
  - `features/library/api.ts` only re-exports `fetchRoast` and `fetchRoastRankings`, for Brew and Bros.
  - `lib/bros.ts` only re-exports `fetchBro`.
  - `photos.ts` keeps only `roastPhoto`.

## Check
- [x] `tsc`, `biome check` and `vite build` pass. Every changed module compiles in the dev server.
- [x] **Library:** both views, search, and the tile counts and scores. Open a roaster, go back, and nothing refetches within 30s (devtools).
- [x] **Roaster page:** the score and rank, the "Your roasts" / "Bros' roasts" split, brews and endorsements, and Add roast → lands on the new roast.
- [x] **Roast page:**
  - Add or replace a photo: it shows developing, then the studio version appears through Realtime.
  - Endorse, and edit an endorsement: the list and the score update.
- [x] **Brew Now drawer:** the Recent row, drilling from a roaster into its roasts, and add a roast from the drawer → it's picked.
