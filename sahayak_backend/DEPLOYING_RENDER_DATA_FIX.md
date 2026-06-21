# Render backend dataset loading fix

Your Render logs show:
- `ERROR: Failed to load datasets: [Errno 2] No such file or directory: 'eligibility_structured.csv'`

That means `CSV_DATA_DIR` points to a directory where `eligibility_structured.csv` and `schemes_clean.csv` are not present.

## Option A (recommended): move/copy CSVs into sahayak_backend/
Place these files inside `sahayak_backend/` in your repo and commit:
- `sahayak_backend/eligibility_structured.csv`
- `sahayak_backend/schemes_clean.csv`

Then set in Render:
- `CSV_DATA_DIR=.`

## Option B: set CSV_DATA_DIR to match Render’s working directory
Try these values in Render (Environment variables) and redeploy backend after each change:
- `CSV_DATA_DIR=.`
- `CSV_DATA_DIR=sahayak_backend`
- `CSV_DATA_DIR=..` (only if Render working dir is `sahayak_backend/`)

## How to verify
After redeploy, backend logs must contain:
- `Datasets loaded successfully. Schemes: ... Eligibility Rules: ...`

