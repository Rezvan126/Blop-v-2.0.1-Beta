# Android Release Guide

This document outlines the steps to generate a production-ready Android App Bundle (AAB) or APK for the Google Play Store.

## 1. Prerequisites
- Android Studio installed and updated.
- Node.js 22+ and NPM installed.
- Capacitor CLI installed (`npm install -g @capacitor/cli`).

## 2. Preparing the Build
1. Clean the project:
   ```bash
   rm -rf dist
   npm run build
   ```
2. Sync with Capacitor:
   ```bash
   npx cap sync android
   ```

## 3. Versioning
Update the version in `android/app/build.gradle`:
- `versionCode`: Increment this for every new release.
- `versionName`: The user-facing version (e.g., "2.0.0").

## 4. Signing the App
To publish to Google Play, the app must be signed with a production keystore.

1. **Generate a Keystore** (if you don't have one):
   In Android Studio: `Build > Generate Signed Bundle / APK > Create new...`
2. **Configure Signing**:
   We recommend using `local.properties` or environment variables to store sensitive paths. Do NOT commit the keystore file to the repository.

## 5. Generating the App Bundle (AAB)
1. Open the `android` folder in Android Studio.
2. Go to `Build > Generate Signed Bundle / APK...`.
3. Select `Android App Bundle`.
4. Follow the prompts to select your keystore and enter passwords.
5. The final `.aab` file will be in `android/app/release/`.

## 6. ProGuard / R8
The project is configured with standard ProGuard rules. If you add new native plugins, ensure their specific ProGuard rules are added to `android/app/proguard-rules.pro`.

## 7. Testing the Release Build
Always test the release build on a physical device before uploading to the Play Store:
```bash
npx cap run android --configuration Release
```
Check for any missing assets, layout issues, or crashes that might only appear in production.
