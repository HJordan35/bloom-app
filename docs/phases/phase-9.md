# Phase 9 — Brew Notes, Results Follow-up (and the data for editing)

**Status:** ✅ Done (migration 005 run)

## Goal
Split "how I brewed it" from "how it tasted":
- **Finishing** a brew captures **brew notes**: process details such as pours, WDT and swirl.
- A **follow-up** asks for **results**, **dialed in** and an **endorsement**. It can be saved now or skipped with **"I'll do it later"**.

This phase also lays all the database groundwork for Phase 10 (editing), so Phase 10 is app-only.

## Database: `supabase/migrations/005_brew_notes.sql`
```sql
alter table brews rename column result to brew_results;
alter table brews add column brew_notes text;

-- Tie an endorsement to the brew it came from (endorsements from the roast page stay unlinked)
alter table endorsements add column brew_id uuid references brews (id) on delete set null;

-- Let bros edit their own endorsements (needed by Phase 10)
create policy "edit your own" on endorsements
  for update to authenticated
  using (bro_id = (select current_bro_id()))
  with check (bro_id = (select current_bro_id()));
```
- **Existing data:** today's `result` values are taste notes (e.g. "Amazing"), so renaming them to `brew_results` keeps their meaning. `brew_notes` starts empty.
- **Views:** Postgres carries the column rename into the `events` view automatically.
- **Backfill:** link existing endorsements made from the Finish panel to their brew. Match on the same bro, roast and method, created within a minute of `finished_at`. This is best-effort, and the data is tiny.
- **Brew updates:** the existing "finish your own" policy already covers them.

## App

### Endorsements module: `src/features/endorsements/`
Endorsements can come from a brew or straight from a roast page, so all endorsement code lives in one module. It works the same wherever an endorsement is created, shown or edited.

| File | What it holds |
|---|---|
| `api.ts` | `ENDORSEMENT_SELECT`, `fetchEndorsements({ roastId \| roasterId \| broId \| brewId })`, `createEndorsement`, `updateEndorsement`. Moved out of `library/api.ts` and `bros/api.ts`, which collapses `fetchBroEndorsements` into the shared fetch. |
| `EndorsementFields.tsx` | Controlled rating 1–10 + note (+ optional method chips). Used inline by the brew follow-up and Phase 10's edit sheet. |
| `EndorsementSheet.tsx` | Create **or** edit in one sheet: given `roast` (+ optional `brew`) it creates; given an `endorsement` it edits. Replaces `library/EndorseSheet.tsx`. |
| `EndorsementRow.tsx` | Moved from `LibraryRows.tsx`. Your own endorsements show a small **Edit** action that opens `EndorsementSheet`. |
| `saveEndorsement(draft, existing?)` | One helper used by every caller: creates, updates, or does nothing when rating and note are both empty. |

- **Who can edit:**
  - **Edit** only appears on your own endorsements. The new RLS update policy enforces this in the database.
  - It's available wherever an endorsement row shows: roast page, roaster page, bro profile and brew detail.
- **Method:**
  - An endorsement linked to a brew always takes the brew's method, and the chips are hidden.
  - A roast-page endorsement keeps the optional method chips.

### Shared form sections (DRY groundwork for Phase 10)
Small controlled components in `src/features/brew/fields/`, each taking a slice of one `BrewDraft` object and an `onChange`:

| Section | Fields | Used by |
|---|---|---|
| `RecipeFields` | dose, grind, grinder, temp + °F/°C | Start, Edit |
| `BrewFields` | min : sec, volume, brew notes | Finish, Edit |
| `ResultFields` | brew results, dialed in | Follow-up, Edit |
| `EndorsementFields` | from the endorsements module, see above | Follow-up, Edit, `EndorsementSheet` |

- **`src/features/brew/draft.ts`:**
  - `BrewDraft`: all inputs as strings or booleans.
  - `draftFromBrew(brew)` and `draftToBrewUpdate(draft)` convert between the form and the database, using the existing `toNumber`, `toSeconds` and `mmss` helpers.
- **The existing sheets** (`StartBrewSheet`, `FinishBrewSheet`) switch to these sections, which removes their duplicated field code.

### New finish flow
1. **Finish brew** sheet: brew time (min : sec), volume and **brew notes** ("Pours, WDT, swirl…"). **Finish** sets `finished_at`.
2. **How was it?** sheet opens straight after: **brew results** ("How did it taste?"), **dialed in**, and an optional endorsement (rating and/or note).
   - **Save** updates the brew, and calls `saveEndorsement` with `brew_id` set.
   - **I'll do it later** closes the sheet. The brew is already finished, so nothing is lost.

### Display
- **Brew detail:** separate **Brew notes** and **Results** sections. The brew's linked endorsement shows on the same page.
- **Recent brews:** a finished brew with no results or dialed-in yet shows a faint **"Results pending"** caption, so it's easy to find again.

## Verification
- **Endorsements module:**
  - Endorse from the roast page, then edit it from the row's **Edit** on the roast page and again from the bro profile. Both edits stick, and the score updates.
  - Another bro sees no **Edit** on your endorsements, and a direct API update is rejected.
- **Finish flow:**
  - Finishing with notes → the follow-up opens.
  - Save with results, dialed in and a rating: the detail page shows notes, results and the endorsement, and the endorsement row has `brew_id` set.
  - **I'll do it later** → the brew is finished, shows in Recent brews as "Results pending", and has no endorsement.
- **Existing data:** "Amazing" now shows under **Results**, and the old Chemex endorsement is linked by the backfill.
- **Rankings:** scores are unchanged.
- `run check` and `run build` pass.

## Rollout
Run `005_brew_notes.sql` and deploy at the same time. The old build writes `result`.

## Build notes
- **Brew form sections:**
  - Built as one file, `src/features/brew/BrewFields.tsx`, rather than a `fields/` folder: `RecipeFields`, `ProcessFields` (time, volume, brew notes) and `OutcomeFields` (results, dialed in).
  - They're driven by `BrewDraft` in `src/features/brew/draft.ts`, through `brewDraft()`, `recipeFromDraft()`, `processFromDraft()` and `outcomeFromDraft()`.
- **Endorsements module:** `src/features/endorsements/` holds `api.ts`, `draft.ts` (`EndorsementDraft`, `saveEndorsement`), `EndorsementFields`, `EndorsementSheet` and `EndorsementRow`.
  - Removed: `library/EndorseSheet.tsx`, the endorsement functions in `library/api.ts`, `fetchBroEndorsements`, and `EndorsementRow` in `LibraryRows`.
- **Brew API:** `updateBrew()` is new, and `finishBrew()` wraps it. `resultsPending()` drives the "Results pending" caption.
- **Follow-up:** `BrewResultsSheet` ("How was it?") opens from Brew Now right after **Finish**.
  - Brew-linked endorsements are saved with `brew_id` and the brew's method.
  - Brew detail shows that endorsement, editable by its owner.
- **Results pending:** adding results to a pending brew needs Phase 10's Edit; until then it can only be done in the follow-up.
- **Verified:**
  - `run check` and `run build` pass.
  - The draft helpers round-trip a real brew (e.g. 270 s ↔ 4 : 30, °C kept); empty drafts save nulls; `resultsPending` and `isEmptyEndorsement` behave as expected.
  - Not yet run against the database: needs migration 005 and a signed-in session.
