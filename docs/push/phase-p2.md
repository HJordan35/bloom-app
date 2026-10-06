# Phase P2 — Sending

**Status:** 🔨 Built — awaiting your setup and test

## Goal
Inserting into `brews`, `roasters`, `roasts` or `endorsements` sends a notification to every subscribed device except the actor's. It works with the app closed, and tapping the notification opens the right page.

## Flow
1. **The database:**
   - A row is inserted by the app, as today.
   - A **Database Webhook** on that table POSTs `{ type: "INSERT", table, record, … }` to `notify`, with an `x-notify-secret` header.
2. **The function, in the request:**
   - Rejects a missing or wrong secret with 401.
   - Otherwise it replies **202** straight away.
   - The real work runs in `EdgeRuntime.waitUntil`, the same as `studio-photo`, so the webhook's short timeout never cuts a send short.
3. **The function, in the background:**
   1. Builds `{ title, body, url }` for the table (see below), looking up names with the service-role client.
   2. Loads `push_subscriptions` where `bro_id` ≠ the actor.
   3. Sends to each one at the same time (`Promise.allSettled`).
   4. If a send comes back **404 or 410**, deletes that subscription (the device unsubscribed, or the app was removed).
   5. Logs any other error. There's no retry.

## Edge Function: `supabase/functions/notify/index.ts`
- **Library:** `npm:web-push`.
  - It's called once to set the keys: `setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)`.
  - Then `sendNotification({ endpoint, keys: { p256dh, auth } }, JSON.stringify(message), { TTL: 3600, urgency: "high" })` for each device.
  - **Confirmed under Deno (2026-10-06):** payload encryption and VAPID signing work, a real HTTPS send reaches Apple's push service, and failures surface `statusCode`. Types come from `npm:@types/web-push`. The fallback (`jsr:@negrel/webpush`) wasn't needed.
- **TTL is 1 hour:** a "Henry is brewing" alert that's still undelivered after an hour is stale, so the push service drops it.
- **`urgency: "high"`:** asks Android to deliver promptly even in Doze.
- **Messages:** one small function per table. Missing parts are left out, and the parts are joined with " · ".

  | Table | Actor | Lookups | Title | Body | url |
  |---|---|---|---|---|---|
  | `brews` | `bro_id` | roast + roaster name | `{First} is brewing` | `{method} · {roast} — {roaster}` | `/brews/{id}` |
  | `roasters` | `created_by` | — | `{First} added a roaster` | `{name} · {location}` | `/library/roasters/{id}` |
  | `roasts` | `created_by` | roaster name | `{First} added a roast` | `{name} — {roaster}` | `/library/roasts/{id}` |
  | `endorsements` | `bro_id` | roast name | `{First} endorsed {roast}` | `{rating}/10 · {method} · "{note, 60 chars…}"` | `/library/roasts/{roast_id}` |

- **Auth:** deployed with JWT verification **off**. The only gate is the shared secret, `NOTIFY_SECRET`, compared with the `x-notify-secret` header.
- **Size:** about 80 lines, in a single file. No `prompt.ts` equivalent is needed.

## Database Webhooks (you create them in the dashboard)
Go to Database → Webhooks → Create a new hook. Enable webhooks if asked; that turns on `pg_net`. Create **four hooks**, one for each table, all set up the same way:

| Field | Value |
|---|---|
| Name | `notify_brews`, `notify_roasters`, `notify_roasts`, `notify_endorsements` |
| Table | `brews` / `roasters` / `roasts` / `endorsements` |
| Events | **Insert** only |
| Type | Supabase Edge Functions → `notify`, method POST |
| Timeout | 5000 ms |
| HTTP headers | `x-notify-secret: <NOTIFY_SECRET>` (keep the default `Content-Type: application/json`) |

They're kept in the dashboard rather than in a migration, so the secret never lands in git.

## You provide
1. **Secrets**, under Edge Functions → Secrets:
   - `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`, the pair from P1.
   - `VAPID_SUBJECT`: `mailto:<your email>`. Apple requires a valid `mailto:` or `https:` subject.
   - `NOTIFY_SECRET`: any long random string, e.g. from `openssl rand -hex 24`.
2. **Deploy `notify`:**
   - In the dashboard editor, paste in `index.ts` and turn **Verify JWT off**.
   - Or use the CLI: `npx supabase functions deploy notify --no-verify-jwt --project-ref <ref>`.
3. **Create the four webhooks** as in the table above.

## Out of scope (see Follow-ups; badges are P3)
Mute settings, quiet hours, batching bursts, targeted "your roast" alerts, and notifications for edits or finished brews.

## Verification
Use two phones, or one phone and desktop Chrome, signed in as two different bros, both subscribed in P1.

- `run check` and `run build` pass.
- `npx --yes deno@latest check index.ts` passes in `supabase/functions/notify/`.
- **Each event, done by Bro A with Bro B's app closed:**
  - **Starting a brew:** B gets "A is brewing", and tapping it opens that brew.
  - **Adding a roaster:** B gets "A added a roaster", and tapping it opens the roaster.
  - **Adding a roast:** B gets "A added a roast", and tapping it opens the roast.
  - **Endorsing:** B gets "A endorsed {roast}" with the rating and note, and tapping it opens the roast.
- **Bro A's own devices** get nothing for A's actions.
- **Finishing, editing or discarding a brew** sends nothing.
- **Wrong or missing secret:** POSTing to the function without the header returns 401, and nothing is sent.
- **Pruning:** turn notifications off on B's phone through the iOS Settings app (not the in-app toggle), trigger an event, and check that the function logs a 410 and B's row is gone.
- **Webhook health:** the delivery log (`net._http_response`, or each webhook's log in the dashboard) shows 202s.
