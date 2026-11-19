# Phase M3 — Reactions and mention push

**Status:** ✅ Done (9391cbf)

## Goal
React to any message with one of six marks, and get a push when someone @mentions you (or @everyone). Nothing else on the board pushes.

## Pieces
- **Migration `023_reactions.sql`:**
  - **`message_reactions`:** `(message_id, bro_id, emoji)` as the key, and `emoji` limited to the six: ☕ 👍 ❤️ 😂 🔥 😮.
  - **RLS:** every bro reads; you add and remove only your own.
  - **Realtime:** the table joins `supabase_realtime`, and a change refreshes the board.
- **API:**
  - Messages load with their reactions embedded (`reactions:message_reactions(bro_id, emoji)`).
  - **`react`:** one mutation adds or removes yours. It updates the cached board at once (optimistic), then refetches.
- **Long-press, on any message:**
  - **The six marks, in a row.** Yours are ringed in brass. Tapping one toggles it and closes the sheet.
  - **Who reacted,** as one faint line under the row, for example "☕ Sam, You · 🔥 Ali".
  - **Your own message** also offers Edit and Delete, as before.
- **Under a bubble:**
  - Each mark used shows as a tiny pill, with a count only from 2.
  - Pills with your reaction get a brass edge and a brass count.
  - Tapping a pill toggles your reaction.
- **Push (`supabase/functions/notify`):**
  - **What a builder returns:** a message builder can now return `null` (send nothing) and an optional `to` (only these bros). `notify()` filters `push_subscriptions` by `to`, always minus the actor.
  - **`messages` insert:**
    - **`@everyone`:** everyone else gets "Henry, to everyone".
    - **`@Name`:** only the mentioned bros get "Henry mentioned you".
    - **Anything else** sends nothing.
    - **Body and link:** the body is clipped to 80 characters, and the push opens `/inbox`.
    - **Bloom posts** have no actor, so "@everyone" in one reaches every bro, titled "Bloom".
  - Edits and reactions never push, because the webhook fires on insert only.

## You provide
1. Run `023_reactions.sql`.
2. Redeploy notify: `npx supabase functions deploy notify --no-verify-jwt --project-ref <ref>`.
3. In Database → Webhooks, add one more webhook, the same as the others:
   - **Table and event:** insert on `public.messages`.
   - **Target:** the `notify` Edge Function.
   - **Header:** `x-notify-secret`.

## Verification
- `npm run build` and `npm run check` pass.
- **Reactions:**
  - Long-press a test message from another bro, then tap ☕. The pill appears straight away, and on the other device live.
  - Tap the pill to remove it.
  - The sheet lists who reacted.
- **Push** (needs a second bro's device subscribed, or a test bro):
  - `@TheirName hi` pushes them, and the tap opens the Inbox.
  - `@everyone` pushes every other subscribed bro.
  - A plain message pushes nobody, and an edit that adds a mention pushes nobody.
  - **Test from SQL:** insert a message as another bro with `mentions = array[<your bro id>]`, and your phone gets the push.
