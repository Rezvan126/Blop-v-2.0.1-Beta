# QA Testing Checklist

Use this checklist to verify the core functionality of Blop before a release or handover.

## Core Group Logic
- [ ] **Create Split:** Create a new group (e.g., "Ski Trip 2026").
- [ ] **Add Members:** Add at least 3 members to the group.
- [ ] **Identity:** Mark one member as "This is me".

## Expense Management
- [ ] **Equal Split:** Add an expense and split it equally among all members.
- [ ] **Exact Split:** Add an expense and use the "Exact" mode. Verify it fails if the sum doesn't match the total.
- [ ] **Percentage Split:** Add an expense and use "Percentage". Verify it requires a total of 100%.
- [ ] **Shares Split:** Add an expense and use "Shares". Verify the math correctly divides the total based on share ratios.
- [ ] **Edit Expense:** Change the amount or category of an existing expense.
- [ ] **Delete Expense:** Remove an expense and verify balances update immediately.

## Settlements & Activity
- [ ] **Record Payment:** Use the "Settle Up" flow to record a payment between two members.
- [ ] **Activity Log:** Verify the activity log shows the creation, edits, and payments in correct chronological order.
- [ ] **Sorting:** Test sorting expenses by date, amount, and payer.

## Cloud Sync & Persistence
- [ ] **Persistence:** Refresh the browser; verify all data remains (Local Storage).
- [ ] **Two-Device Sync:**
    1. Configure Firebase.
    2. Open the app on two different browsers/devices.
    3. Join the same group via invite code.
    4. Add an expense on Device 1; verify it appears on Device 2 automatically.

## Platform Specifics
- [ ] **PWA (iOS):** Open in Safari, "Add to Home Screen", and verify it opens in standalone mode without browser chrome.
- [ ] **PWA (Android):** Open in Chrome, "Install App", and verify standalone mode.
- [ ] **Android APK:** *[Pending Next Phase]*

## Visual Regression
- [ ] **Light Mode:** Check contrast and readability.
- [ ] **Dark Mode:** Check for any "white flashes" or hard-to-read text.
- [ ] **Mobile Responsiveness:** Test on various screen widths (320px to 450px).
