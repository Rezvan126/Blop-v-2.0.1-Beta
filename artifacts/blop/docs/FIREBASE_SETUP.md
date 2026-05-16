# Firebase Setup Guide

Blop uses Firebase for anonymous authentication and real-time data synchronization. Follow these steps to set up your own Firebase project.

## 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and follow the setup wizard.
3. Disable Google Analytics unless you specifically need it.

## 2. Enable Authentication
1. Navigate to **Build > Authentication**.
2. Click **Get Started**.
3. Enable the **Anonymous** sign-in provider.

## 3. Set Up Cloud Firestore
1. Navigate to **Build > Cloud Firestore**.
2. Click **Create database**.
3. Choose a location close to your users.
4. Start in **test mode** for development, but switch to **production mode** before release.
5. Apply the rules provided in the `firestore.rules` file in the root of this repository.

## 4. Register Apps
### Web (PWA)
1. In Project Overview, click the **Web** icon (`</>`).
2. Register the app as `Blop Web`.
3. Copy the `firebaseConfig` object and add it to your `.env` file (see `.env.example`).

### Android
1. Click **Add app** and select **Android**.
2. Package name: `com.blop.app` (must match `android/app/build.gradle`).
3. Download `google-services.json` and place it in `android/app/`.

## 5. Security Rules
Ensure your Firestore rules are strict. Blop's sync logic assumes users can only read/write documents where they are members.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /groups/{groupId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.memberUids;
      allow create: if request.auth != null;
    }
    // ... additional rules for subcollections
  }
}
```
*Note: A complete `firestore.rules` file should be maintained in the project root.*
