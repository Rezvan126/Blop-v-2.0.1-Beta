# Firebase Setup

Blop uses Firebase for optional cloud sync. The app works fully offline without it.

## Services needed

- **Authentication** — Anonymous Auth only (no email or social login required)
- **Firestore** — document database for group/expense/settlement data

## Steps

### 1. Create a Firebase project

Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project.

### 2. Enable Anonymous Authentication

Firebase console → Authentication → Sign-in method → Anonymous → Enable

### 3. Enable Firestore

Firebase console → Firestore Database → Create database → Start in production mode → choose a region.

### 4. Deploy Firestore rules

Copy the `firestore.rules` file from the project root and deploy it:

```bash
firebase deploy --only firestore:rules
```

Or paste the rules directly in Firebase console → Firestore → Rules.

### 5. Add environment variables

Copy `.env.example` to `.env` and fill in the values from Firebase console → Project settings → Your apps → Web app config:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### 6. Run the app

The app detects Firebase config at startup. With valid env vars, cloud sync is enabled automatically. Without them, the app runs in offline-only mode.

## Invite flow

- A split owner generates an invite code (6-character alphanumeric).
- The code is written to `invites/{code}` in Firestore.
- Anyone who pastes the code or URL joins via anonymous auth and is added to the group's `memberUids` using `arrayUnion` (safe, non-destructive).
- The inviting owner's `memberUids` entry is never removed.

## Security rules summary

- Group data is only readable by members listed in `memberUids`.
- Invite metadata (`invites/{code}`) is publicly readable so the join flow works before membership.
- Only authenticated users can write data.

## Testing rules with the emulator

```bash
firebase emulators:start --only firestore
```

Then run rule tests from the `firestore-tests/` directory if present, or use the Firestore emulator UI at `localhost:4000`.
