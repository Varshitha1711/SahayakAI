import os
import pandas as pd
import numpy as np
from app.config import settings
from app.models import User

# In-memory storage for DataFrames
eligibility_df = None
schemes_df = None

def load_datasets():
    """Loads CSV files on demand or startup."""
    global eligibility_df, schemes_df
    
    eligibility_path = os.path.join(settings.CSV_DATA_DIR, "eligibility_structured.csv")
    schemes_path = os.path.join(settings.CSV_DATA_DIR, "schemes_clean.csv")
    
    # Fallback to check backend root directory
    if not os.path.exists(eligibility_path):
        backend_root = os.path.dirname(settings.CSV_DATA_DIR)
        eligibility_path = os.path.join(backend_root, "eligibility_structured.csv")
        schemes_path = os.path.join(backend_root, "schemes_clean.csv")
        
    print(f"Loading datasets from: {eligibility_path} and {schemes_path}")
    
    try:
        eligibility_df = pd.read_csv(eligibility_path)
        schemes_df = pd.read_csv(schemes_path)
        # Drop duplicates or clean indexing if needed
        eligibility_df = eligibility_df.drop_duplicates(subset=["scheme_id"])
        schemes_df = schemes_df.drop_duplicates(subset=["scheme_id"])
        print(f"Datasets loaded successfully. Schemes: {len(schemes_df)}, Eligibility Rules: {len(eligibility_df)}")
    except Exception as e:
        print(f"ERROR: Failed to load datasets: {str(e)}")
        # Provide fallback empty dataframes
        eligibility_df = pd.DataFrame(columns=[
            "scheme_id", "scheme_name", "min_age", "max_age", "gender", 
            "state", "occupation", "income_limit", "category", 
            "education_level", "disability_status", "marital_status"
        ])
        schemes_df = pd.DataFrame(columns=[
            "scheme_id", "scheme_name", "slug", "details", "benefits", 
            "eligibility", "application", "documents", "level", 
            "schemeCategory", "tags"
        ])

# Load datasets upon importing this module
load_datasets()

def clean_val(val):
    """Utility to clean cell value and check if it has a valid filter string."""
    if pd.isna(val) or val is None:
        return None
    s = str(val).strip()
    if s.lower() in ["any", "all", "nan", "none", "all india", ""]:
        return None
    return s

def get_recommended_schemes(user: User) -> list[dict]:
    """
    Evaluates each scheme eligibility criteria against the user profile.
    Returns a list of scheme detail dictionaries that the user qualifies for.
    """
    global eligibility_df, schemes_df
    if eligibility_df is None or schemes_df is None or len(eligibility_df) == 0:
        return []
    
    eligible_ids = []
    
    # Extract user profile values
    u_age = user.age
    u_gender = str(user.gender).strip().lower() if user.gender else None
    u_state = str(user.state).strip().lower() if user.state else None
    u_occupation = str(user.occupation).strip().lower() if user.occupation else None
    u_income = float(user.annual_income) if user.annual_income is not None else None
    u_category = str(user.category).strip().lower() if user.category else None
    u_education = str(user.education_level).strip().lower() if user.education_level else None
    u_disability = bool(user.disability_status)
    u_marital = str(user.marital_status).strip().lower() if user.marital_status else None
    
    for _, row in eligibility_df.iterrows():
        # 1. Age check
        min_age = row.get("min_age")
        max_age = row.get("max_age")
        if u_age is not None:
            if not pd.isna(min_age) and min_age is not None and float(min_age) > u_age:
                continue
            if not pd.isna(max_age) and max_age is not None and float(max_age) < u_age:
                continue
        
        # 2. Gender check
        row_gender = clean_val(row.get("gender"))
        if row_gender and u_gender:
            # e.g., row_gender = 'female', u_gender = 'female'
            if row_gender.lower() != u_gender:
                continue
                
        # 3. State check
        row_state = clean_val(row.get("state"))
        if row_state and u_state:
            # if state in CSV is not "all india" or empty, it must match user's state
            if row_state.lower() != u_state:
                continue
                
        # 4. Occupation check
        row_occupation = clean_val(row.get("occupation"))
        if row_occupation and u_occupation:
            # CSV may contain comma-separated occupations e.g. "student,worker"
            occupations = [o.strip().lower() for o in row_occupation.split(",")]
            if u_occupation not in occupations:
                continue
                
        # 5. Income Limit check
        income_limit = row.get("income_limit")
        if u_income is not None and not pd.isna(income_limit) and income_limit is not None:
            if u_income > float(income_limit):
                continue
                
        # 6. Category check
        row_category = clean_val(row.get("category"))
        if row_category and u_category:
            # CSV may contain comma-separated categories e.g. "sc,st"
            categories = [c.strip().lower() for c in row_category.split(",")]
            if u_category not in categories:
                continue
                
        # 7. Education check
        row_edu = clean_val(row.get("education_level"))
        if row_edu and u_education:
            # simple match check
            if row_edu.lower() != u_education:
                continue
                
        # 8. Disability check
        row_disability = clean_val(row.get("disability_status"))
        if row_disability:
            is_disability_required = row_disability.lower() == "yes"
            if is_disability_required != u_disability:
                continue
                
        # 9. Marital Status check
        row_marital = clean_val(row.get("marital_status"))
        if row_marital and u_marital:
            if row_marital.lower() != u_marital:
                continue
                
        # If all checks pass, user is eligible!
        eligible_ids.append(int(row["scheme_id"]))
        
    # Join eligible scheme_ids with schemes details
    matched_schemes = schemes_df[schemes_df["scheme_id"].isin(eligible_ids)]
    
    # Format results as dictionary list
    results = []
    for _, row in matched_schemes.iterrows():
        results.append({
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
        })
        
    return results

def search_all_schemes(query: str) -> list[dict]:
    """Allows general keyword search across all schemes, regardless of eligibility."""
    global schemes_df
    if schemes_df is None or len(schemes_df) == 0 or not query:
        return []
        
    q = query.lower()
    # Search in name, details, benefits, schemeCategory, and tags
    mask = (
        schemes_df["scheme_name"].str.lower().str.contains(q, na=False) |
        schemes_df["details"].str.lower().str.contains(q, na=False) |
        schemes_df["benefits"].str.lower().str.contains(q, na=False) |
        schemes_df["schemeCategory"].str.lower().str.contains(q, na=False) |
        schemes_df["tags"].str.lower().str.contains(q, na=False)
    )
    
    matched = schemes_df[mask].head(50) # limit to top 50 results
    results = []
    for _, row in matched.iterrows():
        results.append({
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
        })
    return results
