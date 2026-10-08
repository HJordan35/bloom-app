# Client Data Layer (TanStack Query) — Plan

Pages load data with `useData(load, deps)`: one big `Promise.all` on mount, no cache, and a `reload()` that refetches everything. After a few days of use, that means re-downloading the same roasts, roasters and bros on every navigation, then passing it all down as props.

This plan moves the client onto **TanStack Query**: cached, per-entity queries that components ask for directly.

This plan stands on its own. `docs/PLAN.md`, `docs/gallery/PLAN.md` and `docs/push/PLAN.md` aren't needed here.

**Principles:**
- One area of the app at a time; each phase leaves the app working.
- Same Supabase queries, now cached. Narrowing them comes later, as a follow-up.
- Every edge case goes to [Follow-ups](#follow-ups).

## Status

| Phase | Scope | Status | Plan |
|---|---|---|---|
| Q1 | Foundation: `src/api/` per-entity types, services, queries; QueryClient + provider | 🔨 Built — no view uses it yet | [phase-q1.md](phase-q1.md) |
| Q2 | Library: `LibraryBrowser`, `RoasterPage`, `RoastPage`, add roaster / roast forms | ⏳ | — |
| Q3 | Brew: `BrewNowPage`, `BrewDetailPage`, start / edit / finish / results sheets | ⏳ | — |
| Q4 | Bros: `BrosBoardPage`, `BroProfilePage`, endorsement sheet | ⏳ | — |
| Q5 | Realtime + cleanup: `useLive` invalidates query keys; delete `useData` and the re-export shims | ⏳ | — |

Each phase is planned in `docs/query/` before it's built.

## Layout

```
src/api/
  queryClient.ts                # the one QueryClient (staleTime 30s, gcTime 5m)
  api.utils.ts                  # unwrap, byId
  <entity>/
    <entity>.types.ts           # row types + input types
    <entity>.service.ts         # plain async Supabase calls, no React
    <entity>.queries.ts         # key factory, queryOptions, mutationOptions
```
Entities: `bros`, `roasters`, `roasts`, `brews`, `endorsements`, `rankings`, `events`.

## Using it in a view

```tsx
const roast = useQuery(roastQueries.detail(id));
const brosById = useQuery({ ...broQueries.list(), select: byId });
const scores = useQuery({ ...rankingQueries.roasts(), select: byRoastId });
const create = useMutation(roastMutations.create());
```
- **Keys:** each entity's `xKeys.all` is the prefix of all its keys, so `invalidateQueries({ queryKey: xKeys.all })` refreshes everything for that entity.
- **Mutations:** each mutation invalidates its own entity on success. Brew, endorsement, roast and roaster writes also invalidate `rankings` and `events`, because those are database views built from them.
- **Derived data:** use `select`, not a second request. For example, `brewQueries.live(broId)` shares one cache entry with `brewingNow`.

## Migrating a view (Q2–Q4)
1. Replace the page's `load()` / `useData` with one `useQuery` per entity it needs. Children call their own queries instead of receiving props.
2. Replace `reload()` after writes with `useMutation(xMutations.…())`.
3. Remove the old fetch import. When nothing imports a shim (`features/*/api.ts`, `lib/bros.ts`, `lib/types.ts`, `lib/unwrap.ts`), delete it.

## Follow-ups
- Narrower queries once caching is in place. For example, a roaster page could fetch only that roaster's roasts instead of all roasts.
- Prefetch on hover or tap for detail pages.
- Decide whether push subscription state (`lib/push.ts`) belongs in a query. It's per-device browser state, so it's left out for now.
