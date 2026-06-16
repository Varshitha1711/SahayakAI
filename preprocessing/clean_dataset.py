import pandas as pd
import re
from pathlib import Path


# ==========================
# PATHS
# ==========================

BASE_DIR = Path(__file__).resolve().parent.parent

RAW_FILE = BASE_DIR / "data" / "raw" / "schemes.csv"

OUTPUT_FILE = BASE_DIR / "data" / "processed" / "schemes_clean.csv"

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)


# ==========================
# TEXT CLEANER
# ==========================

def clean_text(text):
    """
    Cleans text fields.
    """

    if pd.isna(text):
        return ""

    text = str(text)

    # remove strange unicode characters
    text = text.replace("\ufeff", " ")

    # remove extra spaces
    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ==========================
# LOAD DATA
# ==========================

print("Loading dataset...")

df = pd.read_csv(RAW_FILE)

print(f"Rows before cleaning: {len(df)}")


# ==========================
# REMOVE EMPTY COLUMNS
# ==========================

if "Unnamed: 9" in df.columns:
    df.drop(columns=["Unnamed: 9"], inplace=True)

print("Removed empty columns")


# ==========================
# REMOVE DUPLICATES
# ==========================

df.drop_duplicates(
    subset=["scheme_name"],
    inplace=True
)

print(f"Rows after removing duplicates: {len(df)}")


# ==========================
# CLEAN ALL TEXT COLUMNS
# ==========================

text_columns = [
    "scheme_name",
    "slug",
    "details",
    "benefits",
    "eligibility",
    "application",
    "documents",
    "level",
    "schemeCategory",
    "tags"
]

for col in text_columns:

    if col in df.columns:
        df[col] = df[col].apply(clean_text)

print("Cleaned text fields")


# ==========================
# HANDLE NULL VALUES
# ==========================

default_values = {
    "details": "Not Available",
    "benefits": "Not Available",
    "eligibility": "Not Available",
    "application": "Not Available",
    "documents": "Not Available",
    "level": "Unknown",
    "schemeCategory": "Others",
    "tags": ""
}

df.fillna(default_values, inplace=True)

print("Handled missing values")


# ==========================
# REMOVE EMPTY SCHEME NAMES
# ==========================

df = df[
    df["scheme_name"].notna()
]

df = df[
    df["scheme_name"].str.strip() != ""
]

print(f"Rows after validation: {len(df)}")


# ==========================
# STANDARDIZE LEVEL
# ==========================

df["level"] = (
    df["level"]
    .str.strip()
    .str.title()
)

valid_levels = [
    "Central",
    "State",
    "Union Territory"
]

df.loc[
    ~df["level"].isin(valid_levels),
    "level"
] = "Other"


# ==========================
# CREATE SCHEME ID
# ==========================

df.insert(
    0,
    "scheme_id",
    range(1, len(df) + 1)
)

print("Generated scheme IDs")


# ==========================
# SAVE FILE
# ==========================

df.to_csv(
    OUTPUT_FILE,
    index=False
)

print("\nDataset cleaned successfully")
print(f"Final rows: {len(df)}")
print(f"Saved to: {OUTPUT_FILE}")