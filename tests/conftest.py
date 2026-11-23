"""Test configuration: isolated in-memory SQLite, never production data."""

from __future__ import annotations

import os
import uuid
from datetime import date

import pytest

# Must be set before importing app modules.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "test-only-secret-key-that-is-long-enough-48-bytes"
os.environ["AUTO_CREATE_TABLES"] = "false"
os.environ["ENVIRONMENT"] = "test"

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.facility import Facility  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402
from app.security.authentication import hash_password  # noqa: E402

TEST_PASSWORD = "TestPass123!"


@pytest.fixture()
def db_engine():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)


@pytest.fixture()
def db_session(db_engine):
    TestingSession = sessionmaker(bind=db_engine, autoflush=False, expire_on_commit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _make_user(db, email, role, facility_id, name="Test User"):
    user = User(
        email=email,
        full_name=name,
        hashed_password=hash_password(TEST_PASSWORD),
        role=role,
        facility_id=facility_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def facility(db_session):
    row = Facility(name="Test PHC", district="Test District", state="Karnataka")
    db_session.add(row)
    db_session.commit()
    db_session.refresh(row)
    return row


@pytest.fixture()
def other_facility(db_session):
    row = Facility(name="Other PHC", district="Other District", state="Karnataka")
    db_session.add(row)
    db_session.commit()
    db_session.refresh(row)
    return row


@pytest.fixture()
def admin_user(db_session):
    return _make_user(db_session, "admin@test-swasthya.in", UserRole.admin, None, "Test Admin")


@pytest.fixture()
def worker_user(db_session, facility):
    return _make_user(db_session, "worker@test-swasthya.in", UserRole.health_worker, facility.id, "Test Worker")


@pytest.fixture()
def doctor_user(db_session, facility):
    return _make_user(db_session, "doctor@test-swasthya.in", UserRole.doctor, facility.id, "Dr Test")


@pytest.fixture()
def other_doctor_user(db_session, facility):
    return _make_user(db_session, "doctor2@test-swasthya.in", UserRole.doctor, facility.id, "Dr Other")


def _login(client, email):
    response = client.post(
        "/api/auth/login", json={"email": email, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture()
def admin_headers(client, admin_user):
    return _login(client, admin_user.email)


@pytest.fixture()
def worker_headers(client, worker_user):
    return _login(client, worker_user.email)


@pytest.fixture()
def doctor_headers(client, doctor_user):
    return _login(client, doctor_user.email)


@pytest.fixture()
def other_doctor_headers(client, other_doctor_user):
    return _login(client, other_doctor_user.email)


@pytest.fixture()
def make_patient(client, worker_headers, worker_user):
    counter = {"n": 0}

    def _make(**overrides):
        counter["n"] += 1
        payload = {
            "local_patient_code": f"TEST-{counter['n']:04d}",
            "full_name": f"Fictional Patient {counter['n']}",
            "age": 30 + counter["n"],
            "sex": "female",
            "village": "Test Village",
            "facility_id": str(worker_user.facility_id),
            "relevant_medical_history": None,
            "allergies": None,
            "consent_given": True,
        }
        payload.update(overrides)
        response = client.post("/api/patients", json=payload, headers=worker_headers)
        assert response.status_code == 201, response.text
        return response.json()

    return _make


@pytest.fixture()
def make_consultation(client, worker_headers, make_patient):
    def _make(patient=None, **overrides):
        patient = patient or make_patient()
        payload = {
            "patient_id": patient["id"],
            "language": "English",
            "chief_complaint": "Fictional test complaint",
            "transcript": "Patient reports fever and headache",
            "transcript_confirmed": True,
            "consultation_status": "completed",
            "symptoms": [],
            "vital_signs": [],
        }
        payload.update(overrides)
        response = client.post("/api/consultations", json=payload, headers=worker_headers)
        assert response.status_code == 201, response.text
        return response.json()

    return _make


def vitals_payload(**overrides):
    values = {
        "temperature": ("temperature", 37.0, "C"),
        "pulse": ("pulse", 80, "BPM"),
        "systolic": ("systolic_bp", 120, "mmHg"),
        "diastolic": ("diastolic_bp", 80, "mmHg"),
        "spo2": ("oxygen_saturation", 98, "%"),
        "respiratory": ("respiratory_rate", 16, "breaths/min"),
    }
    result = []
    for name, (vital_type, value, unit) in values.items():
        if name in overrides:
            value = overrides[name]
        if value is None:
            continue
        result.append(
            {
                "vital_type": vital_type,
                "value": value,
                "unit": unit,
                "source": "manual",
                "confirmation_status": "confirmed",
            }
        )
    return result
