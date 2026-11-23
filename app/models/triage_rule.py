"""Configurable, illustrative demo rules for the deterministic triage engine.

These rules are NOT clinically validated. A qualified clinician must review and
approve any rule set before real-world use.
"""

from __future__ import annotations

from sqlalchemy import Boolean, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from ..database import BaseModel, JSONDict
from .assessment import UrgencyLevel


class TriageRule(BaseModel):
    __tablename__ = "triage_rules"

    rule_code: Mapped[str] = mapped_column(String(80), nullable=False, unique=True, index=True)
    version: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    condition: Mapped[dict] = mapped_column(JSONDict, nullable=False)
    urgency_level: Mapped[UrgencyLevel] = mapped_column(
        Enum(UrgencyLevel, native_enum=False, length=40), nullable=False
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
