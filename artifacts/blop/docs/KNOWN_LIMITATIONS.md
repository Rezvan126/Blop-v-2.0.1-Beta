# Known Limitations

## Receipts are local only

Receipt images are stored as data URLs in the device's local storage. They are not uploaded to any cloud service and will not sync across devices. This is intentional for the current release — no backend storage is required.

## Push notifications not implemented

There is no real-time push notification system. Users must open the app to see updates from other members of a split.

## Live exchange rates not implemented

Currency amounts are stored and displayed in the currency chosen at split creation. There is no automatic currency conversion or live exchange rate lookup.

## Anonymous account recovery

The app uses anonymous Firebase Authentication. If a user clears their browser data or installs the app fresh on a new device, they get a new anonymous UID. Their cloud-synced data can still be accessed by rejoining the split group via invite link. However, there is no account recovery by email or phone number.

## iOS not yet supported

The current release targets Android via Capacitor. iOS build setup (Xcode, provisioning profiles, App Store Connect) has not been started.

## Release signing requires owner credentials

A release AAB (Android App Bundle) for Google Play requires a signing keystore. This must be generated and managed by the app owner. Debug builds do not require signing and can be installed via ADB for testing.

## Seed data

Demo/seed data only appears if `VITE_SEED_DATA=true` is set in the environment. It is off by default in production.
