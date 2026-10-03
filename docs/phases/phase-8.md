# Phase 8 — Home-Screen App (PWA)

**Status:** ✅ Built

## Goal
"Add to Home Screen" gives a proper Bloom icon that opens full screen with no browser bars, and you stay signed in.

## What was added
- **`public/manifest.webmanifest`:**
  - name and short name "Bloom"
  - `display: standalone`, portrait
  - espresso-black theme and background colours
  - icons
- **`public/icons/`:** a brass Playfair "B" monogram with a thin rule on espresso black.
  - `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `favicon-64.png`
  - `icon-maskable-512.png` (padded for Android's shaped icons)
  - Rendered from HTML with headless Chrome at 512px and scaled down with `sips`.
- **`index.html`:** links to the manifest, Apple touch icon and favicon, plus the home-screen title.
  - The existing `viewport-fit=cover` and safe-area padding already handle the notch.

## Deliberately skipped
- **Service worker / offline cache:** every screen needs live Supabase data, so offline adds little.
  - iOS never needed a service worker for home-screen apps.
  - Android Chrome no longer requires one to install.

## Verification
- `run build` copies the manifest and icons into `dist/`.
- `vite preview` serves them with status 200, and the manifest is valid JSON.
- **On a phone:**
  - **iPhone:** Safari → Share → Add to Home Screen.
  - **Android:** Chrome → menu → Install app.
  - Check that the icon and name look right and the app opens full screen.
