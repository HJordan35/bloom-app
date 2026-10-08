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
| Q1 | Foundation: `src/api/` per-entity types, services, queries; QueryClient + provider | ✅ Done (2a8447e) | [phase-q1.md](phase-q1.md) |
| Q2 | Library: `LibraryBrowser`, `RoasterPage`, `RoastPage`, add roaster / roast forms | ✅ Done (569a302) | [phase-q2.md](phase-q2.md) |
| Q3 | Brew: `BrewNowPage`, `BrewDetailPage`, start / edit / finish / results sheets | ✅ Done (9308ef7) | [phase-q3.md](phase-q3.md) |
| Q4 | Bros: `BrosBoardPage`, `BroProfilePage`, endorsement sheet | ✅ Done (9f3c860) | [phase-q4.md](phase-q4.md) |
| Q5 | Realtime + cleanup: one app-wide Realtime → invalidation map; retire `lib/types.ts`; clear cache on logout | ✅ Done | [phase-q5.md](phase-q5.md) |

Each phase is planned in `docs/query/` before it's built.

## Layout

```
src/api/
  queryClient.ts                # the one QueryClient (staleTime 30s, gcTime 5m)
  api.utils.ts                  # unwrap, byId
  realtime.ts                   # useRealtimeSync: table change → invalidateX()
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
- **Freshness:** each written entity has an `invalidateX()` that refreshes it, plus `rankings` and `events` (database views built from it). Its mutations call it on success, and `useRealtimeSync` calls it when any bro changes that table.
- **Derived data:** use `select`, not a second request. For example, `brewQueries.live(broId)` shares one cache entry with `brewingNow`.

## Adding to it
- **New endpoint:** a service function, a key in the entity's key factory, and an entry in `xQueries`.
- **New write:** add it to `xMutations`, with `onSuccess: invalidateX`.
- **New Realtime table:** add it to the publication (a migration), then add a row to `INVALIDATE_ON_CHANGE` in `realtime.ts`.
- **Components:** call `useQuery` for what they show, rather than receiving fetched data as props.

## Follow-ups
- Narrower queries once caching is in place. For example, a roaster page could fetch only that roaster's roasts instead of all roasts.
- Prefetch on hover or tap for detail pages.
- Realtime echoes: your own write is refreshed once by the mutation and again by Realtime. That's harmless at this scale; debounce per table if it ever matters.
- `lib/auth.tsx` still queries `bros` by `auth_id` directly. It could move into `bros.service`.
- Decide whether push subscription state (`lib/push.ts`) belongs in a query. It's per-device browser state, so it's left out for now.
