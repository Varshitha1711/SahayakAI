# Sahayak — Frontend

AI-powered multilingual Government Services Assistant for India. React + Vite + Tailwind, with Firebase Auth/Firestore to follow.

## Setup

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`. Routes: `/` (home), `/signin`, `/signup`.

## Project structure

```
src/
  assets/            static images, icons
  components/        shared UI (LanguageSwitcher, AuthLayout, ...)
  pages/             route-level screens (Home, SignIn, SignUp, ...)
  routes/            AppRoutes.jsx — route table
  services/          external integrations (firebaseAuth.js, later firestore.js)
  contexts/          React context providers (AuthContext)
  translations/      i18n.js config + en.json / hi.json / te.json
```

## What's real vs. stubbed right now

- **Real:** routing, page layouts, the OTP-style two-step sign-in/sign-up forms, i18next wired up for English/Hindi/Telugu with a working language switcher.
- **Stubbed:** `src/services/firebaseAuth.js` fakes `sendOtp` / `verifyOtp` with a delay so the UI is fully clickable end to end. No real Firebase project is connected yet.

## Next session: wiring up Firebase

1. Create a Firebase project, enable Phone Auth, and add a web app.
2. Copy `.env.example` to `.env.local` and fill in the config values.
3. Replace the bodies of `sendOtp` / `verifyOtp` / `signOutUser` in `services/firebaseAuth.js` with real calls (`signInWithPhoneNumber`, `RecaptchaVerifier`, `confirmationResult.confirm`). `AuthContext` and the pages don't need to change.
4. Add `services/firestore.js` for reading/writing user profile documents (the `name` collected on sign-up is currently captured in the form but not yet persisted anywhere).

## Notes

- The Hindi/Telugu strings in `translations/` are a first pass — worth a native-speaker review before this ships.
- Tailwind theme tokens (colors, fonts) live in `tailwind.config.js`.
