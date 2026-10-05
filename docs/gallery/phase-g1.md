# Phase G1 — Photo storage, upload and gallery tiles

**Status:** ✅ Done — checked in the app

## Goal
Prove **upload → store → display** end to end with the original photo, before any AI is involved. In G2, the studio version replaces the original wherever it's shown.

## Database: `supabase/migrations/007_roast_photos.sql` (you run it)
- **Bucket:** creates a public `roast-photos` bucket. Public URLs are readable without signing in, but the bucket can't be listed.
- **Storage policy:** linked bros (`current_bro_id() is not null`) can **insert** into `roast-photos`. There's no update or delete: every upload has a new, timestamped path.
- **Column:** adds `roasts.photo_original_path text`.
- **Updating roasts:**
  - Roasts had no update policy until now. This adds one for any linked bro.
  - The `update` grant is narrowed to the `photo_original_path` column alone, so bros still can't rename or edit roasts from the app.

## App
- **`src/features/library/photos.ts`:**
  - `uploadRoastPhoto(roastId, file)` uploads to `{roast_id}/original-{timestamp}.{ext}`, then saves the path on the roast.
  - `roastPhotoUrl(roast)` returns the public URL or null. G2 will make it prefer the studio photo.
- **`PhotoPicker`:**
  - A file input (`accept="image/*"`, so iOS offers the camera or photo library), styled as a ghost button.
  - Once a photo is picked, it shows a small preview.
- **`AddRoastForm`:** an optional "Bag photo" picker. If a photo was picked, it's uploaded after the roast is created.
- **`RoastPhoto`:** shows the 4:5 photo, or a quiet placeholder (the roast's initial on a raised surface) when there isn't one.
- **`Tile`:**
  - New optional `media` slot, drawn edge to edge across the top. The text body keeps today's padding.
  - Roast tiles always pass `RoastPhoto`, so every roast tile in a grid is the same shape and the mosaic reads as a gallery. Roaster tiles are unchanged.
- **`RoastPage`:**
  - With a photo: a centred hero image above the header, with a "Replace photo" text button.
  - Without one: an "Add bag photo" button.
  - Either way, the page reloads after the upload.

## Out of scope (G2 and Follow-ups)
- The studio transform, processing state and Realtime refresh (G2).
- Compression, HEIC conversion, and removing old files after a replace (Follow-ups).

## You provide
- Run `007_roast_photos.sql` in the SQL editor before using the new build. Without it, uploads fail.

## Verification
- `run check` and `run build` pass.
- **Adding a roast** with a photo: it's in Storage under `{roast_id}/`, and the tile and roast page show it.
- **Adding a roast** without a photo: the tile shows the placeholder.
- **Replacing a photo** from the roast page: the new photo shows straight away, with no stale cache.
- **Tiles** in a mixed grid (photo and no photo) line up.
