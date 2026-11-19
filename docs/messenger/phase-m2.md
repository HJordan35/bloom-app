# Phase M2 — Text chat

**Status:** ✅ Done (4ba7aa8)

## Goal
The shared board, in text: send, read live, mention bros, and edit or delete your own messages. Reactions and push come in M3, and photos and sharing in M4.

## Pieces
- **Migration `022_messages.sql`:**
  - **`messages`:** the full table from the plan, including the columns only M4 and M5 use.
  - **RLS:**
    - Every bro can read.
    - Inserts are as yourself, `kind = 'bro'` only.
    - Updates and deletes are on your own rows.
    - Bros may update only the editable columns: `body`, `mentions`, `mention_all` and `edited_at`.
  - **Realtime:** `messages` is added to `supabase_realtime`.
  - **`inbox_unread()`** now answers for messages too: anything newer than your `messages_at` that isn't yours. That includes Bloom posts.
- **`src/api/messages/`:**
  - **`fetchMessages(before?)`:** 50 at a time, newest first. An infinite query pages back on `created_at`.
  - **`send`, `edit`, `remove`:** mutations that refresh the list. Edit stamps `edited_at`.
  - **Realtime:** a change to `messages` refreshes the list and the dots.
- **Inbox layout:**
  - On `/inbox`, the shell's content area stops scrolling and padding. The Inbox lays itself out: the tab switch on top, then either the Notifications list (its own scroller) or the thread with the composer pinned below.
  - **Keyboard:** `useKeyboardInset` moves from `Sheet.tsx` to `src/lib/` and lifts the Messages tab above the keyboard, the same way a sheet's footer is lifted.
- **`MessagesThread`:**
  - **Scrolling:** a `column-reverse` scroller, so it opens at the newest message, and older pages added above don't move what you're reading. A sentinel at the top loads the next 50 as you near it.
  - **Runs:** consecutive messages from one bro within 5 minutes on the same day.
    - A small centred day heading (`dayHeading`) starts each day.
    - A run opens with a faint mono line: "Sam · 9:41" for others, "9:41" for yours.
    - Others' runs show their avatar beside the first message, which opens their profile.
    - *Changed from the plan:* the avatar and time head the run instead of trailing it, so the name and time read before the message.
  - **New messages:** your own sends scroll to the bottom. When another bro's message lands while you're scrolled up, a small "New ↓" pill appears.
- **`MessageBubble`:**
  - **Placement:** yours on the right (`surfaceRaised`, `brassFaint` border), others' on the left (`surface`, hairline). Both use a 6px radius and wrap at 80% width.
  - **Text:** `@Name` (a bro's first name) is brass and opens their profile. `@everyone` is brass. URLs are muted with a faint underline and open in a new tab. An edited message ends with a faint "edited".
  - **Actions:** long-press (or right-click) on your own message opens Edit and Delete. Others' messages get actions with reactions in M3.
- **`Composer`:** pinned under the thread.
  - **Text box:** a growing textarea (`useAutoHeight`, now exported from `Field.tsx`) with Send.
  - **Keys:** Enter sends, Shift+Enter adds a new line.
  - **Mentions:** typing `@` shows a slim row of matching bros plus Everyone. Tapping one inserts `@Name ` and keeps the keyboard up.
  - **Sending:** the body's mentions are parsed into `mentions` and `mention_all` (`mentions.tsx`). Nothing pushes until M3.
  - **Editing:** loads the text with an "Editing · Cancel" line above it. Save writes the new text and its mentions.
- **Delete:** confirmed in a `Dialog`, then removed for everyone.

## You provide
- Run `022_messages.sql`.

## Verification
- `npm run build` and `npm run check` pass.
- **Two devices** (or two browsers, as two bros):
  - A message arrives live on the other, and its Messages dot lights while it's on Notifications.
  - Edit shows "edited" on both, and delete removes it on both.
- **Mentions:**
  - Typing `@` suggests bros, and tapping one inserts the name with the keyboard still up.
  - The brass mention opens that bro's profile, and Back returns to the chat.
- **Runs:** three quick messages form one run with a single avatar and time, and a message after five minutes starts a new run.
- **History:** with more than 50 messages, scrolling up loads more without jumping.
- **iPhone (installed app):** focusing the composer keeps it above the keyboard with the latest messages in view.
