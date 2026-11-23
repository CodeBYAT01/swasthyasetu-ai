"""Role checks and facility-scoped record helpers."""

from __future__ import annotations

import uuid
from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.consultation import Consultation
from ..models.facility import Facility
from ..models.patient import Patient
from ..models.referral import Referral
from ..models.user import User, UserRole
from .authentication import get_current_user


def require_roles(*roles: UserRole) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return user

    return dependency


get_current_admin = require_roles(UserRole.admin)
get_current_worker = require_roles(UserRole.health_worker)
get_current_doctor = require_roles(UserRole.doctor)
get_worker_or_admin = require_roles(UserRole.health_worker, UserRole.admin)
get_current_worker_or_admin = get_worker_or_admin
get_any_staff = require_roles(UserRole.health_worker, UserRole.doctor, UserRole.admin)


def ensure_facility_access(user: User, facility_id: uuid.UUID | None) -> None:
    if user.role == UserRole.admin:
        return
    if facility_id is None or user.facility_id != facility_id:
        raise HTTPException(status_code=403, detail="Access denied for this facility")


def accessible_facility_ids(user: User, db: Session) -> set[uuid.UUID] | None:
    """None means 'all facilities' (admin)."""
    if user.role == UserRole.admin:
        return None
    if user.facility_id is None:
        return set()
    return {user.facility_id}


def get_patient_or_404(db: Session, patient_id: uuid.UUID, user: User) -> Patient:
    patient = db.get(Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    ensure_facility_access(user, patient.facility_id)
    return patient


def get_consultation_or_404(
    db: Session, consultation_id: uuid.UUID, user: User
) -> Consultation:
    consultation = db.get(Consultation, consultation_id)
    if consultation is None:
        raise HTTPException(status_code=404, detail="Consultation not found")
    ensure_facility_access(user, consultation.facility_id)
    return consultation


def get_referral_for_doctor(db: Session, referral_id: uuid.UUID, user: User) -> Referral:
    referral = db.get(Referral, referral_id)
    if referral is None:
        raise HTTPException(status_code=404, detail="Referral not found")
    if user.role != UserRole.admin and referral.assigned_doctor_id != user.id:
        raise HTTPException(status_code=404, detail="Referral not found")
    return referral


def get_facility_or_404(db: Session, facility_id: uuid.UUID) -> Facility:
    facility = db.get(Facility, facility_id)
    if facility is None:
        raise HTTPException(status_code=404, detail="Facility not found")
    return facility
