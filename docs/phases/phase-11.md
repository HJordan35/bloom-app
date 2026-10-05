# Phase 11 — Who's Brewed It (avatars on library tiles)

**Status:** ✅ Built — run migration 006 with the deploy

## Goal
Each roast and roaster tile shows the bros who have brewed it, as small avatars. This replaces the brass "mine" diamond. Your own avatar is styled differently so it stands out.

It also fixes a quiet bug: "mine" was worked out from your last 100 brews only, so older roasts lost their diamond.

## Database: `supabase/migrations/006_brewed_by.sql`
`roast_rankings` and `roaster_rankings` gain a last column:

```sql
coalesce(b.brewed_by, '{}') as brewed_by   -- array_agg(distinct bro_id) over the roast's (or roaster's) brews
```

- Redefined with `create or replace view … with (security_invoker = on)`.
  - Adding a column at the end is allowed, and existing grants and the anonymous revoke carry over.
  - The option is restated so RLS still applies.
- **No new request:** the Library already loads both views for scores, so `brewed_by` arrives with them.

## App
- **Types:** `Ranking.brewed_by: string[]`.
- **New `AvatarStack`** (`src/components/`):
  - Overlapping initial avatars, at most 3, then "+N".
  - Ordered **you first**, then the others by name.
  - **Your avatar:** brass ring and brass initials. Others keep the hairline style.
- **`Avatar`** gains an `xs` size (20px) and a `self` highlight style.
- **`Tile`:**
  - The `mine` prop is replaced by an optional `people` slot, shown on its own line above the footer.
  - The footer keeps **score** and **N brews**: who brewed it and how often are different information.
- **`LibraryBrowser`** builds each stack from `brewed_by` and a bros lookup. It applies to roast and roaster tiles, in the Library tab and the Brew Now drawer.
- **Data:**
  - `fetchLibrary` also loads the bros (3–5 rows) and drops `myRoastIds`.
  - `fetchMyBrewHistory` stays only for the drawer's Recent row.
- **Moved:** `fetchBros` goes to `src/lib/bros.ts`, so `library/api` can use it without a circular import with `bros/api`.

## Rollout
Run `006_brewed_by.sql` and deploy together. The new build expects `brewed_by`.

## Verification
- A roast brewed by you and another bro shows both avatars, yours first with the brass ring.
- A roast nobody has brewed shows no avatars.
- A roaster tile shows everyone who has brewed any of its roasts.
- "N brews" is unchanged.
- `run check` and `run build` pass.

## Build notes
- **`AvatarStack` layout:**
  - Earlier avatars are stacked on top (`zIndex`), so your brass-ringed avatar is never covered.
  - The overlap is a light −4px, so initials stay readable.
  - A 2px ring in the tile colour separates the avatars.
  - It's labelled for screen readers as "Brewed by you, Second, …".
- **Mocked** at phone width with a static HTML render (two tiles, up to 3 avatars + "+1"). The app itself hasn't been checked by eye yet.
- **Migration 006** hasn't been run against the project from here. The SQL keeps 001's column order and appends `brewed_by`, which `create or replace view` allows.
- `run check` and `run build` pass.

## Revision: card redesign (after review)
- **Rating dots:** ten dots under the name (`RatingDots`), filled to the bros' average rating, rounded. All empty when unrated.
- **Score removed from cards:** the overall score and the #1–#3 marks are gone from cards. Score, rank position and the "How?" explainer stay on the roast and roaster pages.
- **One facts line:** roast or roaster facts sit on one line ("Colombia · medium", "Portland, OR · 2 roasts").
- **Footer:** avatars bottom left, "N brews" bottom right.
  - Tiles show at most 2 avatars + "+N", so the count never truncates.
  - The footer has a fixed minimum height, so tiles without avatars line up.
- **Removed:** `Tile`'s `rank` prop and the Library's rank-position maps.

## Revision: who's brewed it on detail pages (after review)
- **Roast and roaster pages:** a **Brewed by** row under the score block, with up to 5 avatars (you first, brass ring) and the names ("You, Second"), or "Nobody yet". The score stays as a number here.
- **New `features/library/BrewedBy.tsx`:** turns a ranking's `brewed_by` into an `AvatarStack`. Tiles use it compact (max 2); detail pages use it `labelled`.
- **`fetchBrosById()` in `lib/bros.ts`:** shared by the Library and both detail pages.
- **`AvatarStack`** takes `on="page"`, so its separating ring matches the page background instead of the tile colour.

## Revision: dots show the score
- **Tiles:** the ten dots (`ScoreDots`, renamed from `RatingDots`) now show the **score**, which combines rating and brews, rounded. Before, they showed the average rating.
- **Average rating removed from:**
  - the Score caption on the roast and roaster pages ("Rated 7.0 · 2"), which is now the rank and brew count;
  - the per-method rows on the roast page.
- **Where ratings still appear:**
  - on endorsements;
  - as the "Rating" line in the "How?" score breakdown, where they explain the score.
