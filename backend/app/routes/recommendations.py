from fastapi import APIRouter
from app.database import supabase
from app.services.eligibility_engine import is_eligible

router = APIRouter(
prefix="/recommendations",
tags=["Recommendations"]
)

@router.get("/")
def get_recommendations():
# Dummy user for testing
    user = {
    "age": 21,
    "gender": "Female",
    "state": "Andhra Pradesh",
    "occupation": "Student",
    "annual_income": 150000,
    "category": "SC"
    }

# Fetch all scheme eligibility records
    response = (
    supabase
    .table("scheme_eligibility")
    .select("*")
    .execute()
    )

    schemes = response.data

    eligible_schemes = []

    for scheme in schemes:

        try:
            if is_eligible(user, scheme):
                    eligible_schemes.append({
                "scheme_id": scheme["scheme_id"]
            })

        except Exception as e:
            print(
            f"Error processing scheme {scheme.get('scheme_id')}: {e}"
            )

    return {
    "status": "success",
    "count": len(eligible_schemes),
    "eligible_schemes": eligible_schemes
    }

