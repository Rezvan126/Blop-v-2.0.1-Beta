# Known Limitations

The following features are currently out of scope or deferred for future releases of Blop v2.0.

## 1. Receipt Cloud Storage
- **Current Behavior**: Receipts are stored locally in the browser/app cache as base64 data URIs or local blob URLs.
- **Limitation**: Receipts do not synchronize between devices. If you join a group on a second device, you will see the expenses but not the attached receipt images.
- **Future Path**: Integration with Firebase Storage is required to sync images across devices.

## 2. Push Notifications
- **Current Behavior**: There is a toggle for "Notifications" in the Settings, but it currently has no effect.
- **Limitation**: The app does not send push notifications for new expenses or settlements.
- **Future Path**: Requires Firebase Cloud Messaging (FCM) integration and a service worker.

## 3. Live Exchange Rates
- **Current Behavior**: The app supports multiple currencies for groups and individual expenses, but the exchange rate is hardcoded to 1:1.
- **Limitation**: All expenses are assumed to be in the same "value" as the group's default currency.
- **Future Path**: Integration with an exchange rate API (e.g., Open Exchange Rates) to support real-time conversion.

## 4. Cross-Device Data Sync
- **Current Behavior**: Users access shared group data via unique invite codes. There is no central "account" to sync all groups at once.
- **Limitation**: The legacy "Sync Key" feature was removed as it was incompatible with the new v2.0 real-time architecture. Cross-device access currently requires joining each group individually using its invite code.
- **Future Path**: Account linking (Email/Google) to persist a single user identity across devices and automatically pull all joined groups.

## 5. Settlement Method Icons
- **Current Behavior**: Settlements show the payment method as a text label (e.g., "Cash", "Bank Transfer").
- **Limitation**: No visual icons are displayed for different payment methods.
- **Future Path**: Add a library of financial service icons (Venmo, PayPal, etc.).
