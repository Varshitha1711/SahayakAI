import os
from fastapi import HTTPException
from supabase import create_client, Client
from app.config import settings

_supabase_client = None

def get_supabase_client() -> Client:
    """
    Initializes the Supabase client lazily.
    Prevents server startup crashes if credentials are not configured or are placeholder keys.
    """
    global _supabase_client
    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY or "your-project-id" in settings.SUPABASE_URL:
            raise HTTPException(
                status_code=500,
                detail="Supabase Storage is not configured. Please supply valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
            )
        try:
            _supabase_client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize Supabase client: {str(e)}. Ensure the key is a valid JWT starting with 'eyJ'."
            )
    return _supabase_client

def upload_document_to_supabase(user_id: str, document_type: str, file_name: str, file_content: bytes) -> str:
    """
    Uploads document bytes to the private 'user-documents' storage bucket in Supabase.
    Saves in path: '{user_id}/{document_type_clean}.{extension}'.
    Generates and returns a signed URL valid for 1 year for rendering.
    """
    bucket_name = "user-documents"
    client = get_supabase_client()
    
    # Extract file extension and construct safe, deterministic filename
    _, ext = os.path.splitext(file_name)
    ext = ext.lower()
    
    # Construct a clean filename e.g. "aadhaar.pdf"
    clean_doc_type = document_type.strip().lower().replace(" ", "_")
    safe_filename = f"{clean_doc_type}{ext}"
    storage_path = f"{user_id}/{safe_filename}"
    
    # Upload file bytes to Supabase Storage (with upsert option enabled)
    try:
        client.storage.from_(bucket_name).upload(
            path=storage_path,
            file=file_content,
            file_options={"x-upsert": "true"}
        )
    except Exception as e:
        # If the file already exists and upload fails, we try to update
        try:
            client.storage.from_(bucket_name).update(
                path=storage_path,
                file=file_content
            )
        except Exception as update_err:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload file to Supabase Storage: {str(update_err)}"
            ) from e
            
    # Generate a secure signed URL valid for 1 year (31,536,000 seconds)
    try:
        signed_url_res = client.storage.from_(bucket_name).create_signed_url(
            path=storage_path,
            expires_in=31536000
        )
        url = signed_url_res.get("signedURL") or signed_url_res.get("signedUrl")
        return url
    except Exception as e:
        # If signed URL generation fails, fallback to standard public URL
        public_url_res = client.storage.from_(bucket_name).get_public_url(storage_path)
        return public_url_res
