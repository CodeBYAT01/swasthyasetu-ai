"""Administrator-only user and facility management."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.facility import Facility
from ..models.user import User
from ..schemas.user import FacilityCreate, FacilityOut, UserCreate, UserOut, UserUpdate
from ..security.authentication import hash_password
from ..security.permissions import get_current_admin
from ..utils.audit import record_audit
from ..utils.response import paginated

router = APIRouter(prefix="/users", tags=["Users & Facilities"])


@router.get("/facilities", response_model=list[FacilityOut], summary="List facilities (admin)")
def list_facilities(
    db: Session = Depends(get_db), admin=Depends(get_current_admin)
):
    return db.execute(select(Facility).order_by(Facility.name)).scalars().all()


@router.post(
    "/facilities",
    response_model=FacilityOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a facility (admin)",
)
def create_facility(
    payload: FacilityCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    facility = Facility(**payload.model_dump())
    db.add(facility)
    db.flush()
    record_audit(db, actor=admin, action="facility.created", resource_type="facility", resource_id=str(facility.id))
    db.commit()
    db.refresh(facility)
    return facility


@router.get("", response_model=dict, summary="List users (admin)")
def list_users(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    total = db.execute(select(func.count()).select_from(User)).scalar_one()
    rows = (
        db.execute(
            select(User).order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        .scalars()
        .all()
    )
    return paginated([UserOut.model_validate(row) for row in rows], total, page, page_size)


@router.post(
    "",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a user (admin)",
)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if db.execute(select(User).where(User.email == payload.email.lower())).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    if payload.facility_id is not None and db.get(Facility, payload.facility_id) is None:
        raise HTTPException(status_code=404, detail="Facility not found")
    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        facility_id=payload.facility_id,
    )
    db.add(user)
    db.flush()
    record_audit(db, actor=admin, action="user.created", resource_type="user", resource_id=str(user.id))
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserOut, summary="Update a user (admin)")
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    record_audit(db, actor=admin, action="user.updated", resource_type="user", resource_id=str(user_id))
    db.commit()
    db.refresh(user)
    return user
