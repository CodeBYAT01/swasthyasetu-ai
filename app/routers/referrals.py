"""Referral and specialist-review endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.referral import Referral
from ..models.user import UserRole
from ..schemas.referral import ReferralCreate, ReferralOut, ReferralStatusUpdate
from ..schemas.specialist_review import ReviewCreate, ReviewOut
from ..security.authentication import get_current_user
from ..security.permissions import get_referral_for_doctor, get_current_worker_or_admin
from ..services import referral_service
from ..utils.response import paginated

router = APIRouter(prefix="/referrals", tags=["Referrals"])


@router.post(
    "",
    response_model=ReferralOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a specialist referral",
)
def create_referral(
    payload: ReferralCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_worker_or_admin),
):
    referral = referral_service.create_referral(db, user, payload)
    return referral_service.referral_to_out(db, referral)


@router.get("", response_model=dict, summary="List referrals visible to the current user")
def list_referrals(
    status_filter: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    query = select(Referral)

    if user.role == UserRole.doctor:
        query = query.where(Referral.assigned_doctor_id == user.id)
    elif user.role == UserRole.health_worker:
        query = query.where(Referral.created_by == user.id)
    elif user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Access denied")

    if status_filter:
        query = query.where(Referral.status == status_filter)
    total = db.execute(select(func.count()).select_from(query.subquery())).scalar_one()
    rows = (
        db.execute(query.order_by(Referral.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
        .scalars()
        .all()
    )
    return paginated([referral_service.referral_to_out(db, row) for row in rows], total, page, page_size)


@router.get("/{referral_id}", response_model=ReferralOut, summary="Get referral with patient summary")
def get_referral(
    referral_id: uuid.UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    referral = get_referral_for_doctor(db, referral_id, user)
    if user.role != UserRole.doctor and user.role != UserRole.admin:
        # Workers may only see referrals they created.
        if referral.created_by != user.id:
            raise HTTPException(status_code=404, detail="Referral not found")
    return referral_service.referral_to_out(db, referral)


@router.put("/{referral_id}/status", response_model=ReferralOut, summary="Update referral status")
def update_status(
    referral_id: uuid.UUID,
    payload: ReferralStatusUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    referral = get_referral_for_doctor(db, referral_id, user)
    if user.role not in (UserRole.doctor, UserRole.admin):
        raise HTTPException(status_code=403, detail="Only a doctor or administrator can change status")
    referral.status = payload.status
    db.commit()
    db.refresh(referral)
    return referral_service.referral_to_out(db, referral)


@router.post(
    "/{referral_id}/reviews",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a specialist review",
)
def submit_review(
    referral_id: uuid.UUID,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.role != UserRole.doctor:
        raise HTTPException(status_code=403, detail="Only doctors can submit reviews")
    referral = get_referral_for_doctor(db, referral_id, user)
    return referral_service.submit_review(db, referral, user, payload)
