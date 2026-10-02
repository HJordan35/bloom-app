# Phase 6 — Ranking Polish

**Status:** ✅ Built — awaiting review on a phone

## Goal
Scores already show on tiles and detail pages, and the Library already sorts by them (Phase 4). This phase makes the ranking **trustworthy and legible**:
- untouched roasts stop looking "ranked"
- you can see where something places
- anyone can tap a score to see why it is what it is
- the Library gains a few useful sort orders

This is the last MVP phase, so it also records what comes after.

## 1. Unranked means unranked
Today a roast with no brews and no ratings scores **2.5**: the neutral 5 rating, halved. That looks like a poor score rather than no score.
- A roast or roaster with **0 brews and 0 ratings** counts as **unranked**: it shows "—" and sorts after everything ranked.
- Handled client-side with one helper, `isRanked(ranking)` in `lib/ranking.ts`. No SQL change.

## 2. Rank position
- Roast and roaster detail pages show the place next to the score, e.g. **#2 of 9**, among ranked roasts or roasters.
- Library tiles show a small **#1 / #2 / #3** mark on the top three in the current view, and nothing on the rest, so the grid stays quiet.

## 3. "How this score works" sheet
Tapping the `Score` block on a detail page opens a sheet that explains it with this item's own numbers:

```
Rating   8.0   avg of each bro's latest rating per method (5 if unrated)
Brews    6.2   3 × ln(1 + 7 brews), capped at 10
Score    7.1   half rating + half brews
```

Plus one plain sentence: "Brewing a roast often raises its score even without ratings. Ratings tilt it up or down."

- The formula lives in **one place in the app**, `lib/ranking.ts` (`ratingPart`, `brewPart`), and mirrors the SQL views.
- A comment in both places says to keep them in sync.

## 4. Library sort — removed after review
> Built, then removed at the user's request: the Library always orders by rank (unranked last, ties by name). `compareBy` became `byRank` in `lib/ranking.ts`.

A small chip row under the Roasters | Roasts switch, remembered in the URL (`?sort=`):
- **Rank** (default): score, unranked last.
- **Most brewed**: brew count.
- **Newest**: date added.
- **A–Z**.

In the grouped Roasts view, the sort applies both to the order of the roaster groups and to the tiles within each group.

## Code
- `src/lib/ranking.ts`:
  - `isRanked`, `ratingPart`, `brewPart`
  - `rankOf(id, rankings)` → `{ position, total }`
  - `compareBy(sort)` for the Library
- `Score`: becomes a button when given `onExplain`; shows `#n of N` when given a position.
- New `RankingSheet` in `src/components/` (uses `Sheet`).
- `Tile`: optional `rank` prop for the top-three mark.
- `LibraryPage`: sort chips + `?sort=` param; replaces the local `byScore`.
- `RoastPage` / `RoasterPage`: pass position and open `RankingSheet`.

## Out of scope
- Changing the formula or its weights. Revisit after a few weeks of real use, when there's data to judge it by.
- Recency weighting (e.g. favouring this month's brews).
- A separate leaderboard page.

## Verification
- A brand-new roast shows "—", sorts last under Rank, and has no #n.
- After one brew it ranks; its score matches the sheet's breakdown and the `roast_rankings` view (e.g. 1 brew, unrated → 2.5 + 1.0 = 3.5).
- Positions are correct in both the Library and detail pages, with ties broken by name.
- Each sort orders correctly in both views.
- Check at 375px: the sort chips fit on one line or wrap neatly.
- `run check` and `run build` pass.

## Checkpoint (user)
- Does the ranking feel right with your real data?
- Do any weights need tuning? It's a one-line change in SQL plus `lib/ranking.ts`.

## After the MVP
Candidates for later, roughly in priority order. Not part of this phase.
1. **Real auth:**
   - Turn on RLS.
   - Stop exposing `password_hash` to the publishable key (move login to an Edge Function or Supabase Auth).
2. **Edit and delete** for brews, roasts and roasters.
3. **Installable app:** home-screen icon, app name and offline shell, so it opens like a native app.
4. **Log a past brew** without the start/finish flow.
5. **Recency in ranking**, if daily drivers from months ago crowd out what's in rotation now.

## Build notes
- `Score` owns its own `RankingSheet`: tapping it anywhere opens the breakdown, and a faint "How?" hints that it's tappable. Pages only pass `ranking` and `rank`.
- `formatScore()` is used everywhere a score shows (tiles, roast rows, score block), so unranked reads "—" consistently.
- The roaster page now lists its roasts by rank.
- Sort chips removed after review; the Library uses rank order only and keeps just the `?view` param.
- Verified read-only against real data:
  - the client formula matches the SQL views for every roast and roaster (0 mismatches)
  - Lemma Coffee Co (no brews or ratings) is unranked and sorts last
  - Stumptown is #1
- `run check` and `run build` pass. Not yet checked by eye in a browser.
