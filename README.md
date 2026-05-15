# Blop v2.0 — Split Beautifully

Blop is a modern, offline-first bill-splitting application designed for trips, roommates, and friend groups. It simplifies shared expenses with a premium user interface, real-time synchronization, and intelligent debt minimization.

## Key Features

- **Offline-First Architecture:** Full functionality without an internet connection, using local persistence.
- **Dynamic Group Splitting:** Create dedicated spaces for different contexts (trips, households, events).
- **Flexible Math:** Supports equal splits, exact amounts, percentages, and shares.
- **Debt Minimization:** An intelligent algorithm that reduces the number of payments needed to square up.
- **Activity Timeline:** A comprehensive log of all changes and transactions within a group.
- **Spending Insights:** Visual breakdowns by category and member to track group health.
- **Cross-Platform:** Works as a PWA and as a native mobile application via Capacitor.

## Technology Stack

- **Frontend:** React 19 + Vite 6
- **State Management:** Zustand 5 (with persistent local storage)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Animation:** Framer Motion 12
- **Data Persistence:** IndexedDB (via Firestore offline cache)
- **Mobile Bridge:** Capacitor 6

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or pnpm

### Installation

Navigate to the `artifacts/blop` directory and install dependencies:

```bash
cd artifacts/blop
npm install
```

### Environment Configuration

Create a `.env` file in the `artifacts/blop` directory with your Firebase credentials:

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
npm run dev
```

The application will be available at `http://localhost:5173`.

## Android Development

### Building for Android

1. Generate the web build:
   ```bash
   npm run build
   ```
2. Sync with the Android project:
   ```bash
   npx cap sync android
   ```
3. Open in Android Studio:
   ```bash
   npx cap open android
   ```

### APK Testing

A debug APK is provided for internal testing. Refer to the [Testing Checklist](docs/TESTING_CHECKLIST.md) for a list of core flows to verify on-device.

## Firebase Integration

Blop uses Firebase for optional cloud synchronization. To enable sync:

1. Enable **Anonymous Authentication** in your Firebase console.
2. Enable **Cloud Firestore** in production mode.
3. Deploy the security rules found in `firestore.rules`.
4. Update your `.env` file with the project credentials.

Detailed instructions can be found in [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md).

## Project Documentation

- [Handover Notes](docs/HANDOVER_NOTES.md)
- [Testing Checklist](docs/TESTING_CHECKLIST.md)
- [Firebase Setup Guide](docs/FIREBASE_SETUP.md)
- [Known Limitations](docs/KNOWN_LIMITATIONS.md)
