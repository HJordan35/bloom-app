# Phase R5 — Roast page

**Status:** ✅ Done

## Goal
The roast page's "By method" section points at bookmarked recipes instead of a dialed-in brew, and every method leads into the shared list.

## `RoastPage` "By method"
- **Rows:** a row for every method that has brews or a bookmarked recipe for the roast.
  - Each row shows the method and its brew count.
  - When anyone has bookmarked a recipe for the method, a quiet brass line reads "🔖 Bookmarked by You, Ben" (you first, then bros by name).
  - The old link to the first dialed-in brew is gone.
- **Every row is a link** to `/recipes?roast=…&method=…&bro=`: the roast and that method, with all bros (a group view of the roast).
  - It opens on Recipes when the method has a bookmark, otherwise on Brews (`&kind=brews`).
  - The `Recipes · Brews` switch is there either way.
- **Data:**
  - Bookmarks come from `preferredQueries.list({ roastId })`, filtered by the database.
  - Brew counts still come from the roast's brews, which the page already loads for its brew lists (as before R5).

## Left as is
- The roast page's "Your brews" / "Bros' brews" lists.
- Counting brews per method in the browser. The page loads those brews anyway; a database view for the counts is a follow-up if the page ever stops loading every brew.

## Verification
- `npx tsc --noEmit -p .`, `npx biome check src` and `npm run build` pass.
- On a roast with brews in two methods, one of them bookmarked:
  - both rows show their counts;
  - the bookmarked one reads "🔖 Bookmarked by …" with the right names;
  - tapping it opens Recipes filtered to the roast and method, with all bros;
  - tapping the other opens Brews the same way.
- A method with a bookmark but no brews still gets a row ("0 brews").
