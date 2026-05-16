# Blop v2.0 Handover Notes

Welcome to the Blop v2.0 repository. This project is a professional-grade, offline-first bill-splitting application built with React, Vite, and Capacitor.

## Project Vision
Blop is designed to be a "minimalist fintech" tool. It prioritizes privacy, speed, and reliability. It works entirely offline, with optional cloud sync for shared splits.

## Technical Architecture
- **Frontend**: React 19 + Vite 6 + Tailwind CSS 4.
- **State Management**: Zustand with persistent middleware (local storage).
- **Mobile Foundation**: Capacitor 8.
- **Backend (Optional)**: Firebase (Auth & Firestore) for real-time synchronization.
- **Design System**: Custom-built minimal fintech UI with a focus on typography and subtle interactions.

## Key Features
- **Offline-First**: All data is stored locally. No account required.
- **Split Sync**: Real-time synchronization for shared splits via invite codes.
- **Flexible Splitting**: Support for equal, exact, percentage, and shares-based splits.
- **Rich Exports**: Export splits as CSV or professional PDF reports.
- **Modern UI**: Dark/Light mode support, curated color themes, and haptic feedback.

## Repository Status
- **Android**: Release-candidate ready. Sync and build verified.
- **iOS**: Infrastructure present (Capacitor), but build/signing remains a future phase.
- **Web/PWA**: Fully functional. Can be deployed to any static hosting.

## Next Steps for the Team
1. **Firebase Configuration**: Provide production `google-services.json` and configure Firestore rules.
2. **Android Signing**: Set up Keystores for Play Store submission (see `docs/ANDROID_RELEASE.md`).
3. **App Store Assets**: Prepare final screenshots and marketing copy.
4. **Monitoring**: Consider adding Sentry or Firebase Crashlytics for production tracking.

---
*Last Updated: May 2026*
