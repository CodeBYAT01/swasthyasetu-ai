"""Idempotent offline synchronisation with explicit version conflicts."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import utcnow
from ..models.consent import PatientConsent
from ..models.consultation import Consultation
from ..models.symptom import Symptom
from ..models.sync_event import SyncEvent
from ..models.user import User, UserRole
from ..models.vital_sign import VitalSign
from ..schemas.consultation import ConsultationCreate
from ..schemas.sync import ConflictOut, SyncPullRecord, SyncPullResponse, SyncPushRequest, SyncPushResponse
from ..security.permissions import get_patient_or_404
from ..utils.audit import record_audit

SUPPORTED_RECORD_TYPES = {"consultation"}


def _canonical(data: dict) -> str:
    return json.dumps(data, sort_keys=True, default=str)


def _apply_consultation_data(
    consultation: Consultation, data: ConsultationCreate, actor: User, version: int
) -> None:
    consultation.language = data.language
    consultation.chief_complaint = data.chief_complaint
    consultation.transcript = data.transcript
    consultation.transcript_confirmed = data.transcript_confirmed
    consultation.consultation_status = data.consultation_status
    consultation.version = version

    consultation.symptoms.clear()
    consultation.vital_signs.clear()
    for symptom in data.symptoms:
        consultation.symptoms.append(
            Symptom(
                code=symptom.code,
                description=symptom.description,
                duration=symptom.duration,
                source=symptom.source,
                confirmation_status=symptom.confirmation_status,
                confidence=symptom.confidence,
                recorded_at=symptom.recorded_at or utcnow(),
                recorded_by=actor.id,
            )
        )
    for vital in data.vital_signs:
        consultation.vital_signs.append(
            VitalSign(
                vital_type=vital.vital_type,
                value=vital.value,
                unit=vital.normalized_unit(),
                source=vital.source,
                confirmation_status=vital.confirmation_status,
                recorded_at=vital.recorded_at or utcnow(),
                recorded_by=actor.id,
            )
        )


def push_records(db: Session, actor: User, payload: SyncPushRequest) -> SyncPushResponse:
    if actor.role not in (UserRole.health_worker, UserRole.admin):
        raise HTTPException(status_code=403, detail="Only health workers can upload consultations")

    successful: list[uuid.UUID] = []
    failed: list[uuid.UUID] = []
    conflicts: list[ConflictOut] = []
    errors: list[dict] = []

    for record in payload.records:
        record_id = record.client_record_id
        try:
            if record.record_type not in SUPPORTED_RECORD_TYPES:
                raise ValueError(f"Unsupported record_type '{record.record_type}'")

            existing = db.execute(
                select(SyncEvent).where(
                    SyncEvent.device_id == payload.device_id,
                    SyncEvent.client_record_id == record_id,
                )
            ).scalar_one_or_none()

            if existing is not None and existing.status != "failed":
                if record.version < existing.version:
                    conflicts.append(
                        ConflictOut(
                            client_record_id=record_id,
                            reason="Incoming version is older than the server version",
                            current_version=existing.version,
                            expected_version=existing.version + 1,
                        )
                    )
                    continue
                if record.version == existing.version:
                    if _canonical(record.data) == _canonical(existing.payload.get("data", {})):
                        # Exact retry: acknowledge without creating a duplicate.
                        successful.append(record_id)
                        continue
                    conflicts.append(
                        ConflictOut(
                            client_record_id=record_id,
                            reason="Same version received with different data",
                            current_version=existing.version,
                            expected_version=existing.version + 1,
                        )
                    )
                    continue

            data = ConsultationCreate.model_validate({**record.data, "id": str(record_id)})
            patient = get_patient_or_404(db, data.patient_id, actor)
            consent = db.execute(
                select(PatientConsent.id).where(
                    PatientConsent.patient_id == patient.id,
                    PatientConsent.is_active.is_(True),
                )
            ).first()
            if consent is None:
                raise HTTPException(
                    status_code=409,
                    detail="Active patient consent is required before syncing a consultation",
                )
            consultation = db.get(Consultation, record_id)

            if consultation is not None:
                if consultation.version > record.version:
                    conflicts.append(
                        ConflictOut(
                            client_record_id=record_id,
                            reason="Server record is newer than the incoming record",
                            current_version=consultation.version,
                            expected_version=consultation.version + 1,
                        )
                    )
                    continue
                if consultation.version == record.version and existing is None:
                    # The consultation was created through the normal API with this UUID.
                    successful.append(record_id)
                    continue
                _apply_consultation_data(consultation, data, actor, record.version)
            else:
                consultation = Consultation(
                    id=record_id,
                    patient_id=patient.id,
                    health_worker_id=actor.id,
                    facility_id=patient.facility_id,
                    version=record.version,
                )
                _apply_consultation_data(consultation, data, actor, record.version)
                db.add(consultation)

            if existing is None:
                existing = SyncEvent(
                    device_id=payload.device_id,
                    client_record_id=record_id,
                    record_type=record.record_type,
                )
                db.add(existing)
            existing.version = record.version
            existing.payload = {"data": record.data}
            existing.status = "synced"
            existing.error_message = None
            existing.server_record_id = consultation.id
            existing.synced_at = utcnow()

            db.flush()
            record_audit(
                db,
                actor=actor,
                action="sync.record_pushed",
                resource_type="consultation",
                resource_id=str(record_id),
                details={"version": record.version, "device_id": str(payload.device_id)},
            )
            db.commit()
            successful.append(record_id)
        except HTTPException as exc:
            db.rollback()
            failed.append(record_id)
            errors.append({"client_record_id": str(record_id), "reason": str(exc.detail)})
        except (ValidationError, ValueError) as exc:
            db.rollback()
            failed.append(record_id)
            errors.append({"client_record_id": str(record_id), "reason": str(exc)[:300]})
        except IntegrityError:
            db.rollback()
            failed.append(record_id)
            errors.append(
                {"client_record_id": str(record_id), "reason": "Database integrity constraint"}
            )
        except Exception:
            db.rollback()
            failed.append(record_id)
            errors.append({"client_record_id": str(record_id), "reason": "Record could not be saved"})

    if conflicts:
        sync_status = "partial" if successful else "conflict"
    elif failed:
        sync_status = "partial" if successful else "failed"
    else:
        sync_status = "completed"

    return SyncPushResponse(
        successful=successful,
        failed=failed,
        conflicts=conflicts,
        errors=errors,
        sync_status=sync_status,
    )


def pull_records(
    db: Session,
    actor: User,
    since: datetime | None,
    limit: int = 100,
) -> SyncPullResponse:
    query = select(Consultation)
    if actor.role != UserRole.admin:
        if actor.facility_id is None:
            return SyncPullResponse(synced_at=utcnow())
        query = query.where(Consultation.facility_id == actor.facility_id)
    if since is not None:
        query = query.where(Consultation.updated_at > since)

    rows = db.execute(
        query.order_by(Consultation.updated_at, Consultation.id).limit(limit + 1)
    ).scalars().all()
    has_more = len(rows) > limit
    rows = rows[:limit]

    records = [
        SyncPullRecord(
            client_record_id=row.id,
            record_type="consultation",
            version=row.version,
            data={
                "id": str(row.id),
                "patient_id": str(row.patient_id),
                "language": row.language.value,
                "chief_complaint": row.chief_complaint,
                "transcript": row.transcript,
                "transcript_confirmed": row.transcript_confirmed,
                "consultation_status": row.consultation_status.value,
                "version": row.version,
                "symptoms": [
                    {
                        "code": symptom.code,
                        "description": symptom.description,
                        "source": symptom.source,
                        "confirmation_status": symptom.confirmation_status.value,
                    }
                    for symptom in row.symptoms
                ],
                "vital_signs": [
                    {
                        "vital_type": vital.vital_type.value,
                        "value": vital.value,
                        "unit": vital.unit,
                        "source": vital.source,
                        "confirmation_status": vital.confirmation_status.value,
                    }
                    for vital in row.vital_signs
                ],
            },
            updated_at=row.updated_at,
        )
        for row in rows
    ]

    cursor = records[-1].updated_at.isoformat() if records else (
        since.isoformat() if since else None
    )
    return SyncPullResponse(
        records=records,
        cursor=cursor,
        has_more=has_more,
        synced_at=utcnow(),
    )


def parse_cursor(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid cursor/since timestamp")
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed
