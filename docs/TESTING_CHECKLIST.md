# Blop v2.0 Testing Checklist

Use this checklist to verify the application before release.

## 1. Onboarding & Setup
- [ ] Splash screen displays correctly with logo.
- [ ] Onboarding carousel works and can be skipped.
- [ ] User can set their name in Settings.
- [ ] Dark mode/Light mode/System mode toggle works.
- [ ] Theme color change applies globally.

## 2. Group Management
- [ ] Create a new group with 2, 5, and 10 members.
- [ ] Verify "Add Members" screen scrolls properly for 10+ members.
- [ ] Block duplicate group names.
- [ ] Block duplicate member names within a group.
- [ ] Join an existing group using an invite code.
- [ ] Archive a group and verify it's hidden from the home list.
- [ ] Restore an archived group from Settings.

## 3. Expenses & Splitting
- [ ] Add an expense with "Equal Split".
- [ ] Add an expense with "Exact Amount" (verify sum matches total).
- [ ] Add an expense with "Percentage" (verify sum equals 100%).
- [ ] Add an expense with "Shares" (verify weight-based calculation).
- [ ] Edit an existing expense and verify balance updates.
- [ ] Delete an expense and verify balance updates.
- [ ] Attach a local receipt (photo/file) to an expense.

## 4. Balances & Settlements
- [ ] Verify "Balances" tab shows correct "Who owes whom" suggestions.
- [ ] Record a full settlement between two members.
- [ ] Record a partial settlement and verify remaining balance.
- [ ] Unsettle a payment and verify balance reverts.
- [ ] Block overpayment (paying more than owed).

## 5. Activity & Insights
- [ ] Activity log shows all actions in chronological order (latest first).
- [ ] Activity log groups events by day (Today, Yesterday, etc.).
- [ ] Global Insights dashboard shows aggregate KPIs (Total spent, Pending).
- [ ] Group Insights tab shows category breakdown for that group.

## 6. Cloud Sync (Firebase)
- [ ] Enable Cloud Sync in Settings.
- [ ] Verify "Cloud sync active" indicator appears.
- [ ] Test sync across two devices/browsers using the same invite code.
- [ ] Verify data remains intact after refreshing the page or restarting the app.

## 7. Export & Backup
- [ ] Export group data as CSV and verify file content.
- [ ] Use Print/PDF export and verify layout.
- [ ] Export full data backup (JSON) from Settings.
- [ ] Import data backup and verify state is restored.

## 8. Android Specific
- [ ] App launches without crashing.
- [ ] Adaptive icons display correctly on home screen.
- [ ] Splash screen transition is smooth.
- [ ] Android back button behaves as expected.
- [ ] Bottom navigation respects safe-area (gestural navigation bar).
