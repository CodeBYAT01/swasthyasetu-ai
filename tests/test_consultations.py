"""Consultation, symptom and vital-sign tests."""

from conftest import vitals_payload


def test_create_consultation_with_symptoms_and_vitals(client, make_consultation, worker_headers):
    consultation = make_consultation(
        symptoms=[
            {
                "description": "Fever",
                "code": "fever",
                "source": "voice_demo",
                "confirmation_status": "unconfirmed",
            }
        ],
        vital_signs=vitals_payload(temperature=38.2),
    )
    assert consultation["transcript_confirmed"] is True
    assert len(consultation["symptoms"]) == 1
    assert consultation["symptoms"][0]["confirmation_status"] == "unconfirmed"
    assert len(consultation["vital_signs"]) == 6

    fetched = client.get(f"/api/consultations/{consultation['id']}", headers=worker_headers)
    assert fetched.status_code == 200
    assert fetched.json()["chief_complaint"] == "Fictional test complaint"


def test_missing_vitals_stay_missing(client, make_consultation):
    consultation = make_consultation(vital_signs=[])
    assert consultation["vital_signs"] == []

    # Only one vital supplied: nothing is invented for the rest.
    partial = make_consultation(
        vital_signs=[
            {
                "vital_type": "oxygen_saturation",
                "value": 95,
                "unit": "%",
                "source": "manual",
                "confirmation_status": "confirmed",
            }
        ]
    )
    assert len(partial["vital_signs"]) == 1
    assert partial["vital_signs"][0]["vital_type"] == "oxygen_saturation"


def test_invalid_vital_value_rejected(client, make_patient, worker_headers):
    patient = make_patient()
    response = client.post(
        "/api/consultations",
        json={
            "patient_id": patient["id"],
            "language": "English",
            "vital_signs": [
                {
                    "vital_type": "oxygen_saturation",
                    "value": 250,
                    "unit": "%",
                }
            ],
        },
        headers=worker_headers,
    )
    assert response.status_code == 422


def test_consultation_requires_active_consent(client, make_patient, worker_headers):
    patient = make_patient(consent_given=False)
    response = client.post(
        "/api/consultations",
        json={"patient_id": patient["id"], "language": "Kannada"},
        headers=worker_headers,
    )
    assert response.status_code == 409
    assert "consent" in response.json()["detail"].lower()


def test_add_symptom_and_vital_after_creation(client, make_consultation, worker_headers):
    consultation = make_consultation()
    symptom = client.post(
        f"/api/consultations/{consultation['id']}/symptoms",
        json={"description": "Headache", "code": "headache", "source": "manual"},
        headers=worker_headers,
    )
    assert symptom.status_code == 201
    assert symptom.json()["confirmation_status"] == "unconfirmed"

    vital = client.post(
        f"/api/consultations/{consultation['id']}/vital-signs",
        json={"vital_type": "pulse", "value": 88, "unit": "BPM"},
        headers=worker_headers,
    )
    assert vital.status_code == 201
    assert vital.json()["unit"] == "BPM"


def test_doctor_cannot_create_consultation(client, make_patient, doctor_headers):
    patient = make_patient()
    response = client.post(
        "/api/consultations",
        json={"patient_id": patient["id"], "language": "English"},
        headers=doctor_headers,
    )
    assert response.status_code == 403
