# Phase R4 — One list for recipes and brews

**Status:** ✅ Done

## Goal
One list and filter experience, used in three places, with the Recipes page's look as the baseline. The one change to it: Mine / All became a bros filter like roast and method.

The `Recipes · Brews` switch is always there; each entry only picks which side it opens on.

| Entry | Opens on | New | Tapping a recipe | Tapping a brew |
|---|---|---|---|---|
| **Recipes tab** (`/recipes`) | Recipes | a dialog: **New brew** / **New recipe** | its summary sheet | the brew's page |
| **Browse brews** (`/brews`, new; "Browse" on Brew now's Recent brews) | Brews | the same dialog | its summary sheet | the brew's page |
| **Select recipe** (brewing card, Brew now's From recipe) | Recipes | none | a summary with Use recipe | a summary with Use recipe |

- **One page:** `/recipes` and `/brews` are a single `BrowsePage({ defaultKind })`, which replaces `RecipesPage`. Switching kind on a page is kept in the URL (`?kind=`); the page's own kind is the default.
- **New dialog** (the R2 `Dialog`):
  - **New brew** goes to the Brew now flow (`/?start`, or `/?roast=` when a roast is filtered);
  - **New recipe** opens the recipe form, on the filtered roast when one is set.

The old Select recipe sheet (`RecipeHistorySheet`, with its method chips and bro avatars) is retired.

## Shared: `src/features/browse/`
- **`BrowseList`:** the top row, the filter line, the results and the empty states.
  - **Top row:** `Recipes · Brews` on the left, always shown, and "+ New" on the right on the pages.
  - **Filter line:** three quiet filters of the same design (`FilterLink`): "All bros ▾", "All roasts ▾" and "All methods ▾". Once set, each shows its choice and an ×.
    - **Bros** and **methods** open `FilterSheet`, one generic drawer of multi-select `Chips` with Clear. Bros are every bro, you first and read as "You" (`Chips format`). Pick yourself for "mine", or any number of bros. None ticked means all bros; "All" isn't its own option.
    - **Roast** opens `RoastPickerSheet`.
    - Labels: "You, Ben", or "3 bros" past two.
  - **Pinned:** the switch and the filter line stick to the top of whatever scrolls (the page, or the Select recipe sheet), and only the rows move under them. Their background matches what's behind (`surface`: page or sheet).
  - **Filters apply to whichever kind is showing.** Switching kind keeps the bro, roast and method filters.
  - **Recipes:** grouped by roast, yours first, the same as today.
  - **Brews:** a flat list of `BrewRow`s, newest first. "Show more" loads the next page.
  - **Empty states:** "No recipes found." or "No brews found." with filters; the first-use hint without them.
- **`BrowseFilter`:** `{ kind, broIds, roastId, methods }`.
  - **Every list opens on just you.** Clearing the bro filter (×) shows all bros.
  - The two pages keep it in the URL (`useUrlFilter`: `?bro=…&roast=…&method=…`). No `bro` param means you; an empty `?bro=` means all bros.
  - Select recipe keeps it in local state. It starts on Recipes, you, the brew's roast and its method (or all methods when none was picked).
- **All filtering runs in the queries:**
  - recipes use `preferredQueries.list(filter)` (R2);
  - brews use the new `brewQueries.browse(filter)`, an infinite query of 30 per page, finished brews only, with `bro_id in (…)`, `roast_id` and `method in (…)` sent to Postgres. `PreferredFilter` moved from `broId` to `broIds` the same way;
  - the client only orders and groups the rows it receives.

## Select recipe (`SelectRecipeSheet`, replacing `RecipeHistorySheet`)
- A tall Sheet holding `BrowseList`.
- **Tapping a row** shows its summary: `PreferredSummary` or `BrewSummary` (moved to its own file), with **Use recipe** and "← All".
- **Use recipe** works as in R3: a preferred recipe links the brew; a past brew clears the link.
- **Used by** the brewing card's "Select recipe" and Brew now's "Select Recipe", with the same props as before (`roast`, `method`, `onUse`, `onClose`).

## Smaller changes
- **`BrewRow`** takes an optional `onClick`, which renders it as a button. Select recipe uses it, and `HistoryRow` goes. Its ✦ dialed-in marker is back (R3 had removed it). Recipes have no equivalent.
- **Brew now's method sheet:** two quiet, equal ghost buttons that are always shown, **Start fresh** and **From recipe**.
  - **Start fresh** stays disabled until a method is picked, since a brew needs one.
  - **From recipe** works with or without a method. Without one, it opens Select recipe on all methods for the roast, and the recipe used brings its own method.
- **Brew now:** the Recent brews section gets a quiet "Browse" action (`HeaderAction`) that opens `/brews`.
- **`AppShell`:** `/brews` is a detail route titled "Brews", with a back button.

## Verification
- `npx tsc --noEmit -p .`, `npx biome check src` and `npm run build` pass.
- **Recipes tab:**
  - opens on Recipes, and the switch goes to Brews and back; a reload keeps the side;
  - "+ New" offers New brew / New recipe, and both work.
- **Brew now → Browse:**
  - bros (yourself, several, or none for all), roast and methods filter the brews; the filters survive a reload;
  - Show more appends older brews;
  - a row opens the brew;
  - New starts the Brew now flow, on the filtered roast when one is set.
- **Brewing card → Select recipe:**
  - opens on Recipes, you, your roast and method;
  - switching to Brews keeps the filters;
  - tapping a row then Use recipe applies it. A recipe shows the target line; a brew clears it.
- **Brew now → From recipe:** with no method picked, the sheet shows every method for the roast; with one, it's filtered to it. Use recipe starts the brew with the recipe's method.
- **Start fresh** is disabled until a method is picked.
- **Brew lists** (Recent brews, Browse) show ✦ on dialed-in brews.
- **Scrolling** a long list, on a page and in Select recipe: the switch and filters stay put, and rows pass cleanly under them.
