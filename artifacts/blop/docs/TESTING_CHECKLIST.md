# Testing Checklist

## First launch

- [ ] App opens to splash screen
- [ ] Onboarding loads correctly
- [ ] No demo data appears (unless VITE_SEED_DATA=true)
- [ ] App defaults to Light mode on first launch

## Home screen

- [ ] Home loads without crashing
- [ ] Long split names truncate correctly
- [ ] Bottom navigation tabs work (Home / Settle / Insights)
- [ ] Settings button opens settings screen
- [ ] Net balance shows $0 with no splits

## Create split

- [ ] User can cancel and return to Home
- [ ] Duplicate split name is blocked
- [ ] Split is created and appears on Home
- [ ] Adding members works
- [ ] Duplicate member name is blocked
- [ ] Long member names truncate safely
- [ ] Currency selector works

## Add expense

- [ ] Amount input accepts decimal values
- [ ] Native number spinner arrows are not visible
- [ ] Description field works (max 70 chars)
- [ ] Category selection works
- [ ] Payer selection works
- [ ] Date picker works
- [ ] Equal split works and saves correctly
- [ ] Exact split: sum validation blocks mismatches
- [ ] Percentage split: total-must-equal-100 validation works
- [ ] Shares split: saves correctly

## Settlement

- [ ] Pending debts appear correctly on Settle tab
- [ ] Settlement can be recorded
- [ ] Overpayment is blocked with an error
- [ ] Pending count drops to 0 after full settlement
- [ ] Activity log updates after settlement

## Export / Restore

- [ ] Export backup creates a downloadable JSON file (web)
- [ ] Export backup triggers share sheet (Android/Capacitor)
- [ ] Restore backup parses file and updates data
- [ ] Invalid file shows a clear error message

## Settings

- [ ] Username can be updated
- [ ] Theme changes apply immediately
- [ ] Dark / Light / Auto mode works
- [ ] Color theme changes apply
- [ ] Cloud sync section shows "not configured" without Firebase env vars
- [ ] Privacy policy screen loads

## Insights

- [ ] Main Insights tab shows totals across all splits
- [ ] Group-level Insights shows group-specific data
- [ ] Large numbers display without overflow

## Android-specific

- [ ] Safe area inset respected for gesture navigation
- [ ] Safe area inset respected for 3-button navigation
- [ ] No content hidden behind Android nav buttons
- [ ] Status bar style is correct (light icons on dark bar or vice versa)
- [ ] App does not crash on back button press
- [ ] Share sheet opens when exporting backup on Android
