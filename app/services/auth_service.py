"""Registration and login business logic."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import utcnow
from ..models.facility import Facility
from ..models.user import User, UserRole
from ..schemas.auth import LoginRequest, RegisterRequest
from ..security.authentication import hash_password, verify_password
from ..utils.audit import record_audit


def register_user(db: Session, payload: RegisterRequest) -> User:
    if not settings.registration_open:
        raise HTTPException(status_code=403, detail="Registration is closed")
    if payload.role == UserRole.admin and not settings.allow_admin_registration:
        raise HTTPException(
            status_code=403,
            detail="Administrator accounts are created by the seed script or an administrator",
        )
    if payload.role in (UserRole.health_worker, UserRole.doctor) and not payload.facility_id:
        raise HTTPException(
            status_code=422, detail="facility_id is required for workers and doctors"
        )

    if payload.facility_id is not None:
        facility = db.get(Facility, payload.facility_id)
        if facility is None or not facility.is_active:
            raise HTTPException(status_code=404, detail="Facility not found")

    existing = db.execute(select(User).where(User.email == payload.email.lower())).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        facility_id=payload.facility_id,
    )
    db.add(user)
    db.flush()
    record_audit(
        db, actor=user, action="user.registered", resource_type="user", resource_id=str(user.id)
    )
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, payload: LoginRequest) -> User:
    user = db.execute(
        select(User).where(User.email == payload.email.lower())
    ).scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.hashed_password):
        # Same message for both cases to avoid account enumeration.
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    user.last_login_at = utcnow()
    record_audit(
        db, actor=user, action="user.login", resource_type="user", resource_id=str(user.id)
    )
    db.commit()
    db.refresh(user)
    return user
