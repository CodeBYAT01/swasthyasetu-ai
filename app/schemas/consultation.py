"""Consultation schemas, including nested symptoms and vital signs."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from ..models.consultation import ConsultationLanguage, ConsultationStatus
from .symptom import SymptomCreate, SymptomOut
from .vital_sign import VitalSignCreate, VitalSignOut


class ConsultationCreate(BaseModel):
    id: uuid.UUID | None = Field(
        default=None, description="Client-generated UUID for offline-created records."
    )
    patient_id: uuid.UUID
    language: ConsultationLanguage = ConsultationLanguage.English
    chief_complaint: str = Field(default="", max_length=500)
    transcript: str = Field(default="", max_length=20000)
    transcript_confirmed: bool = Field(default=False)
    consultation_status: ConsultationStatus = ConsultationStatus.draft
    symptoms: list[SymptomCreate] = Field(default_factory=list)
    vital_signs: list[VitalSignCreate] = Field(default_factory=list)

    @field_validator("transcript")
    @classmethod
    def strip_transcript(cls, value: str) -> str:
        return value.strip()


class ConsultationUpdate(BaseModel):
    language: ConsultationLanguage | None = None
    chief_complaint: str | None = Field(default=None, max_length=500)
    transcript: str | None = Field(default=None, max_length=20000)
    transcript_confirmed: bool | None = None
    consultation_status: ConsultationStatus | None = None


class ConsultationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    health_worker_id: uuid.UUID
    facility_id: uuid.UUID
    language: ConsultationLanguage
    chief_complaint: str
    transcript: str
    transcript_confirmed: bool
    consultation_status: ConsultationStatus
    version: int
    created_at: datetime
    updated_at: datetime
    symptoms: list[SymptomOut] = Field(default_factory=list)
    vital_signs: list[VitalSignOut] = Field(default_factory=list)
