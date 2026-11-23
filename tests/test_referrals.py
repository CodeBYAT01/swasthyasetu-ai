"""Referral creation, assignment scoping and specialist review tests."""

from conftest import vitals_payload


def _create_referral(client, consultation, doctor, headers, **overrides):
    payload = {
        "consultation_id": consultation["id"],
        "assigned_doctor_id": str(doctor.id),
        "referral_reason": "Fictional referral for specialist review",
        "submit": True,
    }
    payload.update(overrides)
    response = client.post("/api/referrals", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_create_referral_and_doctor_summary(
    client, make_consultation, worker_headers, doctor_headers, doctor_user
):
    consultation = make_consultation(vital_signs=vitals_payload(spo2=86))
    client.post("/api/assessments", json={"consultation_id": consultation["id"]}, headers=worker_headers)

    referral = _create_referral(client, consultation, doctor_user, worker_headers)
    assert referral["status"] == "submitted"
    assert referral["urgency"] == "emergency_warning"
    assert referral["patient"]["full_name"].startswith("Fictional Patient")
    assert referral["transcript_confirmed"] is True
    assert referral["assessment"]["urgency_level"] == "emergency_warning"

    listing = client.get("/api/referrals", headers=doctor_headers)
    assert listing.status_code == 200
    assert listing.json()["total"] == 1

    detail = client.get(f"/api/referrals/{referral['id']}", headers=doctor_headers)
    assert detail.status_code == 200
    assert detail.json()["patient"]["id"] == consultation["patient_id"]


def test_other_doctor_cannot_access_referral(
    client, make_consultation, worker_headers, other_doctor_headers, doctor_user
):
    consultation = make_consultation()
    referral = _create_referral(client, consultation, doctor_user, worker_headers)

    response = client.get(f"/api/referrals/{referral['id']}", headers=other_doctor_headers)
    assert response.status_code == 404

    listing = client.get("/api/referrals", headers=other_doctor_headers)
    assert listing.json()["total"] == 0


def test_submit_review_and_prevent_duplicate(
    client, make_consultation, worker_headers, doctor_headers, doctor_user
):
    consultation = make_consultation()
    referral = _create_referral(client, consultation, doctor_user, worker_headers)

    review = client.post(
        f"/api/referrals/{referral['id']}/reviews",
        json={
            "clinical_comments": "Simulated specialist comment only.",
            "follow_up_recommendations": "Simulated follow-up in one week.",
        },
        headers=doctor_headers,
    )
    assert review.status_code == 201, review.text
    assert review.json()["referral_id"] == referral["id"]

    duplicate = client.post(
        f"/api/referrals/{referral['id']}/reviews",
        json={"clinical_comments": "Second simulated comment."},
        headers=doctor_headers,
    )
    assert duplicate.status_code == 409

    detail = client.get(f"/api/referrals/{referral['id']}", headers=doctor_headers)
    assert detail.json()["status"] == "advice_recorded"
    assert detail.json()["review"]["clinical_comments"].startswith("Simulated")


def test_worker_cannot_review_and_doctor_cannot_create(
    client, make_consultation, worker_headers, doctor_headers, doctor_user
):
    consultation = make_consultation()
    referral = _create_referral(client, consultation, doctor_user, worker_headers)

    assert (
        client.post(
            f"/api/referrals/{referral['id']}/reviews",
            json={"clinical_comments": "Not allowed"},
            headers=worker_headers,
        ).status_code
        == 403
    )

    assert (
        client.post(
            "/api/referrals",
            json={
                "consultation_id": consultation["id"],
                "assigned_doctor_id": str(doctor_user.id),
                "referral_reason": "Doctor should not create",
            },
            headers=doctor_headers,
        ).status_code
        == 403
    )


def test_status_update(client, make_consultation, worker_headers, doctor_headers, doctor_user):
    consultation = make_consultation()
    referral = _create_referral(client, consultation, doctor_user, worker_headers)
    response = client.put(
        f"/api/referrals/{referral['id']}/status",
        json={"status": "under_review"},
        headers=doctor_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "under_review"
    assert response.json()["status_label"] == "Under Review"
