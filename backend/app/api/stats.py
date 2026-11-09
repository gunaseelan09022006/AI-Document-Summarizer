from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.action_item import ActionItem
from app.schemas.document import DocumentResponse
from app.api.auth import get_current_user
from app.services.llm.factory import get_llm_provider
from app.core.config import settings

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_docs = db.query(Document).filter(Document.user_id == current_user.id).count()
    total_summaries = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.status == "summarized"
    ).count()

    total_actions = db.query(ActionItem).filter(ActionItem.user_id == current_user.id).count()
    pending_actions = db.query(ActionItem).filter(
        ActionItem.user_id == current_user.id,
        ActionItem.status == "Pending"
    ).count()
    completed_actions = db.query(ActionItem).filter(
        ActionItem.user_id == current_user.id,
        ActionItem.status == "Completed"
    ).count()

    recent_docs = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .limit(5)
        .all()
    )

    llm = get_llm_provider()
    has_gemini = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 5)
    has_openai = bool(settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY.strip()) > 5)

    return {
        "total_documents": total_docs,
        "total_summaries": total_summaries,
        "total_action_items": total_actions,
        "pending_action_items": pending_actions,
        "completed_action_items": completed_actions,
        "recent_documents": [DocumentResponse.model_validate(d) for d in recent_docs],
        "system_info": {
            "active_provider": llm.provider_name,
            "has_gemini_key": has_gemini,
            "has_openai_key": has_openai,
            "preferred_provider": settings.LLM_PROVIDER,
            "max_upload_size_mb": settings.MAX_UPLOAD_SIZE_MB
        }
    }

