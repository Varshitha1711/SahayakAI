import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from app.auth import get_current_user
from app.models import User
from app.schemas import SchemeResponse
from app.services.recommendation import get_recommended_schemes, search_all_schemes, schemes_df
from app.services.translation import translate_scheme, translate_scheme_hybrid

router = APIRouter(prefix="/schemes", tags=["Schemes"])

@router.get("/recommendations", response_model=list[SchemeResponse])
def get_recommendations(
    background_tasks: BackgroundTasks,
    lang: str = Query("en"),
    current_user: User = Depends(get_current_user)
):
    """
    Evaluates the current user's profile and returns a list of schemes 
    they are eligible for, filtered using the matching logic.
    """
    if not current_user.state or current_user.age is None:
        return []
        
    schemes = get_recommended_schemes(current_user)
    
    results = []
    for i, s in enumerate(schemes):
        if i < 3:
            results.append(translate_scheme_hybrid(s, lang, lite=True, force_sync=True))
        else:
            results.append(translate_scheme_hybrid(s, lang, lite=True, force_sync=False))
            background_tasks.add_task(translate_scheme, s, lang, lite=True)
            
    return results

@router.get("/search", response_model=list[SchemeResponse])
def search_schemes(
    background_tasks: BackgroundTasks,
    q: str = Query(..., min_length=1),
    lang: str = Query("en")
):
    """Searches schemes across names, benefits, details, and tags."""
    schemes = search_all_schemes(q)
    
    results = []
    for i, s in enumerate(schemes):
        if i < 3:
            results.append(translate_scheme_hybrid(s, lang, lite=True, force_sync=True))
        else:
            results.append(translate_scheme_hybrid(s, lang, lite=True, force_sync=False))
            background_tasks.add_task(translate_scheme, s, lang, lite=True)
            
    return results


@router.get("/{scheme_id}", response_model=SchemeResponse)
def get_scheme_by_id(scheme_id: int, lang: str = Query("en")):
    """Retrieves full details of a specific scheme by its ID."""
    global schemes_df
    if schemes_df is None or len(schemes_df) == 0:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Scheme database not loaded"
        )
        
    matched = schemes_df[schemes_df["scheme_id"] == scheme_id]
    if len(matched) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme with ID {scheme_id} not found"
        )
        
    row = matched.iloc[0]
    scheme = {
        "scheme_id": int(row.get("scheme_id")),
        "scheme_name": str(row.get("scheme_name")),
        "slug": str(row.get("slug")) if not pd.isna(row.get("slug")) else None,
        "details": str(row.get("details")) if not pd.isna(row.get("details")) else None,
        "benefits": str(row.get("benefits")) if not pd.isna(row.get("benefits")) else None,
        "eligibility": str(row.get("eligibility")) if not pd.isna(row.get("eligibility")) else None,
        "application": str(row.get("application")) if not pd.isna(row.get("application")) else None,
        "documents": str(row.get("documents")) if not pd.isna(row.get("documents")) else None,
        "level": str(row.get("level")) if not pd.isna(row.get("level")) else None,
        "schemeCategory": str(row.get("schemeCategory")) if not pd.isna(row.get("schemeCategory")) else None,
        "tags": str(row.get("tags")) if not pd.isna(row.get("tags")) else None,
    }
    return translate_scheme(scheme, lang)
