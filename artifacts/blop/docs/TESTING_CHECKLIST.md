# QA & Testing Checklist

Perform these tests on a physical Android device before any major release.

## 1. Core Functionality
- [ ] **Create Split**: Verify name, currency, and member addition works.
- [ ] **Add Expense**: 
  - [ ] Test equal split.
  - [ ] Test exact amount split.
  - [ ] Test percentage split.
  - [ ] Test shares/weight split.
- [ ] **Delete/Restore**: Ensure deleted expenses are hidden and can be restored from history.
- [ ] **Settlement**: Record a payment and verify balances update correctly.

## 2. UI & UX
- [ ] **Dark/Light Mode**: Toggle system mode and verify all screens adapt gracefully.
- [ ] **Themes**: Change color theme and verify primary/accent colors update.
- [ ] **Haptics**: Verify tactile feedback on:
  - [ ] Tab switching.
  - [ ] Button presses.
  - [ ] Successful actions (Success overlay).
- [ ] **Responsiveness**: Check on small screens and large screens (tablets).

## 3. Data & Sync
- [ ] **Offline Mode**: Turn off Wi-Fi/Data and add an expense. Verify it saves locally.
- [ ] **Cloud Sync**:
  - [ ] Enable sync (with Firebase configured).
  - [ ] Join a group from another device using an invite code.
  - [ ] Verify real-time updates when an expense is added on another device.
- [ ] **Export/Import**:
  - [ ] Export a JSON backup.
  - [ ] Reset the app.
  - [ ] Import the JSON backup and verify all data is restored.
  - [ ] Export a PDF report and verify layout.

## 4. Performance & Stability
- [ ] **App Launch**: Verify fast startup time (< 2 seconds).
- [ ] **Scrolling**: Ensure smooth scrolling in large expense lists.
- [ ] **Memory**: Check for any significant battery drain or overheating.

## 5. Android Specifics
- [ ] **Back Button**: Verify the physical back button navigates correctly.
- [ ] **Keyboard**: Ensure the keyboard doesn't cover input fields (Capacitor Keyboard plugin check).
- [ ] **Status Bar**: Verify status bar color matches the theme (Capacitor Status Bar plugin check).
