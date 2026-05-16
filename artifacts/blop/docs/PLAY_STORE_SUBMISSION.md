# Google Play Store Submission Checklist

## App identity

- [ ] `applicationId` set in `android/app/build.gradle` (e.g. `com.yourcompany.blop`)
- [ ] `versionCode` incremented for each release
- [ ] `versionName` matches the marketing version (e.g. `2.0.1`)
- [ ] `minSdkVersion` — 24 or higher recommended
- [ ] `targetSdkVersion` — must be API 34+ for new Play Store submissions

## App icons and splash

- [ ] Adaptive icon configured in `android/app/src/main/res/` (foreground + background layers)
- [ ] Launcher icon in all required densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- [ ] Splash screen configured via Capacitor or Android native resources

## Release build

- [ ] Signing keystore created and stored securely (never in git)
- [ ] `signingConfigs` configured in `build.gradle`
- [ ] Release AAB built with `./gradlew bundleRelease`
- [ ] AAB tested on a real device before upload

## Store listing

- [ ] Short description (80 characters max)
- [ ] Full description (4000 characters max)
- [ ] At least 2 screenshots per supported screen size
- [ ] Feature graphic (1024 × 500 px)
- [ ] App icon (512 × 512 px, PNG)
- [ ] Category selected (Finance or Productivity)
- [ ] Content rating questionnaire completed

## Privacy and data safety

- [ ] Privacy policy hosted at a public URL
- [ ] Privacy policy URL added to Play Console
- [ ] Data Safety section completed:
  - Data collected: none required (app is offline-first; no personal data sent to servers by default)
  - If Firebase is enabled: anonymous UID and split data are sent to Firestore
  - No data sold to third parties
  - User can delete all data by clearing app storage

## Common rejection risks

- Missing privacy policy URL
- `targetSdkVersion` below required minimum
- Debug signing used for release build
- App crashes on first launch (test on a clean device)
- Permissions declared but not used (audit `AndroidManifest.xml`)

## What the owner must complete

The developer cannot complete Play Store submission on the owner's behalf. The owner must:

1. Create a Google Play Developer account ($25 one-time fee)
2. Create the app listing in Play Console
3. Generate or provide the signing keystore
4. Upload the signed AAB
5. Complete Data Safety and content rating forms
6. Submit for review
