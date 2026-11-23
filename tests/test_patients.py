"""Patient registration, search, consent and archiving tests."""


def test_register_and_get_patient(client, make_patient, worker_headers):
    patient = make_patient(full_name="Fictional Lakshmi Rao", village="Demo Halli")
    assert patient["full_name"] == "Fictional Lakshmi Rao"
    assert patient["is_active"] is True

    response = client.get(f"/api/patients/{patient['id']}", headers=worker_headers)
    assert response.status_code == 200
    assert response.json()["local_patient_code"] == patient["local_patient_code"]

    consent = client.get(f"/api/patients/{patient['id']}/consent", headers=worker_headers)
    assert consent.status_code == 200
    assert consent.json()["has_active_consent"] is True


def test_search_by_name_code_and_village(client, make_patient, worker_headers):
    first = make_patient(full_name="Fictional Gowda", village="Alpha Village")
    second = make_patient(full_name="Fictional Hegde", village="Beta Village")

    by_name = client.get("/api/patients?q=Gowda", headers=worker_headers)
    assert by_name.status_code == 200
    assert by_name.json()["total"] == 1
    assert by_name.json()["items"][0]["id"] == first["id"]

    by_village = client.get("/api/patients?village=Beta", headers=worker_headers)
    assert by_village.json()["total"] == 1
    assert by_village.json()["items"][0]["id"] == second["id"]

    by_code = client.get(f"/api/patients?q={second['local_patient_code']}", headers=worker_headers)
    assert by_code.json()["total"] == 1


def test_update_patient(client, make_patient, worker_headers):
    patient = make_patient()
    response = client.put(
        f"/api/patients/{patient['id']}",
        json={"village": "Updated Village", "allergies": "None known"},
        headers=worker_headers,
    )
    assert response.status_code == 200
    assert response.json()["village"] == "Updated Village"
    assert response.json()["allergies"] == "None known"


def test_duplicate_patient_code_rejected(client, make_patient, worker_headers):
    patient = make_patient()
    duplicate = client.post(
        "/api/patients",
        json={
            "local_patient_code": patient["local_patient_code"],
            "full_name": "Another Fictional Patient",
            "age": 40,
            "facility_id": patient["facility_id"],
        },
        headers=worker_headers,
    )
    assert duplicate.status_code == 409


def test_archive_patient_never_hard_deletes(client, make_patient, worker_headers):
    patient = make_patient()
    archived = client.delete(f"/api/patients/{patient['id']}", headers=worker_headers)
    assert archived.status_code == 200
    assert archived.json()["is_active"] is False

    listed = client.get("/api/patients", headers=worker_headers)
    assert listed.json()["total"] == 0

    listed_inactive = client.get("/api/patients?include_inactive=true", headers=worker_headers)
    assert listed_inactive.json()["total"] == 1


def test_doctor_cannot_list_patients(client, doctor_headers):
    response = client.get("/api/patients", headers=doctor_headers)
    assert response.status_code == 403
