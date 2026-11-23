"""Stored safety assessments and the exact rules that were triggered."""

from __future__ import annotations

import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import BaseModel, JSONDict


class UrgencyLevel(str, enum.Enum):
    emergency_warning = "emergency_warning"
    prompt_clinical_assessment = "prompt_clinical_assessment"
    further_assessment_required = "further_assessment_required"
    incomplete_information = "incomplete_information"


URGENCY_LABELS = {
    UrgencyLevel.emergency_warning: "Emergency warning",
    UrgencyLevel.prompt_clinical_assessment: "Prompt clinical assessment",
    UrgencyLevel.further_assessment_required: "Further assessment required",
    UrgencyLevel.incomplete_information: "Incomplete information",
}


class Assessment(BaseModel):
    __tablename__ = "assessments"

    consultation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("consultations.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    urgency_level: Mapped[UrgencyLevel] = mapped_column(
        Enum(UrgencyLevel, native_enum=False, length=40), nullable=False, index=True
    )
    triggered_flags: Mapped[list] = mapped_column(JSONDict, nullable=False, default=list)
    missing_information: Mapped[list] = mapped_column(JSONDict, nullable=False, default=list)
    uncertain_information: Mapped[list] = mapped_column(JSONDict, nullable=False, default=list)
    reasons: Mapped[list] = mapped_column(JSONDict, nullable=False, default=list)
    rule_version: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    disclaimer: Mapped[str] = mapped_column(Text, nullable=False)
    emergency_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)

    consultation: Mapped["Consultation"] = relationship(  # noqa: F821
        "Consultation", back_populates="assessments"
    )
    triggers: Mapped[list["TriageTrigger"]] = relationship(
        "TriageTrigger", back_populates="assessment", cascade="all, delete-orphan",
        lazy="selectin"
    )


class TriageTrigger(BaseModel):
    __tablename__ = "triage_triggers"

    assessment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    rule_code: Mapped[str] = mapped_column(String(80), nullable=False)
    rule_version: Mapped[str] = mapped_column(String(30), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    urgency_level: Mapped[UrgencyLevel] = mapped_column(
        Enum(UrgencyLevel, native_enum=False, length=40), nullable=False
    )

    assessment: Mapped[Assessment] = relationship("Assessment", back_populates="triggers")
