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
  - from a brew (prefilled, with `source_brew_id`);
  - from another bro's recipe ("Save as mine");
  - from your own recipe, to edit it.

  **Replace or keep both:** saving a new recipe when you already have one for the roast and method shows a muted line above Save, then text buttons: **Replace** (one per recipe when there are several) and **Keep both**. Replace updates that row in place.

  **Delete** (editing only) takes two taps: "Delete", then "Tap again to delete".
- **`PreferredRow`:** `You · AeroPress · Comandante`, then the recipe line (recipe, grinder, time). There's no ★ in the Recipes list, since everything there is preferred.
- **`PreferredSummary`:** the label and method, `BrewStats` (time and volume are the estimates), notes, and "From Ben's brew" linking to the source brew.
- **Recipes tab** (`/recipes`, 4th tab):
  - a top row with `Mine · All` and "+ New";
  - one filter line: "All roasts ▾", or the roast's name with ×;
  - method chips, shown only when 2+ methods are listed;
  - rows grouped by roast;
  - filters kept in the URL (`?who=all&roast=…&method=…`).

  Tapping a row opens a summary sheet: **Edit** for yours, **Save as mine** for a bro's.
- **Brew detail:**
  - a quiet **☆ Prefer** next to "Use recipe". It becomes **★ Preferred** once you've saved this brew, and then opens that recipe to edit;
  - the method line adds "★ Preferred by You, Ben" for recipes saved from this brew.

## Verification
- `npx tsc --noEmit -p .`, `npx biome check src` and `npm run build` pass.
- With `npm run dev`:
  - Recipes tab: empty state, then "+ New" saves a recipe from scratch;
  - a second recipe for the same roast and method shows the inline Replace / Keep both choice, and both work;
  - edit and delete;
  - a bro's brew → ☆ Prefer copies its values and links back. Editing that brew afterwards doesn't change the copy;
  - `Mine · All`, the roast filter and the method chips filter correctly and survive a reload;
  - a second browser sees new recipes live;
  - brew counts, the Brewsletter and profile stats are unchanged.
