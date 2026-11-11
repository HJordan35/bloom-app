# Brew notes UX

## Goal
Long brew notes are easy to follow mid-brew. Today the active card's notes box is three rows and scrolls on its own, so reading them means scrolling the page and the box.

## Decisions
- **Text boxes grow with their text.** Every `TextAreaField` starts at a minimum height and then grows, so there's never an inner scroll and the page is the only scroll. That covers brew notes, tasting notes and the endorsement note.
  - The minimum is `minRows`: 3 by default, 4 for brew notes so first entry has room.
  - The height is fitted in JS, not with `field-sizing: content`, so older iOS Safari behaves the same.
  - It re-fits when the width changes, and shrinks as text is deleted.
- **The label names its box** (`htmlFor`). Before, a tap on "Brew notes" could land on the label row's Clear button.
- **Considered and dropped:** showing the notes as plain text until tapped. Once the box grows, it already reads like text, so the extra mode added nothing.

## Phase
One phase: `Field.tsx` (auto-grow, `minRows`, label `htmlFor`) and `BrewFields.tsx` (brew notes at 4 rows).
