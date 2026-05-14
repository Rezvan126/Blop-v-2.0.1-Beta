# Blop Logo Asset Package

Source: uploaded Blop logo image.
Background color sampled from source: RGB (3, 191, 158) / Hex #03BF9E

Generated assets:

## PWA / Web
- public/icons/blop-icon-1024.png — 1024x1024, opaque
- public/icons/icon-192.png — 192x192, opaque, purpose any
- public/icons/icon-512.png — 512x512, opaque, purpose any
- public/icons/icon-maskable-192.png — 192x192, opaque, extra padding, purpose maskable
- public/icons/icon-maskable-512.png — 512x512, opaque, extra padding, purpose maskable
- public/icons/blop-logo-transparent.png — 1024x1024, transparent background for splash/settings/onboarding

## Android Prep
- android-prep/android-adaptive-foreground-432.png — 432x432, transparent foreground
- android-prep/android-adaptive-background-432.png — 432x432, solid teal background

## iOS Prep
- ios-prep/ios-icon-1024.png — 1024x1024, opaque, no transparency

## Manifest
Use manifest-icons-snippet.json to update the web app manifest icons array.

Notes:
- Normal icons use logo at ~76% of canvas.
- Maskable icons use logo at ~64% of canvas for cropping safety.
- Android foreground uses logo at ~60% of 432px canvas to remain inside safe area.
