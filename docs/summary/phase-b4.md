# Phase B4 — Tabs and the Brewsletter

**Status:** ✅ Done

## Goal
The monthly report becomes the **Brewsletter**. It's split into three tabs, so each part gets the whole screen instead of one long scroll.

## Rename
These are user-visible text changes only. The routes (`/reports`, `/reports/:month`) and the code names stay the same, because S4's push links and the `report_views` table already use them.

| Where | Before | After |
|---|---|---|
| Top-bar title, list page | Reports | Brewsletters |
| Top-bar title, a month | Report | Brewsletter |
| Top-bar icon label | Monthly reports | Brewsletters |
| Masthead eyebrow | The Bloom Report | The Brewsletter |
| Empty states | No reports yet / No report for … | No Brewsletters yet / No Brewsletter for … |

## Tabs (`ReportView`)
- **Under the masthead,** a `SegmentedControl` with Showcase · Stats · Insights.
- **The tab is kept in the URL** (`?tab=stats`, written with `replace`), so a refresh or a back-navigation keeps your place. S4's push can also link straight to a tab.
- **The default tab** is Showcase when the month has new coffees, otherwise Stats.
- **Each tab's content** is wrapped in a `FadeIn` keyed by the tab, so switching plays the same staggered entrance as a page change.

| Tab | Content |
|---|---|
| **Showcase** | The showcase image, the new-coffee figures, and each coffee's row with its insight (B1–B3). With no new coffees: "No new coffees this month." |
| **Stats** | The headline mosaic, Who did what, and Methods |
| **Insights** | The per-bro report cards, top brewer first |

The masthead ("The Brewsletter", the month, "3 of 4 bros brewing") stays above the tabs on every tab.

## Verification
1. **`/reports`** is titled Brewsletters; a month's page is titled Brewsletter.
2. **The tabs:**
   - Each one shows only its own part.
   - Switching plays the entrance animation.
   - The URL's `?tab=` follows the selected tab, and a refresh keeps it.
3. **A month with no new coffees** opens on Stats.
4. **`/reports/demo`** at 375px: the tabs fit, and the showcase image is still October's real one.
