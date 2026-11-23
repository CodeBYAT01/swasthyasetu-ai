"""Clinical safety assessment endpoints (deterministic demo rules)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.assessment import Assessment
from ..schemas.assessment import AssessmentCreate, AssessmentOut
from ..security.permissions import (
    get_consultation_or_404,
    get_current_user,
    get_current_worker_or_admin,
)
from ..services.referral_service import assessment_to_out
from ..services.triage_engine import store_assessment

router = APIRouter(prefix="/assessments", tags=["Clinical Safety"])


@router.post(
    "",
    response_model=AssessmentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Run and store a rule-based safety assessment",
    description=(
        "Illustrative demo rules only. Never interpreted as a diagnosis. "
        "Emergency warnings require immediate local escalation."
    ),
)
def create_assessment(
    payload: AssessmentCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_worker_or_admin),
):
    consultation = get_consultation_or_404(db, payload.consultation_id, user)
    assessment = store_assessment(db, consultation, user)
    return assessment_to_out(assessment)


@router.get("/{assessment_id}", response_model=AssessmentOut, summary="Get a stored assessment")
def get_assessment(
    assessment_id: uuid.UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    assessment = db.get(Assessment, assessment_id)
    if assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    get_consultation_or_404(db, assessment.consultation_id, user)
    return assessment_to_out(assessment)
