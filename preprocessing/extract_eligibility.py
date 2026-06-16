import pandas as pd
import re
from pathlib import Path

# ==========================
# PATHS
# ==========================

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_FILE = (
    BASE_DIR /
    "data" /
    "processed" /
    "schemes_clean.csv"
)

OUTPUT_FILE = (
    BASE_DIR /
    "data" /
    "processed" /
    "eligibility_structured.csv"
)

# ==========================
# LOOKUP LISTS
# ==========================

STATES = [
    "andhra pradesh",
    "telangana",
    "karnataka",
    "kerala",
    "tamil nadu",
    "maharashtra",
    "gujarat",
    "odisha",
    "west bengal",
    "punjab",
    "haryana",
    "rajasthan",
    "uttar pradesh",
    "madhya pradesh"
]

OCCUPATIONS = [
    "student",
    "farmer",
    "labour",
    "labor",
    "worker",
    "entrepreneur",
    "businessman",
    "businesswoman",
    "self employed",
    "government employee",
    "private employee",
    "unemployed",
    "artisan"
]

CATEGORIES = [
    "sc",
    "st",
    "obc",
    "ews",
    "minority"
]

# ==========================
# AGE EXTRACTION
# ==========================

def extract_age(text):

    text = text.lower()

    patterns = [
        r'(\d+)\s*to\s*(\d+)\s*years',
        r'between\s*(\d+)\s*and\s*(\d+)',
    ]

    for pattern in patterns:

        match = re.search(pattern, text)

        if match:
            return int(match.group(1)), int(match.group(2))

    ages = re.findall(
        r'(\d+)\s*(?:years|year|yrs|yr)',
        text
    )

    if len(ages) == 1:
        return int(ages[0]), None

    if len(ages) >= 2:
        ages = [int(x) for x in ages]
        return min(ages), max(ages)

    return None, None


# ==========================
# INCOME EXTRACTION
# ==========================

def extract_income(text):

    text = text.lower()

    lakh_match = re.search(
        r'(\d+(?:\.\d+)?)\s*lakh',
        text
    )

    if lakh_match:
        return int(
            float(
                lakh_match.group(1)
            ) * 100000
        )

    crore_match = re.search(
        r'(\d+(?:\.\d+)?)\s*crore',
        text
    )

    if crore_match:
        return int(
            float(
                crore_match.group(1)
            ) * 10000000
        )

    rs_match = re.search(
        r'rs\.?\s*(\d[\d,]*)',
        text
    )

    if rs_match:
        value = rs_match.group(1)
        value = value.replace(",", "")
        return int(value)

    return None


# ==========================
# GENDER
# ==========================

def extract_gender(text):

    text = text.lower()

    female_words = [
        "female",
        "women",
        "woman",
        "girl",
        "girls"
    ]

    male_words = [
        "male",
        "men",
        "man",
        "boys"
    ]

    if any(word in text for word in female_words):
        return "Female"

    if any(word in text for word in male_words):
        return "Male"

    return "Any"


# ==========================
# CATEGORY
# ==========================

def extract_category(text):

    text = text.lower()

    found = []

    for category in CATEGORIES:

        if category in text:
            found.append(category.upper())

    if found:
        return ",".join(found)

    return "Any"


# ==========================
# OCCUPATION
# ==========================

def extract_occupation(text):

    text = text.lower()

    found = []

    for occ in OCCUPATIONS:

        if occ in text:
            found.append(occ.title())

    if found:
        return ",".join(found)

    return "Any"


# ==========================
# STATE
# ==========================

def extract_state(text):

    text = text.lower()

    for state in STATES:

        if state in text:
            return state.title()

    return "All India"


# ==========================
# EDUCATION LEVEL
# ==========================

def extract_education(text):

    text = text.lower()

    if "phd" in text:
        return "PhD"

    if "post graduate" in text or "pg" in text:
        return "PG"

    if "graduate" in text or "degree" in text:
        return "UG"

    if "intermediate" in text:
        return "Intermediate"

    if "10th" in text:
        return "10th"

    if "student" in text:
        return "Student"

    return "Any"


# ==========================
# DISABILITY
# ==========================

def extract_disability(text):

    text = text.lower()

    keywords = [
        "disabled",
        "disability",
        "differently abled",
        "pwd"
    ]

    if any(word in text for word in keywords):
        return "Yes"

    return "Any"


# ==========================
# MARITAL STATUS
# ==========================

def extract_marital_status(text):

    text = text.lower()

    if "widow" in text:
        return "Widowed"

    if "married" in text:
        return "Married"

    if "unmarried" in text:
        return "Single"

    return "Any"


# ==========================
# LOAD DATA
# ==========================

df = pd.read_csv(INPUT_FILE)

records = []

# ==========================
# PROCESS EACH SCHEME
# ==========================

for _, row in df.iterrows():

    eligibility_text = str(
        row.get("eligibility", "")
    )

    min_age, max_age = extract_age(
        eligibility_text
    )

    record = {

        "scheme_id":
        row["scheme_id"],

        "scheme_name":
        row["scheme_name"],

        "min_age":
        min_age,

        "max_age":
        max_age,

        "gender":
        extract_gender(
            eligibility_text
        ),

        "state":
        extract_state(
            eligibility_text
        ),

        "occupation":
        extract_occupation(
            eligibility_text
        ),

        "income_limit":
        extract_income(
            eligibility_text
        ),

        "category":
        extract_category(
            eligibility_text
        ),

        "education_level":
        extract_education(
            eligibility_text
        ),

        "disability_status":
        extract_disability(
            eligibility_text
        ),

        "marital_status":
        extract_marital_status(
            eligibility_text
        )
    }

    records.append(record)

# ==========================
# SAVE OUTPUT
# ==========================

result_df = pd.DataFrame(records)

result_df.to_csv(
    OUTPUT_FILE,
    index=False
)

print("Eligibility extraction completed")
print(f"Total schemes: {len(result_df)}")
print(f"Saved to: {OUTPUT_FILE}")