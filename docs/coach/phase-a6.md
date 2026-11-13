# Phase A6 — A voice, and deleting a chat

**Status:** 🔨 Built — not yet used against the live coach

## 1. The voice
The coach becomes the group's barista friend: it loves good coffee, has opinions, and is on your side. Written for dads with budgets and routines who want a better cup and a laugh, not a lecture.

- **Humor when it's earned.** Dry, playful, sarcastic, anywhere including cards, but only when the conversation hands it a line. Never forced, never in every message: the joke nobody saw coming is the one that lands. Plenty of replies are just good help.
- **Opinions about coffee companies.** Its own, held consistently: it backs roasters who roast fresh, say where the coffee came from and let it taste like something, and looks down on the chains and the scaled-up (Starbucks, Black Rifle, specialty names that went bland). It can say which it rates and why. Anything stated as fact has to be true; it searches if unsure.
- **A snob, then a coach.** A bag it would never buy gets its piece said, then the same serious help.
- **A read on you.** It forms an opinion of each bro from their habits and lets it show: always fond, with the hard time a buddy gives. It ribs only what the data shows. Budget and family time are off limits.
- **Notices a rut**, and offers one specific thing to try. Happy where you are is a fine answer.
- **Sincere when it counts.** A cup that landed gets plain credit; frustration or a brew in a hurry gets help with no bit.
- **Instructions stay literal.** A card's reasons, summary and next line can sound like the coach; every number and every step in the notes is exactly what to do.

### What it reads you from
Each turn's context gains **About you** (`context.ts`), computed from your latest 150 brews plus one lookup:
- brews logged ever, and in the last 30 days; how many finished brews you marked dialed in;
- how many different roasts, your most-brewed roasts, roasters, methods and roast levels, with counts;
- your latest eight tasting notes;
- your insights from the latest Brewsletter.

`PROMPT_VERSION = "a6-1"`.

## 2. Deleting a chat
- **Where:** each row of the Earlier list gets a small, faint **×** at its right edge.
- **What it does:** asks "Would you like to delete this conversation?" (Delete / Cancel), then deletes it for good. Deleting the chat that's open leaves a fresh one in its place.
- **Data:** migration `020_coach_delete.sql` lets a bro delete their own chats. The chat's turns stay without it (`chat_id` goes null): they hold no messages, only what the coach looked up and proposed, and the daily limit counts them. The coach no longer follows up on a suggestion from a deleted chat.

## Also fixed
A chat that failed on its very first turn never logged the error (the turn pointed at a chat that hadn't been saved yet). It logs now, with no chat.

## Changes
- `supabase/functions/coach/{prompt,context,index}.ts`; `supabase/migrations/020_coach_delete.sql`.
- `src/api/coach/`: `deleteCoachChat`, `coachMutations.remove`.
- `src/features/coach/`: `EarlierChats.tsx` (the ×, the question), `CoachSheet.tsx`.
- `src/components/icons.tsx`: `CloseIcon`.

## You provide
Run `020_coach_delete.sql`, redeploy `coach`.

## Verification
Done here: `tsc`, `biome` and `npm run build` pass; `deno check` passes for `coach`. Not done: any conversation in the new voice, or a delete against the database.

1. Run the migration, redeploy, `npm run dev`.
2. Ask about a roast you've brewed many times: the help is right, and any joke fits the moment. Several plain questions in a row don't each get one.
3. Ask what it thinks of a roaster, and of you.
4. Earlier → × on a row → the question → Delete: the row goes. Delete the open chat: the sheet shows a fresh one.
