# Phase R1 — Data + API

**Status:** ✅ Done (6973006)

## Goal
Store preferred recipes and read and write them from the app. There's no UI yet, and nothing visible changes.

## Data: `supabase/migrations/016_preferred_recipes.sql`
- **`preferred_recipes`:**
  - `bro_id`, `roast_id` (`on delete cascade`, like brews), `method`, and an optional `label`;
  - the recipe: `dose_g`, `grind_size`, `grinder`, `temp`, `temp_unit`;
  - the estimates: `brew_time_s`, `volume_ml`;
  - `brew_notes`;
  - `source_brew_id` (`on delete set null`): the brew it was copied from, if any;
  - `created_at` and `updated_at`.

  The columns and checks are the same as on `brews`, so the brew draft and form fields work on both.
- **No unique constraint:** a bro can have several for the same roast and method. Replace or keep both is decided in the UI.
- **RLS:** every bro can read; you can only add, edit or delete your own.
- **Realtime:** added to the publication, so another bro's new recipe shows up live.
- **`brews.preferred_recipe_id`** (`on delete set null`): the preferred recipe a brew was started from. R3 uses it for the target line on the brewing card.

## API: `src/api/preferred/`
- **Types:**
  - `PreferredRecipe` (the row) and `PreferredRecipeWithRoast` (adds `roast` and `bro`);
  - `NewPreferredRecipe` (`Recipe & BrewProcess & BrewNotes` plus who, what and where) and `PreferredRecipeUpdate`.
- **Service:**
  - `fetchPreferredRecipe(id)`, `fetchPreferredRecipes()` (all, newest first; it's a small group, so filtering happens client-side) and `fetchPreferredForRoast(roastId)`;
  - `createPreferredRecipe`, `updatePreferredRecipe` (stamps `updated_at`) and `deletePreferredRecipe`.
- **Queries:** `preferredQueries.detail / list / forRoast` and `preferredMutations.create / update / remove`. Each one invalidates `preferredKeys.all`.
- **Realtime:** `preferred_recipes` → `invalidatePreferred`.
- **`NewBrew`** gains an optional `preferred_recipe_id`.

## You provide
Run `016_preferred_recipes.sql` in the SQL editor. There's no Edge Function, webhook or deploy.

## Verification
1. `npx tsc --noEmit -p .`, `npx biome check src` and `npm run build` all pass.
2. In the SQL editor, after running 016:
   - `select count(*) from preferred_recipes;` returns 0;
   - `roast_rankings` brew counts are unchanged.
3. RLS is checked in R2, from the app: saving, editing and deleting your own recipes works, and there's no edit for another bro's.
