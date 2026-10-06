# Push Notifications — Plan

When a bro starts a brew, adds a roaster, adds a roast or leaves an endorsement, the other bros get a notification on their phones (Android and iOS), even when Bloom is closed.

This plan stands on its own. `docs/PLAN.md` and `docs/gallery/PLAN.md` aren't needed here.

**Principles:**
- Happy path only, no tests, minimal abstraction.
- Standard **Web Push**: no native app, App Store, Apple developer account or Firebase project.
- Every edge case goes to [Follow-ups](#follow-ups).

## Status

| Phase | Scope | Status | Plan |
|---|---|---|---|
| P1 | Device subscription: service worker, opt-in toggle, subscriptions table, manual test push | 🔨 Built — awaiting phone test | [phase-p1.md](phase-p1.md) |
| P2 | Sending: `notify` Edge Function + Database Webhooks for the four events | 📝 Planned | [phase-p2.md](phase-p2.md) |
| P3 | Badges: unread count on the app icon, plus a monochrome Android status-bar icon | 📝 Planned | [phase-p3.md](phase-p3.md) |

Each phase is planned in `docs/push/` before it's built, and ends with a checkpoint review.

## How it works

```
Bro A starts a brew ──► insert into brews
                           │  Database Webhook (insert on brews / roasters / roasts / endorsements)
                           ▼
                  Edge Function `notify`
                    ├─ checks the webhook's shared secret
                    ├─ works out who did it and builds the message
                    ├─ loads every push_subscriptions row except the actor's
                    └─ sends a Web Push to each one (VAPID-signed)
                                │
                Apple / Google push service
                                │
Phone ──► service worker (/sw.js) shows the notification
          tap ──► opens Bloom on the right page
```

- **The app** owns opting in and out. It subscribes the device and saves or deletes its row in `push_subscriptions`.
- **The function** owns sending. It reads subscriptions with the service-role key and deletes any the push service reports as gone.
- **Nothing else changes.** No existing page, query or table is touched, except that logging out now also unsubscribes the device.

## Decisions (proposed, confirm at each phase)

- **Transport:** standard Web Push with VAPID keys. One key pair: the public half lives in the app, the private half is an Edge Function secret.
- **Service worker:** a hand-written `public/sw.js` that handles push only.
  - It doesn't cache or work offline, which keeps the Phase 8 decision of no offline cache.
  - No plugin is needed, so `vite.config.ts` stays the same.
- **Subscriptions:**
  - One row per device in `push_subscriptions` (`bro_id`, `endpoint`, `p256dh`, `auth`). A bro with a phone and a laptop has two rows.
  - RLS: a bro can only insert, update, read or delete their own rows.
- **Opting in:** a "Notifications" toggle on your own profile, above Log out. Browsers only show the permission prompt in response to a tap, so it can't happen automatically.
- **Who's notified:** every subscribed bro except the one who did it.
- **Which events:** inserts only. Edits, finishing a brew and deletes don't notify.

  | Event | Table | Actor | Title | Body | Opens |
  |---|---|---|---|---|---|
  | Starts a brew | `brews` | `bro_id` | Henry is brewing | V60 · Guji — Onyx | `/brews/{id}` |
  | Adds a roaster | `roasters` | `created_by` | Henry added a roaster | Onyx · Portland | `/library/roasters/{id}` |
  | Adds a roast | `roasts` | `created_by` | Henry added a roast | Guji — Onyx | `/library/roasts/{id}` |
  | Endorses | `endorsements` | `bro_id` | Henry endorsed Guji | 8/10 · V60 · "first 60 chars of the note…" | `/library/roasts/{roast_id}` |

  Parts that are missing (no location, no rating, no note) are left out of the body.
- **Triggering:** Supabase **Database Webhooks**, one per table, all calling the same `notify` function.
  - They're created in the dashboard, so the shared secret stays out of git.
  - The function is deployed with JWT verification off and checks an `x-notify-secret` header instead, the same pattern as `studio-photo`.
- **Login status:**
  - A subscription belongs to a **device**. It's linked to the bro who turned it on.
  - Notifications arrive while the app is closed, as long as that device is subscribed.
  - **Logging out** deletes the device's row and unsubscribes it, so it stops receiving. It signs out this device only (`scope: "local"`), so other devices keep both their session and their notifications.
  - **Logging back in** doesn't re-subscribe automatically; the bro turns the toggle on again.
  - **An expired session** (without logging out) keeps receiving. That's fine for 3–5 friends.
- **Keeping subscriptions fresh:** whenever the app opens with permission already granted, it re-saves the current subscription with a cheap upsert. That covers the browser rotating an endpoint without a `pushsubscriptionchange` handler.

## Platform limits

- **iOS / iPadOS 16.4 or later only.**
  - Bloom must be **added to the Home Screen and opened from there**. In a Safari tab, push isn't available at all; the toggle explains this instead.
  - Every push must show a visible notification. There are no silent or background updates.
  - Focus modes and Notification Summary can delay or hide notifications. That's the user's setting.
- **Android:** works in Chrome, installed or not. Doze or battery saver can delay delivery.
- **Permission denied:**
  - The app can't ask again.
  - The toggle tells the bro to re-allow notifications in the system settings.
- **Delivery** is best-effort through Apple's and Google's services. It's usually a few seconds, but it isn't guaranteed.
- **Testing** needs the deployed HTTPS site on a real phone.
  - Desktop Chrome on `localhost` works for quick checks.
  - The dev server reached over the LAN from an iPhone doesn't work.

## Phases

### P1 — Device subscription
- **Migration `009_push_subscriptions.sql`:** adds the table and its RLS.
- **App:**
  - `public/sw.js` for push and click.
  - Registered in `main.tsx`.
  - `src/lib/push.ts` for subscribe, unsubscribe and refresh.
  - A toggle on your own profile.
  - Logging out unsubscribes the device.
- **Proof:** one command sends a manual test push to a subscribed phone (`npx web-push send-notification …`).
- **You provide:**
  - Generate VAPID keys.
  - Add `VITE_VAPID_PUBLIC_KEY` to `.env` and to the host's env.
  - Run 009 and deploy the build.
  - On each phone: install to the Home Screen and turn notifications on.

### P2 — Sending
- **Edge Function `supabase/functions/notify/`:**
  - Checks the secret.
  - Builds the message for the table.
  - Sends to everyone but the actor.
  - Prunes subscriptions that come back 404 or 410.
- **Four Database Webhooks** (insert on `brews`, `roasters`, `roasts`, `endorsements`), each with the secret header.
- **You provide:**
  - Secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NOTIFY_SECRET`.
  - Deploy `notify` with JWT verification off.
  - Create the four webhooks.

### P3 — Badges
- **App icon count:**
  - The service worker sets the Home Screen icon's badge to the number of Bloom notifications waiting in the tray.
  - Opening Bloom clears both the badge and the delivered notifications.
- **Android status-bar icon:** a monochrome `badge` image, so Android shows a "B" instead of a generic bell.
- **Server side:** none. It's entirely in the app and `sw.js`.
- **You provide:** deploy the build.

## Follow-ups
Deliberately left out of the MVP, roughly in the order they're likely to matter.

### Likely soon
1. **Noise control:**
   - If bros find it chatty, the first lever is dropping brew-start notifications for repeat brews of the same roast within an hour, or for all brews.
   - **Start in:** `notify/index.ts`.
2. **Per-event preferences:**
   - Let each bro mute event types. That means a `muted text[]` column on `push_subscriptions` (or on `bros`), filtered in `notify`.
   - Checkboxes under the toggle.
3. **iOS install hint:**
   - A one-time banner in Safari that explains Add to Home Screen.
   - Today the explanation only appears on the profile toggle.
4. **Deploy with the CLI:** deploy `notify` with `npx supabase functions deploy notify --no-verify-jwt`, so the deployed code can't drift from git. This is the same follow-up as for `studio-photo`.

### Later
5. **Targeted notifications:** for example, "Sam endorsed *your* roast". This would mark them differently or send them only to the roast's creator.
6. **More events:**
   - Brew finished, or dialed in.
   - A studio photo is ready (from the `roasts.photo_status` update).
7. **Batching:** collapse a burst (one bro adding five roasts) into one notification using the `tag` option, or a short delay in the function.
8. **Quiet hours:** a per-bro time window during which `notify` skips them.
9. **Stale subscriptions:**
    - The function prunes on 404/410 only.
    - Add a periodic cleanup of rows not refreshed in about 60 days, using an `updated_at` column.
10. **Subscription replaced while the app is closed (`pushsubscriptionchange`):**
    - **What happens:** a device's subscription is its address at Apple's or Google's push service (`endpoint`) plus the encryption keys for this device (`p256dh`, `auth`). The browser or push service can occasionally replace it with a new endpoint and keys, for example when it expires or after browser data is cleared.
    - **Effect:** our row still holds the old endpoint. Sends fail with 404/410, P2 prunes the row, and that device gets nothing until the bro opens Bloom.
    - **Covered today:** `refreshPush` re-saves the current subscription every time the app opens, so the device recovers on the next open.
    - **Fix if needed:** handle `pushsubscriptionchange` in `sw.js`. Subscribe again with the same VAPID public key, then send the new subscription to a small Edge Function that swaps it in for the old endpoint. The worker has no Supabase session, so the old endpoint is the proof of ownership.
    - **Why later:** browsers rarely fire the event (Chrome historically doesn't), and replacement is rare for an app that's opened regularly.
