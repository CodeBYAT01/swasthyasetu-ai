"""Safety assessment schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from ..models.assessment import UrgencyLevel


class AssessmentCreate(BaseModel):
    consultation_id: uuid.UUID


class TriggerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rule_code: str
    rule_version: str
    message: str
    urgency_level: UrgencyLevel


class AssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    consultation_id: uuid.UUID
    urgency_level: UrgencyLevel
    urgency_label: str | None = None
    triggered_flags: list[str] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    uncertain_information: list[str] = Field(default_factory=list)
    reasons: list[str] = Field(default_factory=list)
    rule_version: str
    disclaimer: str
    emergency_action: str | None = None
    triggers: list[TriggerOut] = Field(default_factory=list)
    created_at: datetime
