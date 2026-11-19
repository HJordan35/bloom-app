# Phase M4 — Photos and sharing

**Status:** ✅ Done (4d7758a)

## Goal
Post a photo, or share a recipe or brew, on the board. Each shows small: a thumbnail you tap to see full screen, or a one-line link.

## Pieces
- **Migration `024_message_photos.sql`:**
  - A public `message-photos` bucket, the same pattern as `roast-photos`. It can't be listed, and images load by URL.
  - Every photo is stored under its bro's id (`<bro id>/<uuid>.jpg`). A bro can upload, and delete, only in their own folder.
- **`src/lib/resizeImage.ts`:**
  - **Output:** a JPEG at quality 0.82, at most 1600px on the long edge, with the camera's rotation applied. It returns the width and height, so the thumbnail can take its shape before the image loads.
  - **GIFs** become still images. GIF support is a follow-up.
- **API:**
  - **Embeds:** messages load with their shared item, using the same joins as a brew (`recipe:preferred_recipes(…)` and `brew:brews(…)`).
  - **Sending:** a message can be just a photo or just a shared item, so the body may be empty.
  - **Deleting** a message also removes its photo.
- **Composer:**
  - **Attaching:** a quiet `+` before the box reveals `Photo · Recipe`. It's hidden while you're editing.
  - **Photo:** the system picker (camera or library).
  - **Recipe:** opens **`ShareSheet`**, the shared `BrowseList`, starting on your recipes, with a Brews toggle. Tapping a recipe or brew attaches it.
  - **One attachment per message,** shown above the box as a small chip with ×: a photo thumbnail, or "Recipe · V60 · Guji".
  - **Sending:** the photo is resized and uploaded first, so Send reads "Sending…" until it's done.
- **Bubble:**
  - **Photo:** sits above the text as a thumbnail, at most 160px, keeping its shape, with a hairline edge. Tapping it opens **`Lightbox`**: the full image on near-black, closed by a tap or Esc.
  - **Shared item:** a line inside the bubble. A faint mono `RECIPE` or `BREW` comes first, then "V60 · Guji — Onyx", with "· Sam's" when it isn't the sender's own. If the bubble also has text, a hairline separates them.
  - **Tapping the shared item:**
    - A recipe opens **`PreferredRecipeViewer`**. It's extracted from `BrowsePage`, which now uses it too, and keeps Use recipe, Save as mine, and Edit and Delete for your own.
    - A brew opens `/brews/:id`.
  - **Long-press:** works anywhere on the message, photo included. The tap that ends a long-press doesn't also open the photo.

## You provide
- Run `024_message_photos.sql`.

## Verification
- `npm run build` and `npm run check` pass.
- **Photos:**
  - A phone photo sends as a small thumbnail, the right way up, and opens and closes in the lightbox.
  - A photo with text shows both.
  - Deleting it removes the file from Storage → message-photos.
- **Sharing:**
  - Sharing one of your recipes shows a one-line link that opens the recipe sheet. Use recipe starts a brew from it.
  - A brew opens its page.
  - Another bro's shared recipe offers Save as mine.
- **The Recipes tab** still opens, edits and deletes recipes as before.
