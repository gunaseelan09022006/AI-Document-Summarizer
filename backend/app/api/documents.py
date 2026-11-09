import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request, Response, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.config import settings
from app.core.rate_limiter import check_ai_rate_limit
from app.models.user import User
from app.models.document import Document
from app.models.action_item import ActionItem
from app.schemas.document import (
    DocumentResponse, DocumentListItem, AskQuestionRequest,
    AskQuestionResponse, ChatRequest, ChatResponse, ImportantInfoResponse
)
from app.schemas.summary import SummaryOptions
from app.api.auth import get_current_user
from app.services.parser import parse_document
from app.services.summarizer import summarize_document
from app.services.qa_service import ask_question_about_document, chat_with_document, extract_important_info
from app.services.export_service import generate_txt_export, generate_pdf_report
from app.services.llm.factory import get_llm_provider

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate extension
    filename = file.filename or "untitled"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext}'. Allowed types are: {', '.join(settings.ALLOWED_EXTENSIONS).upper()}"
        )

    # Read content and validate size
    contents = await file.read()
    file_size = len(contents)
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty (0 bytes)."
        )
    if file_size > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # Secure unique filename
    unique_name = f"{uuid.uuid4().hex}_{ext}_{filename[-30:]}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        f.write(contents)

    # Parse document and extract text
    try:
        extracted_text, page_count, word_count, ocr_applied = parse_document(file_path, ext)
    except HTTPException:
        # Clean up uploaded file if parsing fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error processing document: {str(e)}"
        )

    doc = Document(
        user_id=current_user.id,
        filename=filename,
        stored_path=file_path,
        file_type=ext,
        file_size=file_size,
        page_count=page_count,
        word_count=word_count,
        extracted_text=extracted_text,
        ocr_applied=ocr_applied,
        status="uploaded"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.get("", response_model=List[DocumentResponse])
def get_documents(
    search: Optional[str] = Query(None, description="Search by filename"),
    doc_type: Optional[str] = Query(None, description="Filter by document type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document).filter(Document.user_id == current_user.id)
    if search:
        query = query.filter(Document.filename.ilike(f"%{search}%"))
    if doc_type and doc_type != "All":
        query = query.filter(Document.document_type == doc_type)

    docs = query.order_by(Document.created_at.desc()).all()
    return docs

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return doc

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    # Remove file from disk
    if doc.stored_path and os.path.exists(doc.stored_path):
        try:
            os.remove(doc.stored_path)
        except OSError:
            pass

    db.delete(doc)
    db.commit()
    return {"message": "Document successfully deleted.", "document_id": document_id}

@router.post("/{document_id}/summarize", response_model=DocumentResponse)
async def summarize_doc_endpoint(
    document_id: int,
    options: SummaryOptions,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_ai_rate_limit(request, current_user.id)

    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if not doc.extracted_text or len(doc.extracted_text.strip()) < 10:
        doc.status = "error"
        doc.error_message = "Cannot summarize document: Extracted text is empty or too short. If this is a scanned document or image, OCR is required."
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot summarize document: Extracted text is empty or too short. If this is a scanned document or image, OCR is required."
        )

    llm = get_llm_provider()

    try:
        extraction = await summarize_document(
            text=doc.extracted_text,
            options=options,
            llm_provider=llm
        )

        doc.executive_summary = extraction.executive_summary
        doc.detailed_summary = extraction.detailed_summary
        doc.key_points = extraction.key_points
        doc.important_dates = extraction.important_dates
        doc.keywords = extraction.keywords
        doc.document_type = extraction.document_type
        doc.summary_length = options.length
        doc.summary_style = options.style
        doc.summary_tone = options.tone
        doc.summary_language = options.language
        doc.status = "summarized"
        doc.error_message = None

        # Clear existing action items and replace with freshly extracted ones
        db.query(ActionItem).filter(ActionItem.document_id == doc.id).delete()
        for item in extraction.action_items:
            action_item = ActionItem(
                document_id=doc.id,
                user_id=current_user.id,
                task_description=item.task_description,
                responsible_person=item.responsible_person or "Not specified",
                due_date=item.due_date or "Not specified",
                is_explicit=item.is_explicit,
                status="Pending"
            )
            db.add(action_item)

        db.commit()
        db.refresh(doc)
        return doc

    except HTTPException as exc:
        db.rollback()
        # Persist error state to document
        doc.status = "error"
        doc.error_message = str(exc.detail)
        db.commit()
        raise
    except Exception as e:
        db.rollback()
        doc.status = "error"
        doc.error_message = str(e)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Summarization failed: {str(e)}"
        )

@router.post("/{document_id}/ask", response_model=AskQuestionResponse)
async def ask_question(
    document_id: int,
    req_body: AskQuestionRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_ai_rate_limit(request, current_user.id)
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    llm = get_llm_provider()
    answer, sources_found = await ask_question_about_document(
        doc_text=doc.extracted_text,
        question=req_body.question,
        llm=llm
    )
    return AskQuestionResponse(
        document_id=doc.id,
        question=req_body.question,
        answer=answer,
        sources_found=sources_found
    )

@router.post("/{document_id}/chat", response_model=ChatResponse)
async def chat_document(
    document_id: int,
    req_body: ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_ai_rate_limit(request, current_user.id)
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    llm = get_llm_provider()
    reply = await chat_with_document(
        doc_text=doc.extracted_text,
        message=req_body.message,
        history=req_body.history,
        llm=llm
    )
    return ChatResponse(
        document_id=doc.id,
        message=reply,
        role="assistant"
    )

@router.post("/{document_id}/extract-info", response_model=ImportantInfoResponse)
async def get_important_info(
    document_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_ai_rate_limit(request, current_user.id)
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    llm = get_llm_provider()
    result = await extract_important_info(
        doc_id=doc.id,
        doc_text=doc.extracted_text,
        llm=llm
    )
    return result

@router.get("/{document_id}/export")
def export_document_report(
    document_id: int,
    format: str = Query("pdf", pattern="^(pdf|txt)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if format == "txt":
        content = generate_txt_export(doc)
        filename = f"{os.path.splitext(doc.filename)[0]}_summary.txt"
        return Response(
            content=content,
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    else:
        pdf_bytes = generate_pdf_report(doc)
        filename = f"{os.path.splitext(doc.filename)[0]}_report.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
