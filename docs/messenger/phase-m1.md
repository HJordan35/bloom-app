# Phase M1 — Placement and profile

**Status:** 🔨 Built — awaiting review

## Goal
Lay out the new structure before any chat exists: the chat icon in the top bar, the Inbox with its two tabs, and the Bros tab as a profile. The Messages tab is a placeholder until M2.

## Pieces
- **Migration `021_inbox.sql`:**
  - **`inbox_seen` table:** one row per bro, with `messages_at` and `notifications_at`. Both default to `-infinity`, so stamping one tab never marks the other as seen. RLS limits each bro to their own row.
  - **`inbox_unread()`:** returns `(messages, notifications)`.
    - `notifications` is true when the `events` view has a row from another bro newer than your `notifications_at`.
    - `messages` is always false until M2.
  - **`mark_inbox_seen(tab)`:** stamps one tab with the **server's** `now()`, so a phone's clock can't make old events look new again.
- **`src/api/inbox/`:** types, service and queries.
  - **`unread()`** reads the dots.
  - **`markSeen`** clears the tab's dot in the cache at once (optimistic).
  - **`invalidateUnread()`** refetches the dots.
- **`src/api/realtime.ts`:**
  - Each table maps to a list of invalidators.
  - `brews`, `roasters`, `roasts` and `endorsements` also refresh the dots.
- **Top bar (`AppShell.tsx`):**
  - The Brewsletter link loses its "Newsletter" caption.
  - **Chat icon:** a new `ChatIcon` sits at the far right, with the same ember dot when either tab has something new.
  - **Where the icon opens:** `/inbox?tab=notifications` when only Notifications is new; otherwise `/inbox`, which opens on Messages.
  - **On `/inbox`:** Back plus the title "Inbox", and the tab bar is hidden.
- **Inbox (`features/inbox/`):**
  - **`InboxPage`:** a `Messages · Notifications` `TextToggle`. The tab lives in `?tab=` and is swapped with `replace`, so Back leaves the Inbox.
    - Each option shows a small ember dot while it has something new.
    - **Stamping:** whenever the open tab is unread (on arrival, or when something lands while you're watching), it's stamped as seen.
  - **`NotificationsList`:** the former Bros Board feed, grouped by day. **`EventRow`** moved here from `features/bros/`.
  - **Messages tab:** a quiet `EmptyState` until M2.
  - **`TextToggle`:** options take an optional `dot`.
- **Bros as profile:**
  - **`/bros`** renders `BroProfilePage` for you. **`/bros/:id`** renders it for any bro, still with Back.
  - **`BroStrip`:** every bro (you first) as a small avatar and name, above the profile header.
    - The bro being viewed gets the brass ring, and a bro who is brewing gets the ember ring.
    - **From `/bros`**, tapping a bro pushes `/bros/:id`. **From `/bros/:id`**, it replaces, so Back returns to wherever you came from.
  - `BrosBoardPage` is deleted. The tab's title is "Bros".

## You provide
- Run `021_inbox.sql` in the Supabase SQL editor.

## Verification
- `npm run build` and `npx biome check .` pass.
- **The dot:**
  - After another bro brews, the chat icon shows a dot.
  - Tapping it opens Notifications, which has its own dot, and both dots clear.
  - With the Inbox open on Notifications, a new event from another bro shows up and doesn't leave a dot behind.
- **Inbox:** switching tabs keeps Back working (it leaves the Inbox), and the tab bar is hidden on `/inbox`.
- **Bros:**
  - The Bros tab opens your profile, with the strip on top.
  - Tapping another bro shows Back, tapping a third swaps in place, and Back returns to your profile.
- **Your own profile:** Notifications and Log out are still there.
