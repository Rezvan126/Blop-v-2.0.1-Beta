# Known Limitations & Roadmap

The following items are recognized limitations of the current Blop v2.0 build and are targeted for future development phases.

## 1. Receipt Storage
Currently, when a user attaches a receipt image to an expense, the image is stored in the browser's local IndexedDB (via the `blop-store-v3` cache). 
- **Limitation:** Receipt images do not sync to the cloud. Only the metadata (expense details) is synced.
- **Next Step:** Integration with Firebase Storage to enable cloud-based receipt syncing.

## 2. Push Notifications
The app does not currently support native or web push notifications.
- **Limitation:** Users are not notified when someone adds an expense or records a payment in a shared group.
- **Next Step:** Implementation of Firebase Cloud Messaging (FCM).

## 3. Live Exchange Rates
Blop supports multiple currencies for group totals, but it does not fetch live exchange rates.
- **Limitation:** Multi-currency groups require a fixed conversion rate or manual input.
- **Next Step:** Integration with a real-time currency API.

## 4. Account Recovery
Blop relies on Anonymous Authentication for zero-friction onboarding.
- **Limitation:** If a user clears their browser data or loses their device without having copied their "Sync Key" from the Settings menu, their data cannot be easily recovered.
- **Next Step:** Optional "Link Account" feature to attach an email or Google account to the anonymous profile.

## 5. Platform Packaging
- **Android:** Capacitor integration is initiated. The next phase will focus on generating signed production APKs/AABs.
- **iOS:** iOS platform support is planned for future phases.
