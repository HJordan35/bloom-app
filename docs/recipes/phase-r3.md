# Phase R3 — Brew with them

**Status:** ✅ Done

## Goal
Starting a brew reaches your bookmarked recipes in a tap or two. The brew remembers which recipe it came from, and the brewing card shows that recipe's estimated time and volume as a target.

## Brew now (`BrewLauncher`)
- **Choose a method:** methods with a preferred recipe for the roast (anyone's) show the small bookmark (`Chips marked`), as a hint. The marks come from one query, `preferredQueries.list({ roastId })`.
- **Then choose how to start.** Two equal-width buttons appear under the methods, for any method:
  - **Start brew** starts at once from your last recipe for the roast and method, as before;
  - **Select recipe** opens the same Select recipe sheet the brewing card uses, already filtered to that method. Using a recipe there starts the brew from it. A preferred recipe links the brew through `preferred_recipe_id`. Closing the sheet goes back to the method choice.
- **`/?preferred=<id>`** starts at once from that recipe, like `/?recipe=`. If you're already brewing, it lands on your open brew.

## Recipes tab
The recipe summary gains **Use recipe** in its Recipe header, the same action as on a brew. It goes to `/?preferred=<id>`.

## Select recipe (`RecipeHistorySheet`)
- **Title:** "Select recipe".
- **Top row:** a `Preferred · History` `TextToggle`. It opens on Preferred when the roast has preferred recipes for the chosen method, otherwise on History.
- **Preferred:** the roast's preferred recipes, filtered in the query by roast and method. Tapping one shows `PreferredSummary` with Use recipe.
- **Method chips** list every method (`BREW_METHODS`) rather than the ones found in the data. A choice with no matches shows "No recipes found."
- **Bro avatars** stay as before and apply to both tabs.
- **History:** the dialed-in-first sort is gone, so it's newest first.
- **Using a recipe:** a preferred recipe sets the brew's `preferred_recipe_id`; a past brew clears it.

## Brewing card (`ActiveBrewCard`)
- `preferred_recipe_id` is part of the autosaved fields.
- When set, a muted line under the recipe reads "Target 3:30 · 250 ml", taken from the recipe's estimates. Finish still starts blank.

## Trims
The ✦ dialed-in marker comes off list rows (`BrewRow`, the history rows), so it doesn't compete with the bookmark. It stays on brew detail and the brew summary.

## Verification
- `npx tsc --noEmit -p .`, `npx biome check src` and `npm run build` pass.
- Brew now on a roast with a bookmarked V60 recipe:
  - V60 shows the bookmark. Tapping any method shows Start brew and Select recipe;
  - Select recipe opens the sheet filtered to V60, and using a preferred recipe starts the brew. The card shows its recipe, notes and target line;
  - using a past brew starts the brew with no target line;
  - Start brew starts from your last recipe.
- Recipes tab → a recipe → Use recipe starts the brew. With a brew already open, it lands on that brew instead.
- Brewing card → Select recipe:
  - it opens on Preferred when there's one for the method;
  - switching to History, method and bro filters work, and the list is newest first;
  - using a past brew clears the target line.
- Reload mid-brew: the target line is still there (the link is saved).
