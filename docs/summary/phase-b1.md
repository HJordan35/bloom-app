# Phase B1 — Showcase image

**Status:** ✅ Done

**Tested before handoff:**
- `month_new_roasts` was run in PGlite against the S2 sample data:
  - A roast first brewed in the month is included.
  - A roast brewed the month before, and again in the month, is excluded.
  - A brew at 11:30pm on the last day (Chicago time) counts in that month.
  - Each month's count equals `monthly_stats`' group `first_tries`.
- The function passes a Deno type check and Biome lint.
- **Not yet run against Gemini.** That's the checkpoint below.

## Goal
For a given month, one studio photograph of the month's **new coffees** standing together, in the same locked studio as the Roast Gallery. "New" means roasts the group brewed for the first time that month.

There's no UI in this phase. The image is checked from its public URL.

## Data: `supabase/migrations/013_showcase.sql`

**`month_new_roasts(p_month date) returns jsonb`**
- Roasts brewed in the month with **no brew by anyone before it**, most brewed first.
- It returns `[{ roast_id, name, roaster, photo_path, brews, volume_ml, bro_ids }]`.
- It uses the same rule and Chicago month bounds as `monthly_stats`' group `first_tries`, so the counts always agree.
- It's built like `monthly_stats`: `language sql stable security invoker`, with execute for `authenticated` and `service_role` only.
- B1 uses it to choose the bags; B2 reuses it for the breakdown.

**`showcase_runs`**
- One row per run: `month`, `status` (`running` · `succeeded` · `skipped` · `failed`), `roast_ids` (in the order sent), `image_path`, `model`, `prompt_version`, `error`, `started_at` and `finished_at`.
- Every run is kept. The month's image is the latest `succeeded` run's, so reruns can be compared while the prompt is tuned.
- RLS: every bro can read. There are no write policies; only the function writes.

## Edge Function: `supabase/functions/showcase/`

| File | Contents |
|---|---|
| `index.ts` | Request handling, run bookkeeping, choosing the bags, the Gemini call and the upload |
| `prompt.ts` | `SHOWCASE_PROMPT` and `PROMPT_VERSION` (`b1-1`) |

**Request:** POST `{ month: "2026-09" }` with header `x-insights-secret: <INSIGHTS_SECRET>`. It's the same secret as `insights`, because S4's cron calls both. JWT verification is off. It replies **202**, and the work runs in `EdgeRuntime.waitUntil`.

**The run:**
1. Insert a `showcase_runs` row.
2. Call `month_new_roasts`. Keep the roasts with a studio photo (`photo_path`), and take the **8 most brewed**.
3. **None left:** the run is `skipped` ("No new roasts with a studio photo").
4. Download the studio plate (`roast-photos/_studio/studio-plate.png`) and each roast's studio photo.
5. **Gemini input:** the prompt, then the labelled plate, then each package labelled `PACKAGE n of N — {name} by {roaster}`.
6. Upload to `roast-photos/_showcase/{month}/showcase-{ts}.jpg`. The bucket is already public-read, so there's no new bucket or policy.
7. Mark the run `succeeded` with the path and roast ids. On any error, mark it `failed` with the message. There's no retry; rerun by hand.

**Gemini:**
- `gemini-3.1-flash-image`, `seed: 1`, the same raw `fetch` to the Interactions API as `studio-photo`.
- **Output:** JPEG, `4:5`, **2K**. Single bags use 1K, but 8 bags at 1K would lose their detail.
- **Limits:** the model supports 1K, 2K and 4K, and keeps up to 10 product references faithful, so 8 bags plus the plate is within limits.

**Why studio photos as the references:**
- The packages have already been photographed in the locked orientation and light, so the model only has to arrange them.
- Roasts with only an original photo are left out, the same as roasts without any photo.

## Prompt (`prompt.ts`)
A group-shot version of the gallery's locked studio spec:
- **Priorities:** product fidelity, then studio consistency, then completeness (every package exactly once, fully visible), then realism, then aesthetic.
- **Product identity rules:** the gallery's rules, condensed. Never redesign, mirror, merge or invent packaging, and keep the package type.
- **Arrangement:**
  - Up to 4 packages stand in one row; 5 or more stand in two staggered rows.
  - Every package keeps the collection's 15° camera-left turn.
  - No package hides another's front panel.
  - Packages keep their real relative sizes.
  - The group fills about 70% of the width, with the most-brewed package at or near the center front.
- **Studio, camera, light, grade, shadows:** the gallery's. The one change is f/5.6 instead of f/4, so every package in the group is sharp.
- **Negatives:** no props, cups, beans, equipment, people, text, captions or borders.

## You provide
1. **Run** `013_showcase.sql` in the SQL editor.
2. **Deploy:** `npx supabase functions deploy showcase --no-verify-jwt --project-ref <ref>`. `INSIGHTS_SECRET` and `GEMINI_API_KEY` are already set.

## Verification
1. **The roasts:** `select jsonb_pretty(month_new_roasts('2026-09-01'));`.
   - The count matches `monthly_stats('2026-09-01')->'totals'->'first_tries'`.
   - The roasts are the ones the group first tried in September.
2. **Run it:**
   ```sh
   curl -X POST https://<ref>.supabase.co/functions/v1/showcase \
     -H "x-insights-secret: $SECRET" -H "content-type: application/json" \
     -d '{"month":"2026-09"}'
   ```
   It returns 202.
3. **The result,** after about a minute: `select status, roast_ids, image_path, error, finished_at - started_at from showcase_runs order by started_at desc;`.
4. **Open the image:** `https://<ref>.supabase.co/storage/v1/object/public/roast-photos/<image_path>`.
5. **Checkpoint review:**
   - Is it the same studio as the gallery photos?
   - Is every package present once, faithful, readable and the right way round?
   - Does the arrangement work at phone size?
   - Tune `prompt.ts` (bumping `PROMPT_VERSION`) and rerun before starting B2.

## Follow-ups
- **More than 8 new roasts:** a second image, or "and N more" in the breakdown.
- **Roasts with only an original photo:** develop them first (call `studio-photo`), or send the original with the gallery's source label.
- **Regenerate from the app:** a button for a bro to rerun the month's showcase.
- **Plate drift:** if the group shot needs a wider set than the single-bag plate, add a wide plate (`_studio/studio-plate-wide.png`).
