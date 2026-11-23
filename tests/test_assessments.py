"""Deterministic safety assessment tests (illustrative demo rules)."""

from conftest import vitals_payload


def _assess(client, consultation, headers):
    response = client.post(
        "/api/assessments", json={"consultation_id": consultation["id"]}, headers=headers
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_emergency_warning_for_low_oxygen(client, make_consultation, worker_headers):
    consultation = make_consultation(vital_signs=vitals_payload(spo2=86))
    assessment = _assess(client, consultation, worker_headers)

    assert assessment["urgency_level"] == "emergency_warning"
    assert assessment["urgency_label"] == "Emergency warning"
    assert "low_oxygen_saturation" in assessment["triggered_flags"]
    assert assessment["emergency_action"]
    assert "immediate local emergency escalation" in assessment["emergency_action"].lower()
    assert assessment["rule_version"] == "demo-v1"
    assert assessment["triggers"]


def test_incomplete_information_when_vitals_missing(client, make_consultation, worker_headers):
    consultation = make_consultation(vital_signs=[])
    assessment = _assess(client, consultation, worker_headers)

    assert assessment["urgency_level"] == "incomplete_information"
    assert "oxygen_saturation" in assessment["missing_information"]
    assert "temperature" in assessment["missing_information"]
    assert assessment["triggered_flags"] == []


def test_no_rule_triggered_never_claims_healthy(client, make_consultation, worker_headers):
    consultation = make_consultation(vital_signs=vitals_payload())
    assessment = _assess(client, consultation, worker_headers)

    assert assessment["urgency_level"] == "further_assessment_required"
    assert assessment["missing_information"] == []
    assert any("does not mean" in reason.lower() for reason in assessment["reasons"])
    assert "healthy" not in str(assessment["triggered_flags"]).lower()


def test_unconfirmed_voice_information_is_flagged(client, make_consultation, worker_headers):
    consultation = make_consultation(
        transcript_confirmed=False,
        symptoms=[
            {
                "description": "Chest pain",
                "code": "chest_pain",
                "source": "voice_demo",
                "confirmation_status": "unconfirmed",
            }
        ],
        vital_signs=vitals_payload(),
    )
    assessment = _assess(client, consultation, worker_headers)
    assert assessment["urgency_level"] == "emergency_warning"
    assert assessment["uncertain_information"]


def test_get_assessment(client, make_consultation, worker_headers):
    consultation = make_consultation(vital_signs=vitals_payload(spo2=86))
    created = _assess(client, consultation, worker_headers)
    fetched = client.get(f"/api/assessments/{created['id']}", headers=worker_headers)
    assert fetched.status_code == 200
    assert fetched.json()["id"] == created["id"]
    assert fetched.json()["disclaimer"]
