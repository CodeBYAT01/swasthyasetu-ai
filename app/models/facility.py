"""Health facility (clinic / primary health centre)."""

from __future__ import annotations

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from ..database import BaseModel


class Facility(BaseModel):
    __tablename__ = "facilities"

    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    district: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(120), nullable=False, default="Karnataka")
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
