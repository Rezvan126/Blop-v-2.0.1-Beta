# Handover Notes

## Current status

Blop v2.0 is a functioning offline-first bill-splitting app. The web version runs in any modern browser. An Android build via Capacitor is ready for debug APK testing.

## Completed work

- Full React + Vite + Zustand + Tailwind CSS v4 frontend
- Offline-first data model (Zustand + localStorage)
- Debt minimization algorithm (reduces number of payments needed to settle up)
- 8 color themes + dark/light/auto mode
- Create, view, and archive split groups
- Add expenses with equal, exact, percentage, and share-based splits
- Settlement recording with overpayment protection
- Activity log per split
- Spending insights at group and global level
- Export/restore JSON backup (web download + Android share sheet)
- Firebase cloud sync (optional, anonymous auth, Firestore)
- Invite system (invite code or URL, safe arrayUnion join)
- Capacitor integration for Android (StatusBar, Haptics, Share, Filesystem)
- Safe area handling for Android gesture and 3-button navigation
- React Error Boundary to prevent full-app crashes from single component errors

## Pending owner actions

- [ ] Set up Firebase project and add env vars if cloud sync is required
- [ ] Generate Android signing keystore for Play Store release
- [ ] Create Google Play developer account and app listing
- [ ] Write store description, screenshots, and feature graphic
- [ ] Complete Play Store Data Safety section
- [ ] Host privacy policy at a public URL
- [ ] Test release AAB end-to-end on a real Android device
- [ ] Decide on iOS timeline

## Android release status

Debug APK can be built with `./gradlew assembleDebug`. Release AAB requires owner-provided signing credentials. See `docs/ANDROID_RELEASE.md`.

## Next phase: iOS

iOS requires Xcode, Apple Developer account, and provisioning profiles. Capacitor supports iOS — the native shell work is the remaining step.
