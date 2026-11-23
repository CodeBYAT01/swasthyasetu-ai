"""Authentication and role-based access tests."""


def test_register_login_and_me(client, facility):
    payload = {
        "email": "new.worker@test-swasthya.in",
        "password": "StrongPass123!",
        "full_name": "New Worker",
        "role": "health_worker",
        "facility_id": str(facility.id),
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201, response.text
    assert response.json()["email"] == payload["email"]
    assert "hashed_password" not in response.json()

    login = client.post(
        "/api/auth/login", json={"email": payload["email"], "password": payload["password"]}
    )
    assert login.status_code == 200
    body = login.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["role"] == "health_worker"

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200
    assert me.json()["email"] == payload["email"]


def test_duplicate_registration_is_rejected(client, facility):
    payload = {
        "email": "duplicate@test-swasthya.in",
        "password": "StrongPass123!",
        "full_name": "Duplicate User",
        "role": "health_worker",
        "facility_id": str(facility.id),
    }
    assert client.post("/api/auth/register", json=payload).status_code == 201
    assert client.post("/api/auth/register", json=payload).status_code == 409


def test_invalid_login(client, worker_user):
    response = client.post(
        "/api/auth/login", json={"email": worker_user.email, "password": "WrongPassword1"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_protected_endpoint_requires_token(client):
    assert client.get("/api/auth/me").status_code in (401, 403)


def test_admin_registration_blocked_by_default(client, facility):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "sneaky.admin@test-swasthya.in",
            "password": "StrongPass123!",
            "full_name": "Sneaky Admin",
            "role": "admin",
            "facility_id": str(facility.id),
        },
    )
    assert response.status_code == 403


def test_role_restrictions(client, worker_headers, admin_headers):
    assert client.get("/api/dashboard/admin", headers=worker_headers).status_code == 403
    assert client.get("/api/dashboard/admin", headers=admin_headers).status_code == 200

    forbidden = client.post(
        "/api/users/facilities",
        json={"name": "Unauthorized Facility", "district": "Nowhere"},
        headers=worker_headers,
    )
    assert forbidden.status_code == 403

    allowed = client.post(
        "/api/users/facilities",
        json={"name": "Admin Facility", "district": "Test"},
        headers=admin_headers,
    )
    assert allowed.status_code == 201
