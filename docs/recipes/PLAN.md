# Preferred Recipes — Plan

"Dialed in" is doing two jobs: it records how a brew turned out, and it's how people find a recipe again. This adds an explicit **preferred recipe**: per bro, roast and method, usually one but more allowed (grinder A vs grinder B). People find them on the roast page, in a new **Recipes** tab, and when starting a brew.

**Principles:**
- Happy path only, no tests, minimal abstraction.
- **Minimalist UI:**
  - one quiet marker, a bookmark: preferring is "save this recipe for later";
  - text-weight toggles (`Mine · All`), not boxed controls;
  - a small dialog for the replace-or-keep choice, not an extra sheet;
  - filters hidden until they're useful;
  - trimming existing elements is fine.

## Status

| Phase | Scope | Status | Plan |
|---|---|---|---|
| R1 | Data + API: `preferred_recipes` table, RLS, realtime, `brews.preferred_recipe_id`, `src/api/preferred` | ✅ Done (6973006) | [phase-r1.md](phase-r1.md) |
| R2 | Create and manage: recipe sheet with a replace-or-keep dialog, Recipes tab, "Save as preferred" on a brew | ✅ Done (1568f23 … e2b9677) | [phase-r2.md](phase-r2.md) |
| R3 | Brew with them: bookmarked methods, then Start Brew / Select Recipe in Brew now, `?preferred=`, target line on the brewing card | ✅ Done (c864b19) | [phase-r3.md](phase-r3.md) |
| R4 | One list for recipes and brews: shared `BrowseList` (always-on `Recipes · Brews` switch) for the Recipes tab, a new Browse brews page and Select recipe; `RecipeHistorySheet` retired | ✅ Done (4c1eeba) | [phase-r4.md](phase-r4.md) |
| R5 | Roast page: "Bookmarked by…", every method opens the list filtered to it | ✅ Done | [phase-r5.md](phase-r5.md) |

## Decisions
- **A table of its own, not a flag on `brews`.** Every count reads `brews`: rankings, `brewed_by`, events, Brewing now, `monthly_stats`, insights, profile stats and the "is brewing" push. A recipe made from scratch must never count as a brew.
- **Copy, don't link.** Saving a brew as preferred copies its values into a row you own. The recipe keeps no link back to the brew (dropped in 017), and a brew shows no "preferred by". "Use recipe" already covers going from a brew to its recipe. `brews.preferred_recipe_id` (brew → recipe) stays, so brews per recipe can be counted.
- **Optional label** ("Comandante", "Iced") to tell several recipes apart.
- **Replace or keep both:** "Replace" updates the existing row in place.
- **Time and volume are estimates.** While brewing, they show as a target line, and Finish starts blank.
- **Starts empty:** no backfill from dialed in.
- **Recipes is the 4th tab.**
- **Dialed in stays** as a brew outcome. It stops driving discovery: the history sheet's dialed-in-first sort goes, and the roast page's dialed-in line is replaced by "Bookmarked by".

## Follow-ups
- Pushes and events-feed entries for new preferred recipes (likely noise).
- Brewsletter stats on preferred recipes, and a "brewed 6× from this recipe" count using `brews.preferred_recipe_id`.
- Ordering or pinning when there are several recipes for a method.
