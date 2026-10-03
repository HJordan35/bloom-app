# Bloom — Overall Plan

Mobile-first coffee diary for 3–5 friends ("Bros"): track roasters, roasts, brews and endorsements, see who is brewing right now, and follow a shared activity board.

**MVP principles:** happy path only, no tests, minimal abstraction. Simplicity is paramount — a working base to build on, not a production release.

## Status

| Phase | Scope | Status | Plan |
|---|---|---|---|
| 1 | Scaffold + data model | ✅ Done | [phase-1.md](phases/phase-1.md) |
| 2 | Design system, app shell, login | ✅ Done | [phase-2.md](phases/phase-2.md) |
| 3 | Brew Now | ✅ Built — awaiting review | [phase-3.md](phases/phase-3.md) |
| 4 | Library | ✅ Built — awaiting review | [phase-4.md](phases/phase-4.md) |
| 5 | Bros Board | ✅ Built — awaiting review | [phase-5.md](phases/phase-5.md) |
| 6 | Ranking polish | ✅ Built — awaiting review | [phase-6.md](phases/phase-6.md) |
| 7 | Minimal security for launch | ✅ Done | [phase-7.md](phases/phase-7.md) |
| 8 | Home-screen app (PWA) | ✅ Built | [phase-8.md](phases/phase-8.md) |

Each phase gets its own plan in `docs/phases/` before implementation, and ends with a checkpoint review.

All six MVP phases are built. Candidates for what comes next are listed under [After the MVP](phases/phase-6.md#after-the-mvp).

## Decisions

- **Auth:** Supabase Auth (email + password) since Phase 7, with public sign-up turned off. Bros are added by hand: an auth user in the dashboard, then a `bros` row linked by `auth_id` (see `supabase/seed.sql`).
- **Supabase key:** publishable key (`sb_publishable_…`), not the legacy anon key.
- **Brewing now:** a brew is live from Start until Finish. Brew time is a separate manually entered field, so forgetting to press Finish doesn't corrupt data. Open brews older than 2 hours don't count as live.
- **Endorsements:** many per bro over time; ratings (1–10) are optional so an endorsement can be just a note. Ranking uses each bro's latest rating per roast + method.
- **Friends:** all bros are implicitly friends.
- **Library:** the distinct roasts a bro has brewed (a query, not a table).
- **RLS:** on since Phase 7.
  - Only linked bros can read.
  - Writes are only as yourself, and only your own brews can be updated or deleted.
  - Views use `security_invoker`, and anonymous access is revoked.

## Tech

Vite + React + TypeScript, Bun, StyleX (`@stylexjs/unplugin`), Biome, `@supabase/supabase-js`, `react-router-dom`. No state library — small per-feature hooks over Supabase calls. Supabase Realtime on `brews` for live status.

Bun isn't installed globally here; run it as `npx --yes bun@latest <cmd>`.

## Data model

Defined in `supabase/migrations/001_init.sql`.

| Table | Key fields |
|---|---|
| `bros` | first_name, last_name, email (unique), auth_id → auth.users |
| `roasters` | name (unique), location, created_by |
| `roasts` | roaster_id, name, roast_level (light/medium/dark), region, created_by |
| `brews` | bro_id, roast_id, method, dose_g, grind_size, grinder, temp_c, brew_time_s, volume_ml, result, dialed_in, started_at, finished_at |
| `endorsements` | bro_id, roast_id, method, rating (1–10, optional), note |

**Migrations:** `001_init.sql` (schema), `002_realtime.sql` (Realtime for roasters, roasts, endorsements), `003_auth.sql` (Supabase Auth link + RLS).
**Views:** `active_brews`, `latest_ratings`, `roast_rankings`, `roaster_rankings`, `events` (Bros Board feed).
**Function:** `current_bro_id()`, the signed-in bro, used by the RLS policies. (The Phase 1 `login` RPC was removed in 003.)
**Brew methods:** constant list in `src/lib/constants.ts`, stored as text.

### Ranking (0–10)

- `E` = average of each bro's latest rating per method (5 if none)
- `B` = `min(10, 3 · ln(1 + brews))` → 1 brew ≈ 2, 5 ≈ 5.4, 20 ≈ 9, ~28+ = 10
- `score = 0.5·E + 0.5·B`; roaster score uses the same formula across all its roasts

Daily drivers climb on brews alone; endorsements tilt the score. Items with no brews and no ratings are **unranked** (shown as "—"). The app mirrors the formula in `src/lib/ranking.ts` to explain scores; keep it in sync with the SQL views.

## Features

- **Brew Now (home):** who's brewing live, start a brew, finish it with results, recent brews → brew detail.
- **Library:** mosaic grid with search; Roasters / Roasts toggle (roasts grouped by roaster); add roaster/roast; detail pages show your vs bro roasts and brews, endorsements, ranking, and a "Brew now" shortcut.
- **Bros Board:** event feed (brews, new roasters, new roasts, endorsements) and a list of bros → bro profile (library, live status, recent brews).
- **Ranking:** shown on library tiles and detail pages; library ordered by rank (unranked last).

## Routes

`/login`, `/` (Brew Now), `/library`, `/library/roasters/:id`, `/library/roasts/:id`, `/brews/:id`, `/bros`, `/bros/:id`

## Frontend structure

```
src/
  main.tsx, App.tsx (router + auth gate)
  lib/        supabase.ts, types.ts, constants.ts, auth.tsx
  theme/      tokens.stylex.ts, global.css
  components/ AppShell, Card, Mosaic, Sheet, Field/Select/Button, Avatar, Rating, LiveDot, EmptyState
  features/
    auth/     LoginPage
    brew/     BrewNowPage, StartBrewSheet, ActiveBrewCard, FinishBrewSheet, BrewDetailPage
    library/  LibraryPage, RoasterPage, RoastPage, AddRoasterSheet, AddRoastSheet, EndorseSheet
    bros/     BrosBoardPage, BroProfilePage
```

## Visual direction

Dark cigar-lounge noir with Linear-level restraint: 1px hairlines, generous spacing, no heavy shadows.

| Token | Value | Use |
|---|---|---|
| bg | `#0D0A08` | espresso black |
| surface | `#16110E` | cards, sheets |
| hairline | `#2B221C` | borders, dividers |
| text | `#E9E0D2` | parchment |
| muted | `#8A7D70` | secondary text |
| brass | `#B8935A` | accent |
| leather | `#6F4428` | secondary accent |
| ember | `#C8642F` | live indicator |

**Type:** Playfair Display (headings), Inter (UI), JetBrains Mono (numbers).
**Mobile first:** 16px gutters, bottom tab bar (Brew · Library · Bros), bottom sheets for forms, ≥44px tap targets, centered column on desktop.

## Verification (every phase)

- `npx --yes bun@latest run dev`, checked at phone width (devtools or a real phone on the LAN).
- Walk the phase's happy path against the real Supabase project.
- `npx --yes bun@latest run check` and `npx --yes bun@latest run build` both pass.
