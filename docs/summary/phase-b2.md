# Phase B2 — New-coffee breakdown

**Status:** ✅ Done

## Goal
The report shows the month's showcase image with a breakdown of each new coffee under it. Until B4's tabs exist, it sits at the top of the report, under the masthead.

## Data (no migration; B1 added everything)
- **`fetchNewRoasts(month)`** calls `month_new_roasts` (B1). Each roast comes with its name, roaster, studio photo, brews, volume and the bros who brewed it, most brewed first.
- **`fetchShowcase(month)`** gets the latest `succeeded` `showcase_runs` row's `image_path`, as a public URL. It returns `null` when the month has no image yet.
- **Queries:** `reportQueries.newRoasts(month)` and `reportQueries.showcase(month)`, with the same layout as the other report queries.

## UI: `src/features/reports/Showcase.tsx`
A `Section` labelled **"New this month"**, rendered only when the month has new coffees.

1. **The showcase image,** if there is one: full width, 4:5, `radius.md`, with a hairline border. It's lazy-loaded.
2. **Three small figure tiles,** in the same style as the bro cards' numbers: **New coffees · Brews · Volume**. These are totals over the new coffees only.
3. **One row per new coffee,** most brewed first, each linking to its roast page:
   - a 4:5 studio thumbnail (36px wide), or the roast's initial when it has no photo
   - its name in display type, with the roaster as a tiny caption
   - an `AvatarStack` of who brewed it
   - its brews as a mono figure at the right, with its volume as a tiny caption

B3 adds one insight to each row.

**Demo:** `mock.ts` gains 4 new roasts (no photos, so the demo shows the thumbnail placeholders) and no showcase image.

## Verification
1. **`/reports/2026-09`:**
   - The image is the B1 run's.
   - The roasts match `month_new_roasts('2026-09-01')`.
   - The tile totals add up from the rows.
2. **A month with no showcase run:** the breakdown shows without an image.
3. **A month with no new coffees:** there's no section.
4. **`/reports/demo`:** the layout is right at 375px wide.
