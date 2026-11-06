# Brew calendar

## Goal
Brew now gets a quiet month of your coffee, drawn in brass diamonds, and tapping a day narrows Recent brews to it. "Start a brew" becomes a subtle top-right action, so the calendar anchors the page.

## Decisions
- **Date math:** date-fns v4, with our own grid.
- **Weeks:** start on Sunday.
- **Months:** quiet ‹ › arrows. › stops at the current month.
- **Today:** a thin brass ring.
- **Selected day:** a short bar under the day.
- **Two views of the same days:**

**Quality (default):** a small diamond per brew under the number, up to four. Dialed-in brews are filled and come first. The legend reads "brewed · dialed in".

**Quantity:** one diamond mark behind the number, the same size at every level, so only the treatment climbs.

| Brews | Level | Mark |
|---|---|---|
| 0 | comatose | none (a faint ring in the legend) |
| 1 | functioning | the diamond's lower half, outlined |
| 2 | caffeinated | the whole diamond, outlined |
| 3+ | ascended | the outline, a small gap, a solid core; dark number |

## Start a brew
One slim line heads the pinned area, above the calendar: the greeting, smaller (15px italic, one line), on the left, and a quiet "+ Start a brew" `HeaderAction` on the right. That replaces the big button. Other pages keep their own ways in (a roast's Brew, a recipe's Use recipe).

## While brewing
The brewing card takes the calendar's place: no calendar and no Start CTA, just the card, Brewing now and Recent brews, as the page is today. Finishing brings the calendar back, with today's new diamond.

## Phases
| Phase | Scope |
|---|---|
| **C1 Design** | `BrewCalendar` on mock data at `/brew/calendar-demo` |
| **C2 Wiring** | Brew now: the slim greeting and CTA line in place of the big button, the pinned calendar and its view switch, each day's brews and dialed-in count from the database, the day filter on Recent brews; the demo goes |
