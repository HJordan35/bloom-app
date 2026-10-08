# Phase Q1 — Foundation

**Status:** 🔨 Built — no view uses it yet

## Goal
Set up a reusable TanStack Query layer for every entity, without changing what any view does.

## Done
- **Packages:** added `@tanstack/react-query` 5.104 and, dev only, `@tanstack/react-query-devtools`.
- **Provider:** `src/main.tsx` wraps the app in `QueryClientProvider`.
  - Devtools are loaded lazily, in dev only. They aren't in the production bundle.
- **`src/api/queryClient.ts`:** `staleTime` 30s, `gcTime` 5m, refetch on window focus, `retry` 1.
- **`src/api/api.utils.ts`:** `unwrap`, moved here from `lib/unwrap.ts`, and `byId` (rows → `Map`, used as a `select`).
- **Per entity (`bros`, `roasters`, `roasts`, `brews`, `endorsements`, `rankings`, `events`):** `.types`, `.service` and `.queries` files.
  - **Services:** the existing Supabase calls, moved without changes.
  - **Queries:** a key factory, `queryOptions` and `mutationOptions`, with invalidation built in.
- **Shims:** the old modules now only re-export the services. This keeps a single implementation of each fetch, and no view had to change.
  - Shimmed modules: `features/*/api.ts`, `features/library/photos.ts`, `lib/bros.ts`, `lib/types.ts`, `lib/unwrap.ts`.
  - The feature modules keep their pure helpers: `isLive`, `resultsPending`, `roastPhoto`, and the composite loaders `fetchLibrary` and `fetchBoard`.

## Query catalog
| Entity | queries | mutations |
|---|---|---|
| bros | `list`, `detail(id)` | — |
| roasters | `list`, `detail(id)` | `create` |
| roasts | `list`, `detail(id)` | `create`, `uploadPhoto` |
| brews | `detail`, `myOpen`, `brewingNow`, `live` (select over brewingNow), `recent`, `forRoast`, `forRoaster`, `forBro`, `lastRecipe`, `history` | `start`, `update`, `finish`, `discard` |
| endorsements | `list(filter)` | `create`, `update` |
| rankings | `roasts`, `roasters` (+ `byRoastId` / `byRoasterId` selects) | — |
| events | `list(limit)` | — |

## Checked
- `tsc`, `biome check` and `vite build` pass.
- The production bundle grows by about 7 KB gzipped.

## Next
Q2: migrate the Library pages.
