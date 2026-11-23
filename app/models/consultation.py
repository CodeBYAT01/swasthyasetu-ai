"""Consultation aggregate (symptoms and vitals are separate child tables)."""

from __future__ import annotations

import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import BaseModel


class ConsultationLanguage(str, enum.Enum):
    Kannada = "Kannada"
    Hindi = "Hindi"
    English = "English"


class ConsultationStatus(str, enum.Enum):
    draft = "draft"
    in_progress = "in_progress"
    completed = "completed"


class Consultation(BaseModel):
    __tablename__ = "consultations"

    # Client-generated UUIDs from offline devices are used as the primary key.
    patient_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patients.id", ondelete="RESTRICT"),
        nullable=False, index=True
    )
    health_worker_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False, index=True
    )
    facility_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("facilities.id", ondelete="RESTRICT"),
        nullable=False, index=True
    )
    language: Mapped[ConsultationLanguage] = mapped_column(
        Enum(ConsultationLanguage, native_enum=False, length=20),
        nullable=False, default=ConsultationLanguage.English
    )
    chief_complaint: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    transcript: Mapped[str] = mapped_column(Text, nullable=False, default="")
    transcript_confirmed: Mapped[bool] = mapped_column(nullable=False, default=False)
    consultation_status: Mapped[ConsultationStatus] = mapped_column(
        Enum(ConsultationStatus, native_enum=False, length=20),
        nullable=False, default=ConsultationStatus.draft, index=True
    )
    version: Mapped[int] = mapped_column(nullable=False, default=1)

    symptoms: Mapped[list["Symptom"]] = relationship(  # noqa: F821
        "Symptom", back_populates="consultation", cascade="all, delete-orphan",
        lazy="selectin", order_by="Symptom.created_at"
    )
    vital_signs: Mapped[list["VitalSign"]] = relationship(  # noqa: F821
        "VitalSign", back_populates="consultation", cascade="all, delete-orphan",
        lazy="selectin", order_by="VitalSign.created_at"
    )
    assessments: Mapped[list["Assessment"]] = relationship(  # noqa: F821
        "Assessment", back_populates="consultation", lazy="selectin",
        order_by="Assessment.created_at.desc()"
    )
