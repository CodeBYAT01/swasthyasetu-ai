"""User and facility schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from ..models.user import UserRole


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")


class FacilityOut(ORMModel):
    id: uuid.UUID
    name: str
    district: str
    state: str
    address: str | None = None
    is_active: bool


class FacilityCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    district: str = Field(min_length=2, max_length=120)
    state: str = Field(default="Karnataka", max_length=120)
    address: str | None = Field(default=None, max_length=500)


class UserOut(ORMModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: UserRole
    facility_id: uuid.UUID | None = None
    facility: FacilityOut | None = None
    is_active: bool
    created_at: datetime


class UserCreate(BaseModel):
    """Admin-only user creation."""

    email: EmailStr
    full_name: str = Field(min_length=2, max_length=200)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole
    facility_id: uuid.UUID | None = None


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=200)
    facility_id: uuid.UUID | None = None
    is_active: bool | None = None
