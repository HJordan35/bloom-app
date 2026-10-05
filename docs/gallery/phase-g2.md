# Phase G2 — Studio transform

**Status:** ✅ Built — needs your setup steps

## Goal
After a bag photo is uploaded, an Edge Function re-shoots it in the locked studio with Gemini. Tiles and the roast page then switch to the studio version by themselves.

## Flow
1. **App:** uploads the original (as in G1), then calls `studio-photo` with `{ roast_id }`.
2. **Function, in the request:**
   - Checks that the caller is a signed-in bro.
   - Sets `photo_status = 'processing'` and replies **202**.
3. **Function, in the background** (`EdgeRuntime.waitUntil`):
   - Downloads the original and the studio plate.
   - Sends both to Gemini with the locked prompt.
   - Uploads `{roast_id}/studio-{ts}.jpg`.
   - Sets `photo_path` and `photo_status = 'ready'`.
   - On any error it sets `failed` and logs the error. There's no retry.
4. **App:** Realtime on `roasts` reloads the Library and the roast page when the status changes.

## Database: `supabase/migrations/008_studio_photos.sql`
- `roasts.photo_path text`: the studio version.
- `roasts.photo_status text`: `processing` | `ready` | `failed`, null when there's no photo.
- The app gets no new write grants. Only the function writes these columns, using the service-role key.

## Edge Function: `supabase/functions/studio-photo/`
- **`prompt.ts`:** the locked studio spec, word for word, as a string constant. A `.ts` file deploys the same way from the CLI or the dashboard editor; a `.md` file would need extra bundling config.
- **`studio-plate.png`:**
  - The copy committed to git is the source of truth.
  - At runtime the function reads it from Storage at `roast-photos/_studio/studio-plate.png`, so the binary isn't bundled into the function.
  - It's 1122 × 1402, about 4:5.
- **`index.ts`:**
  - CORS, auth check, background task.
  - Gemini is called with a plain `fetch` to the **Interactions API**: `POST https://generativelanguage.googleapis.com/v1beta/interactions`. These details were confirmed against Google's docs on 2026-10-05.
- **Pinned settings:**

| Setting | Value |
|---|---|
| Model | `gemini-3.1-flash-image` |
| Output | `response_format`: JPEG, `aspect_ratio: "4:5"`, `image_size: "1K"` |
| Seed | `generation_config.seed: 1` |
| Temperature | The docs give no temperature setting for image output, so it's left out |

- **Request order:**
  1. The locked prompt.
  2. A short label, then the studio plate.
  3. A short label, then the source photo.

  The labels tell Gemini which image is the fixed set and which is the product reference.
- **Output size:** 1K is enough for a phone. That's about 336 CSS px for the roast-page hero at 3× density. It's also faster and cheaper than 2K.
- **Auth:**
  - The function is deployed with `--no-verify-jwt`. It checks the caller itself: it validates the user token with `auth.getUser`, then requires a matching `bros` row.
  - The gateway's built-in JWT check doesn't reliably support projects on the new publishable/secret API keys.

## App
- **`photos.ts`:**
  - `uploadRoastPhoto` now also calls the function.
  - `roastPhoto(roast)` returns `{ url, developing }`. It prefers the studio photo when it's `ready`; otherwise it uses the original.
- **`RoastPhoto`:** while the photo is developing, it shows the original dimmed with a small "Developing…" label.
- **`lib/useLive.ts`:**
  - `useLive(tables, onChange)` pulls out the Realtime subscription the Bros Board already uses.
  - Used by the Bros Board, `LibraryBrowser` and `RoastPage` (on `roasts`).

## You provide
1. **Run** `008_studio_photos.sql`.
2. **Upload the plate:** Storage → `roast-photos` → new folder `_studio` → upload `studio-plate.png`, keeping that exact name.
3. **Set the Gemini key:**
   - Create one in Google AI Studio. Image models need billing enabled.
   - Then either run `npx supabase secrets set GEMINI_API_KEY=… --project-ref <ref>`, or add it in the dashboard under Edge Functions → Secrets.
4. **Deploy the function:**
   - `npx supabase login` once.
   - Then `npx supabase functions deploy studio-photo --no-verify-jwt --project-ref <ref>`.
5. **Deploy the app build.**

## Out of scope
- Retry or regenerate, stuck-job cleanup, compression, and label-fidelity checks: all listed under Follow-ups.
- Tuning the prompt and plate: that's G3.

## Verification
- `run check` and `run build` pass.
- **Uploading a photo:**
  - The tile shows "Developing…" straight away.
  - Within about 30 s it switches to the studio photo with no manual refresh.
  - Both files are in `roast-photos/{roast_id}/`.
- **Replacing a photo:** it goes back to developing, then shows the new studio photo.
- **Without a valid session**, the function replies 401.
- **Failure:** with a broken key, the status becomes `failed`, the original stays visible, and the function logs show the Gemini error.
