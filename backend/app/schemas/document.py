from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict
from app.schemas.action_item import ActionItemResponse

class DocumentBase(BaseModel):
    filename: str
    file_type: str
    file_size: int

class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    page_count: int
    word_count: int
    ocr_applied: bool
    status: str
    error_message: Optional[str] = None
    executive_summary: Optional[str] = None
    detailed_summary: Optional[str] = None
    key_points: List[str] = []
    important_dates: List[str] = []
    keywords: List[str] = []
    document_type: str = "General Document"
    summary_length: str = "Medium"
    summary_style: str = "Structured Report"
    summary_tone: str = "Professional"
    summary_language: str = "English"
    created_at: datetime
    updated_at: datetime
    action_items: List[ActionItemResponse] = []
    model_config = ConfigDict(from_attributes=True)

class DocumentListItem(DocumentBase):
    id: int
    user_id: int
    page_count: int
    word_count: int
    status: str
    document_type: str
    created_at: datetime
    action_items_count: int = 0
    model_config = ConfigDict(from_attributes=True)

class AskQuestionRequest(BaseModel):
    question: str

class AskQuestionResponse(BaseModel):
    document_id: int
    question: str
    answer: str
    sources_found: bool

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    document_id: int
    message: str
    role: str = "assistant"

class DocumentCompareRequest(BaseModel):
    doc_id_1: int
    doc_id_2: int

class DocumentCompareResponse(BaseModel):
    doc1_title: str
    doc2_title: str
    comparison_summary: str
    key_similarities: List[str] = []
    key_differences: List[str] = []
    recommendations: List[str] = []

class ImportantInfoResponse(BaseModel):
    document_id: int
    names_and_entities: List[str] = []
    dates_and_deadlines: List[str] = []
    key_metrics_and_stats: List[str] = []
    decisions_made: List[str] = []
    conclusions: List[str] = []
