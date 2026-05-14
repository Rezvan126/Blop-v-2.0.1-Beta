# Blop v2.0 — Split Beautifully

A modern, offline-first bill-splitting application designed for trips, roommates, and friend groups. Blop simplifies shared expenses with a premium UI, real-time sync, and intelligent debt minimization.

## Key Features

- **Offline-First:** Works anywhere, with or without an internet connection.
- **Group Splitting:** Create dedicated spaces for trips, households, or events.
- **Smart Calculations:** Supports equal, exact amount, percentage, and shares-based splits.
- **Debt Minimization:** Intelligent algorithm reduces the number of payments needed to square up.
- **Activity Log:** Comprehensive timeline of all group activities.
- **Insights:** Visual breakdowns of spending by category and member.
- **PWA Support:** Installable on iOS, Android, and desktop browsers.

## Tech Stack

- **Framework:** React 19 + Vite 6
- **State Management:** Zustand 5 (with persistent local storage)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Animation:** Framer Motion 12
- **Routing:** wouter 3
- **Data Persistence:** IndexedDB (via Firestore offline cache)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+ (recommended) or npm

### Installation

```bash
pnpm install
```

### Environment Setup

Create a `.env` or `.env.local` file in the project root. Refer to `.env.example` for the required variables.

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Running Locally

```bash
pnpm run dev
```

The application will be available at `http://localhost:3000`.

## Firebase Configuration

Blop uses Firebase for optional cloud synchronization. To enable sync:

1. Create a Firebase project.
2. Enable **Anonymous Authentication**.
3. Enable **Cloud Firestore** in production mode.
4. Deploy the Firestore security rules provided in `firestore.rules`.
5. Add your web app credentials to the environment variables.

See [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) for detailed instructions.

## Known Limitations

- Receipt cloud storage is currently local-only.
- Push notifications are scheduled for a future release.
- Live exchange rates are not yet implemented.

---

*Blop v2.0 Handover — Professional Build*
