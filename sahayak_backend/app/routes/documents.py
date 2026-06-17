from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import UserDocument, User
from app.schemas import UserDocumentResponse
from app.auth import get_current_user
from app.services.supabase_storage import upload_document_to_supabase

router = APIRouter(prefix="/documents", tags=["Documents"])

VALID_DOCUMENT_TYPES = {"Aadhaar", "Income Certificate", "Caste Certificate"}
MAX_FILE_SIZE = 5 * 1024 * 1024 # 5 MB
VALID_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}

@router.post("/upload", response_model=UserDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploads a verification document (Aadhaar, Income Certificate, Caste Certificate) 
    on behalf of the logged-in user. Saves metadata in PostgreSQL and file in Supabase Storage.
    """
    # 1. Validate Document Type
    if document_type not in VALID_DOCUMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document type. Allowed types are: {', '.join(VALID_DOCUMENT_TYPES)}"
        )
        
    # 2. Validate File Extension
    import os
    _, ext = os.path.splitext(file.filename)
    if ext.lower() not in VALID_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format. Allowed formats are: {', '.join(VALID_EXTENSIONS)}"
        )
        
    # 3. Read and Validate File Size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is too large. Maximum allowed size is 5MB."
        )
        
    # 4. Upload to Supabase Storage
    # Generate clean filename based on type
    clean_filename = f"{document_type.replace(' ', '_').lower()}{ext.lower()}"
    user_id_str = str(current_user.id)
    
    file_url = upload_document_to_supabase(
        user_id=user_id_str,
        document_type=document_type,
        file_name=file.filename,
        file_content=file_bytes
    )
    
    # 5. Check if document metadata already exists in DB (if so, we update the existing record)
    db_doc = db.query(UserDocument).filter(
        UserDocument.user_id == current_user.id,
        UserDocument.document_type == document_type
    ).first()
    
    if db_doc:
        db_doc.file_name = file.filename
        db_doc.file_path = f"{user_id_str}/{clean_filename}"
        db_doc.file_url = file_url
        db.commit()
        db.refresh(db_doc)
    else:
        # Create new document metadata entry
        db_doc = UserDocument(
            user_id=current_user.id,
            document_type=document_type,
            file_name=file.filename,
            file_path=f"{user_id_str}/{clean_filename}",
            file_url=file_url
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        
    return db_doc

@router.get("", response_model=list[UserDocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all uploaded documents and verification URLs for the current user."""
    docs = db.query(UserDocument).filter(UserDocument.user_id == current_user.id).all()
    return docs
