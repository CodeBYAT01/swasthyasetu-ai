"""SwasthyaSetu AI - FastAPI application entry point.

Run locally:  uvicorn app.main:app --reload
Docs:         http://127.0.0.1:8000/docs
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from . import models  # noqa: F401 - registers all tables on Base.metadata
from .config import settings
from .database import Base, engine
from .routers import (
    assessments,
    auth,
    consultations,
    dashboard,
    patients,
    referrals,
    sync,
    users,
    voice,
)

logger = logging.getLogger("swasthyasetu")

DESCRIPTION = """
**SwasthyaSetu AI** is a voice-first, multilingual, offline-capable clinical
decision-support prototype for frontline health workers in rural India.

### Safety notice
This system is **not** a diagnostic, treatment or prescription system.
All triage rules are **illustrative demo rules**, not medically validated.
Emergency warnings require immediate **local emergency escalation** and never
depend on AI, internet connectivity or doctor availability.
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.auto_create_tables:
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables verified/created")
        except Exception as exc:
            # The API and Swagger docs still load when PostgreSQL is not running.
            logger.warning("Could not auto-create tables: %s", type(exc).__name__)
    yield


app = FastAPI(
    title=settings.app_name,
    description=DESCRIPTION,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = [
        {"location": list(error.get("loc", [])), "message": str(error.get("msg", "Invalid value"))}
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Invalid request", "errors": errors},
    )


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    logger.warning("Database integrity error on %s", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "The record conflicts with existing data"},
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


@app.get("/", tags=["Health"], summary="Service information")
def root():
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs",
        "notice": "Clinical decision-support prototype; not a diagnosis system.",
    }


@app.get("/health", tags=["Health"], summary="Health check")
def health():
    return {"status": "ok"}


for router in (
    auth.router,
    users.router,
    patients.router,
    consultations.router,
    voice.router,
    assessments.router,
    referrals.router,
    sync.router,
    dashboard.router,
):
    app.include_router(router, prefix="/api")
