# Phase 10 — Edit a Brew

**Status:** ✅ Built — awaiting review on a phone

## Goal
A bro can open any of **their own** brews at any time and change anything about it. That includes adding results or an endorsement they skipped with "I'll do it later".

## App only (no migration)
Phase 9 added `brew_notes`, `brew_results`, `endorsements.brew_id` and the endorsement update policy.

### Brew detail
- An **Edit** button, shown only when `brew.bro_id` is the current bro. RLS enforces this anyway.

### `EditBrewSheet` (tall sheet)
Stacks the Phase 9 sections, prefilled with `draftFromBrew(brew)`:
1. **Roast:** current roast with **Change**, which opens the shared `LibraryBrowser` in pick mode, the same drawer as Start a brew.
2. **Method** chips.
3. `RecipeFields`
4. `BrewFields`
5. `ResultFields`
6. **Endorsement:** `EndorsementFields` from the Phase 9 endorsements module, prefilled from `fetchEndorsements({ brewId })`.
   - With no linked endorsement, saving with a rating or note creates one.
   - With a linked endorsement, saving updates it.
   - Its method follows the brew's method.

**Save** calls `updateBrew(id, draftToBrewUpdate(draft))`, then `saveEndorsement(...)` from the endorsements module, then refreshes the detail page.

### Data (`src/features/brew/api.ts`)
- `updateBrew(id, fields)`. The existing `finishBrew` becomes a thin wrapper over it.
- Endorsement data comes from the Phase 9 endorsements module, so there are no new endorsement functions here.

## Out of scope
- Changing start or finish times.
- Deleting a finished brew (Discard covers open brews).
- Edit history.

## Verification
- **As the owner:**
  - Edit every field, including roast (via the drawer), method and temperature unit. The detail page, Recent brews, the roast page and the bro profile all reflect it.
  - Add an endorsement to a brew that had none: the score moves.
  - Change the rating of a linked endorsement: the score moves again (latest-per-bro still applies).
- **As another bro:** no Edit button, and a direct API update is rejected by RLS.
- "Results pending" disappears once results or dialed in are saved.
- `run check` and `run build` pass.

## Build notes
- **Shared roast choice:** `src/features/brew/RoastChoice.tsx` holds `SelectedRoast` (roast + Change) and `RoastPickerSheet` (the library drawer). It's used by both `StartBrewSheet` and `EditBrewSheet`, which removes the inline copy from the start sheet.
- **`EditBrewSheet`:** a tall sheet with roast, method, `RecipeFields`, `ProcessFields`, `OutcomeFields` and `EndorsementFields`. It saves with a single `updateBrew`, then `saveEndorsement`.
  - **Roast or method changes:** the brew's endorsement follows its roast and method. `saveEndorsement` now also updates `roast_id`, a no-op for roast-page edits.
  - **Empty endorsement:** clearing the rating and note leaves an existing endorsement as it was. There's no delete yet.
- **Brew detail:** your own brews show a single **Edit brew** action. A separate **Add results** shortcut was built, then removed after review as redundant. Pending brews are still flagged in Recent brews.
- **Label fix:** the results text field is labelled **Tasting notes**, so it no longer repeats its "Results" section heading.
- **Verified:**
  - `run check` and `run build` pass.
  - Anonymous schema probe confirms migration 005 is live: `brews.result` is gone, and `brew_notes`, `brew_results` and `endorsements.brew_id` exist.
  - Not yet clicked through by eye with a signed-in session.
- **Endorsement toggle (after review):** in the "How was it?" follow-up and the edit sheet, a new endorsement sits behind a **Leave an endorsement** switch, so endorsing is a deliberate choice. It's built as an optional `toggle` prop on `EndorsementFields`. A brew that already has an endorsement shows its fields directly; the roast-page `EndorsementSheet` has no switch.
