import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Database Settings
    DATABASE_URL: str
    
    # Supabase Client Settings (For Storage upload)
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    # JWT Security Settings
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # CSV Data Directory Settings
    # Default: repo root (Render repo contents are mounted there)
    # so `eligibility_structured.csv` and `schemes_clean.csv` resolve correctly.
    CSV_DATA_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))



    # Groq API Configuration
    GROQ_API_KEY: str | None = None

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        extra="ignore"
    )

settings = Settings()
# Validate values are not default placeholders
if "your-project-id" in settings.DATABASE_URL:
    print("WARNING: Default database credentials detected in settings. Please configure your .env file with real credentials.")
