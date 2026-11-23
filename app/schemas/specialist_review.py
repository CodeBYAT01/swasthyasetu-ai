"""Specialist review schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    clinical_comments: str = Field(min_length=2, max_length=5000)
    follow_up_recommendations: str | None = Field(default=None, max_length=3000)


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    referral_id: uuid.UUID
    doctor_id: uuid.UUID
    clinical_comments: str
    follow_up_recommendations: str | None = None
    reviewed_at: datetime
    status: str
