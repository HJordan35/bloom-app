# Brew Coach — Plan

> In the app this feature is called **Dial in** (a dial icon, on Brew now, the launcher and a roast's page). "Coach" is its name in the code, the database and these docs.

A coach you can ask how to brew a coffee, **before you start** or **while you're brewing**. It reads your recipes and brews, the group's for the same roast, and general brewing knowledge, and answers in phone-sized pieces: a short line, a question with tappable answers, or a recipe card that shows what changed.

**The point is better coffee, not more recipes.** The coach finds out what's wrong before it changes anything, changes as little as it can, and says why.

**Principles** (same as `docs/recipes/PLAN.md`):
- Happy path only, no tests, minimal abstraction.
- Minimalist UI: one quiet entry point, plain sheet, theme tokens only until the agent is tuned.
- Least throwaway: the engine and the chat sheet are built in their final shape; tuning happens in the real UI.

## Status

| Phase | Scope | Status | Plan |
|---|---|---|---|
| A1 | Engine: `coach` Edge Function (AI SDK + Gemini, streaming), context, tools, primer, `coach_chats` and `coach_turns` | 🔨 Built — deployed, conversing over curl; awaiting review | [phase-a1.md](phase-a1.md) |
| A2 | Plain chat sheet: entry points before and during a brew, question chips, tweak and recipe cards with their actions | 🔨 Built — awaiting review on a phone | [phase-a2.md](phase-a2.md) |
| A3 | Tuning: replay script with scripted conversations, prompt and primer rounds | — | phase-a3.md |
| A4 | The complete chat, ahead of tuning: earlier chats, starters, an after-brew way in, the coach following up on its last suggestion, polish | 🔨 Built — awaiting review on a phone | [phase-a4.md](phase-a4.md) |
| A5 | One card: always a complete recipe, built from a base and what the coach changed | 🔨 Built — awaiting review on a phone | [phase-a5.md](phase-a5.md) |
| A6 | A voice (barista friend with opinions, and a read on each bro), and deleting a chat | 🔨 Built — awaiting review on a phone | [phase-a6.md](phase-a6.md) |

Each phase is planned in `docs/coach/` before it's built, and ends staged for review.

## How it coaches

- **Diagnose first.** Before suggesting anything it knows what you're after or what's off: how the last cup tasted, what you changed, how the drawdown went. If it doesn't know, it asks, one question at a time.
- **Smallest change that could work.** One setting at a time is the default, so you can taste what it did. A full recipe is for when there's nothing to start from (a new roast or method), or when you ask for one.
- **Always a why.** Every suggestion ties to what you tasted and to evidence: your last brew, your bookmarked recipe, another bro's on the same grinder, or a named technique.
- **What to taste for next.** A suggestion ends with the follow-up: "still sour? Go finer next."
- **Talking is a fine answer.** Explaining why a cup is sour, or that the recipe is already good and the coffee needs rest, needs no card.

It never opens with a recipe, and never sends a card without the line that explains it.

## Voice

The group's barista friend: loves good coffee, has its own opinions about roasters and about each bro, dry and sarcastic when the moment earns it, and still invested in the cup you're making. Humor is never forced; instructions are always literal. See [phase-a6.md](phase-a6.md).

## Two moments, one chat

The coach works out which moment it's in on the server, every turn, from whether you have an open brew. The client never tells it your settings.

| | Before a brew | During a brew |
|---|---|---|
| Where it opens | Brew now's top row, beside "Start a brew"; and in the launcher once a roast is picked | The same top row |
| What it knows at the start | Your gear, your recent roasts, your recipes. A roast if you opened it from one | Your open brew, read fresh: roast, method, dose, grind, grinder, temp, notes, elapsed time, target if started from a recipe |
| First move | **Confirm roast and method.** Chips of your recent roasts, then the methods you've bookmarked or brewed for it. Skips whichever is already known. Offers "Recommend one" for the method | **No questions about roast or method.** It reads your settings and asks what's wrong, or answers what you asked |
| A card | Always a whole recipe, with what changed marked. **Brew this** starts the brew · **Save as recipe** | The same card. **Apply** writes the recipe (only the changed fields when it's based on the open brew) · **Save as recipe** |

- **The same chat carries over.** "Brew this" starts a brew; the next turn sees the open brew and switches to the during rules on its own.
- **Fresh settings.** The brewing card flushes its autosave before the sheet opens and before each message, so the coach reads what's on screen.
- **Mid-brew realism.** Once you're brewing, some things can't change (the dose is ground). The coach asks how far along you are only when its advice depends on it.

## How it works (end state)

```
CoachSheet (useChat)
   │  POST /functions/v1/coach   { chat_id, message, roast_id? }   Authorization: user JWT
   ▼
Edge Function `coach`
   1. who is this (JWT → bros, as studio-photo does); daily turn cap
   2. load the chat's earlier messages from coach_chats; daily cap counts coach_turns
   3. build the context block, no LLM:
        open brew?  → DURING: the brew as it stands, its target, how long it's been going
        otherwise   → BEFORE: roast if known, your recent roasts
        always      → your gear (grinders, grind range per grinder and method), your recipes
        roast known → the group's recipes, last brews and endorsements for it
   4. streamText (gemini-3.8-flash, low thinking, ≤ 6 steps, 60s abort)
        tools: find_roasts · get_my_brews · get_roast_brews · web search · ask_user · propose_recipe
   5. stream the reply; save the chat to coach_chats and the turn to coach_turns when done
        (finishes and saves even if the phone drops the connection)
```

## Decisions

- **Supabase Edge Function + Vercel AI SDK.** Same platform, secrets and auth as every other function. The SDK gives streaming, the chat hook, and "ask the user and wait" as a tool the client answers. `insights` keeps its own loop.
- **The 150s limit is per turn, not per chat.** A turn is one request; a question to you ends it. Turns are capped at 6 steps, one web search and 60s.
- **Gemini only:** `gemini-3.8-flash` on the existing `GEMINI_API_KEY`.
- **Knowledge: a primer plus web search.** The primer is ours, in our own words: which lever to move first, a taste-to-fix map, starting points by roast level, and a page per method in `BREW_METHODS`. Web search covers specifics (a roaster's own recipe, an unfamiliar grinder). No article database.
- **History: yours everywhere, the group's for this roast.** Bookmarked recipes count most, then dialed-in brews, then the rest.
- **Grind is grinder-relative.** A setting only carries between brews on the same grinder. On a different grinder the coach says finer or coarser, never a number.
- **One card, always a complete recipe (A5).** The coach names a base (the open brew, the chat's last card, a recipe or brew, or nothing) and only what it changes; the function fills in the rest and the card shows both the changes and the whole recipe. Changing little stays the easy path, and nothing is lost between cards.
- **A coach recipe is a preferred recipe's fields.** Method, label, dose, grind, grinder, temp, estimated time and volume, notes. So Apply, Brew this and Save as recipe are the existing code paths, and nothing new is stored for recipes.
- **Chats are kept** in `coach_chats`, and each turn in `coach_turns` with model, prompt version, usage and trace: the tuning log, the recovery path for a dropped stream, and what the daily cap counts.

## What the coach can say

| Part | Shape |
|---|---|
| Text | ≤ ~280 characters, one idea, plain |
| `ask_user` | A question ≤ 90 characters with 2–4 chips; a chip can carry an id (a roast). Free text is always allowed |
| `propose_recipe` | A base, the changes from it (`{ field, from, to, why }`), the whole resulting recipe (a preferred recipe's fields), a `summary` when it's from scratch, and `next`: what to taste for |

A grind tweak carries a number only when there are brews on the same grinder to anchor it. Otherwise the coach says "finer" in text and sends no card.

## Follow-ups
- A stronger model, or comparing providers, if tuning stalls.
- An article database, if the primer and search fall short.
- Adding a roast from the chat when the one you want isn't in the library.
