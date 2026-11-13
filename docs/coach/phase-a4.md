# Phase A4 — The complete chat

**Status:** 🔨 Built — rendered with sample chats only; not yet used against the live coach

Brought ahead of A3 (tuning), so the coach is tuned in the experience people will actually use.

## Goal
Everything the chat needs to feel finished: your earlier chats, a way in after a brew, a first tap instead of a blank box, and a coach that remembers what it last told you. Still one sheet, one input, no new controls on any other screen.

## 1. Earlier chats
- **Where:** the sheet's header, before Close: a small history icon for your earlier chats, and a **+** for a new chat. They stay put however long the conversation gets. The history icon shows once you have another chat to go to; the + once this chat has begun.
- **What it shows:** the sheet's body becomes a list, newest first, of your last 30 chats: the roast (or "No roast yet"), the first thing you said, and the day. A row opens that chat and makes it the current one. The history icon again returns to where you were.
- **Data:** `coach_chats` gains `title` (the first line you sent, trimmed to 80 characters), set by the function on a chat's first turn. Migration `019_coach_titles.sql` adds it and backfills existing chats from their messages.
- **API:** `fetchCoachChats()` → `id, title, updated_at, roast:roasts(name)`; `coachQueries.list()`.
- No deleting, renaming or search.

## 2. A first tap
An empty chat offers two or three things to say, as chips under the opening line. A tap sends it.
- **Before a brew:** "What should I brew?" · "Improve my last cup"
- **Before a brew, roast settled** (from the launcher or a roast page): "How should I brew this?" · "Improve my last cup of it"
- **During a brew:** "Check my settings" · "Last cup was off"
- **After a brew** (below): none; it opens already asking.

They go once the chat has a message. Fixed text in the app, not written by the model.

## 3. After a brew
- **Where:** the "How was it?" sheet. Saving results with **Dialed in** off shows one more quiet line on Brew now, under the greeting: "Not quite there? **Ask coach**". It goes away on a tap, when you start a brew, or when you leave the page.
- **What it does:** opens a new chat with the roast settled and sends "Help me improve my last brew" for you. The coach's context already has that brew, with the tasting notes you just wrote, as the latest one.
- Nothing is added to the "How was it?" sheet itself.

## 4. A roast's way in
The roast page gets **Ask coach** as a quiet action under "Brew now": it opens Brew now with the coach up and that roast settled (`/?coach&roast=<id>`).

## 5. The coach remembers its last suggestion
The most useful thing a coach does is follow up. Each turn's context gains one block when a roast is settled:
- the last card the coach gave this bro for this roast (a tweak or a recipe) and when, from `coach_turns`;
- the bro's brews of the roast since then, with their settings, dialed in and tasting notes. The coach compares the settings itself to tell whether the suggestion was used.

The prompt gains: open with the follow-up when there is one ("You went to 205°F and marked it dialed in. Keep it?" / "Coarser didn't fix the bitterness; next lever is temp").

Server only: `context.ts`, `prompt.ts` (`PROMPT_VERSION = "a4-1"`).

## 6. Polish
- **Streaming:** the coach's line appears as it's written, and the thread follows it only while you're at the bottom (scrolling up to reread isn't yanked back).
- **Cards arrive** with the app's existing fade-in, once, not on every re-render.
- **A missed reply while the sheet is open:** coming back to the app reloads the chat if nothing is streaming, so the finished reply appears without closing and reopening.
- **Sources** sit under the reply's last line, above any open question.
- **A recipe's targets go in the notes:** a brew's time and volume are what happened, so a recipe card's target time and volume become the first line of the brew's notes ("Target 3:15 · 250 ml") on **Brew this** and **Apply**. No recipe is saved unless you tap **Save as recipe**, which keeps them as the recipe's own estimates.
- **Loader** stops moving under reduced motion.
- **Chips keep the coach's wording** ("As is", not "As Is").

## Left out on purpose
- **Thumbs up / down on replies.** It's a control on every message, and what you did with a card (applied, brewed, saved) plus how the next brew turned out says more. That signal is what section 5 reads. Revisit in A3 if tuning needs it.
- Deleting or renaming chats, search, sharing a chat.
- An icon, tab or badge for the coach.

## Changes
- `supabase/migrations/019_coach_titles.sql`; `supabase/functions/coach/{index,context,prompt}.ts`.
- `src/api/coach/`: the list query.
- `src/features/coach/`: `CoachSheet.tsx` (earlier chats, starters, an opening message, scroll, reload), `EarlierChats.tsx`, `recipe.ts` (targets into notes).
- `src/features/brew/BrewNowPage.tsx`: the after-brew line, `?coach`. `BrewResultsSheet.tsx`: `onSaved` says whether it was dialed in.
- `src/features/library/RoastPage.tsx`: Ask coach.
- `src/components/Chips.tsx`: an option to leave labels as written. `Loader.tsx`: reduced motion.

## You provide
Run `019_coach_titles.sql`, redeploy `coach`.

## Verification
Done here: `tsc`, `biome` and `npm run build` pass; `deno check` passes for `coach`; the sheet was rendered at phone width with sample data (a follow-up thread with sources, an empty chat with starters, the Earlier list). Not done: anything against the live coach or database, including the follow-up block and the title backfill.

1. Run `019_coach_titles.sql`, redeploy `coach`, `npm run dev`.
2. Earlier: with two chats, **Earlier** lists both with roast, first line and day; a row opens it and it stays current after closing and reopening. The `t1` chat from `curl` is there.
3. Starters: an empty chat before a brew shows two; a tap sends it; they're gone after.
4. After a brew: finish, save results with Dialed in off → the line appears on Brew now; a tap opens a chat that's already asking, and the reply uses the tasting notes just written.
5. Roast page: **Ask coach** opens the coach with no roast question.
6. Follow-up: take a tweak, brew with it, mark the result; a new chat on that roast opens by referring to it.
7. Scroll up mid-reply: the thread stays put. Lock the phone mid-reply and come back: the reply is there.
8. Brew this on a recipe card: the brew's notes start with its target line.
