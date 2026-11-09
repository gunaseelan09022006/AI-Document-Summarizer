from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentCompareRequest, DocumentCompareResponse
from app.api.auth import get_current_user
from app.core.rate_limiter import check_ai_rate_limit
from app.services.compare_service import compare_two_documents
from app.services.llm.factory import get_llm_provider

router = APIRouter(prefix="/api/documents", tags=["Document Comparison"])

@router.post("/compare", response_model=DocumentCompareResponse)
async def compare_documents(
    req: DocumentCompareRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_ai_rate_limit(request, current_user.id)

    if req.doc_id_1 == req.doc_id_2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select two different documents to compare."
        )

    doc1 = db.query(Document).filter(
        Document.id == req.doc_id_1,
        Document.user_id == current_user.id
    ).first()
    if not doc1:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="First document not found.")

    doc2 = db.query(Document).filter(
        Document.id == req.doc_id_2,
        Document.user_id == current_user.id
    ).first()
    if not doc2:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Second document not found.")

    llm = get_llm_provider()
    result = await compare_two_documents(
        doc1_title=doc1.filename,
        doc1_text=doc1.extracted_text,
        doc2_title=doc2.filename,
        doc2_text=doc2.extracted_text,
        llm=llm
    )
    return result

