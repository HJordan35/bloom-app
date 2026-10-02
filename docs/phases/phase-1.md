# Phase 1 — Scaffold + Data Model

**Status:** ✅ Done (commits `e7c292f`, `eb97094`)

## Goal
A buildable app skeleton connected to Supabase, with the full schema defined so later phases only build UI.

## Delivered
- Vite + React 19 + TypeScript + StyleX (`@stylexjs/unplugin`) + Biome, run with Bun.
- `supabase/migrations/001_init.sql`: tables, `login` RPC, views (`active_brews`, `latest_ratings`, `roast_rankings`, `roaster_rankings`, `events`), Realtime turned on for `brews`, RLS off.
- `supabase/seed.sql`: template for adding bros with encrypted passwords.
- `src/lib/supabase.ts`, `src/lib/types.ts`, `src/lib/constants.ts`.
- Placeholder `App.tsx` that shows "Connected · N bros" to confirm the connection.
- `.env.example` using the publishable key (`VITE_SUPABASE_PUBLISHABLE_KEY`).

## Checkpoint (user)
1. Run `001_init.sql` in the Supabase SQL editor.
2. Edit and run `seed.sql` to add bros.
3. Fill in `.env` from `.env.example`.
4. `npx --yes bun@latest run dev` → expect "Connected · N bros".

## Notes
- The SQL hasn't yet been run against the real project; any errors there get fixed before Phase 2.
- Bun isn't installed globally; it runs through `npx --yes bun@latest`.
