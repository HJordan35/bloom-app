# Roast Gallery — Plan

When a bro adds a roast, they can attach a photo of the bag. An AI step re-shoots it as a standardised studio photograph, so the Library's roast mosaic looks like a curated gallery rather than a list of cards.

This plan stands on its own. `docs/PLAN.md` covers the original build and isn't needed here.

**Principles:**
- Happy path only, no tests, minimal abstraction.
- The goal is a working **upload → transform → display** loop with outcomes that are as repeatable as we can make them.
- Every edge case goes to [Follow-ups](#follow-ups), to be picked up once the MVP is trusted.

## Status

| Phase | Scope | Status | Plan |
|---|---|---|---|
| G1 | Photo storage, upload and gallery tiles (original photo) | ✅ Done | [phase-g1.md](phase-g1.md) |
| G2 | Studio transform: Edge Function, background task, Gemini | ✅ Done | [phase-g2.md](phase-g2.md) |
| G3 | Consistency calibration: tune on real bags, lock settings | ⏸ Deferred (see Follow-ups) | [phase-g3.md](phase-g3.md) |

Each phase gets its own plan in `docs/gallery/` before it's built, and ends with a checkpoint review.

## How it works

```
Bro picks a photo ──► Storage: roast-photos/{roast_id}/original-{ts}.jpg
        │
        └──► Edge Function `studio-photo` { roast_id }
                ├─ marks roast photo_status = 'processing', replies 202 at once
                └─ background task (EdgeRuntime.waitUntil):
                     download original → Gemini (locked prompt + studio plate + bag photo)
                     → upload roast-photos/{roast_id}/studio-{ts}.png
                     → roast.photo_path = studio path, photo_status = 'ready'
                                    │
Library / Roast page ◄── Realtime on `roasts` (already published) ──┘
```

- **The client** only uploads the original and calls the function. It never writes the studio image or the status.
- **The function** does every write to `roasts` with the service-role key, which Supabase injects into Edge Functions automatically. No new RLS update policy is needed on `roasts`.
- **Display** prefers the studio photo, then the original (shown with a "developing" treatment while processing), then today's text tile.

## Decisions (proposed, confirm at each phase)

- **Storage:**
  - One bucket, `roast-photos`, holding both the original and the studio version (as requested).
  - **Public read, signed-in write.** These are photos of coffee bags, and a public bucket means a plain `<img src>` with no signed-URL calls on every Library load. Uploads still need a signed-in bro via storage policies. ✅ Confirmed.
  - **Scraping:** no anonymous listing policy, so the bucket can't be browsed. File paths (roast uuid + timestamp) can't be guessed and only appear in data that needs a sign-in. The worst case is someone who already has a URL re-downloading it, which costs egress quota (served via Supabase's CDN). Fallback if that ever happens: a private bucket with signed URLs (Follow-ups).
- **File names:** each upload gets a timestamp in its file name, so replacing a photo never serves a stale cached image.
- **Data:** new nullable columns on `roasts`, with no new table (one photo per roast):
  - `photo_original_path`: added in G1.
  - `photo_path`: the studio version, added in G2.
  - `photo_status`: `processing` | `ready` | `failed`, added in G2.
- **Who can add photos:** any bro, to any roast. This happens when adding a roast, or from the roast page for existing roasts. A new upload replaces the current photo.
- **Prompt:** ✅ Confirmed. The locked studio spec lives in git at `supabase/functions/studio-photo/prompt.ts` and is read by the function. Changing it is a reviewed code change, never an edit made at runtime.
- **Model:** `gemini-3.1-flash-image`, called from the Edge Function with a plain `fetch` to the Gemini Interactions API (no SDK).
  - Settings are pinned in code: the model id, a 4:5 aspect ratio at 1K, and seed 1. The image API has no temperature setting.
  - The exact model id and parameters will be confirmed against Google's docs in G2.
- **Repeatability:** image generation can't be made fully deterministic, even with fixed settings.
  - Consistency comes from the locked prompt, the pinned settings, and a **studio plate**: a fixed photo of the empty set, sent with every bag as the background reference. ✅ Confirmed — included from G2, not left for G3.
  - The plate is committed at `supabase/functions/studio-photo/studio-plate.png`, next to the prompt, so changes to it are reviewed too. The function reads its copy from Storage (`roast-photos/_studio/studio-plate.png`).
  - G3 measures how consistent the results are on real bags before we call it done.

## Phases

### G1 — Photo storage, upload and gallery tiles
Proves the whole loop end to end, without the AI.
- **Migration `007_roast_photos.sql`:**
  - Creates the `roast-photos` bucket (public).
  - Storage policies: signed-in linked bros can insert.
  - Adds `roasts.photo_original_path`.
- **Upload:**
  - An optional "Bag photo" picker in `AddRoastForm` (`accept="image/*"`, so iOS offers the camera or library).
  - Uploads after the roast is created, then saves the path.
  - An "Add photo" / "Replace photo" action on `RoastPage`.
- **Gallery tile:**
  - Roast tiles with a photo get a 4:5 image on top, with the name, rating dots and footer underneath.
  - Tiles without a photo stay exactly as they are today.
  - The same `Tile` component handles both, via an optional `image` prop.
- **Roast page:** the photo as a hero image above the header.
- **You provide:** run migration 007.

### G2 — Studio transform
- **Migration `008_studio_photos.sql`:** adds `roasts.photo_path` and `roasts.photo_status`.
- **Edge Function `supabase/functions/studio-photo/`:**
  - Verifies the caller's JWT (the default).
  - Sets the status to `processing` and returns 202.
  - Runs the background task described under How it works. On any error it sets `failed`, and that's all.
- **Client:**
  - After the original uploads, call the function with `supabase.functions.invoke`.
  - Tiles and the roast page show the studio photo once it's `ready`. Realtime already pushes the `roasts` update.
  - While `processing`, show the original dimmed with a quiet "Developing…" label.
- **Gemini request:** the prompt, then the studio plate (labelled as the fixed set), then the bag photo (labelled as the product to preserve).
- **You provide:**
  - ✅ The studio plate (`studio-plate.png`). Still to do: upload a copy to Storage.
  - A Gemini API key (Google AI Studio; image models may need billing enabled), stored with `supabase secrets set GEMINI_API_KEY=…`.
  - Deploy the function: `npx supabase functions deploy studio-photo`, or through the dashboard editor.
  - Run migration 008.

### G3 — Consistency calibration
- Run 5–8 real bags through the pipeline: varied phones, lighting and angles, including one awkward shot.
- Lay the results out side by side and check them against the spec: orientation, scale (60–70% of height), tabletop, lighting, and that the packaging text is untouched.
- **Tuning levers, in order:**
  1. Tighten the prompt wording.
  2. Pin the model and its parameters.
  3. Adjust how the studio plate is described and weighted in the prompt, or swap in a better plate.
- Lock the final prompt and settings, and record the before/after in `phase-g3.md`.
- **You provide:** the sample bag photos, and the final say on what looks "right".

## Needs from you before G2
✅ Both received: the studio plate, and the full prompt (committed word for word in `supabase/functions/studio-photo/prompt.ts`).

## Current state (MVP shipped)
- **Live:** photo upload (Add roast form and roast page), Gemini studio re-shoot in the background, a "Developing…" state, gallery tiles, and the roast page hero.
- **Migrations:** `007_roast_photos.sql` and `008_studio_photos.sql`, both run.
- **Edge Function:** `studio-photo`, deployed **through the dashboard editor**. It runs with JWT verification off; the function checks the caller itself.
  - The source is `supabase/functions/studio-photo/`.
  - Any change to `index.ts` or `prompt.ts` has to be pasted into the dashboard again, or deployed with the CLI.
- **Storage** (`roast-photos`, public read):
  - Originals and studio versions live at `{roast_id}/original-{ts}.*` and `{roast_id}/studio-{ts}.jpg`.
  - The plate lives at `_studio/studio-plate.png`; the git copy is the master.
- **Secrets:** `GEMINI_API_KEY`, in Edge Functions → Secrets.

## Follow-ups
Deliberately left out of the MVP. They're listed roughly in the order they're likely to matter, and each says where to start.

### Likely soon
1. **Compression:**
   - Downscale and re-encode the original in the browser before uploading (canvas → JPEG, about 1600 px on the long edge).
   - Optionally, save a smaller tile-sized copy of the studio image too.
   - **Why:** tiles download full-size phone photos, and very large or HEIC files are the most likely thing to break the happy path.
   - **Start in:** `uploadRoastPhoto` in `src/features/library/photos.ts`.
2. **Retry / regenerate:**
   - A "Re-shoot" action on the roast page for `failed` or disappointing results. It's just another call to `studio-photo` with `{ roast_id }`, since the original is already stored.
   - Automatic retry of transient Gemini errors inside the function.
   - **Start in:** `photos.ts` (pull the `functions.invoke` call out into its own function) and `RoastPage.tsx`.
3. **Stuck jobs:**
   - Rows stuck in `processing` (the function was killed or timed out) never recover.
   - **Fix:** treat `processing` older than about 5 minutes as `failed`, either in `roastPhoto()` on the client or with a scheduled SQL update.
4. **Consistency calibration (deferred G3):**
   - The procedure, checklist and tuning levers are in [phase-g3.md](phase-g3.md).
   - The side-by-side "Studio check" page with a Re-shoot button was built and then removed to keep the code lean. Restore it from commit `d901ec6` (`src/features/library/StudioCheckPage.tsx` plus its route).

### Later
5. **Purging originals:**
   - Delete originals once the studio version is accepted, or after N days.
   - Photos that were replaced leave both their files in storage. Clean them up by listing `{roast_id}/` and keeping only the paths the roast still references.
6. **Fidelity check:** a second model pass that compares the label text on the original and the studio image, and flags drift.
7. **Validation:** reject photos that aren't a coffee bag (one cheap model call before the re-shoot).
8. **Cost guard:** a per-bro daily limit on `studio-photo` calls.
9. **Ownership rules:** today any bro can replace any roast's photo. Decide whether only the roast's creator should.
10. **Several photos per roast:** front and back, or a carousel. This needs a `roast_photos` table in place of the columns on `roasts`.
11. **Roaster imagery:** logos or a hero image on roaster tiles.
12. **Private bucket:** switch to signed URLs if photos ever need to stay private. See the scraping note under Decisions.
13. **Function deploys in git:** deploy with the CLI (`npx supabase functions deploy studio-photo --no-verify-jwt`) so the deployed code can't drift from the repo.
