from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from decimal import Decimal

# --- Authentication Schemas ---

class UserSignUp(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=50)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None

# --- Profile Schemas ---

class UserProfileUpdate(BaseModel):
    age: int = Field(..., ge=0, le=120)
    gender: str = Field(..., min_length=2, max_length=20)
    state: str = Field(..., min_length=2, max_length=50)
    district: str = Field(..., min_length=2, max_length=50)
    occupation: str = Field(..., min_length=2, max_length=50)
    annual_income: float = Field(..., ge=0)
    category: str = Field(..., min_length=2, max_length=20)
    education_level: str = Field(..., min_length=2, max_length=50)
    disability_status: bool = Field(default=False)
    marital_status: str = Field(..., min_length=2, max_length=20)
    email_notifications: bool = Field(default=True)


class UserProfile(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    age: int | None = None
    gender: str | None = None
    state: str | None = None
    district: str | None = None
    occupation: str | None = None
    annual_income: float | None = None
    category: str | None = None
    education_level: str | None = None
    disability_status: bool = False
    marital_status: str | None = None
    email_notifications: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Document Schemas ---

class UserDocumentResponse(BaseModel):
    id: UUID
    document_type: str
    file_name: str
    file_url: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

# --- Scheme Recommendation Schemas ---

class SchemeResponse(BaseModel):
    scheme_id: int
    scheme_name: str
    benefits: str | None = None
    eligibility: str | None = None
    documents: str | None = None
    application: str | None = None
    schemeCategory: str | None = None
    details: str | None = None
    slug: str | None = None
    level: str | None = None
    tags: str | None = None

    class Config:
        from_attributes = True
