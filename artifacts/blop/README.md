# Blop — Split Beautifully

A modern, offline-first bill-splitting app for trips, roommates, and friend groups.

## Features

- Create split groups for trips, households, or events
- Add expenses with equal, exact, percentage, or share-based splits
- Intelligent debt minimization — reduces the number of payments needed to settle up
- Activity timeline and spending insights per split
- Settlement flow with smart payment suggestions
- 8 color themes with dark, light, and auto modes
- Optional Firebase cloud sync (offline-first by default)
- Export/restore local data backup
- Android app via Capacitor

## Tech stack

- React 19 + Vite 7
- Tailwind CSS v4 + shadcn/ui
- Zustand (offline-first state + localStorage persistence)
- Framer Motion
- Firebase Firestore (optional cloud sync)
- Capacitor 8 (Android)
- Wouter (routing)

## Setup

Install dependencies:

```bash
pnpm install
```

Copy the environment file:

```bash
cp .env.example .env
```

Fill in Firebase values if cloud sync is needed (the app works fully offline without them).

## Run

```bash
pnpm --filter @workspace/blop run dev
```

## Build

```bash
pnpm --filter @workspace/blop run build
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | No | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | No | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | No | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | No | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | No | Firebase app ID |
| `VITE_SEED_DATA` | No | Set to `true` to load demo data (default: `false`) |

Without Firebase variables, the app runs in offline-only mode.

## Android

See `docs/ANDROID_RELEASE.md` for the full Android build guide.

Quick steps:

```bash
pnpm --filter @workspace/blop run build
cd artifacts/blop && npx cap sync android
cd android && ./gradlew assembleDebug
```

## Documentation

- `docs/FIREBASE_SETUP.md` — Firebase project setup and Firestore rules
- `docs/ANDROID_RELEASE.md` — Android debug APK and release AAB
- `docs/TESTING_CHECKLIST.md` — Manual QA checklist for all flows
- `docs/KNOWN_LIMITATIONS.md` — Current limitations and future work
- `docs/PLAY_STORE_SUBMISSION.md` — Google Play submission checklist
- `docs/HANDOVER_NOTES.md` — Status summary and owner action items
