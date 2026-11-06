# Phase R2 — Create and manage

**Status:** 🔨 Built — awaiting your review

## Goal
Save, edit and delete preferred recipes, from scratch or from any brew, and browse everyone's in a new **Recipes** tab.

## UI
- **`TextToggle`** (`src/components/`): inline `Mine · All` text, the active option in `colors.text` and the others muted. It's the only new primitive, and R3 reuses it for `Preferred · History`.
- **`PreferredRecipeSheet`** (`src/features/recipes/`), the create and edit form:
  - roast (`SelectedRoast` / `RoastPickerSheet`) and method chips;
  - an optional label;
  - `RecipeFields`;
  - `ProcessFields` titled "Estimate";
  - `BrewNotesField`.

  It opens:
  - from scratch;
  - from a brew (prefilled; a copy, with no link back);
  - from another bro's recipe ("Save as mine");
  - from your own recipe, to edit it.

  The button reads **Bookmark recipe**, or **Save changes** when editing.

  **Replace or keep both** is a small centred `Dialog` (`src/components/`). It opens when you bookmark a new recipe and already have one for that roast and method. Its buttons are **Replace** (one per recipe when there are several), **Keep both** and **Cancel**. Replace updates that recipe in place.

  **Delete** (editing only) takes two taps: "Delete", then "Tap again to delete".
- **`PreferredRow`:** `You · AeroPress · Comandante`, then the recipe line (recipe, grinder, time). There's no marker in the Recipes list, since everything there is preferred.
- **`PreferredSummary`:** the label and method, `BrewStats` (time and volume are the estimates), and notes.
- **Recipes tab** (`/recipes`, 4th tab):
  - a top row with `Mine · All` and "+ New";
  - one quiet filter line with two text filters of the same design, "All roasts ▾" and "All methods ▾". Once set, each shows its choice and an ×:
    - roast: opens the roast picker and shows the roast's name;
    - methods: opens a short sheet listing the methods that have recipes, each with a ✓ and its count. You can tick several, and the list filters as you tick. It shows "V60, AeroPress", or "3 methods" past two;
  - rows grouped by roast;
  - filters kept in the URL (`?who=all&roast=…&method=V60&method=AeroPress`).

  Tapping a row opens a summary sheet: **Edit** for yours, **Save as mine** for a bro's.
- **Brew detail:** a **Bookmark** action in the top row, beside Edit, on anyone's brew. It opens the form prefilled with a copy. Saving the same brew twice goes through Replace / Keep both.
  - There's no "preferred by" indicator on brews and no link from a brew to its recipes ("Use recipe" covers that).
- **Icons:** the Recipes tab and Bookmark share one bookmark shape (`RecipeIcon` / `BookmarkIcon`).

## You provide
Run `017_drop_recipe_source.sql`.

## Verification
- `npx tsc --noEmit -p .`, `npx biome check src` and `npm run build` pass.
- With `npm run dev`:
  - Recipes tab: empty state, then "+ New" saves a recipe from scratch;
  - a second recipe for the same roast and method shows the inline Replace / Keep both choice, and both work;
  - edit and delete;
  - a bro's brew → Bookmark copies its values. Editing that brew afterwards doesn't change the copy;
  - `Mine · All`, the roast filter and the method chips filter correctly and survive a reload;
  - a second browser sees new recipes live;
  - brew counts, the Brewsletter and profile stats are unchanged.
