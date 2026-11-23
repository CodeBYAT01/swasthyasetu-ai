"""One measured vital sign per row. Missing vitals are simply absent."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import BaseModel, utcnow
from .symptom import ConfirmationStatus


class VitalType(str, enum.Enum):
    temperature = "temperature"
    pulse = "pulse"
    systolic_bp = "systolic_bp"
    diastolic_bp = "diastolic_bp"
    oxygen_saturation = "oxygen_saturation"
    respiratory_rate = "respiratory_rate"


class VitalSign(BaseModel):
    __tablename__ = "vital_signs"

    consultation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("consultations.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    vital_type: Mapped[VitalType] = mapped_column(
        Enum(VitalType, native_enum=False, length=30), nullable=False, index=True
    )
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="manual")
    confirmation_status: Mapped[ConfirmationStatus] = mapped_column(
        Enum(ConfirmationStatus, native_enum=False, length=20),
        nullable=False, default=ConfirmationStatus.confirmed
    )
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    recorded_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)

    consultation: Mapped["Consultation"] = relationship(  # noqa: F821
        "Consultation", back_populates="vital_signs"
    )
