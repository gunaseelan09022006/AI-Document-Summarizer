from typing import List, Optional
from pydantic import BaseModel, Field

class SummaryOptions(BaseModel):
    length: str = Field(default="Medium", description="Short, Medium, or Detailed")
    style: str = Field(default="Structured Report", description="Paragraphs, Bullet Points, or Structured Report")
    tone: str = Field(default="Professional", description="Professional, Academic, or Simple English")
    language: str = Field(default="English", description="Target language, e.g., English, Spanish, French")

class ActionItemExtraction(BaseModel):
    task_description: str
    responsible_person: Optional[str] = "Not specified"
    due_date: Optional[str] = "Not specified"
    is_explicit: bool = True  # True if explicitly stated in text, False if AI-suggested

class StructuredExtraction(BaseModel):
    executive_summary: str
    detailed_summary: str
    key_points: List[str] = []
    action_items: List[ActionItemExtraction] = []
    important_dates: List[str] = []
    keywords: List[str] = []
    document_type: str = "General Document"

