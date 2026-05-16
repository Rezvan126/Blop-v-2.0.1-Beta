# Blop v2.0 — Split Beautifully

A modern, offline-first bill-splitting app for trips, roommates, and friend groups. Features intelligent debt minimization, real-time Firebase sync, and a premium UI.

## Run & Operate

- `pnpm --filter @workspace/blop run dev` — run the Blop frontend (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7 + Tailwind CSS v4 + shadcn/ui
- State: Zustand 5 (with localStorage persistence)
- Sync: Firebase Firestore (optional — offline-first with IndexedDB)
- Animation: Framer Motion 12
- Mobile bridge: Capacitor 8 (web-first, dynamic imports)
- Router: Wouter
- API: Express 5 (existing scaffold, not used by Blop frontend)

## Where things live

- `artifacts/blop/src/pages/` — all screens (splash, onboarding, home, group-dashboard, etc.)
- `artifacts/blop/src/lib/store.ts` — Zustand store (source of truth for all app state)
- `artifacts/blop/src/lib/firebase.ts` — Firebase init (optional, gracefully disabled without env vars)
- `artifacts/blop/src/lib/sync-engine.ts` — Firebase sync logic
- `artifacts/blop/src/lib/calculations.ts` — debt minimization algorithm
- `artifacts/blop/src/lib/models.ts` — data model types
- `artifacts/blop/src/contexts/ThemeContext.tsx` — multi-theme (8 color themes + dark/light/system)
- `artifacts/blop/src/components/ui/` — shadcn/ui components

## Architecture decisions

- Offline-first: all data lives in Zustand + localStorage; Firebase sync is optional and additive
- Firebase credentials read from `VITE_FIREBASE_*` env vars; app works without them (offline-only mode)
- Capacitor imports are all dynamic (`await import(...)`) gated by `window.Capacitor` checks — safe on web
- Phone-frame layout: max-width 430px centered, background lavender tint on desktop
- 8 color themes (indigo, forest, cognac, espresso, gold, rose, ocean, obsidian) + dark/light/system modes

## Product

- Create/join split groups for trips, households, or events
- Add expenses with equal, exact, percentage, or share splits
- Intelligent debt minimization reduces the number of payments needed to settle up
- Activity timeline, spending insights, per-category breakdowns
- Settlement flow with smart payment suggestions

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Firebase requires `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` env vars. Without them, the app runs in offline-only mode.
- Capacitor packages (`@capacitor/core`, `@capacitor/status-bar`, `@capacitor/haptics`, `@capacitor/share`) are installed as runtime deps — needed even on web since Vite resolves dynamic imports at build time.
- `formatAmount(amount, symbol)` is defined in `src/lib/utils.ts` (was missing from original repo, added manually).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
