import os
import pandas as pd
import numpy as np
import json
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from app.config import settings
from app.models import User

# In-memory storage for DataFrames
eligibility_df = None
schemes_df = None
dynamic_schemes_cache = {}
user_rec_cache = {}

# Persistent caches
CACHE_FILE = None
USER_REC_CACHE_FILE = None

def load_dynamic_cache():
    pass

def save_dynamic_cache():
    pass

def load_user_rec_cache():
    pass

def save_user_rec_cache():
    pass


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
    finally:
        load_dynamic_cache()
        load_user_rec_cache()

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

def matches_state_name_exclusion(scheme_row, user_state: str) -> bool:
    """
    Returns True if the scheme's text mentions another state/UT but does not
    mention the user's state/UT, indicating a state mismatch.
    """
    s_name = str(scheme_row.get("scheme_name", "")).lower()
    u_state = user_state.lower()
    
    state_aliases = {
        "andhra pradesh": ["andhra", "ap"],
        "telangana": ["telangana", "ts"],
        "tamil nadu": ["tamil nadu", "tn"],
        "west bengal": ["west bengal", "wb"],
        "madhya pradesh": ["madhya pradesh", "mp"],
        "uttar pradesh": ["uttar pradesh", "up"],
        "himachal pradesh": ["himachal pradesh", "hp"],
        "jammu and kashmir": ["jammu", "kashmir", "j&k", "jk"]
    }
    
    all_states = [
        "telangana", "andhra pradesh", "haryana", "tamil nadu", "west bengal",
        "kerala", "karnataka", "punjab", "gujarat", "madhya pradesh",
        "maharashtra", "odisha", "rajasthan", "uttar pradesh", "bihar",
        "jharkhand", "assam", "uttarakhand", "puducherry", "delhi", "himachal pradesh",
        "goa", "chandigarh", "jammu", "kashmir", "pondicherry", "sikkim", "tripura",
        "manipur", "meghalaya", "mizoram", "nagaland", "arunachal pradesh", "chhattisgarh"
    ]
    
    # Gather all text associated with the scheme to inspect
    scheme_text = " ".join([
        s_name,
        str(scheme_row.get("details", "")).lower(),
        str(scheme_row.get("benefits", "")).lower(),
        str(scheme_row.get("eligibility", "")).lower(),
        str(scheme_row.get("application", "")).lower(),
        str(scheme_row.get("documents", "")).lower(),
        str(scheme_row.get("tags", "")).lower()
    ])
    
    for state in all_states:
        if state in scheme_text:
            is_match = (state == u_state)
            if not is_match and u_state in state_aliases:
                for alias in state_aliases[u_state]:
                    if alias in state:
                        is_match = True
                        break
            if not is_match:
                has_user_state = (u_state in scheme_text)
                if not has_user_state and u_state in state_aliases:
                    for alias in state_aliases[u_state]:
                        if f" {alias} " in f" {scheme_text} ":
                            has_user_state = True
                            break
                if not has_user_state:
                    return True # Mentions another state but not user's state -> Mismatch!
                    
    for state, aliases in state_aliases.items():
        if state != u_state:
            for alias in aliases:
                if f" {alias} " in f" {scheme_text} " or scheme_text.endswith(f" - {alias}") or scheme_text.startswith(f"{alias} "):
                    has_user_state = (u_state in scheme_text)
                    if not has_user_state and u_state in state_aliases:
                        for u_alias in state_aliases[u_state]:
                            if f" {u_alias} " in f" {scheme_text} ":
                                has_user_state = True
                                break
                    if not has_user_state:
                        return True
                        
    return False

def get_dynamic_llm_recommendations(user: User) -> list[dict]:
    """
    Uses Groq Llama-3.3 to dynamically recommend official and realistic schemes
    matching the user's specific profile.

    NOTE: recommendation results were previously served from a persistent cache.
    That can make scheme updates appear “stuck” after profile changes.

    To ensure profile changes are reflected reliably, we now bypass the
    persistent user recommendation cache and always regenerate when called.
    """
    # Generate profile hash
    import hashlib
    u_income = float(user.annual_income) if user.annual_income is not None else None
    profile_str = f"{user.id}:{user.state}:{user.age}:{user.gender}:{user.occupation}:{u_income}:{user.category}:{user.education_level}:{bool(user.disability_status)}:{user.marital_status}"
    p_hash = hashlib.md5(profile_str.encode("utf-8")).hexdigest()

    global user_rec_cache, dynamic_schemes_cache
    # Always regenerate (avoid stale recommendations across profile updates)
    # Cache is still written at the end for future calls.
    if p_hash in user_rec_cache:
        print(f"Using cached recommendations for user {user.id}")

        rec_ids = user_rec_cache[p_hash]

        cached_schemes = [
            dynamic_schemes_cache[sid]
            for sid in rec_ids
            if sid in dynamic_schemes_cache
        ]

        if cached_schemes:
            return cached_schemes
    api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
    if not api_key:
        print("WARNING: GROQ_API_KEY is not set. Skipping dynamic LLM recommendations.")
        return []

    # If the user profile is empty, skip calling LLM to avoid generic results
    if not user.state or user.age is None:
        return []

    # Format user profile
    profile = {
        "full_name": user.full_name,
        "age": user.age,
        "gender": user.gender,
        "state": user.state,
        "district": user.district,
        "occupation": user.occupation,
        "annual_income": u_income,
        "category": user.category,
        "education_level": user.education_level,
        "disability_status": bool(user.disability_status),
        "marital_status": user.marital_status
    }

    system_prompt = (
        "You are an expert government welfare scheme matchmaker for Indian citizens. "
        "Your goal is to recommend the most realistic, active, and official central government schemes and state government schemes "
        "matching the citizen's profile. "
        "CRITICAL RULES:\n"
        "1. STRICT ELIGIBILITY: You must ONLY recommend schemes that the citizen actually and strictly qualifies for. "
        "Verify the following constraints carefully:\n"
        "   - State constraint: The scheme level/state must match the user's state (e.g. only Andhra Pradesh state schemes and Central schemes for AP residents).\n"
        f"   - Income constraint: User's annual income is Rs. {profile['annual_income']}. Do NOT recommend schemes with low-income thresholds (like BPL / below poverty line / under 2 Lakhs annual income) if the user's income is high.\n"
        f"   - Occupation constraint: User's occupation is {profile['occupation']}. Do NOT recommend schemes for farmers, weavers, workers, or entrepreneurs if the user is a student.\n"
        f"   - Category constraint: User's caste category is {profile['category']}. If a scheme is restricted to SC/ST/OBC, do NOT recommend it to a General category user.\n"
        f"   - Disability constraint: User's disability status is {profile['disability_status']}. If this is False, you MUST NOT recommend any scheme that is restricted to specially-abled/disabled individuals (e.g. Saksham Scholarship Scheme). Only recommend disability schemes if this is True.\n"
        "2. Return a list of up to 6 most relevant schemes that the user strictly qualifies for.\n\n"
        "The output must be a JSON object with a single key 'schemes' containing an array of schemes, where each scheme has: "
        "- scheme_id: a unique integer (generate starting from 100000) "
        "- scheme_name: official name of the scheme "
        "- benefits: details of financial or other benefits "
        "- eligibility: eligibility criteria "
        "- documents: list of required documents as a string or list "
        "- application: step-by-step application process, ensuring you include the exact official application portal URL (e.g., https://...) so the citizen knows where to apply "
        "- schemeCategory: category (e.g., Education & Learning, Health & Wellness, Social Welfare & Empowerment) "
        "- details: overview of the scheme "
        "- slug: a URL-friendly slug based on the scheme name "
        "- level: 'Central' or 'State' "
        "- tags: comma-separated keyword tags "
        "Output ONLY the JSON. No explanations, no markdown blocks."
    )

    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "User Profile: {profile_json}")
        ])
        
        result = None
        # Try Llama 3.3 first
        try:
            print("Attempting to get dynamic recommendations using llama-3.3-70b-versatile...")
            llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                groq_api_key=api_key,
                temperature=0.1,
                response_format={"type": "json_object"},
                max_retries=1
            )
            chain = prompt | llm | JsonOutputParser()
            result = chain.invoke({"profile_json": json.dumps(profile)})
        except Exception as e33:
            print(f"WARNING: llama-3.3-70b-versatile failed ({e33}). Falling back to llama-3.1-8b-instant...")
            # Fallback to Llama 3.1 8b
            llm = ChatGroq(
                model="llama-3.1-8b-instant",
                groq_api_key=api_key,
                temperature=0.1,
                response_format={"type": "json_object"},
                max_retries=1
            )
            chain = prompt | llm | JsonOutputParser()
            result = chain.invoke({"profile_json": json.dumps(profile)})
        
        schemes = result.get("schemes", []) if result else []
        formatted_schemes = []
        for i, s in enumerate(schemes):
            scheme_id = s.get("scheme_id")
            if not isinstance(scheme_id, int):
                scheme_id = 100000 + i
                
            docs = s.get("documents")
            if isinstance(docs, list):
                docs = ", ".join(docs)
                
            formatted_schemes.append({
                "scheme_id": scheme_id,
                "scheme_name": str(s.get("scheme_name", "")),
                "slug": str(s.get("slug", "")),
                "details": str(s.get("details", "")),
                "benefits": str(s.get("benefits", "")),
                "eligibility": str(s.get("eligibility", "")),
                "application": str(s.get("application", "")),
                "documents": str(docs or ""),
                "level": str(s.get("level", "Central")),
                "schemeCategory": str(s.get("schemeCategory", "")),
                "tags": str(s.get("tags", ""))
            })
        
        # Store in dynamic schemes cache
        rec_ids = []
        for s in formatted_schemes:
            dynamic_schemes_cache[s["scheme_id"]] = s
            rec_ids.append(s["scheme_id"])
        save_dynamic_cache()
        
        # Store in user recommendations cache
        user_rec_cache[p_hash] = rec_ids
        save_user_rec_cache()
            
        return formatted_schemes
    except Exception as e:
        print(f"ERROR: Dynamic scheme recommendation failed completely: {e}")
        return []

def get_recommended_schemes(user: User) -> list[dict]:
    """
    Evaluates each scheme eligibility criteria against the user profile.
    Returns a list of scheme detail dictionaries that the user qualifies for.
    """
    global eligibility_df, schemes_df
    
    # 1. Fetch dynamic LLM recommendations (especially targeting realistic schemes)
    dynamic_schemes = get_dynamic_llm_recommendations(user)
    
    # 2. Get static matches from CSV database
    csv_schemes = []
    if eligibility_df is not None and schemes_df is not None and len(eligibility_df) > 0:
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
        
        # Build in-memory map of schemes to check details on the fly
        schemes_map = {row["scheme_id"]: row for _, row in schemes_df.iterrows()}
        
        for _, row in eligibility_df.iterrows():
            scheme_id = row.get("scheme_id")
            scheme_detail = schemes_map.get(scheme_id)
            if scheme_detail is None:
                continue
                
            scheme_name = str(scheme_detail.get("scheme_name", ""))
            scheme_name_lower = scheme_name.lower()
            
            # Build full scheme text for deep text keyword checks
            scheme_text_lower = " ".join([
                scheme_name,
                str(scheme_detail.get("details", "")),
                str(scheme_detail.get("benefits", "")),
                str(scheme_detail.get("eligibility", "")),
                str(scheme_detail.get("application", "")),
                str(scheme_detail.get("documents", "")),
                str(scheme_detail.get("tags", ""))
            ]).lower()
            
            # --- Robust Rule-Based Exclusion Filters ---
            
            # A. State mismatch filter
            if u_state and matches_state_name_exclusion(scheme_detail, u_state):
                continue
                
            # B. Disability mismatch filter
            if not u_disability:
                disability_keywords = [
                    "differently abled", "blind", "leprosy", "deaf", "disabled", "handicapped", 
                    "autism", "cerebral palsy", "visually impaired", "braille", "hearing impairment", 
                    "handicap", "deformed leprosy", "mentally challenged", "orthopedically", "intellectual disability",
                    "smartcane", "folding stick", "artificial limbs", "aids and appliances", "hearing aid", "hearing aids",
                    "visually challenged", "physically challenged", "disabled persons", "crutches", "tricycle", "wheelchair", "prosthetic"
                ]
                if any(kw in scheme_name_lower or kw in scheme_text_lower for kw in disability_keywords):
                    continue
                    
            # C. Gender mismatch filter
            if u_gender == "male":
                male_exclude = ["girl", "women", "female", "mahila", "widow", "maternity", "lactating", "pregnancy", "pregnant", "bride", "shaadi", "marriage assistance"]
                if any(kw in scheme_name_lower or kw in scheme_text_lower for kw in male_exclude):
                    continue
            elif u_gender == "female":
                female_exclude = ["boy", "men", "male", "groom"]
                if any(kw in scheme_name_lower or kw in scheme_text_lower for kw in female_exclude):
                    if "female" not in scheme_name_lower and "women" not in scheme_name_lower and "female" not in scheme_text_lower and "women" not in scheme_text_lower:
                        continue
                        
            # D. Occupation mismatch filter
            if u_occupation == "student":
                student_exclude = [
                    "farmer", "rythu", "krishi", "cultivator", "kisan", "weaver", "handloom", "artisan", "laborer", "worker", "shepherd", "fisherman", "potter",
                    "trader", "self employed", "self-employed", "vyapari", "shopkeeper", "retailer", "hawker", "vendor", "merchant", "entrepreneur", "business owner",
                    "micro enterprises", "msme", "pensioners", "senior citizen", "old age"
                ]
                if any(kw in scheme_name_lower or kw in scheme_text_lower for kw in student_exclude):
                    if not any(student_kw in scheme_name_lower for student_kw in ["student", "education", "scholarship", "college", "school"]):
                        continue
                        
            # E. Marital / Newborn / Pregnancy Filter
            if u_marital == "single" or u_occupation == "student":
                single_exclude = [
                    "marriage assistance", "marriage gift", "bride", "shaadi", "kalyanamastu", "shaadi mubarak", 
                    "marriage incentive", "marriage support", "wedding", "widow", "divorced", "destitute women",
                    "newborn", "new born", "infant", "toddler", "lactating", "pregnancy", "pregnant", 
                    "maternity", "maternal", "matritva", "delivery facility", "childbirth", "child birth", "antenatal"
                ]
                if any(kw in scheme_name_lower or kw in scheme_text_lower for kw in single_exclude):
                    if not any(student_kw in scheme_name_lower for student_kw in ["student", "education", "scholarship", "college", "school"]):
                        continue

            # F. BPL / Low Income Exclusion for high income users
            if u_income is not None and u_income > 200000:
                bpl_exclude = [
                    "bpl", "below poverty line", "poor families", "destitute", "low income", "marginalized families", 
                    "low-income", "impoverished", "poverty line", "manual scavengers", "landless", "street vendor", 
                    "ragpickers", "slum dweller", "economically weaker", "ews"
                ]
                if any(kw in scheme_name_lower or kw in scheme_text_lower for kw in bpl_exclude):
                    if not any(student_kw in scheme_name_lower for student_kw in ["student", "education", "scholarship", "college", "school"]):
                        continue
                        
            # --- Standard Criteria Checks ---
            
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
                if row_gender.lower() != u_gender:
                    continue
                    
            # 3. State check
            row_state = clean_val(row.get("state"))
            if row_state and u_state:
                if row_state.lower() != u_state:
                    continue
                    
            # 4. Occupation check
            row_occupation = clean_val(row.get("occupation"))
            if row_occupation and u_occupation:
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
                categories = [c.strip().lower() for c in row_category.split(",")]
                if u_category not in categories:
                    continue
                    
            # 7. Education check
            row_edu = clean_val(row.get("education_level"))
            if row_edu and u_education:
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
        for _, row in matched_schemes.iterrows():
            csv_schemes.append({
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
            
    # Merge and deduplicate by scheme_name (case-insensitive)
    seen_names = set()
    merged_results = []
    
    # Add dynamic LLM recommendations first (high quality, state-specific)
    for s in dynamic_schemes:
        name = s["scheme_name"].strip().lower()
        if name not in seen_names:
            seen_names.add(name)
            merged_results.append(s)
            
    # Add CSV matches next
    for s in csv_schemes:
        name = s["scheme_name"].strip().lower()
        if name not in seen_names:
            seen_names.add(name)
            merged_results.append(s)
            
    return merged_results

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
