from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ActionItemBase(BaseModel):
    task_description: str
    responsible_person: Optional[str] = "Not specified"
    due_date: Optional[str] = "Not specified"
    is_explicit: bool = True
    status: str = "Pending"

class ActionItemCreate(ActionItemBase):
    document_id: int

class ActionItemUpdate(BaseModel):
    task_description: Optional[str] = None
    responsible_person: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None
    is_explicit: Optional[bool] = None

class ActionItemResponse(ActionItemBase):
    id: int
    document_id: int
    user_id: int
    document_filename: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
