# Phase Q3 — Brew

**Status:** ✅ Done (9308ef7)

## Goal
The Brew pages and sheets read from the query cache and write through the brew mutations. Starting, finishing or editing a brew now refreshes rankings and events everywhere. That closes the Q2 gap where Library scores could lag behind a finished brew for up to 30 seconds.

## Changes
- **`BrewNowPage`:**
  - Three queries: `myOpen`, `live` and `recent`. `live` is a `select` over `brewingNow`, so it's one shared request.
  - Its hand-rolled Realtime channel is now `useLive(["brews"], invalidateBrews)`.
  - Discard is `brewMutations.discard`. All the `reload*` / `refresh` plumbing is gone.
- **`StartBrewSheet`:**
  - The initial roast (`?roast=`) comes from `roastQueries.detail`.
  - Grinders come from `brewQueries.history` + `select`.
  - The recipe prefill goes through the cache with `queryClient.fetchQuery(brewQueries.lastRecipe(…))`. It's keyed on the roast id, so a background refresh of the roast doesn't overwrite what you've typed.
  - Start uses `brewMutations.start`.
- **`FinishBrewSheet`:**
  - Uses `brewMutations.finish`.
  - `onFinished(brew)` now passes the brew back. By the time the mutation resolves, the cache has refetched and the page no longer has an open brew to hand to the follow-up.
- **`BrewResultsSheet` / `EditBrewSheet`:** use `brewMutations.update`, then `saveEndorsement`. A local `busy` flag covers both writes.
- **`BrewDetailPage`:** uses `brewQueries.detail` + `endorsementQueries.list({ brewId })`. Edits just close the sheet.
- **`saveEndorsement`** (`features/endorsements/draft.ts`): refreshes endorsements, rankings and events after it writes. As a result:
  - `EndorsementRow`'s `onChanged` is now optional. Only `BroProfilePage`, still on `useData`, uses it.
  - The Library pages no longer refresh explicitly after saving an endorsement.
- **Shims pruned:**
  - `features/brew/api.ts` only has the pure helpers `isLive` and `resultsPending`.
  - `features/library/api.ts` only re-exports `fetchRoastRankings`, for Bros.

## Check
- [x] `tsc`, `biome check` and `vite build` pass. Every changed module compiles in the dev server.
- [ ] **Start a brew** from Brew Now, and from a roast page (`?roast=`):
  - The recipe prefills from your last brew of that roast and method.
  - The grinder suggestions show.
  - The card appears.
- [ ] **On another device or account:** your brew shows under "Brewing now" through Realtime.
- [ ] **Finish:**
  - The "How was it?" follow-up opens with the right brew.
  - Saving it with an endorsement updates Recent brews.
  - The Library score and "Brewed by" update straight away.
- [ ] **"I'll do it later":** the brew shows as pending in Recent.
- [ ] **Discard** an open brew.
- [ ] **Brew detail:**
  - Edit the brew, including changing its roast: the page updates.
  - Edit the endorsement row: it updates in place.
