# Phase M5 — Bloom posts and the usage check

**Status:** ✅ Done

## Goal
Bloom can speak on the board: release notes now, and AI insights later, posted between Brewsletters. A Bloom post looks like a note in the margin, not a chat bubble. Also, a saved query to see how much the board is used before any retention policy.

## Pieces
- **`BloomPost`:** how a `kind = 'bloom'` message renders.
  - **Layout:** full width between hairlines, with no avatar and no bubble.
  - **Eyebrow:** "BLOOM · WHAT'S NEW" in brass mono (from `label`, or just "BLOOM" without one), and the time on the right in faint mono.
  - **Body:** the display serif, with mentions and links as in a bubble, plus a photo thumbnail if it has one.
  - **Reactions:** the same pills underneath. Long-press opens the reactions (no Edit or Delete, since it isn't yours).
- **Already in place from earlier phases:**
  - Bloom posts light the Messages dot (M2).
  - A Bloom post with `mention_all` pushes every bro, titled "Bloom, to everyone" (M3).
  - RLS stops bros from posting as Bloom (M2).
- **Posting:** by SQL in the dashboard for now (snippet in `PLAN.md`). A future insights agent inserts the same row with the service-role key.
- **Usage check:** a saved query in `PLAN.md` for the message count, photo count, table size and photo storage.

## You provide
- Nothing to run. To try it, post the welcome note from `PLAN.md` → Bloom posts.

## Verification
- `npm run build` and `npm run check` pass.
- The welcome note renders as a note between hairlines, with the brass eyebrow and serif body.
- It lights the dot on the other bros' phones, and with `mention_all` it pushes them.
- Long-pressing it offers reactions only.
- The usage query returns one row.
