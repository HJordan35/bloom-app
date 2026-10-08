# Phase Q4 — Bros

**Status:** ✅ Done

## Goal
The Bros board, the profile pages and the endorsement sheet read from the query cache. `useData` and every pass-through module except `lib/types.ts` are gone.

## Changes
- **`BrosBoardPage`:**
  - `fetchBoard` is gone. The page uses `eventQueries.list()`, `broQueries.list()` and `brewQueries.brewingNow()` (with a `select` for who's brewing).
  - It also uses the roasts and roasters lists, so the page only renders once every name is ready.
  - **Realtime:** a change to brews, roasters, roasts or endorsements refreshes only what the board shows: events, brewing now, roasts and roasters. Before, it re-ran five requests.
- **`EventRow`:**
  - The `board` prop is gone.
  - Each row looks up its bro, roast, roaster and live status from the cached lists, using `byId` / `select`. That's no extra requests: every row shares the board's cache entries.
- **`BroProfilePage`:**
  - The `load()` function is gone.
  - Data comes from `broQueries.detail`, `brewQueries.forBro`, `endorsementQueries.list({ broId })` and the roast rankings.
  - Its brews and endorsements share their cache with the Brew and Library pages, so an edit anywhere shows up here.
- **`EndorsementSheet`:** saving runs as a mutation (`useMutation` around `saveEndorsement`, which refreshes endorsements, rankings and events). `isPending` replaces the local `busy` flag.
- **`EndorsementRow`:** the `onChanged` prop is removed. Nothing needs to reload by hand any more.
- **Deleted:**
  - `lib/useData.ts`
  - `lib/bros.ts`
  - `lib/unwrap.ts` (`push.ts` now imports `unwrap` from `api/api.utils`)
  - `features/bros/api.ts`
  - `features/library/api.ts`
  - `features/endorsements/api.ts`

## Check
- [x] `tsc`, `biome check` and `vite build` pass. Every changed module compiles in the dev server.
- [ ] **Board:**
  - The bro strip, with live dots for anyone brewing.
  - Events grouped by day, with names, roasts, roasters and ratings.
  - Tapping a row opens the right page.
- [ ] **Board live:** another bro starts a brew, adds a roast or endorses. The board updates without a reload.
- [ ] **Your profile:** stats, Library tiles with scores, recent brews, endorsements, the Notifications toggle and Log out.
- [ ] **Another bro's profile:** same data, without your controls.
- [ ] **Edit an endorsement on your profile:** it updates in place. Open the roast and it's updated there too, without refetching if within 30s.
