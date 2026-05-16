# Privacy & Data Safety Notes

This document provides information needed for the Google Play "Data Safety" questionnaire.

## 1. Data Collection & Sharing
Blop collects and shares minimal data to enable its features.

| Data Type | Purpose | Collection | Sharing |
|-----------|---------|------------|---------|
| **Personal Info** | App functionality (User Display Name) | Optional | Shared (with split members) |
| **Financial Info** | App functionality (Expenses/Settlements) | Yes | Shared (with split members) |
| **App Activity** | App functionality (Action logs) | Yes | Shared (with split members) |
| **Device IDs** | App functionality (Anonymous Auth) | Yes | No |

## 2. Data Encryption
- **In Transit**: All data sent between the device and Firebase is encrypted using HTTPS.
- **At Rest**: Data stored in Google's Firebase infrastructure is encrypted at rest.

## 3. Data Deletion
- Users can delete their entire local database via **Settings > Danger Zone > Reset all data**.
- For cloud-synced data, users can delete individual expenses or splits, which propagates to the server.

## 4. Third-Party Services
- **Firebase (Google)**: Used for authentication and data synchronization.

## 5. Privacy Policy Template
> Blop is built with an "Offline-First" philosophy. Your data belongs to you.
>
> 1. **Local Storage**: By default, all expense data is stored on your device only.
> 2. **Optional Sync**: If you choose to share a split, data for that split is synced via Firebase.
> 3. **No Personal Identification**: We do not collect emails, phone numbers, or real identities. Anonymous authentication uses a unique ID to identify your session.
> 4. **No Third-Party Access**: We do not sell your data to advertisers or third parties.
