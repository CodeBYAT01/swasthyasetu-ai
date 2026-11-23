"""Referrals sent from a health worker to an assigned specialist."""

from __future__ import annotations

import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import BaseModel
from .assessment import UrgencyLevel


class ReferralStatus(str, enum.Enum):
    created = "created"
    submitted = "submitted"
    acknowledged = "acknowledged"
    under_review = "under_review"
    advice_recorded = "advice_recorded"
    closed = "closed"


REFERRAL_STATUS_LABELS = {
    ReferralStatus.created: "Created",
    ReferralStatus.submitted: "Submitted",
    ReferralStatus.acknowledged: "Acknowledged",
    ReferralStatus.under_review: "Under Review",
    ReferralStatus.advice_recorded: "Advice Recorded",
    ReferralStatus.closed: "Closed",
}


class Referral(BaseModel):
    __tablename__ = "referrals"
    __table_args__ = (
        Index("ix_referrals_doctor_status", "assigned_doctor_id", "status"),
    )

    consultation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("consultations.id", ondelete="RESTRICT"),
        nullable=False, index=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    assigned_doctor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False, index=True
    )
    referral_reason: Mapped[str] = mapped_column(Text, nullable=False)
    urgency: Mapped[UrgencyLevel] = mapped_column(
        Enum(UrgencyLevel, native_enum=False, length=40),
        nullable=False, default=UrgencyLevel.further_assessment_required, index=True
    )
    status: Mapped[ReferralStatus] = mapped_column(
        Enum(ReferralStatus, native_enum=False, length=30),
        nullable=False, default=ReferralStatus.created, index=True
    )
    reference: Mapped[str] = mapped_column(
        String(40), nullable=False, unique=True, index=True
    )

    consultation: Mapped["Consultation"] = relationship(  # noqa: F821
        "Consultation", lazy="selectin"
    )
    review: Mapped["SpecialistReview | None"] = relationship(  # noqa: F821
        "SpecialistReview", back_populates="referral", uselist=False, lazy="selectin"
    )
