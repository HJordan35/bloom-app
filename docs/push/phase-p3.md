# Phase P3 — Badges

**Status:** 🔨 Built — awaiting phone test

## Goal
- **Home Screen icon:** shows how many Bloom notifications are waiting, like a messaging app.
- **Opening Bloom** clears the count.
- **Android:** Bloom's notifications show a "B" in the status bar instead of a generic bell.

There's no server change: everything happens in `sw.js` and the app.

## What the count means
**The number of Bloom notifications still sitting in the notification tray.**

- **Rises:** each push adds one.
- **Falls:**
  - Opening Bloom, including from a notification tap, clears them all.
  - Swiping them away in the tray takes them off; the count corrects itself on the next push or when Bloom opens.
- **Why this definition:**
  - The service worker can ask the OS which notifications are still showing (`registration.getNotifications()`). So there's no counter to store, no "read" table, and nothing to drift out of sync.
  - The alternative, a per-bro unread count kept on the server, needs a table, writes from the app and a count in every push. That's not worth it for 3–5 friends.

## App

### `public/sw.js`
- **`push`:**
  - After `showNotification`, it reads `getNotifications()` and calls `navigator.setAppBadge(count)`.
  - This all happens inside the same `event.waitUntil`.
- **`notificationclick`:** no badge change. Tapping opens Bloom, and opening Bloom clears everything (below).
- **`install`:** `skipWaiting()`, so an updated `sw.js` takes over without waiting for every Bloom window to close. Nothing is cached, so this is safe.
- **Guarded with `if ("setAppBadge" in navigator)`,** so browsers without the Badging API just skip it.
- **Status-bar icon:** `showNotification` gets `badge: "/icons/badge-96.png"`. iOS ignores it.

### `src/lib/push.ts`
- **`clearBadge()`:**
  - Calls `navigator.clearAppBadge()`.
  - Then gets the service worker registration and closes every delivered notification (`getNotifications()` → `close()`).
  - Guarded the same way.

### `src/components/AppShell.tsx`
- **The existing `refreshPush` effect** also calls `clearBadge()` on mount.
- **It also listens for `visibilitychange`:** when the page becomes visible, it calls `clearBadge()` again. Reopening a Home Screen app from the background doesn't remount it, so this is the event that fires.

### `public/icons/badge-96.png` (new)
- 96 × 96: a white Playfair Display (600) "B" on a transparent background, with no rule or fill.
  - Android uses only the alpha channel, so colour doesn't matter, but the shape has to read at 24 dp.
- Rendered the same way as the Phase 8 icons (HTML in headless Chrome, then `sips`). Kept with the other icons.

## Platform behaviour
| | Count on the app icon | Status-bar icon |
|---|---|---|
| **iOS 16.4+, Home Screen app** | ✅ The number shows on the Bloom icon. It needs notification permission, which P1 already asks for. | — (iOS always uses the app icon) |
| **Android, installed** | Depends on the launcher. Most show a **dot**, and some show the number. Android works it out from the notifications on its own, and `setAppBadge` adds little. | ✅ The "B" |
| **Android, Chrome tab** | No badge | ✅ The "B" |
| **Desktop Chrome / Edge, installed** | ✅ The number shows on the dock or taskbar icon | — |

## Verifying `getNotifications()` on iOS
Safari's support for `getNotifications()` inside the service worker gets confirmed on a real iPhone during the build. If it returns nothing there, the fallback is a plain counter in the service worker:
- It's stored as one small entry in Cache Storage, since `localStorage` isn't available in workers.
- Each push adds 1, and `clearBadge()` resets it to 0.

The behaviour is the same either way; only the source of the count changes.

## You provide
- Deploy the build. Nothing to run in Supabase.

## Out of scope (Follow-ups)
- A server-side unread count shared across a bro's devices.
- Clearing badges on the bro's *other* devices when they open Bloom on one.

## Verification
- `run check` and `run build` pass, and `dist/icons/badge-96.png` exists.
- **iPhone (Home Screen app, closed):**
  - Three events from another bro: the Bloom icon shows **3**.
  - Tap one notification: Bloom opens on that page, and the badge and the other notifications clear.
  - Two more events, then open Bloom from its icon (not from a notification): the badge clears and the tray empties.
  - Send Bloom to the background, then trigger an event: the badge shows **1**. Switch back to Bloom: it clears without a reload.
- **Android:**
  - The notification shows the "B" in the status bar, not a bell.
  - The installed app icon shows a dot or number, depending on the launcher.
- **Desktop Chrome (installed):** the taskbar or dock icon shows the count, and it clears on focus.
