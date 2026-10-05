# Phase G3 — Consistency calibration

**Status:** ⏸ Deferred

The MVP is accepted as it is, and tuning is postponed. The Studio check page described below was built (commit `d901ec6`) and then removed to keep the code lean. Restore it from that commit when calibration resumes. Everything else here is still the plan.

## Goal
Confirm that studio photos look like one collection: the same set, camera, light and grade, with every bag faithful to the real thing. Then lock the prompt and settings that get us there. Most of this phase is your eye. The code is just enough to make the loop quick.

## Tooling: the Studio check page (`/library/studio`)
A hidden contact sheet, reached by URL only, with nothing added to the nav.
- **Per roast with a photo:** the original and the studio version side by side, plus its status.
- **Re-shoot:** runs the same original through the function again. Use it to test repeatability, or to re-run after a prompt change. It calls the existing function, so there's nothing new on the server.
- **Studio photos in one grid:** the "would these sit together in one catalogue?" view.
- **Shared code:** `developRoastPhoto(roastId)` in `photos.ts` is the single call used by both upload and Re-shoot.

Re-shoot is a calibration tool here, not the user-facing "regenerate" from Follow-ups. That stays a Follow-up.

## Procedure (you)
1. **Batch:** add photos for 5–8 roasts, deliberately varied:
   - a bright kitchen, a dim room and outdoors;
   - straight-on and angled shots;
   - a glossy bag, a kraft bag, and one with small text;
   - one awkward shot (a hand in frame, or other products nearby).
2. **Repeatability:** re-shoot 2 of them 3 times each, and screenshot each result. This shows how much drift the fixed seed still allows.
3. **Score each image** against the checklist below, and send me notes and screenshots of anything that misses.

## Checklist
| # | Check | Spec |
|---|---|---|
| 1 | Bag faithful | Logo, text, colours and artwork unchanged; nothing invented |
| 2 | Material | Matte stays matte, kraft stays kraft |
| 3 | Orientation | Upright, front-on, turned slightly left |
| 4 | Scale | The bag is 60–70% of the image height, about the same across images |
| 5 | Set | The background matches the plate; no new props, cups, beans or people |
| 6 | Tabletop | Dark mahogany, bottom 10–15% of the image |
| 7 | Light and shadow | Key light from camera-left, soft contact shadow, no floating |
| 8 | Grade and focus | Warm neutral, bag sharp, background softly blurred |
| 9 | Realism | Looks photographed, not composited |

## Tuning levers (me, in this order)
1. **The image labels in `index.ts`:** how the plate and source are described. This touches the least and leaves your prompt untouched.
2. **Request settings:** the seed, `image_size` (1K or 2K), and whether to send the plate before or after the photo.
3. **Model:** try `gemini-3-pro-image` if fidelity (checks 1–2) misses. It's slower and costs more.
4. **Prompt wording:** only with your sign-off, since it's your locked spec. Each change is one reviewed commit.

After every change I'll tell you which files to paste into the dashboard editor (usually `index.ts`).

## Lock-in
When you're happy:
- Record the final model, settings and prompt commit here.
- Add a `PROMPT_VERSION` note to `index.ts`.
- Decide whether to re-shoot the existing photos under the final version.

## You provide
- The sample photos and the scoring notes.
- A dashboard redeploy after each change.
- The final sign-off.

## Verification
- `run check` and `run build` pass.
- `/library/studio` lists every roast with a photo, and Re-shoot shows "Developing…", then the new result, live.
