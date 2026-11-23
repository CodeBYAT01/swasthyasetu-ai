"""Offline synchronisation request/response schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SyncRecord(BaseModel):
    client_record_id: uuid.UUID
    version: int = Field(ge=1, le=1_000_000)
    record_type: str = Field(min_length=2, max_length=50)
    data: dict = Field(default_factory=dict)


class SyncPushRequest(BaseModel):
    device_id: uuid.UUID
    records: list[SyncRecord] = Field(default_factory=list, max_length=500)


class ConflictOut(BaseModel):
    client_record_id: uuid.UUID
    reason: str
    current_version: int | None = None
    expected_version: int | None = None


class SyncPushResponse(BaseModel):
    successful: list[uuid.UUID] = Field(default_factory=list)
    failed: list[uuid.UUID] = Field(default_factory=list)
    conflicts: list[ConflictOut] = Field(default_factory=list)
    errors: list[dict] = Field(default_factory=list)
    sync_status: str


class SyncPullRecord(BaseModel):
    client_record_id: uuid.UUID
    record_type: str
    version: int
    data: dict
    updated_at: datetime


class SyncPullResponse(BaseModel):
    records: list[SyncPullRecord] = Field(default_factory=list)
    cursor: str | None = None
    has_more: bool = False
    synced_at: datetime
