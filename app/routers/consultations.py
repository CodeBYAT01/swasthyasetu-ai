"""Consultation record endpoints (symptoms and vitals are child records)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db, utcnow
from ..models.consent import PatientConsent
from ..models.consultation import Consultation
from ..models.symptom import Symptom
from ..models.vital_sign import VitalSign
from ..schemas.consultation import ConsultationCreate, ConsultationOut, ConsultationUpdate
from ..schemas.symptom import SymptomCreate, SymptomOut
from ..schemas.vital_sign import VitalSignCreate, VitalSignOut
from ..security.permissions import (
    get_consultation_or_404,
    get_current_user,
    get_current_worker_or_admin,
    get_patient_or_404,
)
from ..utils.audit import record_audit
from ..utils.response import paginated

router = APIRouter(prefix="/consultations", tags=["Consultations"])


def _require_consent(db: Session, patient_id: uuid.UUID) -> None:
    has_consent = db.execute(
        select(PatientConsent.id).where(
            PatientConsent.patient_id == patient_id,
            PatientConsent.is_active.is_(True),
        )
    ).first()
    if has_consent is None:
        raise HTTPException(
            status_code=409,
            detail="Active patient consent is required before recording a consultation",
        )


@router.post(
    "",
    response_model=ConsultationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a consultation",
    responses={409: {"description": "Consent missing or duplicate offline UUID"}},
)
def create_consultation(
    payload: ConsultationCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_worker_or_admin),
):
    patient = get_patient_or_404(db, payload.patient_id, user)
    _require_consent(db, patient.id)

    consultation_id = payload.id or uuid.uuid4()
    if db.get(Consultation, consultation_id) is not None:
        raise HTTPException(status_code=409, detail="A consultation with this id already exists")

    consultation = Consultation(
        id=consultation_id,
        patient_id=patient.id,
        health_worker_id=user.id,
        facility_id=patient.facility_id,
        language=payload.language,
        chief_complaint=payload.chief_complaint,
        transcript=payload.transcript,
        transcript_confirmed=payload.transcript_confirmed,
        consultation_status=payload.consultation_status,
    )
    for symptom in payload.symptoms:
        consultation.symptoms.append(
            Symptom(
                code=symptom.code,
                description=symptom.description,
                duration=symptom.duration,
                source=symptom.source,
                confirmation_status=symptom.confirmation_status,
                confidence=symptom.confidence,
                recorded_at=symptom.recorded_at or utcnow(),
                recorded_by=user.id,
            )
        )
    for vital in payload.vital_signs:
        consultation.vital_signs.append(
            VitalSign(
                vital_type=vital.vital_type,
                value=vital.value,
                unit=vital.normalized_unit(),
                source=vital.source,
                confirmation_status=vital.confirmation_status,
                recorded_at=vital.recorded_at or utcnow(),
                recorded_by=user.id,
            )
        )

    db.add(consultation)
    db.flush()
    record_audit(db, actor=user, action="consultation.created", resource_type="consultation", resource_id=str(consultation.id))
    db.commit()
    db.refresh(consultation)
    return consultation


@router.get("", response_model=dict, summary="List consultations with filters")
def list_consultations(
    patient_id: uuid.UUID | None = None,
    consultation_status: str | None = None,
    language: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.role not in ("health_worker", "admin"):
        raise HTTPException(status_code=403, detail="Access denied")
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    query = select(Consultation)
    if user.role != "admin":
        query = query.where(Consultation.facility_id == user.facility_id)
    if patient_id is not None:
        query = query.where(Consultation.patient_id == patient_id)
    if consultation_status:
        query = query.where(Consultation.consultation_status == consultation_status)
    if language:
        query = query.where(Consultation.language == language)

    total = db.execute(select(func.count()).select_from(query.subquery())).scalar_one()
    rows = (
        db.execute(query.order_by(Consultation.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
        .scalars()
        .all()
    )
    return paginated([ConsultationOut.model_validate(row) for row in rows], total, page, page_size)


@router.get("/{consultation_id}", response_model=ConsultationOut, summary="Get consultation details")
def get_consultation(
    consultation_id: uuid.UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return get_consultation_or_404(db, consultation_id, user)


@router.put("/{consultation_id}", response_model=ConsultationOut, summary="Update consultation")
def update_consultation(
    consultation_id: uuid.UUID,
    payload: ConsultationUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_worker_or_admin),
):
    consultation = get_consultation_or_404(db, consultation_id, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(consultation, field, value)
    consultation.version += 1
    record_audit(db, actor=user, action="consultation.updated", resource_type="consultation", resource_id=str(consultation_id))
    db.commit()
    db.refresh(consultation)
    return consultation


@router.post(
    "/{consultation_id}/symptoms",
    response_model=SymptomOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a symptom to a consultation",
)
def add_symptom(
    consultation_id: uuid.UUID,
    payload: SymptomCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_worker_or_admin),
):
    consultation = get_consultation_or_404(db, consultation_id, user)
    symptom = Symptom(
        consultation_id=consultation.id,
        code=payload.code,
        description=payload.description,
        duration=payload.duration,
        source=payload.source,
        confirmation_status=payload.confirmation_status,
        confidence=payload.confidence,
        recorded_at=payload.recorded_at or utcnow(),
        recorded_by=user.id,
    )
    db.add(symptom)
    db.commit()
    db.refresh(symptom)
    return symptom


@router.post(
    "/{consultation_id}/vital-signs",
    response_model=VitalSignOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a vital sign to a consultation",
)
def add_vital_sign(
    consultation_id: uuid.UUID,
    payload: VitalSignCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_worker_or_admin),
):
    consultation = get_consultation_or_404(db, consultation_id, user)
    vital = VitalSign(
        consultation_id=consultation.id,
        vital_type=payload.vital_type,
        value=payload.value,
        unit=payload.normalized_unit(),
        source=payload.source,
        confirmation_status=payload.confirmation_status,
        recorded_at=payload.recorded_at or utcnow(),
        recorded_by=user.id,
    )
    db.add(vital)
    db.commit()
    db.refresh(vital)
    return vital
