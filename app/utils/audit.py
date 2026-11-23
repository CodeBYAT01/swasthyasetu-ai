"""Write minimal audit records. Never store passwords, tokens or clinical text."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from ..models.audit_log import AuditLog
from ..models.user import User


def record_audit(
    db: Session,
    *,
    actor: User | None,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    details: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_id=actor.id if actor else None,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            facility_id=actor.facility_id if actor else None,
            details=details or {},
        )
    )
