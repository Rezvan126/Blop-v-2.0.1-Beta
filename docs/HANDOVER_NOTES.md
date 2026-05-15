# Handover Notes — Blop v2.0

## Project Status: Beta-Ready (Android APK Generated)

The application has reached a stable state suitable for internal testing and private beta. All core bill-splitting features are functional, and the synchronization engine has been hardened against data loss.

### What is Complete
- **Core Engine**: Full support for group creation, expense management, and settlement tracking.
- **Advanced Splitting**: Equal, exact, percentage, and shares-based splitting logic.
- **Sync System**: Firestore-backed real-time synchronization with offline persistence.
- **Premium UI**: 8 themes, 3 modes (Light/Dark/System), and high-fidelity animations.
- **Android Port**: Capacitor integration with adaptive icons, splash screen, and successfully compiled debug APK.
- **Data Integrity**: Listeners fixed to ignore temporary cache evictions; non-destructive snapshot merging implemented.

### Pending / Deferred
- **Receipt Syncing**: Images are local-only (see `docs/KNOWN_LIMITATIONS.md`).
- **Push Notifications**: UI exists but backend integration is deferred.
- **Live Rates**: Multi-currency conversion is currently 1:1.

### Technical Debt / Cleanup
- **Temporary Scripts**: All `patch_*.cjs` and `fix_*.cjs` files have been removed from the root.
- **Environment**: Root `.gitignore` created to protect local environment variables and build artifacts.
- **Documentation**: Comprehensive guides for Firebase setup, testing, and limitations have been added to the `docs/` folder.

### Next Steps for the Client
1. **Firebase Ownership**: The current project uses a temporary Firebase instance. The client should create their own project and update the `.env` variables (see `docs/FIREBASE_SETUP.md`).
2. **Security Rules**: Deploy the provided `firestore.rules` to the production project.
3. **App Store Assets**: While icons are provided, final branded marketing screenshots will be needed.
4. **Release Signing**: The generated APK is a **Debug** build. For Play Store release, a signing keystore must be configured in `android/app/build.gradle`.

---
*Prepared for final review on 2026-05-15.*
