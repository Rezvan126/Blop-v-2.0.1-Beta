# Google Play Store Submission Checklist

Use this checklist to prepare your submission to the Google Play Console.

## 1. Store Listing
- [ ] **App Name**: Blop (Max 30 characters).
- [ ] **Short Description**: Fast, fair, and offline-first bill splitting for you and your friends.
- [ ] **Full Description**: (See below for a template).
- [ ] **Icon**: 512x512 PNG, 32-bit (Use `public/icons/blop-icon-1024.png` scaled down).
- [ ] **Feature Graphic**: 1024x500 PNG.
- [ ] **Screenshots**: At least 4 screenshots (Phone, 7-inch tablet, 10-inch tablet).

## 2. App Content
- [ ] **Privacy Policy**: Provide the URL to your hosted privacy policy (or use the one in `docs/PRIVACY_NOTES.md`).
- [ ] **Content Rating**: Complete the questionnaire (Utilities/Finance category).
- [ ] **Target Audience**: Usually 13+ or 18+.
- [ ] **Data Safety**: (See `docs/PRIVACY_NOTES.md` for specific disclosures).

## 3. Technical Requirements
- [ ] **App Bundle (AAB)**: Signed with your production keystore.
- [ ] **API Level**: Ensure `targetSdkVersion` is at least 34 (currently set to 36).
- [ ] **Permissions**: Only `INTERNET` is currently used.

## 4. Full Description Template
> Blop makes it easy to track and split expenses with friends, family, and roommates. Whether it's a weekend trip, a dinner out, or monthly household bills, Blop keeps everything transparent and fair.
>
> Why choose Blop?
> - **Privacy First**: We don't ask for your email or phone number. Your data stays on your device.
> - **Offline-First**: Use it anywhere, even without a signal.
> - **Real-Time Sync**: Optionally share splits with friends via a simple invite code.
> - **Flexible Splitting**: Split by percentage, exact amounts, or shares.
> - **Beautiful Reports**: Generate PDF or CSV reports for easy record-keeping.
>
> Stop worrying about who owes whom. Start splitting with Blop.

---
*Note: Ensure you have "Data Safety" disclosure ready. Google requires specific answers about data collection (Blop collects minimal data for sync).*
