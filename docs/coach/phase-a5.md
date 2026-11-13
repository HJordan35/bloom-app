# Phase A5 — One card

**Status:** 🔨 Built — rendered with sample chats only; not yet used against the live coach

## Why
The coach had two cards: a tweak (a change or two from a base) and a full recipe. A tweak could only start from the open brew, a bookmarked recipe or a past brew, so iterating on a recipe the coach had just proposed lost everything the tweak didn't mention, notes included. And a tweak never showed the whole picture.

## What changed
**One card, always a complete recipe.** The coach gives a base and only what it changes; the function fills in the rest from the base. The card shows the changes first (before → after, with the reason), then the whole recipe with the changed values picked out in brass, the notes, and what to taste for.

- **Bases:** `open_brew`, `last_card` (the recipe on the previous card in this chat: the fix for iterating), `recipe` or `brew` by id, and `none` (from scratch, every field from the coach, with a summary instead of per-change reasons).
- **Why base + changes, not a rewritten recipe each time:** the diff is the coaching, and copying unchanged fields on the server means only what the coach names can differ. It can't reword your notes or nudge the grind by accident.
- **A past brew as a base** brings its recipe and notes, not its time and volume: those are what happened, not targets.
- **Clearing a field:** an empty `grind_size` leaves it blank, for a base on someone else's grinder.

## The tool: `propose_recipe` (`suggest_tweak` is gone)
`{ base: { kind, id? }, roast_id?, temp_unit?, label?, changes: [{ field, to, why? }], summary?, next }` → `{ base, recipe, changes: [{ field, from, to, why }], summary, next }`.
- Fields: `method`, `dose_g`, `grind_size`, `grinder`, `temp`, `brew_time_s`, `volume_ml`, `brew_notes` (the full notes, up to 8 lines).
- Checks: the base exists; each value is sane for its field and differs from the base; a reason per change (unless from scratch); dose, temp and notes present; the ratio is sane; no time or volume change on an open brew (it has no target fields).
- `PROMPT_VERSION = "a5-1"`.

## In the app
- `CoachCards.tsx`: one `RecipeCard`. `TweakCard` is gone.
- **Before a brew:** **Brew this** starts a brew on the recipe, its targets as the first line of the notes. **Save as recipe** as before.
- **During a brew:** **Apply** writes the whole recipe, except when the card is based on the open brew: then only the changed fields, so an edit made on the brewing card since the coach read it isn't put back.
- `ActiveBrewCard`'s handle is `save` and `applyCoach(card)`.

## Not kept
Chats with the old tweak cards won't load their cards. Clear them: `delete from coach_chats;` (turns go with them).

## You provide
Redeploy `coach`. No migration.

## Verification
Done here: `tsc`, `biome`, `npm run build` and `deno check` pass; the card was rendered with a from-scratch recipe and with a one-change iteration on it.

1. A roast and method you've never brewed → a full recipe card with a summary and no change rows.
2. "Make it stronger" → a card based on the last one: one change row, and the rest of the recipe, notes included, exactly as before.
3. **Brew this** → the brew has every field and the notes, with "Target …" as their first line.
4. During that brew, "last cup was sour" → a card based on the open brew; edit the dose on the brewing card, then **Apply**: only the coach's field changes, your dose edit stays.
5. A recipe based on another bro's, on a different grinder → the grinder is yours and the grind is blank.
