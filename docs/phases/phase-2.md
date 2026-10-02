# Phase 2 — Design System, App Shell, Login

**Status:** ✅ Built — awaiting design review on a phone

## Goal
Set the look and feel and the app's frame so it can be reviewed on a phone before any features are built. By the end, a bro can log in and move between three empty tabs styled in the final visual language.

## Scope

### Theme
- `src/theme/tokens.stylex.ts`: `stylex.defineVars` for colors (palette in [PLAN.md](../PLAN.md#visual-direction)), fonts (display / UI / mono), spacing scale, radii (small: 2–6px), hairline border.
- `src/theme/global.css`: reset, body background, font smoothing, safe-area padding.

### Auth
- `src/lib/auth.tsx` (`AuthProvider`, `useAuth`, `useCurrentBro`):
  - `login(email, password)` → calls the `login` RPC; on success saves the bro to `localStorage`.
  - `logout()` → clears it.
  - `useCurrentBro()` → a small React context exposing `{ bro, login, logout }`.
- `App.tsx`: router with an auth gate — no bro sends you to `/login`; a logged-in bro visiting `/login` goes to `/`.

### Base components (`src/components/`)
Only what this phase uses; the rest (Sheet, Mosaic, Rating, LiveDot, Avatar) come with the features that need them.
- `AppShell` — top bar (page title in Playfair) + fixed bottom tab bar (Brew · Library · Bros) with thin-line icons, active tab in brass. Content scrolls between them.
- `Button` — primary (brass outline/fill), ghost.
- `Field` — label + input, hairline underline style.
- `Card` — surface background + 1px hairline border.
- `EmptyState` — muted centered message.

### Pages
- `features/auth/LoginPage` — Bloom wordmark, email + password, error message on failure.
- Placeholder pages for `/` (Brew Now), `/library`, `/bros`, each showing an `EmptyState` so the shell can be judged. The Bros page includes a "Log out" button.

## Out of scope
Data features (Phases 3–5), bottom sheets, realtime.

## Verification
- Log in with a seeded bro; a wrong password shows an error.
- Refresh keeps you logged in; Log out returns to `/login`.
- Tabs switch routes; active tab highlighted.
- Check at 375px width in devtools and on a real phone: no horizontal scroll, tab bar clears the iOS home indicator, tap targets ≥44px.
- `run check` and `run build` pass.

## Checkpoint (user)
Review the visual direction on a phone — palette, type, line weight, density — and adjust before Phase 3.

## Build notes
- Theme tokens added: `surfaceRaised`, `faint`, `danger`, plus `layout` (max width, top bar and tab bar heights).
- Verified: production build and Biome pass; dev server serves the StyleX CSS; the live Supabase project has the schema, `login` RPC and views.
- Not yet verified: a real login. The `bros` table was empty at build time — run `supabase/seed.sql` first.
