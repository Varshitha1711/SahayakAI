import uuid
from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    state = Column(String(50), nullable=True)
    district = Column(String(50), nullable=True)
    occupation = Column(String(50), nullable=True)
    annual_income = Column(Numeric, nullable=True)
    category = Column(String(20), nullable=True)
    education_level = Column(String(50), nullable=True)
    disability_status = Column(Boolean, default=False, nullable=True)
    marital_status = Column(String(20), nullable=True)
    email_notifications = Column(Boolean, default=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("TIMEZONE('utc'::text, NOW())"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("TIMEZONE('utc'::text, NOW())"), nullable=False, onupdate=text("TIMEZONE('utc'::text, NOW())"))

    # Relationships
    documents = relationship("UserDocument", back_populates="user", cascade="all, delete-orphan")


class UserDocument(Base):
    __tablename__ = "user_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(50), nullable=False) # e.g. 'Aadhaar', 'Income Certificate', 'Caste Certificate'
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False) # Storage path inside bucket
    file_url = Column(String(1000), nullable=False) # Public/signed URL
    uploaded_at = Column(DateTime(timezone=True), server_default=text("TIMEZONE('utc'::text, NOW())"), nullable=False)

    # Relationships
    user = relationship("User", back_populates="documents")
