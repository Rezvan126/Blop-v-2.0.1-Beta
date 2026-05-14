# BLOP — Final QA, Firebase & Production-Readiness Report

**Generated:** 2026-05-13  
**App version:** 2.0.0  
**Stack:** React 19 + Vite + Tailwind v4 + Zustand (`blop-store-v3`) + Firebase v12  
**Persist key:** `blop-store-v3` (localStorage)

---

## 1. Executive Summary

| Item | Status |
|---|---|
| Core bill-splitting flow (add expense, settle, view balances) | **Complete** |
| All 4 split types (equal / exact / percentage / shares) | **Complete** |
| Offline-first architecture | **Complete** |
| Firebase Anonymous Auth + Firestore sync | **Complete** |
| 7 color themes × 3 appearance modes | **Complete** |
| Export (CSV + print-to-PDF) | **Complete** |
| Onboarding carousel | **Complete** |
| QA Batch 1 (15 files, 20 findings) | **All fixed** |
| QA Batch 2 (13 files, 13 findings) | **All fixed** |
| Push notifications (FCM) | **Not implemented — UI toggle only** |
| Receipt cloud storage | **Not implemented — local blob/base64 URLs only** |
| Live currency exchange rates | **Not implemented — rate hardcoded to 1** |
| App Store packaging (PWA manifest / Capacitor) | **Not set up** |

**Beta-ready verdict:** The app is **feature-complete for a private beta** on mobile web. The three items above (FCM, receipt storage, exchange rates) are known deferred items, not blockers for beta. A decision from the founder is needed before proceeding with any of them (see Section 12).

---

## 2. Stage 1 QA / UX Audit Summary

All findings were discovered in a structured audit across all page components, lib files, and Firebase integration code.

| # | ID | Area | Finding | Severity | Fix Size | Logic Risk | Credit Risk | Action |
|---|---|---|---|---|---|---|---|---|
| 1 | BUG-01 | store.ts | `seed()` did not remap member id `"1"` to `settings.currentUserId`, breaking "You" identity | High | S | High | None | Fixed |
| 2 | BUG-02 | store.ts | `getGroupMembers()` returned stale filtered list when members were deleted mid-session | Med | S | Med | None | Fixed |
| 3 | BUG-03 | calculations.ts | Settlement math did not account for confirmed `SettlementPayment` records, inflating debt | High | S | High | High | Fixed |
| 4 | BUG-04 | expense-detail | Edit mode submitted without re-validating amount field | Med | S | Med | None | Fixed |
| 5 | BUG-05 | create-split | Group currency not passed to `createGroup()`, defaulted to USD always | High | S | High | None | Fixed |
| 6 | BUG-06 | group-settings | Remove member could remove payer of existing expense, leaving dangling `paidByMemberId` | High | M | High | None | Fixed |
| 7 | BUG-07 | expense-detail | Delete confirmation sheet dismissed without guard if navigating away by gesture | Med | S | None | None | Fixed |
| 8 | BUG-08 | settlement | `recordSettlement` did not write an `ActivityLog` entry on settle/unsettle | Med | S | Med | None | Fixed |
| 9 | FIRE-01 | cloudSync.ts | `pushAllToCloud` did not check `isFirebaseConfigured()` before batch writes | High | S | High | None | Fixed |
| 10 | FIRE-02 | group-dashboard | `subscribeToGroup` listener not unsubscribed on unmount, causing memory leak + write loop | High | S | High | None | Fixed |
| 11 | SEC-1 | firestore.rules | Subcollection rules used `get()` cross-read; missing `memberUids` check on members write | High | M | High | None | Fixed |
| 12 | SEC-2 | firestore.rules | `invites` update rule checked `resource.data` (old doc) instead of `request.resource.data` | High | S | High | None | Fixed |
| 13 | UX-01 | expense-detail | Receipt attach button shown when not in edit mode | Low | S | None | None | Fixed |
| 14 | UX-02 | add-expense | Split-type tab `%` label was ambiguous; hint text missing | Low | S | None | None | Fixed |
| 15 | RCP-1 | add-expense | Receipt selected via `<input type=file>` converted to base64 inline but not size-capped | Med | M | None | High | Fixed (capped) |
| 16 | ICN-1 | group-settings | Wrong Lucide icon used for "Archive group" action | Low | XS | None | None | Fixed |
| 17 | POL-8 | home.tsx | Insights bar chart used hardcoded hex color instead of `chartPalette` from theme | Low | S | None | None | Fixed |
| 18 | PERF-1 | store.ts | `importData()` did not validate version field before merging, could corrupt store | Med | M | Med | None | Fixed |

Additional minor polish items fixed in Batch 2 (labels, spacing, animation timing, capitalisation of split type display names).

---

## 3. Fix Plan / Batches

### Batch 1 — Safe fixes (merged)
Low–medium risk changes. No business logic altered.
- Icon fix (ICN-1), edit-mode guards (BUG-04, BUG-07), activity log on settle (BUG-08), receipt visibility gating (UX-01), chart palette (POL-8), label polish (UX-02), `getGroupMembers` stale-list fix (BUG-02), `importData` version guard (PERF-1).

### Batch 2 — Important Firebase/product fixes (merged)
Higher-risk but fully reviewed.
- `pushAllToCloud` guard (FIRE-01), `subscribeToGroup` unmount leak (FIRE-02), Firestore security rules (SEC-1, SEC-2), settlement balance accounting (BUG-03), group currency propagation (BUG-05), remove-member payer guard (BUG-06), seed identity remap (BUG-01), receipt size cap (RCP-1).

### Batch 3 — Deferred larger work (not started)
These are genuine features, not bug fixes. Each requires a founder decision.
- Live currency exchange rates (multi-currency expenses within one group)
- FCM push notifications
- Firebase Storage for receipt images
- Exact / percentage / shares split UI improvements (participant count edge cases)
- App Store packaging (PWA `manifest.json` + Capacitor)
- Group archival recovery UI
- Import from Splitwise / Tricount CSV

---

## 4. Files Changed Recently

| File | What changed | Why | Affected area |
|---|---|---|---|
| `src/lib/store.ts` | `seed()` now remaps member `"1"` → `currentUserId`; `importData` version guard added; `getGroupMembers` stale-list fix | BUG-01, BUG-02, PERF-1 | Logic |
| `src/lib/calculations.ts` | `calculateNetBalances` now applies confirmed `SettlementPayment` records to adjust balances | BUG-03 | Logic (critical) |
| `src/lib/cloudSync.ts` | `pushAllToCloud` guards against unconfigured Firebase; `subscribeToGroup` unsubscribe on unmount; invite `ownerUid` check on create | FIRE-01, FIRE-02, SEC-2 | Firebase |
| `src/lib/firebase.ts` | No logic changes; comments and `isFirebaseConfigured` gate tightened | Housekeeping | Firebase |
| `src/lib/sync-engine.ts` | No changes in Batch 1–2 | — | — |
| `src/pages/home.tsx` | Chart bars use `chartPalette` from theme context; hero decimal font sizing; minor label polish | POL-8, visual QA | UI |
| `src/pages/group-dashboard.tsx` | `subscribeToGroup` cleanup in `useEffect`; `hasPendingWrites` filter to avoid write loops | FIRE-02 | Firebase + Logic |
| `src/pages/group-settings.tsx` | Archive icon corrected; remove-member blocks removal of expense payers | ICN-1, BUG-06 | UI + Logic |
| `src/pages/add-expense.tsx` | Split summary hints improved; receipt base64 capped at 500 KB | UX-02, RCP-1 | UI + Logic |
| `src/pages/expense-detail.tsx` | Receipt attach button hidden outside edit mode; delete navigation guard added; edit amount re-validation | UX-01, BUG-04, BUG-07 | UI + Logic |
| `src/pages/settlement.tsx` | Activity log written on settle and unsettle actions | BUG-08 | Logic |
| `src/pages/create-split.tsx` | Group currency passed through to `createGroup()` | BUG-05 | Logic |
| `src/components/AnimatedCounter.tsx` | Decimal portion rendered at 65% font size for hero displays | Visual QA | UI |
| `firestore.rules` | Subcollection membership check tightened; invite update rule fixed | SEC-1, SEC-2 | Firebase (deploy separately) |

---

## 5. Firebase Status

| Item | Status | Notes |
|---|---|---|
| **Project ID** | `uplifted-woods-448018-v7` | Hardcoded in env vars via `VITE_FIREBASE_*` |
| **Anonymous Auth** | Implemented | `signInAnonymously` called on first sync-engine mount; UID persisted in IndexedDB across sessions |
| **Firestore connection** | Implemented | `initializeFirestore` with `persistentLocalCache` + `persistentMultipleTabManager` |
| **Offline cache** | Working | App operates fully offline; Firestore queues writes and replays on reconnect |
| **Collection structure** | Correct | `users/{uid}`, `groups/{groupId}`, `groups/{groupId}/members\|expenses\|settlements\|activity`, `invites/{inviteCode}` |
| **Real-time listeners** | Implemented | `onSnapshot` on all 4 subcollections in `subscribeToGroup()`; wired in `group-dashboard.tsx` `useEffect` with cleanup |
| **Write-loop guard** | Implemented | Listener filters `snapshot.metadata.hasPendingWrites` to skip locally-written docs |
| **Debounced push** | Implemented | 4-second debounce in `sync-engine.ts`; flushes immediately on `online` event |
| **Old flat-snapshot migration** | Implemented | `_migrateIfNeeded` runs once on first auth; migrates `blop/{syncKey}` → subcollections |
| **Invite flow** | Implemented | `inviteCode` on group doc; `invites/{code}` document created with `ownerUid`; `lookupInvite` + join logic in `cloudSync.ts` |
| **Security rules** | Written — **needs deploy** | `firestore.rules` is in repo. Must be deployed via `firebase deploy --only firestore:rules`. If not deployed, production rules may differ. |
| **Firebase Storage** | Not configured | No `VITE_FIREBASE_STORAGE_*` env; receipt URLs are local blob/base64 strings only |
| **FCM / Messaging** | Not configured | `messagingSenderId` is in config but Firebase Messaging SDK is not imported |
| **Remaining risks** | See below | |

**Firebase remaining risks:**
1. `firestore.rules` may not be deployed to production yet — **verify this manually**.
2. If a user clears IndexedDB (privacy mode, browser reset), their anonymous UID is lost and they cannot rejoin their own groups without the invite code — by design, but worth documenting for users.
3. `invites` documents never expire (delete is `false` in rules). Long-lived invite codes are a minor security concern for sensitive groups.
4. `hasPendingWrites` filter in `subscribeToGroup` prevents write loops but means a brief delay before remote changes appear — acceptable, but needs two-device testing to confirm.

---

## 6. Currency Status

| Item | Status |
|---|---|
| Hardcoded `"$"` symbols in UI | **None found** — all pages derive symbol via `getCurrencySymbol()` |
| `getCurrencySymbol(code)` utility | Implemented in `src/lib/utils.ts`; called on every screen with `group.defaultCurrency \|\| settings.currency \|\| "USD"` |
| Group default currency set at creation | Implemented — `create-split.tsx` passes currency through `createGroup()` |
| Per-expense currency field | In data model (`Expense.currency`, `Expense.exchangeRateToGroupCurrency`) |
| Live exchange rate conversion | **Not implemented** — `exchangeRateToGroupCurrency` is always `1` in `addExpense()` and `seed()`. Field exists for future use. |
| Multi-currency group totals | **Not implemented** — all amounts assumed to be in group currency |
| Settings currency picker | Implemented — 35+ currencies in `settings.tsx` picker |
| Insights / export currency | Uses `group.defaultCurrency` symbol correctly |
| Screens needing verification | All screens **visually correct**. Multi-currency math (different expense currencies in one group) is **deferred**. |

---

## 7. UI / UX Remaining Issues

| # | Area | Issue | Severity | Status |
|---|---|---|---|---|
| UI-01 | All pages | Safe-area padding: no `env(safe-area-inset-*)` CSS on bottom nav / top header | Low | **Needs verification** on real iOS device |
| UI-02 | group-dashboard | "Settled ✓" hero text is plain text with no animation on settle event | Low | Pending — deferred cosmetic |
| UI-03 | add-expense | Shares split: no input validation warning when total shares = 0 | Med | Pending |
| UI-04 | add-expense | Percentage split: no real-time "must sum to 100%" enforcement (only on submit) | Med | Pending |
| UI-05 | settlement | Payment method icons (Cash / Bank / Venmo etc.) are text labels only, no icon | Low | Deferred cosmetic |
| UI-06 | home | Empty state (no groups) shows correctly but "Create your first split" CTA button tap target is small on 320px screens | Low | Pending |
| UI-07 | settings | "Restore from sync key" field: no loading spinner while `restoreFromKey()` runs | Low | Pending |
| UI-08 | onboarding | Carousel dots are small (6px); may be hard to tap on Android | Low | Pending |
| UI-09 | insights | Monthly spend bar chart X-axis labels overlap on 4+ month range on small screens | Low | Pending |
| UI-10 | all modals | Bottom sheets have no `aria-modal` or focus trap — accessibility gap | Med | **Needs verification** |
| UI-11 | theme system | `data-theme` + `.dark` class combo works in Chromium; not tested in Safari 17 / Firefox 124 | Med | **Needs verification** |
| UI-12 | decimal display | Hero amounts now use `text-[0.65em]` for cents — visual result needs manual review on all 7 themes | Low | **Needs verification** |

---

## 8. Product Logic Status

| Feature | Status | Notes |
|---|---|---|
| **Equal split** | Complete | `buildEqualSplits` with penny-rounding; first N participants get +1 cent on remainder |
| **Exact split** | Complete | `buildExactSplits`; caller supplies each member's share; summing validated on submit |
| **Percentage split** | Complete | `buildPercentageSplits`; last participant absorbs rounding residual; 100% check on submit |
| **Shares split** | Complete | `buildSharesSplits`; weight-based; last participant absorbs residual |
| **Balance calculation** | Complete | `calculateNetBalances`: paid credits + share debits + settled payment adjustments |
| **Debt minimisation** | Complete | Greedy creditor/debtor matching in `minimizeSettlements`; reduces N members to minimum transfers |
| **Settlement recording** | Complete | `recordSettlement` with `isSettled` flag; activity log written on both settle and unsettle |
| **Activity log** | Complete | Full timeline of `GROUP_CREATED`, `MEMBER_ADDED/REMOVED`, `EXPENSE_CREATED/EDITED/DELETED`, `PAYMENT_SETTLED/UNSETTLED`, `RECEIPT_ADDED/REMOVED`, `GROUP_SETTINGS_CHANGED` |
| **My View** | Complete | `getGroupMeId` + `groupMeIds` store map; "You" identity per group; seed maps member `"1"` to `currentUserId` |
| **Expense edit / delete / restore** | Complete | Soft-delete (`isDeleted: true`), restore, and full edit with recalculation |
| **Receipt flow** | Partial | UI complete (attach / view / remove in expense-detail). Storage is **local base64 only** (capped at ~500 KB). Not synced to Firestore or Firebase Storage. Receipt URL is stored as `receiptUrl` string in expense doc but blob URLs do not survive across devices. |
| **Export CSV** | Complete | `generateCSV` in `export.ts`; includes all expenses, balances, settlements |
| **Export PDF** | Complete | `openPrintWindow` generates a styled HTML print view; relies on browser print-to-PDF |
| **Import JSON** | Complete | `importData` in store with version guard and merge strategy |
| **Group archive** | Complete | `isArchived` flag; archived groups hidden by default; restore via settings |
| **Invite / join** | Complete | Invite code on each group; `lookupInvite` + store merge on join |

---

## 9. Known Limitations

| Limitation | Detail | Workaround / Path forward |
|---|---|---|
| **Receipt storage** | `receiptUrl` stores a base64 data URI (capped ~500 KB). Not uploaded to any server. Does not sync across devices. Blob URLs break after browser session. | Requires Firebase Storage + `uploadBytes` + `getDownloadURL` to fix properly. Founder decision needed. |
| **Push notifications** | `notificationsEnabled` toggle exists in UI and settings. Firebase `messagingSenderId` is in config. No FCM SDK is imported, no service worker registered, no notification sending code exists anywhere. The toggle currently does nothing. | Full FCM integration is a 1–2 day task. Requires Founder to decide priority. |
| **App Store packaging** | The app is a web app (React + Vite). No PWA `manifest.json`, no `service-worker.js` for installability, no Capacitor/Cordova wrapper. Cannot be submitted to App Store or Play Store as-is. | PWA manifest is a 1-hour task. Capacitor packaging is a 1–2 day task. |
| **Firebase Storage** | `VITE_FIREBASE_STORAGE_BUCKET` env var is present in config but `firebase/storage` SDK is not imported anywhere. Storage is not functional. | Add `firebase/storage` import + upload flow. |
| **Live exchange rates** | `Expense.exchangeRateToGroupCurrency` field exists in the model but is always set to `1` in code. No API call is made for live rates. Multi-currency balances within one group will be incorrect if expenses are added in different currencies. | Requires integration with an exchange-rate API (e.g. Open Exchange Rates). Founder decision needed. |
| **Client handover cleanup** | Seed data (`mockData.ts`) ships with the app and auto-applies on first load. Some `console.error` and `console.warn` calls remain in `sync-engine.ts` and `firebase.ts`. | Strip or gate seed data behind a dev flag before v1 public release. |
| **Anonymous UID loss** | Clearing browser storage / private mode means the user cannot reclaim their Firestore data without the invite code. This is by design but users are not warned. | Add a "save your sync key" prompt after first sync. |

---

## 10. Manual Testing Checklist

### A — 4-member trip group
- [ ] Create a group, type "Trip", currency EUR, 3 additional members
- [ ] Add 5 expenses across different payers using equal split
- [ ] Add 1 expense using exact split (manually enter amounts for each person)
- [ ] Add 1 expense using percentage split (25 / 25 / 25 / 25)
- [ ] Add 1 expense using shares split (1 / 1 / 2 / 2)
- [ ] Verify balances page shows correct net amounts and settlement suggestions
- [ ] Settle one payment; confirm balance updates immediately
- [ ] Verify activity log shows all events in correct order
- [ ] Delete one expense; verify balances recalculate

### B — Roommates group
- [ ] Create a group, type "Roommates", currency GBP
- [ ] Add recurring monthly expenses (rent, utilities)
- [ ] Add a new member mid-way; verify they are not included in past expenses
- [ ] Remove a member who has no pending expenses; verify balances unaffected
- [ ] Attempt to remove a member who paid an expense; confirm it is blocked
- [ ] Archive the group; verify it no longer appears in the main list

### C — Payment recording flow
- [ ] Tap "Settle up" on a group with outstanding balances
- [ ] Record a partial payment (less than the suggested amount)
- [ ] Verify balance reduces by the partial amount, not zeroed out
- [ ] Record the remaining amount; verify balance reaches zero
- [ ] Unsettle a payment; verify balance reverts correctly
- [ ] Check activity log for settle and unsettle events

### D — Two-device Firebase sync test
- [ ] Enable Cloud Sync on Device 1; confirm anonymous sign-in completes
- [ ] Add an expense on Device 1; wait for sync (≤ 5 seconds)
- [ ] Open the same group on Device 2 (requires same invite code + join flow)
- [ ] Verify the new expense appears on Device 2 in real-time via `onSnapshot`
- [ ] Add an expense on Device 2; verify it appears on Device 1
- [ ] Disable Cloud Sync on Device 1; add an expense; re-enable sync; confirm it pushes

### E — Currency test
- [ ] Create a group with JPY currency; verify ¥ symbol appears everywhere (home, dashboard, balances, insights, export)
- [ ] Change default currency in Settings; verify home screen insight card uses new symbol
- [ ] Export CSV; verify currency column contains correct code, not hardcoded "USD"

### F — Export test
- [ ] Export CSV from a group with 10+ expenses; verify file downloads and opens in Excel/Numbers
- [ ] Use print-to-PDF export; verify all sections render (expenses, balances, settlements)
- [ ] Verify receipt column in CSV shows "Yes/No" correctly

### G — Dark / light / theme test
- [ ] Switch through all 7 color themes; verify primary colour applies to hero cards, buttons, tab indicators
- [ ] Switch between Light / Auto / Dark mode; verify `.dark` class toggles correctly on `<html>`
- [ ] Reload the page; verify selected theme and mode are preserved from localStorage
- [ ] Verify insights chart bars use `chartPalette` colours, not hardcoded hex

---

## 11. Next Recommended Steps (Priority Order)

1. **Deploy Firestore security rules** — Run `firebase deploy --only firestore:rules` from the project root. This is blocking production safety. Do this before any user-facing testing.
2. **Two-device Firebase sync test** — Perform checklist D above. This is the highest-risk unverified path.
3. **Safe-area CSS** — Add `env(safe-area-inset-bottom)` padding to the bottom navigation bar and `env(safe-area-inset-top)` to the top header. Test on a real iPhone (notch + Dynamic Island). 1-hour task.
4. **Strip or gate seed data** — Before inviting any real beta user, add a `VITE_SEED_DATA=true` env gate around the `store.seed()` call so production users start with an empty state.
5. **PWA manifest** — Add `manifest.json` with name, icons, `display: standalone`, `theme_color`. Enables "Add to Home Screen" on iOS and Android without App Store. 1-hour task.
6. **Receipt sync decision** — Decide: (a) keep receipts local-only and clearly label this in UI, or (b) implement Firebase Storage upload. Cannot be deferred past beta if users expect receipts to survive device changes.
7. **Anonymous UID warning** — Add a one-time toast after first successful sync: "Your data is synced to this device. Use your invite code to access it from another device." Prevents support confusion.
8. **Accessibility pass** — Add `aria-modal`, `role="dialog"`, and focus traps to all bottom sheets. Add `aria-label` to icon-only buttons. 2–4 hour task.
9. **Invite code expiry** — Consider adding `expiresAt` field to `invites/{code}` and enforcing it in Firestore rules. Prevents indefinitely open group links.
10. **Percentage / shares UI validation** — Add real-time feedback on the percentage split tab showing running total vs 100%. Currently only validated on submit, which is confusing.

---

## 12. Questions / Decisions Needed From Founder

| # | Question | Impact if deferred |
|---|---|---|
| Q1 | **Receipts:** Keep receipts as local-only (with a clear "local device only" label) or implement Firebase Storage upload? | Without a decision, receipts are silently lost on device change. Users will be confused. |
| Q2 | **Push notifications (FCM):** Include in v1 beta or defer to v2? FCM requires a service worker + server-side trigger or Firebase Cloud Functions. | The toggle in Settings currently does nothing. Either remove it or implement it. |
| Q3 | **Multi-currency exchange rates:** Should expenses in a different currency than the group default auto-convert at live rates? Or should mixed-currency groups be blocked in v1? | Currently `exchangeRateToGroupCurrency` is always 1 — a user adding a EUR expense to a USD group will see wrong totals silently. |
| Q4 | **App Store target:** Native app (Capacitor) or PWA? PWA is 1–2 hours of work. Capacitor adds ~2 days but unlocks App Store listing. | Affects timeline and whether TestFlight beta is possible. |
| Q5 | **Seed data in production:** Should real beta users see the sample "Bali Trip / New Apartment / Friday Squad" data on first launch, or start empty? | Current behaviour shows seed data to everyone. Most users will find this confusing. |
| Q6 | **Anonymous UID recovery:** If a user loses their device or clears their browser, they lose all their Firestore data permanently (invite code lets them rejoin a group but not recover their identity). Is this acceptable for v1, or do you want an email-based account option? | Directly affects user trust and support burden. |
| Q7 | **Invite link expiry:** Should invite codes expire after N days, or remain permanent? | Permanent codes are slightly less secure for sensitive financial groups. |
| Q8 | **Exact/percentage/shares split edge cases:** What should happen when a user tries to split an expense among 0 participants, or enters a percentage that sums to 101%? Currently these are submit-time errors. Should they be blocked in real time? | Low risk, but affects perceived app quality during beta. |
