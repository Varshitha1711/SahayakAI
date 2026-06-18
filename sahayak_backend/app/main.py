from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes.auth import router as auth_router
from app.routes.profile import router as profile_router
from app.routes.schemes import router as schemes_router
from app.routes.documents import router as documents_router

# Attempt to auto-create tables in Supabase on startup
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables synchronized successfully.")
except Exception as e:
    print(f"Startup Warning: Could not sync database tables (normal if .env connection credentials are placeholder): {e}")

app = FastAPI(
    title="Sahayak AI API",
    description="Bridging Citizens and Government Services in India",
    version="1.0.0"
)

# Enable CORS for frontend local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175",
        "http://localhost:3000", "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include route paths
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(schemes_router)
app.include_router(documents_router)

@app.get("/")
def read_root():
    """Service health check endpoint."""
    return {
        "app": "Sahayak AI API",
        "status": "healthy",
        "tagline": "Bridging Citizens and Government Services"
    }
