"""Patient consent records. Consent can be withdrawn at any time."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from ..database import BaseModel, utcnow


class PatientConsent(BaseModel):
    __tablename__ = "patient_consents"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    purpose: Mapped[str] = mapped_column(
        String(100), nullable=False, default="consultation_and_referral"
    )
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True, index=True)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    withdrawn_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
