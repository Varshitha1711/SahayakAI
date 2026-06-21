from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes.auth import router as auth_router
from app.routes.profile import router as profile_router
from app.routes.schemes import router as schemes_router
from app.routes.documents import router as documents_router
from app.routes.chat import router as chat_router

# Attempt to auto-create tables in Supabase on startup
from sqlalchemy import text
try:
    Base.metadata.create_all(bind=engine)
    # Seamless migration for email_notifications column
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;"))
        conn.commit()
    print("Database tables synchronized successfully.")
except Exception as e:
    print(f"Startup Warning: Could not sync database tables (normal if .env connection credentials are placeholder): {e}")

app = FastAPI(
    title="Sahayak AI API",
    description="SAHAYAKAI - Bridging Citizens and Services in India",
    version="1.0.0"
)

# CORS: allow local dev + Vercel frontend
# Note: FastAPI's CORSMiddleware does not support wildcards like "*.vercel.app".
# So we allow the common Vercel patterns explicitly.
vercel_origins = [
    "https://vercel.app",
    "https://vercel.com",
    "https://sahayak-ai-ebon.vercel.app",
]


allow_origins = [
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:5174", "http://127.0.0.1:5174",
    "http://localhost:5175", "http://127.0.0.1:5175",
    "http://localhost:3000", "http://127.0.0.1:3000",
    *vercel_origins,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include route paths
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(schemes_router)
app.include_router(documents_router)
app.include_router(chat_router)

@app.get("/")
def read_root():
    """Service health check endpoint."""
    return {
        "app": "Sahayak AI API",
        "status": "healthy",
        "tagline": "SAHAYAKAI - Bridging Citizens and Services"
    }
