# Sahayak AI (सहायक AI / సహాయక్ AI)

**Sahayak AI** is a full-stack web app that helps Indian citizens find government welfare schemes they are eligible for. It matches a user’s profile (age, gender, state, income, caste/category, occupation, disability status, etc.) against scheme eligibility rules and presents the most relevant schemes in the user’s preferred language.

The project includes:
- **FastAPI backend** (JWT auth, scheme recommendation, CSV-based eligibility engine, Supabase storage integration, translation cache)
- **React (Vite) frontend** (i18n, glassmorphism UI, Firebase Authentication + profile persistence)

---

## Features

### Smart scheme recommendations (fast + practical)
- Uses structured eligibility data from `eligibility_structured.csv` and scheme details from `schemes_clean.csv`.
- Applies robust rule-based filtering (state mismatch, disability mismatch, gender mismatch, occupation rules, income exclusions, etc.).
- Optionally uses an LLM (Groq) to generate realistic dynamic scheme recommendations that still follow strict eligibility constraints.

### Multilingual UI
- Instant localization for **English (EN)**, **Hindi (हिंदी)**, **Telugu (తెలుగు)**, and **Kannada (ಕನ್ನಡ)**.
- Scheme fields can be translated on-demand and cached.

### Secure private document vault
- Uploads user documents to **Supabase Private Storage** into a private bucket (bucket name: `user-documents`).
- Generates secure signed URLs for viewing/downloading.

### Voice-friendly UX (client-side)
- Frontend supports audio/voice UI patterns (see `Frontend/src/components/` for voice-related components).

---

## Tech Stack

- **Frontend:** React + Vite, Tailwind CSS, Axios, Firebase Auth
- **Backend:** FastAPI, SQLAlchemy, Pydantic settings, JWT
- **AI/Translation:** Groq LLM (optional), `deep-translator` with persistent translation cache
- **Data & Storage:** CSV datasets + Supabase PostgreSQL + Supabase Storage

---

## Repository Layout

```
SahayakAI/
├── eligibility_structured.csv
├── schemes_clean.csv
├── schema.sql
├── README.md
│
├── sahayak_backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── services/
│   │   │   ├── recommendation.py
│   │   │   ├── translation.py
│   │   │   └── supabase_storage.py
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── profile.py
│   │       ├── schemes.py
│   │       ├── documents.py
│   │       └── chat.py
│   └── requirements.txt
│
└── Frontend/
    ├── package.json
    ├── vite.config.js
    ├── src/
    │   ├── contexts/AuthContext.jsx
    │   ├── routes/AppRoutes.jsx
    │   └── services/
    │       ├── firebase.js
    │       ├── firebaseAuth.js
    │       └── firestoreProfile.js
```

---

## Backend Setup (FastAPI)

### 1) Configure environment
Create `sahayak_backend/.env` with at least:

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
JWT_SECRET=<secret>
GROQ_API_KEY=<optional>
```

### 2) Start backend
```bash
cd sahayak_backend
python -m venv venv
.
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend health check:
- `GET /` should respond with `{ "status": "healthy" }`

---

## Frontend Setup (React + Vite)

### 1) Configure environment
Create `Frontend/.env` with:

```env
VITE_API_URL=http://localhost:8000
```

If you want Firebase Auth enabled, also set the Firebase config (must be prefixed with `VITE_`):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 2) Run frontend
```bash
cd Frontend
npm install
npm run dev
```

Open:
- `http://localhost:5173`


---

## How scheme matching works (high level)

1. Load datasets from:
   - `eligibility_structured.csv`
   - `schemes_clean.csv`
2. Use user profile attributes to filter eligible schemes.
3. Optionally generate additional recommendations via Groq, then merge results.
4. Return scheme objects (name, benefits, eligibility, documents, application link, etc.) to the frontend.


