"""Symptom schemas. Uncertainty is explicit and never silently confirmed."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from ..models.symptom import ConfirmationStatus


class SymptomCreate(BaseModel):
    description: str = Field(min_length=1, max_length=300)
    code: str | None = Field(default=None, max_length=50)
    duration: str | None = Field(default=None, max_length=100)
    source: str = Field(default="manual", max_length=50)
    confirmation_status: ConfirmationStatus = ConfirmationStatus.unconfirmed
    confidence: str | None = Field(default=None, max_length=20)
    recorded_at: datetime | None = None


class SymptomOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    consultation_id: uuid.UUID
    description: str
    code: str | None = None
    duration: str | None = None
    source: str
    confirmation_status: ConfirmationStatus
    confidence: str | None = None
    recorded_at: datetime
