# Sahayak AI (సహాయక్ AI / सहायक AI)

**Sahayak AI** is a modern, full-stack web application designed to bridge the gap between citizens and government welfare schemes in India. It enables users to discover eligible welfare programs, upload verification documents securely, and interact with the platform in multiple languages using voice inputs and speech narration.

The system features a **FastAPI backend** (using **SQLAlchemy** and **JWT authentication**), a **React (Vite) + Tailwind CSS frontend** styled with a premium dark gradient glassmorphism theme, and is fully integrated with **Supabase PostgreSQL** and **Supabase Private Storage**.

---

## Key Features

1. **Smart Recommendation Engine**: Matches citizen profile attributes (Age, Gender, State, District, Occupation, Income, Caste Category, Marital Status, Disability) against structured eligibility criteria in under **0.02 seconds**.
2. **100% Dynamic Localization**: Seamless on-the-fly switching between **English (EN)**, **Hindi (हिंदी)**, **Telugu (తెలుగు)**, and **Kannada (ಕನ್ನಡ)**. All UI labels, placeholders, dropdown options, and matched schemes translate instantly.
3. **Optimized Hybrid Translation Caching**: Avoids Google Translate rate blocks and timeouts by translating card lists in the background while caching results in a thread-safe `translations_cache.json` vault. Scheme details are fetched and translated on-demand when clicked.
4. **Secure Document Vault**: Private drag-and-drop document uploads (Aadhaar, Caste, and Income Certificates) mapped to Supabase private storage buckets. Exposed only to authenticated users via temporary secure signed URLs.
5. **Interactive Voice Assistant**:
   * **Speech-to-Text (STT)**: Speaks search queries in Telugu, Hindi, or English to filter schemes.
   * **Text-to-Speech (TTS)**: Reads card benefits and details in the active language using whitelisted cloud audio channels for perfect native pronunciation.
6. **Premium Dark Glassmorphic Theme**: A stunning gold-and-indigo palette with ambient float orbs, grid backdrops, and semi-transparent glassmorphic cards.

---

## Technology Stack

* **Backend**: FastAPI (Python), Uvicorn, Pandas, SQLAlchemy, Pydantic, deep-translator, JWT, PyJWT, bcrypt.
* **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Axios, i18next, react-i18next.
* **Database & File Storage**: Supabase PostgreSQL, Supabase Storage.

---

## Folder Structure

```
SAHAYAK/
├── eligibility_structured.csv   # Eligibility rules database
├── schemes_clean.csv            # Schemes dataset
├── schema.sql                   # Supabase SQL database schemas
├── README.md                    # Project documentation
│
├── sahayak_backend/             # FastAPI REST Server
│   ├── .env                     # Backend configuration (Supabase URLs, Database URL, JWT Secrets)
│   ├── requirements.txt         # Python package requirements
│   └── app/
│       ├── main.py              # Application core, CORS configurations
│       ├── config.py            # System configuration loader
│       ├── database.py          # SQLAlchemy engine & sessionlocal bindings
│       ├── models.py            # Database tables (User, UserDocument)
│       ├── schemas.py           # Pydantic validation schemas
│       ├── auth.py              # Passwords hashing and JWT tokens generator
│       ├── routes/
│       │   ├── auth.py          # Sign Up and Login API endpoints
│       │   ├── profile.py       # Fetch and Update Profile API endpoints
│       │   ├── schemes.py       # Recommendations, Search, and Scheme details endpoints
│       │   └── documents.py     # Document uploading and metadata retrieval routes
│       └── services/
│           ├── recommendation.py# Pandas multi-criteria filtering engine
│           ├── supabase_storage.py # Supabase storage communications client
│           └── translation.py   # Thread-safe hybrid translate cache service
│
└── sahayak_frontend/            # React.js UI Client
    ├── package.json             # NPM dependencies list
    ├── .env                     # Vite backend API target port (VITE_API_URL)
    └── src/
        ├── App.jsx              # Routing configurations
        ├── main.jsx             # React client entry point
        ├── index.css            # Custom glassmorphic styling system & utility classes
        ├── components/
        │   ├── AuthLayout.jsx   # Centered glass form card container
        │   ├── FormField.jsx     # Form input wrapper with high-readability labels
        │   ├── LanguageSwitcher.jsx # Floating glass language controller
        │   ├── ProfileMenu.jsx   # Avatar dropdown menu in the header
        │   └── VoiceAssistant.jsx# Web Speech STT recorder & HTML5 Audio TTS player
        ├── contexts/
        │   └── AuthContext.jsx   # JWT state provider & local storage manager
        ├── pages/
        │   ├── Home.jsx          # Public introduction landing page
        │   ├── SignIn.jsx        # Login page (redirects to onboarding if incomplete)
        │   ├── SignUp.jsx        # Account registration
        │   ├── onboarding.jsx    # 3-step profile builder
        │   ├── Dashboard.jsx     # Schemes feed page
        │   └── DocumentVerification.jsx # Drag & drop document vault
        └── translations/
            ├── en.json / hi.json / te.json / kn.json # Translation catalogs
            └── i18n.js          # Translation initializations
```

---

## Installation & Setup

### 1. Database Setup (Supabase)
1. Go to the [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor**, paste the queries from the root [schema.sql](file:///Users/anusreereddysama/Desktop/SAHAYAK/schema.sql) file, and click **Run**.
3. Go to **Storage**, click **New Bucket**, and create a **private** bucket named `user-documents`.
4. Copy your Database URL, Project API URL, and Service Role key from your project's settings page.

### 2. Run the Backend (`sahayak_backend`)
1. Navigate to the backend folder:
   ```bash
   cd sahayak_backend
   ```
2. Create and configure your `.env` file based on the environment variables:
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
   SUPABASE_URL="https://[PROJECT-REF].supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
   JWT_SECRET="[YOUR-SECRET-SIGNING-KEY]"
   ```
3. Initialize the Python virtual environment and install requirements:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
4. Start the development server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

### 3. Run the Frontend (`sahayak_frontend`)
1. Open a new terminal tab and navigate to the frontend folder:
   ```bash
   cd sahayak_frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Verify that your `.env` contains:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Navigate to **`http://localhost:5173`** (or `http://localhost:5174` depending on your active port) to open the application.
