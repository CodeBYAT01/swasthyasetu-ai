"""Patient registry. Only the minimum necessary demographic data is stored."""

from __future__ import annotations

import enum
import uuid
from datetime import date

from sqlalchemy import Date, Enum, Index, Integer, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from ..database import BaseModel


class PatientSex(str, enum.Enum):
    female = "female"
    male = "male"
    other = "other"
    not_disclosed = "not_disclosed"


class Patient(BaseModel):
    __tablename__ = "patients"
    __table_args__ = (
        UniqueConstraint("facility_id", "local_patient_code", name="uq_patient_facility_code"),
        Index("ix_patients_name", "full_name"),
        Index("ix_patients_village", "village"),
    )

    local_patient_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sex: Mapped[PatientSex | None] = mapped_column(
        Enum(PatientSex, native_enum=False, length=20), nullable=True
    )
    village: Mapped[str] = mapped_column(String(150), nullable=False, default="")
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    facility_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), nullable=False, index=True
    )
    relevant_medical_history: Mapped[str | None] = mapped_column(Text, nullable=True)
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)
