"""A doctor's written review of one referral (one review per referral)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import BaseModel, utcnow


class SpecialistReview(BaseModel):
    __tablename__ = "specialist_reviews"

    referral_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("referrals.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    clinical_comments: Mapped[str] = mapped_column(Text, nullable=False)
    follow_up_recommendations: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    status: Mapped[str] = mapped_column(default="submitted", nullable=False)

    referral: Mapped["Referral"] = relationship(  # noqa: F821
        "Referral", back_populates="review"
    )
