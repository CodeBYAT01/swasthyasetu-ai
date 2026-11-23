"""Patient registration, search and consent management."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..database import get_db, utcnow
from ..models.consent import PatientConsent
from ..models.patient import Patient
from ..schemas.patient import PatientCreate, PatientOut, PatientUpdate
from ..security.authentication import get_current_user
from ..security.permissions import (
    accessible_facility_ids,
    ensure_facility_access,
    get_current_worker_or_admin,
    get_patient_or_404,
)
from ..utils.audit import record_audit
from ..utils.response import paginated

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post(
    "",
    response_model=PatientOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a patient",
    responses={409: {"description": "Duplicate patient code for this facility"}},
)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_worker_or_admin),
):
    ensure_facility_access(user, payload.facility_id)
    duplicate = db.execute(
        select(Patient).where(
            Patient.facility_id == payload.facility_id,
            Patient.local_patient_code == payload.local_patient_code,
        )
    ).scalar_one_or_none()
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="Patient code already exists at this facility")

    values = payload.model_dump(exclude={"consent_given"})
    patient = Patient(**values)
    db.add(patient)
    db.flush()

    if payload.consent_given:
        db.add(
            PatientConsent(
                patient_id=patient.id,
                purpose="consultation_and_referral",
                is_active=True,
                granted_at=utcnow(),
            )
        )
    record_audit(db, actor=user, action="patient.created", resource_type="patient", resource_id=str(patient.id))
    db.commit()
    db.refresh(patient)
    return patient


@router.get("", response_model=dict, summary="Search patients (name, code or village)")
def list_patients(
    q: str | None = None,
    village: str | None = None,
    include_inactive: bool = False,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.role not in ("health_worker", "admin"):
        raise HTTPException(status_code=403, detail="Access denied")
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    query = select(Patient)
    facility_ids = accessible_facility_ids(user, db)
    if facility_ids is not None:
        query = query.where(Patient.facility_id.in_(facility_ids or [uuid.UUID(int=0)]))
    if not include_inactive:
        query = query.where(Patient.is_active.is_(True))
    if q:
        like = f"%{q.strip()}%"
        query = query.where(
            or_(
                Patient.full_name.ilike(like),
                Patient.local_patient_code.ilike(like),
                Patient.village.ilike(like),
            )
        )
    if village:
        query = query.where(Patient.village.ilike(f"%{village.strip()}%"))

    total = db.execute(select(func.count()).select_from(query.subquery())).scalar_one()
    rows = (
        db.execute(query.order_by(Patient.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
        .scalars()
        .all()
    )
    return paginated([PatientOut.model_validate(row) for row in rows], total, page, page_size)


@router.get("/{patient_id}", response_model=PatientOut, summary="Get patient details")
def get_patient(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return get_patient_or_404(db, patient_id, user)


@router.put("/{patient_id}", response_model=PatientOut, summary="Update patient")
def update_patient(
    patient_id: uuid.UUID,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_worker_or_admin),
):
    patient = get_patient_or_404(db, patient_id, user)
    values = payload.model_dump(exclude_unset=True)
    if "local_patient_code" in values:
        duplicate = db.execute(
            select(Patient).where(
                Patient.facility_id == patient.facility_id,
                Patient.local_patient_code == values["local_patient_code"],
                Patient.id != patient.id,
            )
        ).scalar_one_or_none()
        if duplicate is not None:
            raise HTTPException(status_code=409, detail="Patient code already exists at this facility")
    for field, value in values.items():
        setattr(patient, field, value)
    record_audit(db, actor=user, action="patient.updated", resource_type="patient", resource_id=str(patient_id))
    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", response_model=PatientOut, summary="Archive (deactivate) a patient")
def archive_patient(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_worker_or_admin),
):
    """Retention policy: records are never hard-deleted by this API."""
    patient = get_patient_or_404(db, patient_id, user)
    patient.is_active = False
    record_audit(db, actor=user, action="patient.archived", resource_type="patient", resource_id=str(patient_id))
    db.commit()
    db.refresh(patient)
    return patient


@router.post("/{patient_id}/consent", status_code=status.HTTP_201_CREATED, summary="Record patient consent")
def grant_consent(
    patient_id: uuid.UUID,
    purpose: str = "consultation_and_referral",
    notes: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_worker_or_admin),
):
    patient = get_patient_or_404(db, patient_id, user)
    consent = PatientConsent(
        patient_id=patient.id, purpose=purpose, is_active=True, granted_at=utcnow(), notes=notes
    )
    db.add(consent)
    record_audit(db, actor=user, action="consent.granted", resource_type="patient", resource_id=str(patient_id))
    db.commit()
    db.refresh(consent)
    return {
        "id": str(consent.id),
        "patient_id": str(consent.patient_id),
        "purpose": consent.purpose,
        "is_active": consent.is_active,
        "granted_at": consent.granted_at.isoformat(),
    }


@router.get("/{patient_id}/consent", summary="Check active consent")
def get_consent(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    patient = get_patient_or_404(db, patient_id, user)
    consent = db.execute(
        select(PatientConsent)
        .where(PatientConsent.patient_id == patient.id, PatientConsent.is_active.is_(True))
        .order_by(PatientConsent.granted_at.desc())
    ).scalars().first()
    return {
        "has_active_consent": consent is not None,
        "purpose": consent.purpose if consent else None,
        "granted_at": consent.granted_at.isoformat() if consent else None,
    }
