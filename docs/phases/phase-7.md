# Phase 7 — Minimal Security for Launch

**Status:** ✅ Built — waiting on the dashboard steps and migration 003

## Goal
Make Bloom safe to put on a public URL for a handful of friends. Only bros you created can sign in, and a signed-in bro can only write as themselves.

## Today's exposure
The publishable key ships in the JavaScript, and RLS is off, so anyone who opens the site can:
- read every table, including `bros.password_hash` (bcrypt hashes can be cracked offline);
- insert, edit or delete any brew, roast, roaster or endorsement, as anyone;
- call `login()` as often as they like, with no rate limit.

## Approach: Supabase Auth + row-level security
Supabase Auth handles passwords, sessions, token refresh and rate limiting, so we write no crypto. Accounts stay manual: you add each bro in the Supabase dashboard. Public sign-up is switched off.

### Database (`supabase/migrations/003_auth.sql`)
- **Accounts:**
  - `bros.auth_id` links each bro to their Supabase Auth user. Existing bros are linked by email.
  - Drop `bros.password_hash` and the `login()` function.
- **`current_bro_id()`:** a `security definer` function returning the signed-in bro's id. It's used by every policy below.
- **RLS on all five tables:**

| Table | Read | Write |
|---|---|---|
| `bros` | any linked bro | none from the app |
| `roasters`, `roasts` | any linked bro | insert, only with `created_by` = you |
| `brews` | any linked bro | insert / update / delete your own only |
| `endorsements` | any linked bro | insert, only with `bro_id` = you |

  - "Linked bro" means a Supabase user that has a `bros` row. Even if sign-up were accidentally left on, a stranger's new account could read nothing.
  - Nothing can be updated or deleted except your own brews (Finish / Discard). No other edit or delete exists in the app yet.
- **Views:** all views get `security_invoker = on`, so RLS applies through them. Views otherwise run with owner rights and would bypass RLS.
- **Anonymous access:** revoked on all tables and views (`revoke all … from anon`).
- Realtime keeps working: it checks each subscriber's read policy.

### App
- **`lib/auth.tsx`:**
  - `signInWithPassword` replaces the RPC.
  - The bro is loaded from `bros` by `auth_id`.
  - The session is restored on reload through `onAuthStateChange`.
  - `logout` calls `signOut`.
  - A signed-in user with no bro row is signed straight back out.
- **`LoginPage`:** no manual navigation; the auth gate switches routes when the bro arrives.
- **While the session restores:** nothing renders, so the login screen doesn't flash.
- `supabase/seed.sql` becomes a how-to for adding a bro.

## Manual steps (you, in the Supabase dashboard)
Order matters:
1. **Authentication → Sign In / Providers:** turn **off** "Allow new users to sign up". Keep the Email provider on.
2. **Authentication → Users → Add user**, once per bro: same email as in `bros`, a password, **Auto Confirm User** ticked.
3. **SQL editor:** run `003_auth.sql`. The migration stops with an error if any bro has no matching user, so no one gets locked out by accident.
4. Deploy the new app build. Everyone signs in again with their new password.

## Out of scope
- Password reset emails, profile editing, MFA.
- Hosting setup. Any static host with HTTPS works (Vercel, Netlify, Cloudflare Pages).
- Editing or deleting roasts and roasters.

## Verification
- **Anonymous requests** with the publishable key:
  - every table and view returns `[]` or a permission error
  - inserts are rejected
  - `login` no longer exists
- **Signed in as bro A:**
  - can read everything
  - can start, finish and discard own brews
  - cannot insert a brew with bro B's id
  - cannot update or delete bro B's brew
  - cannot insert a roast with `created_by` = B
- **Sign-up:** a sign-up attempt through the API is refused.
- **Realtime:** bro B still sees A's live brew appear.
- **Sessions:** reloading keeps you signed in; Log out returns to the login screen.
- `run check` and `run build` pass.
