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

## 4. Anonymous Account Recovery
- **Current Behavior**: Users are authenticated anonymously to provide a friction-less experience.
- **Limitation**: If a user clears their browser data or loses their device, they cannot "log back in" to their account. They must use an invite code to rejoin their groups, but they will be treated as a new member identity.
- **Future Path**: Option to link an email or Google account for permanent recovery.

## 5. Settlement Method Icons
- **Current Behavior**: Settlements show the payment method as a text label (e.g., "Cash", "Bank Transfer").
- **Limitation**: No visual icons are displayed for different payment methods.
- **Future Path**: Add a library of financial service icons (Venmo, PayPal, etc.).
