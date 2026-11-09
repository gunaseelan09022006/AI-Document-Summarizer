from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    filename = Column(String, nullable=False)
    stored_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # "pdf", "docx", "txt"
    file_size = Column(Integer, nullable=False)  # in bytes
    page_count = Column(Integer, default=1)
    word_count = Column(Integer, default=0)
    extracted_text = Column(Text, nullable=True)
    ocr_applied = Column(Boolean, default=False)
    status = Column(String, default="uploaded")  # "uploaded", "summarized", "error"
    error_message = Column(String, nullable=True)

    # Summary & metadata
    executive_summary = Column(Text, nullable=True)
    detailed_summary = Column(Text, nullable=True)
    key_points = Column(JSON, default=list)
    important_dates = Column(JSON, default=list)
    keywords = Column(JSON, default=list)
    document_type = Column(String, default="General Document")

    # Options used when generating
    summary_length = Column(String, default="Medium")
    summary_style = Column(String, default="Structured Report")
    summary_tone = Column(String, default="Professional")
    summary_language = Column(String, default="English")

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="documents")
    action_items = relationship("ActionItem", back_populates="document", cascade="all, delete-orphan")

