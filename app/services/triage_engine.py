"""Deterministic, rule-based clinical SAFETY assessment (decision support only).

IMPORTANT
---------
* No LLM and no network call determines urgency here.
* The bundled thresholds are illustrative demo values, NOT medically validated.
* No rule firing never means "healthy".
* An emergency warning always tells the worker to escalate locally and
  immediately; it never waits for a remote doctor or internet connection.
* The engine never produces a diagnosis, treatment or medication suggestion.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

from sqlalchemy.orm import Session

from ..config import settings
from ..models.assessment import (
    URGENCY_LABELS,
    Assessment,
    TriageTrigger,
    UrgencyLevel,
)
from ..models.consultation import Consultation
from ..models.user import User
from ..models.vital_sign import VitalType
from ..utils.audit import record_audit
from ..utils.response import DEMO_DISCLAIMER

EMERGENCY_ACTION = (
    "EMERGENCY WARNING: Arrange immediate local emergency escalation now "
    "(local emergency services / nearest emergency department). Do NOT wait "
    "for a remote doctor, an internet connection or this application."
)

NO_RULE_MESSAGE = (
    "No predefined demo rule was triggered. This does NOT mean the patient is "
    "healthy; continue clinical assessment."
)

# Illustrative symptom codes used by the demo rules.
EMERGENCY_SYMPTOM_CODES = {
    "difficulty_breathing",
    "chest_pain",
    "unconscious",
    "severe_bleeding",
}
PROMPT_SYMPTOM_CODES = {"high_fever", "persistent_vomiting"}


@dataclass
class Facts:
    vitals: dict[str, float] = field(default_factory=dict)
    symptom_codes: set[str] = field(default_factory=set)
    symptom_descriptions: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class Rule:
    code: str
    description: str
    urgency: UrgencyLevel
    flag: str
    message: str
    condition: Callable[[Facts], bool]
    is_demo: bool = True


def _required_vitals() -> list[str]:
    return [name.strip() for name in settings.triage_required_vitals.split(",") if name.strip()]


DEMO_RULES: tuple[Rule, ...] = (
    Rule(
        code="DEMO-SPO2-LOW",
        description="Illustrative: very low oxygen saturation",
        urgency=UrgencyLevel.emergency_warning,
        flag="low_oxygen_saturation",
        message=f"Recorded SpO2 below {settings.triage_spo2_emergency:g}% (demo threshold).",
        condition=lambda f: (
            VitalType.oxygen_saturation.value in f.vitals
            and f.vitals[VitalType.oxygen_saturation.value] < settings.triage_spo2_emergency
        ),
    ),
    Rule(
        code="DEMO-SYSTOLIC-LOW",
        description="Illustrative: very low systolic blood pressure",
        urgency=UrgencyLevel.emergency_warning,
        flag="low_systolic_blood_pressure",
        message=(
            "Recorded systolic BP below "
            f"{settings.triage_systolic_low_emergency:g} mmHg (demo threshold)."
        ),
        condition=lambda f: (
            VitalType.systolic_bp.value in f.vitals
            and f.vitals[VitalType.systolic_bp.value] < settings.triage_systolic_low_emergency
        ),
    ),
    Rule(
        code="DEMO-RESP-RATE-HIGH",
        description="Illustrative: very high respiratory rate",
        urgency=UrgencyLevel.emergency_warning,
        flag="high_respiratory_rate",
        message=(
            "Recorded respiratory rate above "
            f"{settings.triage_respiratory_high_emergency:g}/min (demo threshold)."
        ),
        condition=lambda f: (
            VitalType.respiratory_rate.value in f.vitals
            and f.vitals[VitalType.respiratory_rate.value]
            > settings.triage_respiratory_high_emergency
        ),
    ),
    Rule(
        code="DEMO-EMERGENCY-SYMPTOM",
        description="Illustrative: symptom tagged for emergency escalation",
        urgency=UrgencyLevel.emergency_warning,
        flag="emergency_symptom_reported",
        message="A symptom tagged as an emergency warning in the demo rule set was reported.",
        condition=lambda f: bool(f.symptom_codes & EMERGENCY_SYMPTOM_CODES),
    ),
    Rule(
        code="DEMO-TEMP-HIGH",
        description="Illustrative: high temperature",
        urgency=UrgencyLevel.prompt_clinical_assessment,
        flag="high_temperature",
        message=f"Recorded temperature at/above {settings.triage_temperature_prompt:g} C (demo threshold).",
        condition=lambda f: (
            VitalType.temperature.value in f.vitals
            and f.vitals[VitalType.temperature.value] >= settings.triage_temperature_prompt
        ),
    ),
    Rule(
        code="DEMO-PULSE-HIGH",
        description="Illustrative: high pulse rate",
        urgency=UrgencyLevel.prompt_clinical_assessment,
        flag="high_pulse",
        message=f"Recorded pulse above {settings.triage_pulse_high_prompt:g} BPM (demo threshold).",
        condition=lambda f: (
            VitalType.pulse.value in f.vitals
            and f.vitals[VitalType.pulse.value] > settings.triage_pulse_high_prompt
        ),
    ),
    Rule(
        code="DEMO-BP-HIGH",
        description="Illustrative: very high blood pressure",
        urgency=UrgencyLevel.prompt_clinical_assessment,
        flag="high_blood_pressure",
        message=(
            "Recorded BP at/above "
            f"{settings.triage_systolic_high_prompt:g}/{settings.triage_diastolic_high_prompt:g} "
            "mmHg (demo threshold)."
        ),
        condition=lambda f: (
            (
                VitalType.systolic_bp.value in f.vitals
                and f.vitals[VitalType.systolic_bp.value] >= settings.triage_systolic_high_prompt
            )
            or (
                VitalType.diastolic_bp.value in f.vitals
                and f.vitals[VitalType.diastolic_bp.value] >= settings.triage_diastolic_high_prompt
            )
        ),
    ),
    Rule(
        code="DEMO-PROMPT-SYMPTOM",
        description="Illustrative: symptom needing prompt assessment",
        urgency=UrgencyLevel.prompt_clinical_assessment,
        flag="prompt_assessment_symptom",
        message="A symptom tagged for prompt assessment in the demo rule set was reported.",
        condition=lambda f: bool(f.symptom_codes & PROMPT_SYMPTOM_CODES),
    ),
)

_URGENCY_RANK = {
    UrgencyLevel.further_assessment_required: 0,
    UrgencyLevel.incomplete_information: 0,
    UrgencyLevel.prompt_clinical_assessment: 1,
    UrgencyLevel.emergency_warning: 2,
}


@dataclass
class AssessmentResult:
    urgency_level: UrgencyLevel
    triggered_flags: list[str]
    missing_information: list[str]
    uncertain_information: list[str]
    reasons: list[str]
    triggered_rules: list[Rule]
    rule_version: str
    disclaimer: str
    emergency_action: str | None


def build_facts(consultation: Consultation) -> tuple[Facts, list[str]]:
    """Extract numbers and text from confirmed/stored consultation fields."""
    facts = Facts()
    uncertain: list[str] = []

    for vital in consultation.vital_signs:
        key = vital.vital_type.value
        facts.vitals[key] = vital.value
        if vital.confirmation_status.value != "confirmed" or "voice" in vital.source.lower():
            uncertain.append(f"vital:{key} ({vital.confirmation_status.value}, source={vital.source})")

    for symptom in consultation.symptoms:
        facts.symptom_descriptions.append(symptom.description)
        if symptom.code:
            facts.symptom_codes.add(symptom.code.lower())
        if symptom.confirmation_status.value != "confirmed" or "voice" in symptom.source.lower():
            uncertain.append(
                f"symptom:{symptom.code or symptom.description} "
                f"({symptom.confirmation_status.value}, source={symptom.source})"
            )

    if not consultation.transcript_confirmed and consultation.transcript:
        uncertain.append("voice transcript (not confirmed by health worker)")

    return facts, uncertain


def evaluate_assessment(
    consultation: Consultation, rule_version: str | None = None
) -> AssessmentResult:
    """Pure, deterministic rule evaluation for one consultation."""
    version = rule_version or settings.triage_rule_version
    facts, uncertain = build_facts(consultation)

    missing = [name for name in _required_vitals() if name not in facts.vitals]
    triggered: list[Rule] = [rule for rule in DEMO_RULES if rule.condition(facts)]

    flags = []
    reasons = []
    for rule in triggered:
        if rule.flag not in flags:
            flags.append(rule.flag)
        reasons.append(f"{rule.code}: {rule.message}")

    if any(rule.urgency == UrgencyLevel.emergency_warning for rule in triggered):
        urgency = UrgencyLevel.emergency_warning
    elif triggered:
        urgency = UrgencyLevel.prompt_clinical_assessment
    elif missing:
        urgency = UrgencyLevel.incomplete_information
        reasons.append(
            "Required information is missing: " + ", ".join(missing) + ". Assessment is incomplete."
        )
    else:
        urgency = UrgencyLevel.further_assessment_required
        reasons.append(NO_RULE_MESSAGE)

    if uncertain:
        reasons.append("Uncertain or unconfirmed information was flagged for review.")
    reasons.append(DEMO_DISCLAIMER)

    return AssessmentResult(
        urgency_level=urgency,
        triggered_flags=flags,
        missing_information=missing,
        uncertain_information=uncertain,
        reasons=reasons,
        triggered_rules=triggered,
        rule_version=version,
        disclaimer=DEMO_DISCLAIMER,
        emergency_action=(
            EMERGENCY_ACTION if urgency == UrgencyLevel.emergency_warning else None
        ),
    )


def store_assessment(
    db: Session, consultation: Consultation, actor: User | None
) -> Assessment:
    """Evaluate, persist the rule version + triggers, and return the assessment."""
    result = evaluate_assessment(consultation)
    assessment = Assessment(
        consultation_id=consultation.id,
        urgency_level=result.urgency_level,
        triggered_flags=result.triggered_flags,
        missing_information=result.missing_information,
        uncertain_information=result.uncertain_information,
        reasons=result.reasons,
        rule_version=result.rule_version,
        disclaimer=result.disclaimer,
        emergency_action=result.emergency_action,
        created_by=actor.id if actor else None,
        triggers=[
            TriageTrigger(
                rule_code=rule.code,
                rule_version=result.rule_version,
                message=rule.message,
                urgency_level=rule.urgency,
            )
            for rule in result.triggered_rules
        ],
    )
    db.add(assessment)
    db.flush()
    record_audit(
        db,
        actor=actor,
        action="assessment.created",
        resource_type="assessment",
        resource_id=str(assessment.id),
        details={"rule_version": result.rule_version, "urgency": result.urgency_level.value},
    )
    db.commit()
    db.refresh(assessment)
    return assessment


def urgency_label(level: UrgencyLevel) -> str:
    return URGENCY_LABELS.get(level, level.value)
