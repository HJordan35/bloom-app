# View Transitions — Plan

Views fade in when you navigate between them, instead of cutting in. It's one drop-in wrapper, so every current and future view behaves the same way.

This plan stands on its own. It builds on the query cache from `docs/query/PLAN.md`: cached views mount immediately, so the fade is what you see.

## Status

| Phase | Scope | Status |
|---|---|---|
| T1 | `FadeIn` wrapper adopted in every view; staggered fade + rise; `Sheet` portaled | 🔨 Built — awaiting phone test |

## How it works
- **`src/components/FadeIn.tsx`:** wraps the view's root and adds the `bloom-enter` class.
  - **`xstyle`:** takes the view's own root style, so `FadeIn` replaces the root element instead of adding a layer.
  - **`as`:** `"div"` by default, or `"main"`.
- **The animation** (`.bloom-enter` in `src/theme/global.css`):
  - Each top-level block of the view fades in and rises 8px.
  - Timing: 360ms, with an expo-out curve (`cubic-bezier(0.16, 1, 0.3, 1)`).
  - The blocks are staggered 40ms apart, top to bottom, capped at 200ms. So a header, button and sections arrive in sequence.
  - It respects the system's reduce-motion setting by not animating.
- **Why `global.css`:** StyleX can't target an element's children. `animation-fill-mode: backwards` holds the start state during each block's delay, and leaves no transform behind once the animation ends.
- **`Sheet`** is portaled to `<body>`, so a view's animation can never trap it or draw it under the top bar or tab bar.
- **Placement:** `FadeIn` goes after the view's loading check, not around the `<Outlet>`.
  - Views render `null` until their queries resolve, so a fade around the `<Outlet>` would fade in an empty page, and then the content would pop in.
  - As the view's root, the fade plays once its data is ready. A cached view fades in immediately; an uncached one stays blank for the fetch, then fades in as one piece.
- **`AppShell`:** renders `<Outlet key={pathname} />`. Every path change remounts the view, so the fade also plays from one roast or bro to another.
  - Local state no longer carries over between ids.
  - Search-param changes don't remount: Library's Roasters/Roasts toggle and `?start` don't re-fade.
- **`BrewNowPage`:** waits for your open brew, live brews and recent brews, so it fades in as one piece.

## Adding a view
Wrap its content in `<FadeIn xstyle={styles.page}>` as the root, after its `if (!data) return null` check.

Its direct children are what animate. Keep a view's main blocks (header, actions, sections) as direct children of `FadeIn` to get the stagger. Anything else `position: fixed` should be portaled, like `Sheet`.

## Check
- [x] `tsc`, `biome check` and `vite build` pass. The compiled CSS has the `bloom-enter` keyframes, the stagger delays and the reduced-motion rule.
- [ ] **Tabs:** switching Brew → Library → Bros fades each view in.
- [ ] **Detail pages:** roast → another roast, and bro → board, fade in, including cached revisits.
- [ ] **Uncached detail page:** blank, then a single fade, with no pieces popping in.
- [ ] **Roasters/Roasts toggle:** doesn't re-fade.
- [ ] **Sheets opened mid-page:** still slide over the whole screen.
- [ ] **Sheets after the portal:** close by tapping the backdrop or Close. The roast picker in Brew Now scrolls, and its blocks stagger in as well.
- [ ] **`/?start`:** the start sheet covers the top bar and tab bar from the first frame.
- [ ] **Reduced motion:** with it on in OS settings, views appear without animating.

## Follow-ups
- A loading skeleton for uncached views, instead of the brief blank.
- Tune the feel in one place: the duration, curve, rise and stagger all live in the `.bloom-enter` rules.
