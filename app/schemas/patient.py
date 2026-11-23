"""Patient schemas."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from ..models.patient import PatientSex


class PatientBase(BaseModel):
    local_patient_code: str = Field(min_length=2, max_length=50)
    full_name: str = Field(min_length=2, max_length=200)
    date_of_birth: date | None = None
    age: int | None = Field(default=None, ge=0, le=120)
    sex: PatientSex | None = None
    village: str = Field(default="", max_length=150)
    phone_number: str | None = Field(default=None, max_length=20)
    facility_id: uuid.UUID
    relevant_medical_history: str | None = Field(default=None, max_length=2000)
    allergies: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def date_or_age(self):
        if self.date_of_birth is None and self.age is None:
            raise ValueError("Provide date_of_birth or age")
        return self


class PatientCreate(PatientBase):
    consent_given: bool = Field(
        default=True,
        description="Records consent for consultation and referral processing.",
    )


class PatientUpdate(BaseModel):
    local_patient_code: str | None = Field(default=None, min_length=2, max_length=50)
    full_name: str | None = Field(default=None, min_length=2, max_length=200)
    date_of_birth: date | None = None
    age: int | None = Field(default=None, ge=0, le=120)
    sex: PatientSex | None = None
    village: str | None = Field(default=None, max_length=150)
    phone_number: str | None = Field(default=None, max_length=20)
    relevant_medical_history: str | None = Field(default=None, max_length=2000)
    allergies: str | None = Field(default=None, max_length=1000)
    is_active: bool | None = None


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    local_patient_code: str
    full_name: str
    date_of_birth: date | None = None
    age: int | None = None
    sex: PatientSex | None = None
    village: str
    phone_number: str | None = None
    facility_id: uuid.UUID
    relevant_medical_history: str | None = None
    allergies: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
