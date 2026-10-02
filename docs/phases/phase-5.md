# Phase 5 — Bros Board

**Status:** 📝 Planned — awaiting approval

## Goal
The social tab: a notice board of what everyone's been doing, and a profile for each bro showing their library, live status and brewing habits.

## Bros Board (`/bros`)

### 1. Bros strip
- A horizontal row of round **avatars** (initials, hairline ring), you first, labelled "You".
- A bro who is brewing right now gets an **ember ring** plus a `LiveDot`.
- Tap → their profile.

### 2. Feed
The latest 60 events from the existing `events` view, grouped under day headings (Today / Yesterday / weekday / date). Each row has a small avatar, a one-line sentence and a time, and links somewhere:

| Event | Sentence | Links to |
|---|---|---|
| Brew (finished) | **Henry** brewed *Colombia* · Chemex ✦ | brew detail |
| Brew (still open, < 2h) | **Henry** is brewing *Colombia* · Chemex ● | brew detail |
| New roaster | **Henry** added roaster *Stumptown* | roaster page |
| New roast | **Henry** added *Colombia* from Stumptown | roast page |
| Endorsement | **Henry** endorsed *Colombia* **7** · Chemex, with the note quoted underneath in italics | roast page |

- **Names:** the `events` view only carries ids. The page also loads bros, roasts (with roasters) and roasters, and looks the names up in memory. That's fine at this size and needs no schema change.
- **Live updates:** Realtime is already published for `brews`. The board subscribes to it and reloads the feed and live state on any brew change. Other event types show up on the next visit or pull-to-refresh (see open questions).

### 3. Log out moves
The Log out button moves from this page to your own profile.

## Bro profile (`/bros/:id`)
1. **Header:**
   - Name, "Brewing now: *roast* · method · 4:12" when live.
   - A row of stats: total brews · roasts in library · endorsements · dialed-in brews · favourite method (most brewed).
2. **Library:**
   - Their roasts (distinct roasts they've brewed) as a `Mosaic`.
   - Ordered by **their** brew count, so their daily drivers come first.
   - Tiles show the roast's overall score plus "N brews by Henry".
3. **Recent brews:** latest 20, using `BrewRow` → brew detail.
4. **Endorsements:** latest 10, using `EndorsementRow` with the roast name.
5. **Log out:** only on your own profile.

## Code

### Data (`src/features/bros/api.ts`)
- `fetchBros()` (id and names only; never `password_hash`).
- `fetchEvents(limit = 60)` from the `events` view.
- `fetchBrewingNow()`: all open brews from the last 2 hours. Same window as `fetchLiveBrews`, but including you.
- `fetchBroBrews(broId)`: all their brews with roast joined. Used for library, stats and recent brews.
- `fetchBroEndorsements(broId)`: reuses `ENDORSEMENT_SELECT` from the library api.
- `fetchBoard()`: one `Promise.all` for the board (events, bros, roasts, roasters, brewing now). It returns lookup maps, the same pattern as `fetchLibrary`.

### New components
- `Avatar`: initials in a circle; sizes `sm` / `lg`; optional `live` ember ring.
- `features/bros/EventRow`: builds the sentence above per event type.
- `features/bros/BroProfilePage`.

### Changes
- `Tile` gets an optional footer caption override, for "N brews by Henry".
- `relativeDate` gets a sibling `dayHeading(iso)` in `lib/format.ts`.
- Route `/bros/:id`; `AppShell` `DETAIL_TITLES` gets `/bros/` → "Bro".
- Remove the Phase 2 placeholder card from `BrosBoardPage`.

## Out of scope
- Likes, comments or reactions on events.
- Friend requests or managing who's a bro (still manual, via SQL).
- Notifications.
- Paging the feed beyond 60 events.
- Editing your own profile.

## Verification
- Every event type appears with the right sentence and link, checked against your real Stumptown data and a new brew, roast and endorsement.
- Start a brew as bro A:
  - Bro B's board shows A's avatar ember-ringed and an "is brewing" row without refreshing.
  - Finishing it switches the row to "brewed".
- Profile stats match the brews and endorsements in the database. The favourite method is the most-brewed one.
- The profile library is ordered by that bro's brew count.
- Log out appears only on your own profile.
- Check at 375px: the avatar strip scrolls sideways without making the whole page scroll sideways; long roast names wrap cleanly in feed rows.
- `run check` and `run build` pass.

## Checkpoint (user)
- Does the feed read well, and is anything missing from it?
- Are the profile stats the right ones?

## Open questions
- **Live board for all event types:** a one-file migration (`002_realtime.sql`) would turn on Realtime for `roasters`, `roasts` and `endorsements`, so new roasts and endorsements also appear instantly. Recommended, but it needs you to run the SQL. Without it, only brews are live.
- **Your own events in the feed:** planned to include them, since the spec says "from you and bros". Could be filtered to bros only.
