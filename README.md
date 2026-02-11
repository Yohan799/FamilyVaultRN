# Family Vault

A secure document vault app with a React Native frontend and Supabase backend.

## Project Structure

```
FamilyVaultRN/
├── frontend/          # React Native mobile app
│   ├── App.tsx        # Root component
│   ├── index.js       # Entry point
│   ├── src/           # Source code (screens, components, services, etc.)
│   ├── android/       # Android native project
│   ├── ios/           # iOS native project
│   ├── package.json   # Dependencies & scripts
│   └── .env           # Frontend env vars (Supabase URL, anon key, Google OAuth)
│
├── backend/           # Supabase backend
│   ├── supabase/      # Supabase config + edge functions
│   │   ├── config.toml
│   │   └── functions/ # Edge functions (OTP, backup, notifications, etc.)
│   ├── functions/     # Edge functions (alternate deployment source)
│   ├── sql_scripts.txt # Database schema & migration SQL
│   └── .env           # Backend env vars (SMTP, Supabase credentials)
│
├── .gitignore
└── README.md
```

## Features

- 🔐 Secure document storage with encryption
- 👨‍👩‍👧‍👦 Family sharing and nominee system
- ⏰ Time capsule for scheduled messages
- 🔒 Biometric and PIN authentication
- ☁️ Google Drive backup integration

## Getting Started

### Prerequisites

- Node.js 20+
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- JDK 17

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env   # Update with your credentials
npx expo start         # Start Expo dev server
```

**Android:** Press `a` in Expo CLI or run `npm run android`
**iOS:** Run `cd ios && pod install && cd ..` then `npm run ios`

### Backend Setup

```bash
cd backend
supabase start                    # Start local Supabase
supabase functions serve          # Serve edge functions locally
```

## Tech Stack

- **Framework:** React Native 0.83 + Expo
- **Language:** TypeScript
- **Navigation:** React Navigation 7
- **State Management:** TanStack Query
- **Backend:** Supabase (Auth, Database, Edge Functions, Storage)
- **Styling:** NativeWind (TailwindCSS for RN)
- **Storage:** MMKV
