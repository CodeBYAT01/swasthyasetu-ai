"""Role-scoped dashboard counters for the React frontend."""

from __future__ import annotations

from datetime import datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db, utcnow
from ..models.consultation import Consultation
from ..models.facility import Facility
from ..models.patient import Patient
from ..models.referral import Referral
from ..models.sync_event import SyncEvent
from ..models.user import User, UserRole
from ..schemas.consultation import ConsultationOut
from ..security.permissions import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

PENDING_REVIEW_STATUSES = ("submitted", "acknowledged", "under_review")


def _start_of_utc_today() -> datetime:
    return datetime.combine(utcnow().date(), time.min, tzinfo=timezone.utc)


@router.get("/worker", summary="Frontline health worker dashboard")
def worker_dashboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role != UserRole.health_worker:
        raise HTTPException(status_code=403, detail="Worker dashboard only")
    facility_id = user.facility_id

    patients = db.execute(
        select(func.count()).select_from(Patient).where(
            Patient.facility_id == facility_id, Patient.is_active.is_(True)
        )
    ).scalar_one()
    consultations_today = db.execute(
        select(func.count()).select_from(Consultation).where(
            Consultation.facility_id == facility_id,
            Consultation.created_at >= _start_of_utc_today(),
        )
    ).scalar_one()

    facility_consultation_ids = select(Consultation.id).where(Consultation.facility_id == facility_id)
    pending_referrals = db.execute(
        select(func.count()).select_from(Referral).where(
            Referral.created_by == user.id,
            Referral.status.in_(PENDING_REVIEW_STATUSES),
        )
    ).scalar_one()
    pending_sync = db.execute(
        select(func.count()).select_from(SyncEvent).where(
            SyncEvent.status.in_(("pending", "failed")),
            SyncEvent.server_record_id.in_(facility_consultation_ids),
        )
    ).scalar_one()
    recent = (
        db.execute(
            select(Consultation)
            .where(Consultation.facility_id == facility_id)
            .order_by(Consultation.created_at.desc())
            .limit(5)
        )
        .scalars()
        .all()
    )
    return {
        "role": "health_worker",
        "total_registered_patients": patients,
        "consultations_today": consultations_today,
        "pending_referrals": pending_referrals,
        "pending_synchronization": pending_sync,
        "recent_consultations": [ConsultationOut.model_validate(row) for row in recent],
        "generated_at": utcnow().isoformat(),
        "note": "Pending synchronization counts records the server has not acknowledged.",
    }


@router.get("/doctor", summary="Doctor / specialist dashboard")
def doctor_dashboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role != UserRole.doctor:
        raise HTTPException(status_code=403, detail="Doctor dashboard only")

    assigned = db.execute(
        select(func.count()).select_from(Referral).where(Referral.assigned_doctor_id == user.id)
    ).scalar_one()
    emergency = db.execute(
        select(func.count()).select_from(Referral).where(
            Referral.assigned_doctor_id == user.id,
            Referral.urgency == "emergency_warning",
        )
    ).scalar_one()
    pending_reviews = db.execute(
        select(func.count())
        .select_from(Referral)
        .where(
            Referral.assigned_doctor_id == user.id,
            Referral.status.in_(PENDING_REVIEW_STATUSES),
        )
    ).scalar_one()
    reviewed = (
        db.execute(
            select(Referral)
            .where(
                Referral.assigned_doctor_id == user.id,
                Referral.status == "advice_recorded",
            )
            .order_by(Referral.updated_at.desc())
            .limit(5)
        )
        .scalars()
        .all()
    )
    return {
        "role": "doctor",
        "assigned_referrals": assigned,
        "emergency_priority_referrals": emergency,
        "pending_reviews": pending_reviews,
        "recently_reviewed": [
            {
                "id": str(row.id),
                "reference": row.reference,
                "patient_id": str(row.consultation.patient_id),
                "status": row.status.value,
                "updated_at": row.updated_at.isoformat(),
            }
            for row in reviewed
        ],
        "generated_at": utcnow().isoformat(),
    }


@router.get("/admin", summary="Administrator dashboard")
def admin_dashboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin dashboard only")
    return {
        "role": "admin",
        "total_users": db.execute(select(func.count()).select_from(User)).scalar_one(),
        "total_facilities": db.execute(select(func.count()).select_from(Facility)).scalar_one(),
        "total_patients": db.execute(select(func.count()).select_from(Patient)).scalar_one(),
        "total_consultations": db.execute(
            select(func.count()).select_from(Consultation)
        ).scalar_one(),
        "synchronization_failures": db.execute(
            select(func.count()).select_from(SyncEvent).where(SyncEvent.status == "failed")
        ).scalar_one(),
        "generated_at": utcnow().isoformat(),
    }
