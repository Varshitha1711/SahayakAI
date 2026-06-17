from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserProfile, UserProfileUpdate
from app.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["User Profile"])

@router.get("", response_model=UserProfile)
def get_profile(current_user: User = Depends(get_current_user)):
    """Retrieves the currently logged-in user's profile details."""
    return current_user

@router.put("", response_model=UserProfile)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates the logged-in user's profile details during onboarding or profile edits."""
    # Update profile fields
    current_user.age = profile_data.age
    current_user.gender = profile_data.gender
    current_user.state = profile_data.state
    current_user.district = profile_data.district
    current_user.occupation = profile_data.occupation
    current_user.annual_income = profile_data.annual_income
    current_user.category = profile_data.category
    current_user.education_level = profile_data.education_level
    current_user.disability_status = profile_data.disability_status
    current_user.marital_status = profile_data.marital_status
    
    db.commit()
    db.refresh(current_user)
    return current_user
