# Phase A2 — Chat sheet

**Status:** 🔨 Built — rendered with sample chats only; not yet used against the live coach

## Goal
Talk to the coach in the app, before and during a brew, and act on what it suggests: answer its questions with a tap, apply a tweak, brew or save a recipe. Lean and noir like the rest of the app: existing components and theme tokens, one input, no extra controls. This is where the coach gets tuned.

## Where it opens
- **Brew now, top row:** a quiet **Coach** action, before a brew (beside "Start a brew") and during one. It's the one place the coach lives.
- **The launcher's "Choose a method" sheet:** **Ask coach** in the Method row, which opens the coach with that roast settled.

No tab, no badge, no floating button, nothing added to the brewing card.

## One sheet, one chat
- Brew now renders the sheet in both moments. During a brew it reaches the brewing card through a handle the card exposes (`save`, `applyTweak`, `applyRecipe`).
- The chat lives in `coach_chats`, and the sheet loads it by id each time it opens. That's what carries a conversation from before a brew into it, and what recovers a reply the phone missed (backgrounded mid-stream).
- **The current chat id** is kept in `localStorage` with the time it was last used. It's reused for 3 hours, then a new one starts. **New chat**, a quiet action at the top of a conversation, starts one at once.
- So: ask before a brew, tap **Brew this**, the sheet closes and the brew starts; open Coach again and the same conversation is there, now reading the open brew.

## API: `src/api/coach/`
- **`coach.types.ts`:** `CoachAsk`, `CoachTweak` and `CoachRecipe`, the shapes `ask_user`, `suggest_tweak` and `propose_recipe` produce (`supabase/functions/coach/tools.ts`), and `CoachMessage`, the UI message typed with them.
- **`coach.service.ts`:** `fetchCoachChat(id)` (your own row, by RLS; null when there isn't one yet) and `coachTransport()`:
  - posts to `${VITE_SUPABASE_URL}/functions/v1/coach` with the session's access token;
  - sends only the newest message: `{ chat_id, message, roast_id? }`.
- **`coach.queries.ts`:** `coachQueries.chat(id)`. Not in realtime.
- **Dependencies:** `ai` and `@ai-sdk/react`.

## The sheet: `src/features/coach/`
- **`CoachSheet.tsx`** — `Sheet` (tall, with the input as its footer) around `useChat`. Loaded on first open, so the chat library stays out of the main bundle.
  - Props: `roastId?` (from the launcher), `brewing`, `actions` (what the cards do here, below), `beforeSend?` (the brewing card saves its pending edit), `onClose`.
  - **Messages:** the coach speaks in plain lines, no bubble; yours sit right in a raised block. No avatars, no timestamps.
  - **Input:** one line on an underline, and Send. An empty chat shows one italic line in its place of messages.
  - **A question (`ask_user`):** the question as a coach line, its options as `Chips` under it. A tap answers it. Typing while a question is open answers it too (the server needs that answer to go on). Once answered, the chips go and your answer shows as your line.
  - **Sending on its own:** only after you answer a question. A card never triggers another request.
  - **While it works:** one small-caps line that names what it's doing ("Looking at the brews…", "Searching…").
  - **Sources:** when it searched, the page titles as small links under that reply.
  - **Errors:** one plain line ("The coach hit a snag. Send that again."), or the coach's own line for the daily limit. No retry button: you send again.
- **`CoachCards.tsx`**
  - **`TweakCard`:** one row per change, `Temp  200°F → 205°F`, with its why under it; then the "next" line in italics. One text button.
  - **`RecipeCard`:** method and label, the summary, the numbers (`BrewStats`), the notes, the "next" line. Two text buttons.
  - A used card's button reads "Applied" / "Started".
- **`chatId.ts`:** the current chat id and its 3-hour life.

## Shared pieces
- **`Sheet`** gains `footer`: pinned under the scrolling body. With a footer, the sheet lifts itself above the on-screen keyboard (`visualViewport`), since phones don't resize the page for it.
- **`HeaderAction`** dims when disabled.

## What the cards do
| | Before a brew (Brew now) | During a brew (brewing card) |
|---|---|---|
| Tweak | **Brew this:** starts a brew on the tweak's `result` (the base with the change made), then closes the sheet | **Apply:** patches only the changed fields into the card's draft; autosave keeps them. The sheet stays open. A tweak based on another recipe or brew applies its whole `result` |
| Recipe | **Brew this:** starts a brew on it, then closes the sheet · **Save as recipe** | **Apply:** the existing `applyRecipe` (method, recipe, notes) · **Save as recipe** |

- **Save as recipe** opens the existing `PreferredRecipeSheet` filled from the card (`from: { roast, method, values }`), so the label, edits and the replace-or-keep question work as they do everywhere else.
- **Brew this** needs what the launcher's `start()` does. That body moves to `newBrew(bro, roastId, method, from, preferredId)` in `draft.ts`, used by both.
- **Fresh settings:** the brewing card saves any pending edit before the sheet opens and before each message (`onBeforeSend`), so the coach reads what's on screen. An applied tweak is saved the same way before your next message.

## Changes to existing files
- `BrewNowPage.tsx`: the Coach action in the top row, a `"coach"` sheet state, and what the cards do in each moment.
- `BrewLauncher.tsx`: "Ask coach" in the method sheet (`onAskCoach(roastId)`); `start()` uses `newBrew`.
- `ActiveBrewCard.tsx`: the handle (`save`, `applyTweak`, `applyRecipe`). Nothing visible changes.
- `draft.ts`: `newBrew`.
- `Sheet.tsx`, `HeaderAction.tsx`: above.
- `package.json`: `ai`, `@ai-sdk/react`.

## You provide
Redeploy `coach` (lookup results are no longer streamed or kept). No migration.

## Verification
Done here: `npx tsc --noEmit -p .`, `npx biome check src` and `npm run build` pass, and the sheet was rendered at phone width with sample conversations (a tweak, a recipe, an open question, an empty chat). Not done: any real conversation, Apply, Brew this, Save as recipe, or the keyboard on a phone.

1. Redeploy `coach`, then `npm run dev`.
2. On a phone, with no open brew:
   - Coach from Brew now → it asks which roast, with your recent ones as chips; a tap answers and it goes on to the method.
   - Type an answer while chips are showing → taken as the answer.
   - Get to a tweak on a recipe of yours → **Brew this** starts a brew with only that setting changed, and the sheet closes.
   - From the launcher: pick a roast, **Ask coach** → it doesn't ask which roast.
   - A roast and method you've never brewed → a recipe card; **Save as recipe** opens the recipe sheet filled in, and saving it shows it under Recipes.
3. With that brew open:
   - Coach from the top row → the earlier conversation is there.
   - "Last cup was sour" → a tweak; **Apply** changes only that field on the card, and a reload shows it saved.
   - Edit the grind on the card, open Coach, ask about it → the reply uses the new value.
4. Tap the input on a phone: the sheet lifts so the input sits just above the keyboard, and the latest line stays in view.
5. Lock the phone mid-reply, wait, reopen Coach → the finished reply is there.
6. **New chat** starts empty; the old one is still in `coach_chats`.
7. Nothing changed for someone who never opens Coach: starting, brewing and finishing work as before.
