# Blop v2.0 — Split Beautifully

A modern, offline-first bill-splitting app for trips, roommates, and friend groups. Built with React, Vite, Tailwind CSS, Zustand, and Firebase. Ships to Android via Capacitor.

## What it does

- Create split groups for trips, households, or events
- Add expenses with equal, exact, percentage, or share-based splits
- Smart debt minimization reduces the number of payments needed to settle up
- Activity timeline, per-category insights, and group-level spending breakdowns
- Settlement flow with overpayment protection
- Export and restore backup files (JSON)
- Optional cloud sync via Firebase Firestore (anonymous auth)
- Multi-theme UI (8 color themes + light/dark/auto)

## Tech stack

- **Frontend:** React 19, Vite 7, TypeScript 5.9, Tailwind CSS v4, shadcn/ui
- **State:** Zustand 5 with localStorage persistence
- **Sync:** Firebase Firestore (optional; app works offline without it)
- **Animation:** Framer Motion 12
- **Mobile:** Capacitor 8 (web-first; native plugins loaded dynamically)
- **Router:** Wouter

## Project structure

```
artifacts/blop/
├── src/
│   ├── pages/           # Screens (home, group-dashboard, settlement, settings, ...)
│   ├── components/      # UI components and design system (ds.tsx)
│   ├── lib/             # Store, calculations, sync engine, Firebase init
│   ├── contexts/        # Theme provider
│   └── App.tsx          # Root component with router and ErrorBoundary
├── docs/                # Setup, release, and handover documentation
├── public/              # Static assets
├── index.html
├── vite.config.ts
└── package.json
```

## Local setup

```bash
pnpm install
cp artifacts/blop/.env.example artifacts/blop/.env   # optional, for Firebase
pnpm --filter @workspace/blop run dev
```

## Environment variables

All Firebase variables are optional. Without them, the app runs in offline-only mode.

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_SEED_DATA=false
```

See `artifacts/blop/docs/FIREBASE_SETUP.md` for the full Firebase setup guide.

## Build commands

```bash
pnpm --filter @workspace/blop run typecheck   # TypeScript check
pnpm --filter @workspace/blop run build       # Production web build → dist/public
pnpm run typecheck                            # Workspace-wide typecheck
```

## Android build

```bash
cd artifacts/blop
npx cap sync android
cd android && ./gradlew assembleDebug          # Debug APK
cd android && ./gradlew bundleRelease          # Release AAB (requires signing keystore)
```

See `artifacts/blop/docs/ANDROID_RELEASE.md` for full Android instructions and `artifacts/blop/docs/PLAY_STORE_SUBMISSION.md` for Play Store checklist.

## Documentation

Full handover and release documentation lives in `artifacts/blop/docs/`:

- `FIREBASE_SETUP.md` — Firebase project, Auth, Firestore rules, env vars
- `ANDROID_RELEASE.md` — Capacitor sync, debug APK, release AAB
- `TESTING_CHECKLIST.md` — Full A-to-Z manual test checklist
- `KNOWN_LIMITATIONS.md` — Receipts local-only, no push notifications, etc.
- `PRIVACY_NOTES.md` — Source of truth for in-app privacy and Play Data Safety
- `PLAY_STORE_SUBMISSION.md` — Google Play submission checklist
- `HANDOVER_NOTES.md` — Status, completed work, owner action items

## Known limitations

- Receipts are stored locally; they do not sync across devices.
- Push notifications are not implemented.
- Live currency exchange rates are not implemented.
- iOS build is not started; Android is the current target.
- Release AAB signing requires the owner's keystore credentials.

## License

Proprietary. All rights reserved.
