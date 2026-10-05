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
| G1 | Photo storage, upload and gallery tiles (original photo) | Not started | `phase-g1.md` (written before building) |
| G2 | Studio transform: Edge Function, background task, Gemini | Not started | `phase-g2.md` |
| G3 | Consistency calibration: tune on real bags, lock settings | Not started | `phase-g3.md` |

Each phase gets its own plan in `docs/gallery/` before it's built, and ends with a checkpoint review.

## How it works

```
Bro picks a photo ──► Storage: roast-photos/{roast_id}/original-{ts}.jpg
        │
        └──► Edge Function `studio-photo` { roast_id }
                ├─ marks roast photo_status = 'processing', replies 202 at once
                └─ background task (EdgeRuntime.waitUntil):
                     download original → Gemini (locked prompt + image)
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
  - **Public read, signed-in write.** These are photos of coffee bags, and a public bucket means a plain `<img src>` with no signed-URL calls on every Library load. Uploads still need a signed-in bro via storage policies.
- **File names:** each upload gets a timestamp in its file name, so replacing a photo never serves a stale cached image.
- **Data:** new nullable columns on `roasts`, with no new table (one photo per roast):
  - `photo_original_path`: added in G1.
  - `photo_path`: the studio version, added in G2.
  - `photo_status`: `processing` | `ready` | `failed`, added in G2.
- **Who can add photos:** any bro, to any roast. This happens when adding a roast, or from the roast page for existing roasts. A new upload replaces the current photo.
- **Prompt:** the locked studio spec lives in git at `supabase/functions/studio-photo/prompt.md` and is read by the function. Changing it is a reviewed code change, never an edit made at runtime.
- **Model:** Gemini 3.1 Flash Image, called from the Edge Function with a plain `fetch` to the Gemini REST API (no SDK).
  - Settings are pinned in code: the model id, a 4:5 aspect ratio, temperature 0, and a fixed seed if the API supports one.
  - The exact model id and parameters will be confirmed against Google's docs in G2.
- **Repeatability:** image generation can't be made fully deterministic, even with fixed settings.
  - Consistency comes from the locked prompt and pinned settings, and possibly a reference "studio plate" image (see G3).
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
- **You provide:**
  - A Gemini API key (Google AI Studio; image models may need billing enabled), stored with `supabase secrets set GEMINI_API_KEY=…`.
  - Deploy the function: `npx supabase functions deploy studio-photo`, or through the dashboard editor.
  - Run migration 008.

### G3 — Consistency calibration
- Run 5–8 real bags through the pipeline: varied phones, lighting and angles, including one awkward shot.
- Lay the results out side by side and check them against the spec: orientation, scale (60–70% of height), tabletop, lighting, and that the packaging text is untouched.
- **Tuning levers, in order:**
  1. Tighten the prompt wording.
  2. Pin the model and its parameters.
  3. Add a fixed reference "studio plate" image (an empty set photo sent alongside each bag) so the background stops drifting.
- Lock the final prompt and settings, and record the before/after in `phase-g3.md`.
- **You provide:** the sample bag photos, and the final say on what looks "right".

## Needs from you before G2
- **The full prompt.** The pasted spec cuts off in section 15 ("Use natural optical depth of fie…"). Please send the complete text; it will be committed as-is to `prompt.md`.

## Follow-ups
Deliberately left out of the MVP:
- **Retry / regenerate:**
  - A "Re-shoot" button for failed or unsatisfying results.
  - Automatic retry on transient Gemini errors.
- **Stuck jobs:** reset `processing` rows older than N minutes to `failed`.
- **Fidelity check:** a second model pass that compares the label text on the original and the studio image, and flags drift.
- **Compression:**
  - Downscale and re-encode the original in the browser before uploading.
  - Serve smaller WebP or thumbnail versions for tiles.
  - Note: very large or HEIC phone photos are the most likely thing to break the happy path, so this may get pulled forward.
- **Original purging:** delete originals once the studio version is accepted, or after N days. Old files from replaced photos are also left in storage until then.
- **Moderation / validation:** reject photos that aren't a coffee bag.
- **Several photos per roast:** front and back, or a carousel.
- **Ownership rules:** decide whether only the roast's creator can replace its photo.
- **Cost guard:** a rate limit per bro per day.
- **Roaster imagery:** logos or a hero image on roaster tiles.
- **Private bucket:** switch to signed URLs if the photos ever need to stay private.
