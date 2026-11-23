"""Seed fictional demo data.

Usage (from the backend folder, virtualenv active):
    python -m app.seed
    python -m app.seed --reset    # DESTRUCTIVE: drops and recreates all tables

All names, phone numbers and clinical values below are fictional and intended
only for a hackathon demonstration. Demo login password: DemoPass123!
"""

from __future__ import annotations

import argparse
import sys
from datetime import date, timedelta

from sqlalchemy import select

from .database import Base, SessionLocal, engine, utcnow
from .models.assessment import UrgencyLevel
from .models.consent import PatientConsent
from .models.consultation import Consultation, ConsultationLanguage, ConsultationStatus
from .models.facility import Facility
from .models.patient import Patient, PatientSex
from .models.referral import Referral, ReferralStatus
from .models.symptom import ConfirmationStatus, Symptom
from .models.specialist_review import SpecialistReview
from .models.user import User, UserRole
from .models.vital_sign import VitalSign, VitalType
from .security.authentication import hash_password
from .services.triage_engine import store_assessment

DEMO_PASSWORD = "DemoPass123!"


def _user(email, name, role, facility=None):
    return User(
        email=email,
        full_name=name,
        hashed_password=hash_password(DEMO_PASSWORD),
        role=role,
        facility_id=facility.id if facility else None,
    )


def _patient(code, name, age, sex, village, facility, history="", allergies=""):
    return Patient(
        local_patient_code=code,
        full_name=name,
        age=age,
        date_of_birth=date(utcnow().year - age, 1, 1),
        sex=sex,
        village=village,
        phone_number=None,
        facility_id=facility.id,
        relevant_medical_history=history,
        allergies=allergies,
    )


def _vital(vital_type, value, unit):
    return VitalSign(
        vital_type=vital_type,
        value=value,
        unit=unit,
        source="manual_demo",
        confirmation_status=ConfirmationStatus.confirmed,
        recorded_at=utcnow(),
    )


def seed(reset: bool = False) -> None:
    if reset:
        print("WARNING: --reset drops every table in the configured database.")
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.execute(select(User.id)).first() is not None:
            print("Database already contains users. Seed skipped (use --reset to start over).")
            return

        facility_a = Facility(
            name="Demo Primary Health Centre, Mysuru",
            district="Mysuru",
            state="Karnataka",
            address="Fictional address for demonstration only",
        )
        facility_b = Facility(
            name="Demo Community Health Centre, Belagavi",
            district="Belagavi",
            state="Karnataka",
            address="Fictional address for demonstration only",
        )
        db.add_all([facility_a, facility_b])
        db.flush()

        admin = _user("admin@demo-swasthya.in", "Demo Administrator", UserRole.admin)
        workers = [
            _user("worker1@demo-swasthya.in", "Asha Demo Worker", UserRole.health_worker, facility_a),
            _user("worker2@demo-swasthya.in", "Lakshmi Demo Worker", UserRole.health_worker, facility_a),
            _user("worker3@demo-swasthya.in", "Ravi Demo Worker", UserRole.health_worker, facility_b),
        ]
        doctors = [
            _user("doctor1@demo-swasthya.in", "Dr. Meera Demo", UserRole.doctor, facility_a),
            _user("doctor2@demo-swasthya.in", "Dr. Arjun Demo", UserRole.doctor, facility_a),
        ]
        db.add_all([admin, *workers, *doctors])
        db.flush()

        patients = [
            _patient("SS-2026-00001", "Fictional Patient One", 54, PatientSex.female, "Demo Village A", facility_a, "Hypertension (fictional)"),
            _patient("SS-2026-00002", "Fictional Patient Two", 28, PatientSex.male, "Demo Village B", facility_a),
            _patient("SS-2026-00003", "Fictional Patient Three", 67, PatientSex.female, "Demo Village A", facility_a, "Diabetes (fictional)"),
            _patient("SS-2026-00004", "Fictional Patient Four", 35, PatientSex.male, "Demo Village C", facility_a),
            _patient("SS-2026-00005", "Fictional Patient Five", 19, PatientSex.female, "Demo Village B", facility_a, allergies="Penicillin (fictional)"),
            _patient("SS-2026-00006", "Fictional Patient Six", 45, PatientSex.male, "Demo Village D", facility_b),
            _patient("SS-2026-00007", "Fictional Patient Seven", 72, PatientSex.female, "Demo Village E", facility_b),
            _patient("SS-2026-00008", "Fictional Patient Eight", 31, PatientSex.other, "Demo Village F", facility_b),
            _patient("SS-2026-00009", "Fictional Patient Nine", 8, PatientSex.male, "Demo Village D", facility_b),
            _patient("SS-2026-00010", "Fictional Patient Ten", 60, PatientSex.female, "Demo Village A", facility_a),
        ]
        db.add_all(patients)
        db.flush()
        for patient in patients:
            db.add(PatientConsent(patient_id=patient.id, purpose="consultation_and_referral", is_active=True))

        def consultation(patient, worker, facility, language, complaint, transcript, confirmed, status, symptoms, vitals):
            row = Consultation(
                patient_id=patient.id,
                health_worker_id=worker.id,
                facility_id=facility.id,
                language=language,
                chief_complaint=complaint,
                transcript=transcript,
                transcript_confirmed=confirmed,
                consultation_status=status,
            )
            for code, description, source, confirmation in symptoms:
                row.symptoms.append(
                    Symptom(
                        code=code,
                        description=description,
                        source=source,
                        confirmation_status=confirmation,
                        recorded_by=worker.id,
                        recorded_at=utcnow(),
                    )
                )
            for vital_type, value, unit in vitals:
                row.vital_signs.append(_vital(vital_type, value, unit))
            db.add(row)
            db.flush()
            return row

        c1 = consultation(
            patients[0], workers[0], facility_a, ConsultationLanguage.Kannada,
            "Breathlessness and chest discomfort (simulated)",
            "Demo transcript: patient reports breathlessness and chest discomfort.",
            True, ConsultationStatus.completed,
            [("chest_pain", "Chest pain", "worker_confirmed", ConfirmationStatus.confirmed),
             ("difficulty_breathing", "Difficulty breathing", "worker_confirmed", ConfirmationStatus.confirmed)],
            [(VitalType.temperature, 38.9, "C"), (VitalType.pulse, 118, "BPM"),
             (VitalType.systolic_bp, 100, "mmHg"), (VitalType.diastolic_bp, 70, "mmHg"),
             (VitalType.oxygen_saturation, 86, "%"), (VitalType.respiratory_rate, 28, "breaths/min")],
        )
        c2 = consultation(
            patients[1], workers[0], facility_a, ConsultationLanguage.Hindi,
            "Fever for two days (simulated)",
            "Demo transcript: patient reports fever. Not yet reviewed by the worker.",
            False, ConsultationStatus.draft,
            [("fever", "Fever", "voice_demo", ConfirmationStatus.unconfirmed)],
            [],
        )
        c3 = consultation(
            patients[2], workers[1], facility_a, ConsultationLanguage.English,
            "Cough and mild tiredness (simulated)",
            "Demo transcript: patient reports cough and tiredness.",
            True, ConsultationStatus.completed,
            [("cough", "Cough", "worker_confirmed", ConfirmationStatus.confirmed)],
            [(VitalType.temperature, 36.8, "C"), (VitalType.pulse, 78, "BPM"),
             (VitalType.systolic_bp, 118, "mmHg"), (VitalType.diastolic_bp, 76, "mmHg"),
             (VitalType.oxygen_saturation, 98, "%"), (VitalType.respiratory_rate, 16, "breaths/min")],
        )
        c4 = consultation(
            patients[3], workers[1], facility_a, ConsultationLanguage.Kannada,
            "High fever and weakness (simulated)",
            "Demo transcript: patient reports high fever and weakness.",
            True, ConsultationStatus.completed,
            [("high_fever", "High fever", "worker_confirmed", ConfirmationStatus.confirmed)],
            [(VitalType.temperature, 39.6, "C"), (VitalType.pulse, 112, "BPM"),
             (VitalType.systolic_bp, 124, "mmHg"), (VitalType.diastolic_bp, 82, "mmHg"),
             (VitalType.oxygen_saturation, 96, "%"), (VitalType.respiratory_rate, 20, "breaths/min")],
        )
        c5 = consultation(
            patients[5], workers[2], facility_b, ConsultationLanguage.Hindi,
            "Joint pain (simulated)",
            "Demo transcript: patient reports joint pain.",
            True, ConsultationStatus.completed,
            [("joint_pain", "Joint pain", "worker_confirmed", ConfirmationStatus.confirmed)],
            [(VitalType.temperature, 37.1, "C"), (VitalType.pulse, 82, "BPM"),
             (VitalType.systolic_bp, 130, "mmHg"), (VitalType.diastolic_bp, 84, "mmHg"),
             (VitalType.oxygen_saturation, 97, "%"), (VitalType.respiratory_rate, 18, "breaths/min")],
        )

        assessments = [store_assessment(db, c, workers[0]) for c in (c1, c2, c3, c4, c5)]

        r1 = Referral(
            consultation_id=c1.id, created_by=workers[0].id, assigned_doctor_id=doctors[0].id,
            referral_reason="Simulated emergency-priority referral for immediate local review.",
            urgency=UrgencyLevel.emergency_warning, status=ReferralStatus.submitted,
            reference=f"REF-{utcnow().year}-0001",
        )
        r2 = Referral(
            consultation_id=c4.id, created_by=workers[1].id, assigned_doctor_id=doctors[0].id,
            referral_reason="Simulated prompt-assessment referral.",
            urgency=UrgencyLevel.prompt_clinical_assessment, status=ReferralStatus.acknowledged,
            reference=f"REF-{utcnow().year}-0002",
        )
        r3 = Referral(
            consultation_id=c3.id, created_by=workers[1].id, assigned_doctor_id=doctors[1].id,
            referral_reason="Simulated routine review request.",
            urgency=UrgencyLevel.further_assessment_required, status=ReferralStatus.under_review,
            reference=f"REF-{utcnow().year}-0003",
        )
        db.add_all([r1, r2, r3])
        db.flush()
        db.add(
            SpecialistReview(
                referral_id=r3.id,
                doctor_id=doctors[1].id,
                clinical_comments="Simulated review: please arrange an in-person examination.",
                follow_up_recommendations="Simulated follow-up in one week. Not real medical advice.",
            )
        )
        r3.status = ReferralStatus.advice_recorded
        db.commit()

        print("Demo data seeded successfully.")
        print(f"  Facilities: 2 | Users: 6 | Patients: 10 | Consultations: 5 | Referrals: 3")
        print(f"  Emergency demo assessment urgency: {assessments[0].urgency_level.value}")
        print(f"  Incomplete-info demo assessment urgency: {assessments[1].urgency_level.value}")
        print(f"  Login password for every demo account: {DEMO_PASSWORD}")
        print("  Accounts: admin@demo-swasthya.in, worker1@demo-swasthya.in,")
        print("            doctor1@demo-swasthya.in (and worker2/3, doctor2)")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed SwasthyaSetu AI demo data")
    parser.add_argument("--reset", action="store_true", help="Drop all tables first (destructive)")
    args = parser.parse_args()
    try:
        seed(reset=args.reset)
    except Exception as exc:
        print(f"Seed failed: {exc}", file=sys.stderr)
        raise
