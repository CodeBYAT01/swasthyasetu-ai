"""Vital sign schemas with sane input ranges (malformed values are rejected)."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from ..models.symptom import ConfirmationStatus
from ..models.vital_sign import VitalType

UNITS = {
    VitalType.temperature: "C",
    VitalType.pulse: "BPM",
    VitalType.systolic_bp: "mmHg",
    VitalType.diastolic_bp: "mmHg",
    VitalType.oxygen_saturation: "%",
    VitalType.respiratory_rate: "breaths/min",
}

RANGES = {
    VitalType.temperature: (30.0, 45.0),
    VitalType.pulse: (20.0, 250.0),
    VitalType.systolic_bp: (50.0, 300.0),
    VitalType.diastolic_bp: (20.0, 200.0),
    VitalType.oxygen_saturation: (50.0, 100.0),
    VitalType.respiratory_rate: (4.0, 80.0),
}


class VitalSignCreate(BaseModel):
    vital_type: VitalType
    value: float = Field(gt=0)
    unit: str | None = Field(default=None, max_length=20)
    source: str = Field(default="manual", max_length=50)
    confirmation_status: ConfirmationStatus = ConfirmationStatus.confirmed
    recorded_at: datetime | None = None

    @field_validator("value")
    @classmethod
    def reject_non_finite(cls, value: float) -> float:
        import math

        if not math.isfinite(value):
            raise ValueError("Vital value must be a finite number")
        return value

    @model_validator(mode="after")
    def validate_range(self):
        self.check_range()
        return self

    def normalized_unit(self) -> str:
        return self.unit or UNITS[self.vital_type]

    def check_range(self) -> None:
        low, high = RANGES[self.vital_type]
        if not low <= self.value <= high:
            raise ValueError(
                f"{self.vital_type.value} must be between {low} and {high} {self.normalized_unit()}"
            )


class VitalSignOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    consultation_id: uuid.UUID
    vital_type: VitalType
    value: float
    unit: str
    source: str
    confirmation_status: ConfirmationStatus
    recorded_at: datetime
