"""Database engine, session factory and shared declarative base.

The project targets PostgreSQL. SQLite (in-memory) is also supported so the
test suite runs on a laptop without a PostgreSQL server.
"""

from __future__ import annotations

import uuid
from collections.abc import Generator
from datetime import datetime, timezone
from sqlalchemy import JSON, DateTime, create_engine
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.pool import StaticPool

from .config import settings


def utcnow() -> datetime:
    """Timezone-aware UTC timestamp used for all application timestamps."""
    return datetime.now(timezone.utc)


def _build_engine():
    if settings.database_url.startswith("sqlite"):
        # StaticPool keeps the in-memory test database on one shared connection.
        return create_engine(
            settings.database_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    return create_engine(settings.database_url, pool_pre_ping=True)


engine = _build_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

# JSONB on PostgreSQL, plain JSON elsewhere (tests).
JSONDict = JSON().with_variant(JSONB, "postgresql")


class Base(DeclarativeBase):
    pass


class BaseModel(Base):
    """Common UUID primary key and timestamps for every table."""

    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields one database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
