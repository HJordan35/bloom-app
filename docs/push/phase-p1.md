# Phase P1 — Device subscription

**Status:** ✅ Done — test push delivered to iPhone (commit `4c119c0`)

## Goal
A bro can turn notifications on for a device from their profile, and that device can receive a push even when Bloom is closed. Proven with a manual test push sent from the terminal. P2 sends the real ones.

## Database: `supabase/migrations/009_push_subscriptions.sql` (you run it)
```sql
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  bro_id uuid not null references bros (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
create policy "own subscriptions" on push_subscriptions
  for all to authenticated
  using (bro_id = (select current_bro_id()))
  with check (bro_id = (select current_bro_id()));
revoke all on push_subscriptions from anon;
```
- **One row per device.** `endpoint` is the push service URL that identifies the device, and it's unique, so saving again is an upsert.
- **Own rows only.** No bro can see another bro's devices. P2's function reads every row with the service-role key, which bypasses RLS.
- Not added to Realtime, since nothing in the app needs to watch it.

## App

### `public/sw.js` (new, about 25 lines, plain JS)
- **`push`:**
  - Reads the JSON payload `{ title, body, url }`.
  - Calls `showNotification(title, { body, icon: "/icons/icon-192.png", data: { url } })`.
  - Wraps that in `event.waitUntil`. iOS requires every push to show a notification.
- **`notificationclick`:**
  - Closes the notification.
  - If a Bloom window is already open, it focuses it and posts `{ url }` to it, and `AppShell` navigates in-app without reloading.
  - Otherwise it opens a new window at `data.url`.
  - Posting a message is more reliable than `WindowClient.navigate`, which only works on pages the worker already controls.
- There's no `fetch` handler and no caching. Phase 8's "no offline cache" decision stands.
- Vite copies `public/` into `dist/` as it is, so it's served at `/sw.js`. Its scope is the whole app, and `_redirects` doesn't affect real files.

### `src/main.tsx`
- `if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");`

### `src/lib/push.ts` (new)
| Function | Does |
|---|---|
| `pushState()` | Returns `"unsupported"` \| `"denied"` \| `"off"` \| `"on"`. The answer is "unsupported" when `PushManager` is missing, which is what iOS Safari reports outside the Home Screen app. Otherwise it's based on `Notification.permission` and whether a subscription exists. |
| `enablePush(broId)` | Asks for permission, calls `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`, then saves the row. |
| `disablePush()` | Deletes this device's row (by `endpoint`), then calls `subscription.unsubscribe()`. Does nothing when there's no subscription. |
| `refreshPush(broId)` | If permission is granted and a subscription exists, upserts it again. Called once when the app opens. |

- **Saving a row:** `supabase.from("push_subscriptions").upsert({ bro_id, endpoint, p256dh, auth }, { onConflict: "endpoint" })`. The values come from `subscription.toJSON()`.
- **`applicationServerKey`:** built from `import.meta.env.VITE_VAPID_PUBLIC_KEY`, using a small base64url-to-`Uint8Array` helper in the same file. Safari doesn't reliably accept the plain string.

### `src/features/bros/NotificationsToggle.tsx` (new)
Shown on **your own** profile, above Log out (`BroProfilePage`, where `bro.id === me.id`).

| State | Shows |
|---|---|
| `on` / `off` | The existing `Toggle`, labelled "Notifications". Tapping it calls `enablePush` or `disablePush`, then re-reads the state. |
| `unsupported` | A quiet line: "To get notifications, add Bloom to your Home Screen and open it from there." |
| `denied` | "Notifications are blocked. Allow them for Bloom in your phone's Settings." |

### Logging out: `src/lib/auth.tsx`
- `logout` becomes `async`. It awaits `disablePush()` **before** signing out, because the row can only be deleted while the bro is still signed in (RLS).
- **`signOut({ scope: "local" })`:**
  - Logging out now ends only this device's session.
  - The default (`global`) also signed out the bro's other devices within the hour, but left their subscriptions in place. Those devices would have kept receiving notifications while showing the login screen.

### Refresh on open: `src/components/AppShell.tsx`
- One `useEffect` that:
  - calls `refreshPush(bro.id)` once on mount;
  - listens for the service worker's `{ url }` message and navigates to it.

### Env
- `VITE_VAPID_PUBLIC_KEY` is typed in `src/vite-env.d.ts` and listed in `.env.example`.

## You provide
1. **VAPID keys:** `npx web-push generate-vapid-keys`. Keep both halves; P2 needs the private key.
2. **The public key** in `.env`:
   - `VITE_VAPID_PUBLIC_KEY=…`
   - Add the same variable to the host's environment settings, then redeploy.
3. **Run** `009_push_subscriptions.sql`.
4. **Deploy the build.**
5. **On each phone:**
   - **iPhone:** add Bloom to the Home Screen (Safari → Share → Add to Home Screen), open it from there, go to your profile, turn Notifications on and tap Allow.
   - **Android:** in Chrome or the installed app, go to your profile, turn Notifications on and tap Allow.

## Out of scope (P2 and Follow-ups)
- Sending real notifications (P2).
- **One device shared between two bros:**
  - Logging out removes the first bro's row, so the second bro can subscribe cleanly.
  - If the first bro never logged out, the second bro's upsert fails under RLS. That's rare enough to ignore.
- Re-subscribing from inside the service worker (`pushsubscriptionchange`). It's in Follow-ups; `refreshPush` covers the common case.

## Verification
- `run check` and `run build` pass, and `dist/sw.js` exists.
- **Profile toggle:**
  - On your own profile, Notifications appears above Log out. It doesn't appear on other bros' profiles.
  - In an iPhone Safari tab, it shows the Home Screen hint.
  - In the installed app, turning it on shows the system prompt. After Allow, a row appears in `push_subscriptions` with your `bro_id`.
  - Turning it off deletes the row.
- **Manual test push** (with the app fully closed on the phone):
  ```sh
  npx web-push send-notification \
    --endpoint="<endpoint>" --key="<p256dh>" --auth="<auth>" \
    --vapid-subject="mailto:you@example.com" \
    --vapid-pubkey="<public>" --vapid-pvtkey="<private>" \
    --payload='{"title":"Bloom","body":"Test push","url":"/bros"}'
  ```
  Copy the endpoint, p256dh and auth values from the row in the Table Editor.
  - The notification appears with the Bloom icon.
  - Tapping it opens Bloom on the Bros Board.
- **Logging out** removes the device's row, and the same test command then fails with 404 or 410 (gone).
