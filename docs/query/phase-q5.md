# Phase Q5 — Realtime + cleanup

**Status:** ✅ Done

## Goal
- One place decides what Realtime refreshes.
- Every type is imported from its entity.
- Logging out leaves nothing cached for the next bro.

## Changes
- **`src/api/realtime.ts` → `useRealtimeSync()`:**
  - One subscription, mounted in `AppShell`, so it's only active while signed in.
  - It maps every published table to that entity's `invalidateX()`:

    | Table | Refreshes |
    |---|---|
    | `brews` | brews, rankings, events |
    | `roasters` | roasters, rankings, events |
    | `roasts` | roasts, rankings, events (incl. studio photos developing) |
    | `endorsements` | endorsements, rankings, events |

  - Invalidation only refetches queries on screen. Everything else is marked stale and refetches when next shown, so a global subscription costs nothing on pages that don't use the data.
- **Fewer Realtime subscriptions:** the per-page `useLive` calls are gone (Brew Now, Library browser, roast page, board), along with the board's `refreshBoard` and `lib/useLive.ts`.
  - The app now opens one Realtime channel instead of one per page.
  - **Gaps closed:** pages update live when another bro adds a roaster (the Library used to watch only `roasts`). The roast and roaster pages also update for brews and endorsements.
- **One `invalidateX()` per entity:** `invalidateRoasters`, `invalidateRoasts`, `invalidateBrews` and `invalidateEndorsements` each refresh the entity plus the rankings and events built from it. Mutations and Realtime share them.
- **Logout** calls `queryClient.clear()` after signing out.
- **`lib/types.ts` removed:** all 29 importers (26 elsewhere, 3 inside `lib/`) now import from `src/api/<entity>/<entity>.types`.

## Check
- [x] `tsc`, `biome check` and `vite build` pass. Every changed module compiles in the dev server.
- [ ] **Two devices or accounts:** a brew started on one shows on the other's Brew Now ("Brewing now") and on the board, with no reload.
- [ ] **Roasters:** another bro adds a roaster while you're on the Library page, and it appears.
- [ ] **Studio photo:** it still swaps in from "developing" on the roast page and Library tiles.
- [ ] **Scores:** an endorsement on one device updates the roast's score on the other.
- [ ] **Log out → log in as another bro:** no data from the first bro flashes.
