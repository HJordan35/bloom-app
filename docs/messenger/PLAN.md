# Messenger: Plan

## Context
Bros only talk about coffee in Bloom indirectly, through brews, endorsements and the Bros Board feed. This adds **one shared message board for every bro**: no DMs, no groups, a single thread. It's for quick coffee talk (@mentions, a shared recipe, a photo, reactions), not a replacement for texting. Later, Bloom itself posts here too: release notes and AI insights between Brewsletters.

It also reorganises the IA:
- A new **Inbox** view, opened from a message icon in the top bar. It has two tabs: **Messages** (the board) and **Notifications** (today's Bros Board event feed).
- The **Bros** tab becomes a **profile**. It opens on your own stats, with the other bros one tap away.

Style stays noir and minimal. Links are subtle, photos are small thumbnails you tap to enlarge, a shared recipe is one concise line, and reactions are quiet.

**Principles** (same as every Bloom plan): happy path only, no tests, minimal abstraction. Edge cases go to Follow-ups. Each phase gets a `docs/messenger/phase-mN.md` before it's built, and ends staged (not committed) for review.

## Status

| Phase | Scope | Status | Plan |
|---|---|---|---|
| M1 | Placement and profile: top-bar chat icon and dot, Inbox (Messages placeholder · Notifications), Bros tab as profile | ✅ Done (33b4a08) | [phase-m1.md](phase-m1.md) |
| M2 | Text chat: thread, bubbles, composer, mentions, edit and delete, live updates | ✅ Done (4ba7aa8) | [phase-m2.md](phase-m2.md) |
| M3 | Reactions and mention push | ✅ Done (9391cbf) | [phase-m3.md](phase-m3.md) |
| M4 | Photos and recipe or brew sharing | 🔨 Built — awaiting review | [phase-m4.md](phase-m4.md) |
| M5 | Bloom posts and the usage check | Planned | — |

## Decisions
- **Route `/inbox`**, with the tab in the URL (`/inbox?tab=notifications`).
  - It's a detail route: Back plus the title "Messages" or "Notifications".
  - The **tab bar is hidden on `/inbox`**. The composer sits where the tab bar was, which keeps the keyboard handling simple.
- **Top bar, right side:** the Brewsletter icon (caption "Newsletter" removed) and a new chat icon. The chat icon has **one ember dot** when Messages *or* Notifications has something new. No counts.
  - Inside the Inbox, each option of the `Messages · Notifications` TextToggle gets its own small dot.
  - When only Notifications is new, the Inbox opens on that tab; otherwise it opens on Messages.
- **"New since last check":** a tiny `inbox_seen` table with one row per bro (`messages_at`, `notifications_at`).
  - **Unread** means something newer than your timestamp that was posted by someone else.
  - Opening a tab stamps it. A message arriving while you're watching stamps it again.
  - Stored on the server, so it's consistent across your devices. No per-message read tracking.
- **Messages table:** one table. Bro posts and Bloom posts share it, separated by `kind`.
  - **Edit:** your own messages, text only. Saving sets `edited_at`, which shows a faint "edited".
  - **Delete:** a hard delete of your own message. Its reactions cascade, and its photo is removed from storage.
- **Mentions:**
  - Typed as plain `@Henry` / `@everyone` text.
  - **On send:** the body is matched against bros' first names. The result goes into `mentions uuid[]` and `mention_all bool`, which drive the push.
  - **On display:** a matching `@Name` renders in brass and opens that bro's profile.
  - **Autocomplete:** typing `@` shows a slim row of bro avatars plus "everyone" above the input; tap one to insert it.
  - This assumes unique first names, which is true today (see Follow-ups).
- **Reactions:** a fixed set of six: ☕ 👍 ❤️ 😂 🔥 😮.
  - **Long-press** a message (right-click on desktop) to open a small action sheet: the six reactions, then Edit and Delete if it's yours.
  - **Under the bubble:** reactions show as tiny muted `☕ 2  🔥` marks, with yours in brass. Tapping a mark toggles your reaction.
- **Sharing:** the composer's `+` offers **Photo · Recipe**.
  - **Recipe** opens the existing `BrowseList` in a sheet (the same pattern as `SelectRecipeSheet`), so a preferred recipe *or* a brew can be shared.
  - **In the thread:** it renders as one line, for example `↗ V60 · Guji — Onyx`.
  - **Tapping it:** a recipe opens the same view sheet Browse uses, with Use recipe and Save as mine. A brew opens `/brews/:id`.
- **Photos:**
  - **Upload:** resized in the browser to 1600px on the long edge, as JPEG.
  - **Storage:** a public `message-photos` bucket, the same pattern as `roast-photos`. Width and height are stored to avoid layout jump.
  - **In the thread:** a thumbnail of at most about 160px. Tap for a full-screen lightbox, and tap again to close.
  - **GIFs are deferred.** A picked GIF becomes a still image.
- **Layout:**
  - **Your messages** sit on the right, with no avatar.
  - **Other bros' messages** sit on the left, with an avatar on the last message of a run. A run is consecutive messages from the same sender within 5 minutes.
  - **Time** is a faint mono `clockTime` under each run. Day headings are small centred mono labels using the existing `dayHeading`.
  - **Bubbles** use a 6px radius, `surface` with a hairline border for others and `surfaceRaised` with a `brassFaint` border for yours.
- **Bloom posts** (`kind = 'bloom'`, no `bro_id`):
  - **Look:** no bubble, full width between hairlines, a brass mono eyebrow ("BLOOM · WHAT'S NEW" / "BLOOM · INSIGHT"), and the body in the display serif. Reactions are allowed; edit and delete aren't.
  - **Posting:** by SQL for now. The AI agent comes later.
- **Push:** only for mentions.
  - **Trigger:** a Database Webhook on `messages` insert calls the existing `notify` function.
  - **Recipients:** the mentioned bros, or everyone for `@everyone` (always minus the sender).
  - **Content:** the title "Henry mentioned you" or "Henry, to everyone", a clipped body, opening `/inbox`.
  - **Edits and reactions** never push.
- **Profile:**
  - **`/bros`** renders `BroProfilePage` for you.
  - **`/bros/:id`** renders it for any bro, with Back. This is where avatars and @mentions in the chat land.
  - **The bro strip** sits on both, extracted from `BrosBoardPage`. On `/bros/:id` it switches bro with `replace`, so Back still returns to the chat.
  - `BrosBoardPage` goes away. Its feed becomes the Notifications tab.

## Data model (end state, migrations 021–024)
```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'bro' check (kind in ('bro', 'bloom')),
  bro_id uuid references bros (id) on delete cascade,     -- null for Bloom posts
  label text,                                              -- Bloom eyebrow: 'What''s new', 'Insight'
  body text not null default '',
  mentions uuid[] not null default '{}',
  mention_all boolean not null default false,
  recipe_id uuid references preferred_recipes (id) on delete set null,
  brew_id uuid references brews (id) on delete set null,
  photo_path text, photo_w int, photo_h int,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);
create index on messages (created_at desc);

create table message_reactions (
  message_id uuid not null references messages (id) on delete cascade,
  bro_id uuid not null references bros (id) on delete cascade,
  emoji text not null,
  primary key (message_id, bro_id, emoji)
);

create table inbox_seen (
  bro_id uuid primary key references bros (id) on delete cascade,
  messages_at timestamptz not null default now(),
  notifications_at timestamptz not null default now()
);
```
- **RLS** (current_bro_id pattern from 003):
  - Every bro can read `messages` and `message_reactions`.
  - Inserts are as yourself, with `kind = 'bro'`.
  - Updates and deletes are on your own rows. `inbox_seen` is your own row only.
- **Storage:** a `message-photos` bucket, with insert for bros and delete where `owner = auth.uid()`.
- **Realtime:** add `messages` and `message_reactions` to `supabase_realtime`.
- **`inbox_unread()` returns `(messages bool, notifications bool)`.** It's one SQL function (security invoker) with two `exists` checks: against `messages`, and against the `events` view. Both take `bro_id <> current_bro_id()` and compare to `inbox_seen`. One round trip.
- **Phasing:** the migration is split across phases. `inbox_seen` and `inbox_unread` (notifications half) come in M1; the rest in M2, M3 and M4.

## Phases

### M1: Placement and profile (no chat yet)
- **Docs:** `docs/messenger/PLAN.md` (this plan) and `phase-m1.md`.
- **Migration `021_inbox.sql`:** `inbox_seen`, plus `inbox_unread()` with notifications only (messages is always false for now).
- **New `src/features/inbox/`:**
  - **`InboxPage.tsx`:** a `Messages · Notifications` `TextToggle`, given an optional per-option `dot`. The light TextToggle suits the page better than the boxed SegmentedControl.
  - **`NotificationsList.tsx`:** the feed and `groupByDay`, moved from `BrosBoardPage.tsx`.
  - **`EventRow.tsx`:** moved from `features/bros/`.
  - **Messages tab:** a quiet `EmptyState` placeholder.
- **New `src/api/inbox/`:** `inbox.service.ts`, `inbox.queries.ts` and types, holding `unread()`, `markSeen(tab)` and `invalidateUnread`.
- **`src/components/AppShell.tsx`:**
  - Removes the caption from `ReportsLink`.
  - Adds an `InboxLink` (a new `ChatIcon` in `icons.tsx`, with the same badge style).
  - Adds `/inbox` to `DETAIL_TITLES`.
  - Hides the tab bar on `/inbox`.
- **`src/api/realtime.ts`:** `INVALIDATE_ON_CHANGE` values can run several invalidators, and the event tables also call `invalidateUnread`.
- **Bros as profile:**
  - **`App.tsx`:** `/bros` renders `BroProfilePage` with your id.
  - **New `BroStrip.tsx`:** from `BrosBoardPage`, with the selected bro shown using Avatar's `selected` ring.
  - **Removed:** `BrosBoardPage.tsx`.
  - **`TITLES["/bros"]`:** becomes "Bros".

### M2: Text chat
- **Migration `022_messages.sql`:** the full `messages` table (every column, including the ones only M4 and M5 use), its RLS and realtime, and `inbox_unread` updated for messages.
- **New `src/api/messages/`:**
  - **Reading:** `fetchMessages(before?)` returns pages of 50 with reactions, recipe and brew embedded. Reactions arrive in M3, and the recipe and brew embeds in M4.
  - **Writing:** `sendMessage`, `editMessage` and `deleteMessage`.
  - **Queries:** a `useInfiniteQuery` on the `created_at` cursor.
- **`src/features/inbox/`:**
  - **`MessagesThread.tsx`:**
    - **Scrolling:** a `flex-direction: column-reverse` scroller, so it opens at the bottom and older pages prepend without a jump. A top sentinel loads earlier messages.
    - **New messages:** it follows them while you're at the bottom; otherwise a small "New ↓" pill appears.
    - **Seen:** it stamps `messages_at` on mount and on new data.
  - **`MessageBubble.tsx`:** run grouping, the avatar and time. The body text is parsed into mentions (brass, linked) and URLs (muted underline). It also renders `edited`.
  - **`Composer.tsx`:**
    - **Text box:** the auto-growing textarea from `components/Field.tsx`, capped at about 5 lines, and a brass "Send".
    - **Mentions:** the `@` autocomplete row.
    - **Editing:** an "Editing · Cancel" bar.
    - **Keyboard:** the keyboard inset hook is moved from `Sheet.tsx` to `src/lib/useKeyboardInset.ts` and shared.
  - **`MessageActions.tsx`:** a long-press sheet with Edit and Delete in M2, plus reactions in M3. Delete confirms with the existing `Dialog`.
  - **`mentions.ts`:** `parseMentions(body, bros)` and `renderTokens`.
- **Realtime:** `messages` triggers `invalidateMessages` and `invalidateUnread`.

### M3: Reactions and mention push
- **Migration `023_reactions.sql`:** `message_reactions` with RLS and realtime.
- **Reactions:** the reaction row in `MessageActions`, marks under bubbles that toggle on tap, and reactions joined into the message select.
- **`supabase/functions/notify/index.ts`:**
  - A `messages` builder may return `null` (skip) and an optional `to: string[]`.
  - `notify()` filters `push_subscriptions` with `.in("bro_id", to)` when `to` is given.
  - A Bloom post with `mention_all` pushes to everyone, which is useful for release notes.
- **You provide:** redeploy `notify`, and add a Database Webhook (insert on `messages`) with the `x-notify-secret` header.

### M4: Photos and recipe sharing
- **Migration `024_message_photos.sql`:** the `message-photos` bucket and its policies. Every `messages` column, including `recipe_id`, `brew_id` and the photo fields, already exists from 022; this phase only wires the UI.
- **New `src/lib/resizeImage.ts`:** canvas to JPEG with a 1600px long edge, returning width and height.
- **`Composer`:**
  - **`+`** reveals inline "Photo · Recipe".
  - **Photo:** a hidden file input, like `PhotoPicker`.
  - **Recipe:** a `ShareRecipeSheet` that reuses `BrowseList` the way `SelectRecipeSheet` does, with a "Share" action on the viewing step.
  - **Pending attachment:** shown as a chip with ×.
- **`MessageBubble`:**
  - **Photo:** a thumbnail that opens a new `Lightbox.tsx` component.
  - **Shared item:** a one-line link.
  - **Recipe view:** the Browse view sheet (`BrowsePage.tsx`, the `open.kind === "view"` block and its follow-on sheets) is extracted into a reusable `PreferredRecipeViewer` that both pages use.
- **Delete:** also removes the photo object.

### M5: Bloom posts and the usage check
- **Bloom posts:** the `kind = 'bloom'` rendering in `MessageBubble`, and a documented SQL snippet in `PLAN.md` for posting release notes. The posts carry `mention_all` for a push if wanted.
- **AI insights:** not built. The style and `label` are in place for a future agent, which inserts via the service role.
- **Usage check:** a saved SQL query in `PLAN.md` for message count, table size and photo storage size, to check before any retention work.

## Retention and cost assessment (no retention yet)
These assume 5 bros. Supabase limits should be checked against the current pricing page.

| Resource | Free tier | Pro ($25/mo) | Messenger usage, heavy case |
|---|---|---|---|
| Database | 500 MB | 8 GB | Text is about 0.5 KB per message with its index. 200 a day is about 40 MB a year. |
| File storage | 1 GB | 100 GB | A photo is about 300 KB. 3 a day is about 330 MB a year, which is the **first limit you'd hit on Free**. |
| Egress | 5 GB | 250 GB | Realtime refetches of the loaded pages are about 25 KB × 5 clients per message, plus photos. That's under 1 GB a month. |
| Realtime | 2M msgs, 200 conns | 5M, 500 | Negligible. |

- **Performance:** pages of 50 and a `created_at desc` index keep queries flat well past 100k rows. The DOM only holds what you've scrolled.
- **Retention:** measured by volume, not time. Revisit at about **25k messages or 750 MB of photos**.
  - **Text:** a pg_cron job that keeps the latest N messages.
  - **Photos:** expire photos on all but the newest N photo messages, showing "photo expired".

## Follow-ups (not built)
GIFs (picked or pasted, then GIPHY search) · AI insight agent posting · push on edits that add a mention · optimistic send and patching the cache from realtime payloads instead of refetching · first-name collisions in mentions · sharing a roast · "Share to Messages" from a recipe sheet · photo thumbnails via image transforms · a retention job · orphaned photos if a delete partly fails.

## Verification (manual, by you; I run `npm run build` and `npm run check` each phase)
- **M1:**
  - The chat icon's dot appears after another bro brews.
  - Opening the Inbox lands on Notifications and the dot clears.
  - The Bros tab opens your profile, the strip switches bro, and Back works from `/bros/:id`.
- **M2:**
  - Two devices or browsers as two bros: send, receive live, edit (shows "edited"), delete.
  - Mention autocomplete inserts `@Name`, and the brass mention opens the profile.
  - Load earlier works and older messages prepend with no jump.
  - The keyboard on an iPhone PWA keeps the composer visible.
- **M3:**
  - React and un-react, and the other device updates.
  - `@Name` pushes only that bro, `@everyone` pushes all others, and a plain message pushes no one.
- **M4:**
  - A phone photo uploads as a small thumbnail, and the lightbox opens and closes.
  - A shared recipe opens the recipe sheet, and a shared brew opens the brew page.
- **M5:** insert a Bloom post via SQL; it renders as a note, takes reactions, and has no edit option.
