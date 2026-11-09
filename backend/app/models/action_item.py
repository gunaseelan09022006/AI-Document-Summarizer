from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    task_description = Column(Text, nullable=False)
    responsible_person = Column(String, default="Not specified")
    due_date = Column(String, default="Not specified")
    is_explicit = Column(Boolean, default=True)  # True = explicitly stated in document, False = AI suggested
    status = Column(String, default="Pending")  # "Pending", "Completed"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="action_items")
    user = relationship("User", back_populates="action_items")

