from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.action_item import ActionItem
from app.models.document import Document
from app.schemas.action_item import ActionItemResponse, ActionItemUpdate
from app.api.auth import get_current_user
from app.services.export_service import generate_csv_action_items

router = APIRouter(prefix="/api/action-items", tags=["Action Items"])

@router.get("", response_model=List[ActionItemResponse])
def get_action_items(
    document_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        db.query(ActionItem, Document.filename.label("document_filename"))
        .join(Document, ActionItem.document_id == Document.id)
        .filter(ActionItem.user_id == current_user.id)
    )

    if document_id:
        query = query.filter(ActionItem.document_id == document_id)
    if status_filter and status_filter != "All":
        query = query.filter(ActionItem.status == status_filter)

    results = query.order_by(ActionItem.created_at.desc()).all()

    response_items = []
    for item, doc_filename in results:
        resp = ActionItemResponse.model_validate(item)
        resp.document_filename = doc_filename
        response_items.append(resp)
    return response_items

@router.patch("/{item_id}", response_model=ActionItemResponse)
def update_action_item(
    item_id: int,
    item_update: ActionItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(ActionItem).filter(
        ActionItem.id == item_id,
        ActionItem.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action item not found.")

    update_data = item_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)

    resp = ActionItemResponse.model_validate(item)
    if item.document:
        resp.document_filename = item.document.filename
    return resp

@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
def delete_action_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(ActionItem).filter(
        ActionItem.id == item_id,
        ActionItem.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action item not found.")

    db.delete(item)
    db.commit()
    return {"message": "Action item deleted successfully.", "item_id": item_id}

@router.get("/export/csv")
def export_action_items_csv(
    document_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ActionItem).filter(ActionItem.user_id == current_user.id)
    if document_id:
        query = query.filter(ActionItem.document_id == document_id)
    if status_filter and status_filter != "All":
        query = query.filter(ActionItem.status == status_filter)

    items = query.order_by(ActionItem.created_at.desc()).all()
    csv_data = generate_csv_action_items(items)

    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="action_items.csv"'}
    )

