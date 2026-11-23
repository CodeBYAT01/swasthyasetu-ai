"""Offline-first synchronisation endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.sync import SyncPullResponse, SyncPushRequest, SyncPushResponse
from ..security.permissions import get_current_user
from ..services.sync_service import parse_cursor, pull_records, push_records

router = APIRouter(prefix="/sync", tags=["Offline Sync"])


@router.post(
    "/push",
    response_model=SyncPushResponse,
    summary="Upload queued offline records",
    description=(
        "Idempotent per (device_id, client_record_id). Retries of the same "
        "version and payload are acknowledged without duplication. Older "
        "versions or conflicting edits return a conflict instead of overwriting."
    ),
)
def push(
    payload: SyncPushRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return push_records(db, user, payload)


@router.get(
    "/pull",
    response_model=SyncPullResponse,
    summary="Fetch server records updated since a timestamp/cursor",
)
def pull(
    since: str | None = Query(default=None, description="ISO 8601 timestamp"),
    cursor: str | None = Query(default=None, description="Alias for since"),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    parsed = parse_cursor(since or cursor)
    return pull_records(db, user, parsed, limit)
