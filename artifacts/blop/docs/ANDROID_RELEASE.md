# Android Release Guide

## Prerequisites

- Node.js 18+
- JDK 17 (recommended for Android builds)
- Android Studio with Android SDK (API 33+ recommended)
- Capacitor CLI: `npm install -g @capacitor/cli`

## 1. Build the web app

```bash
pnpm --filter @workspace/blop run build
```

This outputs static files to `artifacts/blop/dist/public/`.

## 2. Sync Capacitor

```bash
cd artifacts/blop
npx cap sync android
```

This copies the web build into the Android project and updates native plugins.

## 3. Debug APK

Open Android Studio with the `artifacts/blop/android/` folder, or run:

```bash
cd artifacts/blop/android
./gradlew assembleDebug
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

Install on a connected device:

```bash
adb install app-debug.apk
```

## 4. Release AAB (for Google Play)

Before building a release, you need a signing keystore. To generate one:

```bash
keytool -genkey -v -keystore blop-release.keystore -alias blop -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore and passwords securely. Never commit them to git.

Configure signing in `android/app/build.gradle` (signingConfigs section), then:

```bash
cd artifacts/blop/android
./gradlew bundleRelease
```

AAB output: `android/app/build/outputs/bundle/release/app-release.aab`

## 5. Debugging on device

Use Android Studio Logcat for real-time logs. For WebView issues, enable remote debugging:

```javascript
// In Android WebView settings (Capacitor handles this automatically in debug builds)
WebView.setWebContentsDebuggingEnabled(true);
```

Then open `chrome://inspect` in Chrome on your desktop to inspect the WebView.

## Safe area notes

- The app uses `env(safe-area-inset-*)` for gesture navigation and 3-button navigation bar spacing.
- Status bar style is set to Light via Capacitor StatusBar plugin (transparent, dark icons).
- Edge-to-edge mode is enabled for Android 15+.
