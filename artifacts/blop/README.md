# Blop v2.0

Blop is a fast, fair, and offline-first bill-splitting application. Built with a focus on privacy and minimalist design, it's the perfect tool for tracking shared expenses with friends, family, and roommates.

## ✨ Key Features
- **Privacy-First**: No accounts, no emails, no tracking.
- **Offline-First**: Fully functional without an internet connection.
- **Optional Cloud Sync**: Real-time split updates via Firebase.
- **Professional Reports**: Export to PDF or CSV.
- **Modern UI**: Dark/Light modes and premium color themes.

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- NPM

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📱 Mobile Development (Android)
Blop uses **Capacitor** to target Android.

1. Build the web project:
   ```bash
   npm run build
   ```
2. Sync with Android:
   ```bash
   npx cap sync android
   ```
3. Open in Android Studio:
   ```bash
   npx cap open android
   ```

## 🛠 Tech Stack
- **Frontend**: React 19, Vite 6, Tailwind CSS 4.
- **State**: Zustand (with Persistence).
- **Mobile**: Capacitor 8.
- **Database**: Firestore (Optional Sync).
- **Icons**: Lucide React.

## 📄 Documentation
- [Firebase Setup](docs/FIREBASE_SETUP.md)
- [Android Release Guide](docs/ANDROID_RELEASE.md)
- [Testing Checklist](docs/TESTING_CHECKLIST.md)
- [Handover Notes](docs/HANDOVER_NOTES.md)
- [Privacy Policy](docs/PRIVACY_NOTES.md)

---
*Created with ❤️ for simple splitting.*
