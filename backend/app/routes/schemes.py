from fastapi import APIRouter
from app.database import supabase

router = APIRouter(
    prefix="/schemes",
    tags=["Schemes"]
)

@router.get("")
def get_schemes():

    result = (
        supabase
        .table("schemes")
        .select("*")
        .limit(100)
        .execute()
    )

    return result.data
@router.get("/{scheme_id}")
def get_scheme(
    scheme_id:int
):

    result = (
        supabase
        .table("schemes")
        .select("*")
        .eq(
            "scheme_id",
            scheme_id
        )
        .execute()
    )

    if not result.data:

        return {
            "message":
            "Scheme not found"
        }

    return result.data[0]
@router.get("/search/{keyword}")
def search_schemes(
    keyword:str
):

    result = (
        supabase
        .table("schemes")
        .select("*")
        .ilike(
            "scheme_name",
            f"%{keyword}%"
        )
        .execute()
    )

    return result.data
@router.get("/{scheme_id}/documents")
def get_documents(
    scheme_id:int
):

    result = (
        supabase
        .table("schemes")
        .select(
            "documents"
        )
        .eq(
            "scheme_id",
            scheme_id
        )
        .execute()
    )

    return result.data
