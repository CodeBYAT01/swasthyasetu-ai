"""Referral schemas, including the doctor-facing patient summary."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from ..models.assessment import UrgencyLevel
from ..models.referral import ReferralStatus
from .assessment import AssessmentOut
from .specialist_review import ReviewCreate, ReviewOut
from .symptom import SymptomOut
from .vital_sign import VitalSignOut


class ReferralCreate(BaseModel):
    consultation_id: uuid.UUID
    assigned_doctor_id: uuid.UUID
    referral_reason: str = Field(min_length=3, max_length=2000)
    urgency: UrgencyLevel | None = Field(
        default=None, description="Defaults to the latest assessment urgency."
    )
    submit: bool = Field(default=True, description="Create and submit in one step.")


class ReferralStatusUpdate(BaseModel):
    status: ReferralStatus


class PatientSummary(BaseModel):
    id: uuid.UUID
    local_patient_code: str
    full_name: str
    age: int | None = None
    sex: str | None = None
    village: str | None = None
    relevant_medical_history: str | None = None
    allergies: str | None = None


class ReferralOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reference: str
    consultation_id: uuid.UUID
    created_by: uuid.UUID
    assigned_doctor_id: uuid.UUID
    referral_reason: str
    urgency: UrgencyLevel
    urgency_label: str | None = None
    status: ReferralStatus
    status_label: str | None = None
    created_at: datetime
    updated_at: datetime
    review: ReviewOut | None = None
    patient: PatientSummary | None = None
    language: str | None = None
    chief_complaint: str | None = None
    transcript: str | None = None
    transcript_confirmed: bool | None = None
    symptoms: list[SymptomOut] = Field(default_factory=list)
    vital_signs: list[VitalSignOut] = Field(default_factory=list)
    assessment: AssessmentOut | None = None
