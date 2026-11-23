"""Referral creation, doctor-facing summaries and specialist reviews."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import utcnow
from ..models.assessment import UrgencyLevel
from ..models.consultation import Consultation
from ..models.patient import Patient
from ..models.referral import (
    REFERRAL_STATUS_LABELS,
    Referral,
    ReferralStatus,
)
from ..models.specialist_review import SpecialistReview
from ..models.user import User, UserRole
from ..schemas.assessment import AssessmentOut
from ..schemas.referral import PatientSummary, ReferralCreate, ReferralOut, ReviewCreate
from ..schemas.specialist_review import ReviewOut
from ..security.permissions import ensure_facility_access
from ..services.triage_engine import urgency_label
from ..utils.audit import record_audit


def _next_reference(db: Session) -> str:
    count = db.execute(select(func.count()).select_from(Referral)).scalar_one() + 1
    return f"REF-{utcnow().year}-{count:04d}"


def assessment_to_out(assessment) -> AssessmentOut | None:
    if assessment is None:
        return None
    data = AssessmentOut.model_validate(assessment, from_attributes=True)
    data.urgency_label = urgency_label(data.urgency_level)
    return data


def create_referral(db: Session, actor: User, payload: ReferralCreate) -> Referral:
    consultation = db.get(Consultation, payload.consultation_id)
    if consultation is None:
        raise HTTPException(status_code=404, detail="Consultation not found")
    ensure_facility_access(actor, consultation.facility_id)

    doctor = db.get(User, payload.assigned_doctor_id)
    if doctor is None or doctor.role != UserRole.doctor or not doctor.is_active:
        raise HTTPException(status_code=422, detail="assigned_doctor_id must be an active doctor")
    if doctor.facility_id and actor.role != UserRole.admin:
        ensure_facility_access(actor, doctor.facility_id)

    latest_assessment = consultation.assessments[0] if consultation.assessments else None
    urgency = payload.urgency
    if urgency is None:
        urgency = latest_assessment.urgency_level if latest_assessment else UrgencyLevel.further_assessment_required

    referral = Referral(
        consultation_id=consultation.id,
        created_by=actor.id,
        assigned_doctor_id=doctor.id,
        referral_reason=payload.referral_reason,
        urgency=urgency,
        status=ReferralStatus.submitted if payload.submit else ReferralStatus.created,
        reference=_next_reference(db),
    )
    db.add(referral)
    db.flush()
    record_audit(
        db,
        actor=actor,
        action="referral.created",
        resource_type="referral",
        resource_id=str(referral.id),
        details={"urgency": urgency.value, "doctor_id": str(doctor.id)},
    )
    db.commit()
    db.refresh(referral)
    return referral


def referral_to_out(db: Session, referral: Referral) -> ReferralOut:
    consultation = referral.consultation
    patient = db.get(Patient, consultation.patient_id)
    latest_assessment = consultation.assessments[0] if consultation.assessments else None

    patient_summary = None
    if patient is not None:
        patient_summary = PatientSummary(
            id=patient.id,
            local_patient_code=patient.local_patient_code,
            full_name=patient.full_name,
            age=patient.age,
            sex=patient.sex.value if patient.sex else None,
            village=patient.village or None,
            relevant_medical_history=patient.relevant_medical_history,
            allergies=patient.allergies,
        )

    return ReferralOut(
        id=referral.id,
        reference=referral.reference,
        consultation_id=referral.consultation_id,
        created_by=referral.created_by,
        assigned_doctor_id=referral.assigned_doctor_id,
        referral_reason=referral.referral_reason,
        urgency=referral.urgency,
        urgency_label=urgency_label(referral.urgency),
        status=referral.status,
        status_label=REFERRAL_STATUS_LABELS[referral.status],
        created_at=referral.created_at,
        updated_at=referral.updated_at,
        review=ReviewOut.model_validate(referral.review, from_attributes=True)
        if referral.review
        else None,
        patient=patient_summary,
        language=consultation.language.value,
        chief_complaint=consultation.chief_complaint,
        transcript=consultation.transcript,
        transcript_confirmed=consultation.transcript_confirmed,
        symptoms=list(consultation.symptoms),
        vital_signs=list(consultation.vital_signs),
        assessment=assessment_to_out(latest_assessment),
    )


def submit_review(
    db: Session, referral: Referral, doctor: User, payload: ReviewCreate
) -> SpecialistReview:
    if referral.review is not None:
        raise HTTPException(status_code=409, detail="A review has already been submitted")
    review = SpecialistReview(
        referral_id=referral.id,
        doctor_id=doctor.id,
        clinical_comments=payload.clinical_comments,
        follow_up_recommendations=payload.follow_up_recommendations,
    )
    referral.status = ReferralStatus.advice_recorded
    db.add(review)
    db.flush()
    record_audit(
        db,
        actor=doctor,
        action="referral.review_submitted",
        resource_type="referral",
        resource_id=str(referral.id),
    )
    db.commit()
    db.refresh(review)
    return review
