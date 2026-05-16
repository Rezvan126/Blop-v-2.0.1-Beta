# Privacy Notes

This document summarizes how Blop handles user data. It is the source of truth for the in-app Privacy Policy and the Google Play Data Safety form.

## Storage

- **Offline-first.** All app data (splits, members, expenses, settlements, receipts) is stored in the device's local browser storage by default.
- **No account required.** The app works without any sign-up, email, or login.
- **Optional cloud sync.** When Firebase environment variables are configured, the app can sync shared splits via Firestore. Sync is per-split and additive; local data is never overwritten by empty cache snapshots.

## Authentication

- **Anonymous Firebase Auth only.** No email, password, phone, or social login.
- The anonymous UID is generated on first cloud-sync use and stored locally. There is no account recovery.

## Data collected through Firebase (when enabled)

- Split names, member display names, expenses, settlements, and activity entries.
- The user's anonymous Firebase UID.
- Invite codes for joining shared splits.

## Data not collected

- No email, phone number, real name, address, or payment information.
- No location data.
- No advertising identifiers.
- No analytics or behavioral tracking.
- No third-party SDKs beyond Firebase.

## Receipts

- Stored as data URLs in local browser storage only.
- Not uploaded to Firebase or any cloud service.

## Backups

- Export creates a JSON file the user saves locally or shares through the native share sheet.
- Restore parses a backup file the user selects.
- Backup files are never uploaded.

## Data sharing and sale

- Data is not sold to third parties.
- Data is not used for advertising.
- Firebase processes data on behalf of the app under Google's Firebase terms.

## User control

- Reset data clears all local storage.
- Splits can be archived or deleted.
- Cloud-synced data remains in Firestore until the owner removes the split or clears the project (see Handover Notes for owner actions).

## What the Play Console Data Safety form should reflect

- **Data collected:** Anonymous user ID, app activity (splits, expenses, settlements) — only when cloud sync is enabled.
- **Collection optional:** Yes (cloud sync is opt-in via configuration).
- **Encryption in transit:** Yes (HTTPS via Firebase SDK).
- **Data shared with third parties:** No.
- **Data deletion:** User can request deletion by clearing app data or removing the synced split.

The Privacy Policy hosted at a public URL must match these answers exactly.
