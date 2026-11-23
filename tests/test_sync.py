"""Offline push/pull idempotency and conflict tests."""

import uuid


def _record(patient, client_record_id=None, version=1, **overrides):
    data = {
        "patient_id": patient["id"],
        "language": "Hindi",
        "chief_complaint": "Offline fictional complaint",
        "transcript": "Offline transcript requiring confirmation",
        "transcript_confirmed": False,
        "consultation_status": "draft",
        "symptoms": [
            {
                "description": "Fever",
                "code": "fever",
                "source": "voice_demo",
                "confirmation_status": "unconfirmed",
            }
        ],
        "vital_signs": [],
    }
    data.update(overrides)
    return {
        "client_record_id": str(client_record_id or uuid.uuid4()),
        "version": version,
        "record_type": "consultation",
        "data": data,
    }


def _push(client, headers, device_id, records):
    response = client.post(
        "/api/sync/push",
        json={"device_id": str(device_id), "records": records},
        headers=headers,
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_push_creates_consultation(client, make_patient, worker_headers):
    patient = make_patient()
    record = _record(patient)
    device_id = uuid.uuid4()

    result = _push(client, worker_headers, device_id, [record])
    assert result["sync_status"] == "completed"
    assert record["client_record_id"] in [str(item) for item in result["successful"]]

    consultation = client.get(
        f"/api/consultations/{record['client_record_id']}", headers=worker_headers
    )
    assert consultation.status_code == 200
    assert consultation.json()["transcript_confirmed"] is False
    assert consultation.json()["symptoms"][0]["confirmation_status"] == "unconfirmed"


def test_duplicate_push_is_idempotent(client, make_patient, worker_headers):
    patient = make_patient()
    record = _record(patient)
    device_id = uuid.uuid4()

    first = _push(client, worker_headers, device_id, [record])
    second = _push(client, worker_headers, device_id, [record])
    assert first["successful"] and second["successful"]
    assert second["conflicts"] == []

    listing = client.get("/api/consultations", headers=worker_headers)
    assert listing.json()["total"] == 1


def test_same_version_different_data_is_conflict(client, make_patient, worker_headers):
    patient = make_patient()
    record = _record(patient)
    device_id = uuid.uuid4()
    _push(client, worker_headers, device_id, [record])

    changed = _record(patient, client_record_id=record["client_record_id"], version=1)
    changed["data"]["transcript"] = "Different transcript at the same version"
    result = _push(client, worker_headers, device_id, [changed])
    assert result["sync_status"] == "conflict"
    assert result["conflicts"][0]["reason"]
    assert result["conflicts"][0]["current_version"] == 1


def test_older_version_is_rejected(client, make_patient, worker_headers):
    patient = make_patient()
    record = _record(patient)
    device_id = uuid.uuid4()
    _push(client, worker_headers, device_id, [record])

    newer = _record(patient, client_record_id=record["client_record_id"], version=2)
    newer["data"]["transcript"] = "Updated transcript at version two"
    assert _push(client, worker_headers, device_id, [newer])["sync_status"] == "completed"

    older = _record(patient, client_record_id=record["client_record_id"], version=1)
    result = _push(client, worker_headers, device_id, [older])
    assert result["sync_status"] == "conflict"
    assert result["conflicts"][0]["current_version"] == 2
    assert result["conflicts"][0]["expected_version"] == 3


def test_pull_returns_updated_records(client, make_patient, worker_headers):
    patient = make_patient()
    record = _record(patient)
    _push(client, worker_headers, uuid.uuid4(), [record])

    pull = client.get("/api/sync/pull", headers=worker_headers)
    assert pull.status_code == 200
    body = pull.json()
    assert body["records"]
    assert body["records"][0]["client_record_id"] == record["client_record_id"]
    assert body["cursor"]


def test_unsupported_record_type_fails_safely(client, make_patient, worker_headers):
    patient = make_patient()
    record = _record(patient)
    record["record_type"] = "patient"
    result = _push(client, worker_headers, uuid.uuid4(), [record])
    assert result["sync_status"] == "failed"
    assert result["errors"]


def test_doctor_cannot_push_consultations(client, make_patient, doctor_headers):
    patient = make_patient()
    response = client.post(
        "/api/sync/push",
        json={"device_id": str(uuid.uuid4()), "records": [_record(patient)]},
        headers=doctor_headers,
    )
    assert response.status_code == 403
