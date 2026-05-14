# Firebase Setup Guide

Blop uses Firebase for real-time cloud synchronization between devices. Follow these steps to configure your own Firebase environment.

## 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and follow the setup wizard.

## 2. Enable Anonymous Authentication
Blop uses anonymous authentication to keep the user experience friction-less while still securing data per-user.
1. In the left sidebar, click **Authentication**.
2. Go to the **Sign-in method** tab.
3. Enable **Anonymous** and click **Save**.

## 3. Create a Cloud Firestore Database
1. In the left sidebar, click **Firestore Database**.
2. Click **Create database**.
3. Select **Production mode** for security.
4. Choose a location near your users.

## 4. Deploy Security Rules
Copy the contents of `firestore.rules` from the project root and paste them into the **Rules** tab of your Firestore Database in the Firebase Console. Click **Publish**.

## 5. Register a Web App
1. In the Firebase Project Overview, click the **Web** icon (`</>`) to add an app.
2. Register the app (e.g., "Blop Web").
3. You will be shown a `firebaseConfig` object.

## 6. Configure Environment Variables
Copy the values from the `firebaseConfig` object into your local `.env` or `.env.local` file:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 7. Verify Configuration
Once configured and the dev server is restarted, go to the **Settings** screen in Blop. You should see a status indicator that says **"Cloud sync active"**.
