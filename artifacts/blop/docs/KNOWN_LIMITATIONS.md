# Known Limitations & Future Roadmap

This document lists current technical limitations and planned improvements for Blop.

## Current Limitations
- **Receipts**: Receipt images are stored as Base64 strings in the database. Large images may impact sync performance. Future versions should use Firebase Storage.
- **Push Notifications**: Not yet implemented. Users must open the app to see group updates in the Activity feed.
- **Currency Rates**: Automatic exchange rate fetching is not yet implemented. All transactions assume a 1:1 rate if multiple currencies are used in a single group.
- **iOS Build**: While Capacitor is configured, the project has not been fully optimized or signed for iOS/App Store.
- **Web App Manifest**: Some PWA features (like background sync) are not fully utilized yet.

## Future Roadmap
- [ ] **Firebase Storage Integration**: Move receipts to cloud storage to reduce database size.
- [ ] **Push Notifications**: Implement FCM for immediate update alerts.
- [ ] **Live Exchange Rates**: Integrate an API (e.g., Fixer.io) for real-time currency conversion.
- [ ] **iOS Optimization**: Finalize UI and splash screens for iPhone/iPad.
- [ ] **Email/Social Login**: Add optional authentication for easier cross-device migration.
- [ ] **Monthly Reports**: Automated PDF generation for recurring splits (e.g., roommates).

---
*Blop is actively evolving. We welcome feedback and contributions.*
