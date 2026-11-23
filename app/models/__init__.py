"""Import every model here so SQLAlchemy sees all tables on metadata creation."""

from .assessment import Assessment, TriageTrigger
from .audit_log import AuditLog
from .consent import PatientConsent
from .consultation import Consultation
from .facility import Facility
from .patient import Patient
from .referral import Referral
from .specialist_review import SpecialistReview
from .symptom import Symptom
from .sync_event import SyncEvent
from .triage_rule import TriageRule
from .user import User
from .vital_sign import VitalSign

__all__ = [
    "Assessment",
    "AuditLog",
    "Consultation",
    "Facility",
    "Patient",
    "PatientConsent",
    "Referral",
    "SpecialistReview",
    "SyncEvent",
    "Symptom",
    "TriageRule",
    "TriageTrigger",
    "User",
    "VitalSign",
]
