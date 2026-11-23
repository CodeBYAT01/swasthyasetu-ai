"""Symptoms recorded during a consultation (text first, optional code)."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import BaseModel, JSONDict, utcnow


class ConfirmationStatus(str, enum.Enum):
    unconfirmed = "unconfirmed"
    confirmed = "confirmed"


class Symptom(BaseModel):
    __tablename__ = "symptoms"

    consultation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("consultations.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    code: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    description: Mapped[str] = mapped_column(String(300), nullable=False)
    duration: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # e.g. "voice_demo", "manual", "worker_confirmed"
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="manual")
    confirmation_status: Mapped[ConfirmationStatus] = mapped_column(
        Enum(ConfirmationStatus, native_enum=False, length=20),
        nullable=False, default=ConfirmationStatus.unconfirmed
    )
    confidence: Mapped[str | None] = mapped_column(String(20), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    recorded_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    extra_data: Mapped[dict | None] = mapped_column(JSONDict, nullable=True)

    consultation: Mapped["Consultation"] = relationship(  # noqa: F821
        "Consultation", back_populates="symptoms"
    )
