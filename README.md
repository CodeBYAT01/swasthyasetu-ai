# SwasthyaSetu AI — Backend

FastAPI backend for the **SwasthyaSetu AI** hackathon demo. It provides authentication, patient registration, consultations with mock voice transcription, deterministic safety triage, referrals/specialist review, offline sync, and dashboard APIs.

> **Demo/safety notice**
> - This is a **hackathon demonstration**, not a medical device.
> - It provides **decision-support signals only**. It does **not** provide autonomous diagnosis or prescriptions.
> - Emergency warnings require **immediate local emergency escalation**.
> - Triage rules are **simple, deterministic, and clearly labelled** in code and API responses.
> - When no rule triggers, the API says **further assessment required** — it never claims “healthy”.

## Tech stack

- Python 3.11+
- FastAPI + Uvicorn
- PostgreSQL (production) / SQLite (tests, local smoke)
- SQLAlchemy 2.0 + Alembic
- Pydantic v2
- JWT auth (PyJWT) + Argon2id password hashing (`argon2-cffi`)
- Pytest + FastAPI/Starlette TestClient

## Project layout

```text
backend/
  app/
    main.py                 # FastAPI app, CORS, error handlers, router mounts
    config.py               # .env settings
    database.py             # SQLAlchemy engine/session/Base
    seed.py                 # Fictional demo data seeder
    models/                 # ORM models (User, Facility, Patient, Consultation, ...)
    schemas/                # Pydantic request/response schemas
    routers/                # /api route modules
    services/               # triage_engine, sync_service, voice_service, etc.
    security/               # JWT auth, role/ownership permissions
    utils/                  # audit logging, pagination helpers
  alembic/                  # migrations
  tests/                    # pytest suite (isolated SQLite)
  requirements.txt
  .env.example
  README.md
```

## Windows + VS Code setup (beginner-friendly)

### 1) Prerequisites

- **Python 3.11+** installed and on PATH. Check with:
  ```powershell
  python --version
  ```
- **VS Code** with the Python extension.
- **PostgreSQL** (recommended for real demo). If you don't have it, you can still run tests and a SQLite smoke run.

### 2) Open the backend folder

Open `swasthyasetu-ai\backend` in VS Code (or open the repo root and use the terminal in `backend`).

### 3) Create and activate a virtual environment

From `backend`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, run once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### 4) Install dependencies

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

### 5) Configure environment

Copy `.env.example` to `.env` and edit values:

```powershell
Copy-Item .env.example .env
```

Important `.env` values:

```env
DATABASE_URL=postgresql+pg8000://postgres:postgres@localhost:5432/swasthyasetu
SECRET_KEY=replace-with-a-long-random-secret-at-least-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
AUTO_CREATE_TABLES=false
ENVIRONMENT=development
ALLOW_PUBLIC_ADMIN_REGISTRATION=false
```

Generate a secret key:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

## PostgreSQL setup

1. Install PostgreSQL and ensure `psql` is available.
2. Create database and user (adjust password as needed):

```sql
CREATE DATABASE swasthyasetu;
CREATE USER swasthyasetu_user WITH PASSWORD 'change-me';
GRANT ALL PRIVILEGES ON DATABASE swasthyasetu TO swasthyasetu_user;
```

3. Set `DATABASE_URL` in `.env`, for example:

```env
DATABASE_URL=postgresql+pg8000://swasthyasetu_user:change-me@localhost:5432/swasthyasetu
```

> The project uses **`pg8000`** (pure Python) for PostgreSQL compatibility on Windows ARM64 machines where `psycopg2-binary` wheels may be unavailable.

## Run migrations

From `backend` with venv active:

```powershell
alembic upgrade head
```

To create a new migration after model changes:

```powershell
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Seed demo data

```powershell
python -m app.seed
```

Destructive reset (drops/recreates all tables):

```powershell
python -m app.seed --reset
```

Seed creates fictional facilities, users, patients, consultations, assessments, referrals, and one review.

**Demo accounts** (password for all: `DemoPass123!`):

| Role | Email | Notes |
|---|---|---|
| Admin | `admin@demo-swasthya.in` | Dashboard/admin access |
| Health worker | `worker1@demo-swasthya.in` | Facility A |
| Health worker | `worker2@demo-swasthya.in` | Facility A |
| Health worker | `worker3@demo-swasthya.in` | Facility B |
| Doctor | `doctor1@demo-swasthya.in` | Assigned referrals |
| Doctor | `doctor2@demo-swasthya.in` | Assigned referrals |

## Run the API server

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
- Health: http://127.0.0.1:8000/health

## Run tests

Tests use isolated in-memory SQLite and do **not** touch PostgreSQL/production data.

```powershell
pytest -q
```

## Windows Application Control / DLL note

On some Windows machines (especially with Application Control/WDAC policies), running Python packages with native `.pyd` files from `Downloads` can fail with:

```text
ImportError: DLL load failed while importing ... An Application Control policy has blocked this file.
```

Workarounds:

1. **Move/copy the project** to a trusted location (e.g. `C:\dev\swasthyasetu-ai`) and create the venv there. This is the cleanest fix.
2. If you must keep it in `Downloads`, copy the `backend` and `.venv` to a temp location (e.g. `C:\Users\<you>\AppData\Local\Temp\ss-verify`) and run commands there, then sync source changes back.
3. Use pure-Python dependencies where possible. This project already pins `SQLAlchemy==2.0.30` and uses `pg8000` to avoid problematic native extensions.

## API overview

All routes are mounted under `/api`. Auth uses `Authorization: Bearer <token>`.

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public* | Register user (*admin self-registration disabled by default) |
| POST | `/api/auth/login` | Public | Login, get JWT |
| GET | `/api/auth/me` | Authenticated | Current user |
| GET/POST | `/api/users` | Admin | List/create users |
| GET/PUT | `/api/users/{id}` | Admin | User detail/update |
| GET/POST | `/api/users/facilities` | Admin | Facilities |
| GET | `/api/users/facilities/{id}` | Admin | Facility detail |
| POST | `/api/patients` | Worker/Admin | Register patient + consent |
| GET | `/api/patients?q=&village=` | Worker/Admin | Search/list patients |
| GET/PUT/DELETE | `/api/patients/{id}` | Worker/Admin | Detail/update/archive (no hard delete) |
| GET | `/api/patients/{id}/consent` | Worker/Admin | Consent status |
| POST | `/api/consultations` | Worker/Admin | Create consultation |
| GET | `/api/consultations` | Worker/Admin | List consultations (scoped) |
| GET/PUT | `/api/consultations/{id}` | Worker/Admin | Detail/update |
| POST | `/api/consultations/{id}/symptoms` | Worker/Admin | Add symptom |
| POST | `/api/consultations/{id}/vital-signs` | Worker/Admin | Add vital |
| POST | `/api/voice/transcribe` | Worker/Admin | Mock multilingual transcription |
| POST | `/api/assessments` | Worker/Admin | Run deterministic triage |
| GET | `/api/assessments/{id}` | Worker/Admin | Assessment detail |
| POST | `/api/referrals` | Worker/Admin | Create referral |
| GET | `/api/referrals` | Doctor/Worker/Admin | List referrals (scoped) |
| GET | `/api/referrals/{id}` | Doctor/Worker/Admin | Referral detail |
| PUT | `/api/referrals/{id}/status` | Doctor/Admin | Update status |
| POST | `/api/referrals/{id}/reviews` | Doctor | Submit specialist review |
| POST | `/api/sync/push` | Worker/Admin | Push offline records (idempotent) |
| GET | `/api/sync/pull` | Worker/Admin | Pull updated records |
| GET | `/api/dashboard/admin` | Admin | Admin metrics |
| GET | `/api/dashboard/doctor` | Doctor/Admin | Doctor queue metrics |

## Frontend integration mapping

The existing frontend (`src/services/api.js`) currently calls paths like `/patients/`, `/consultations/`, `/referrals/`, `/dashboard/`, `/health-check`. The backend mounts routes under `/api` and uses slightly different resource shapes. When connecting the frontend, update the client to:

| Frontend expectation | Backend endpoint | Notes |
|---|---|---|
| `GET /health-check` | `GET /health` | Simple health response |
| `POST /auth/login` (form) | `POST /api/auth/login` (JSON) | Send `{email,password}` JSON; response includes `access_token` and `user` |
| `GET /users/me` | `GET /api/auth/me` | Current user |
| `GET /patients/?search=` | `GET /api/patients?q=&village=` | Response is `{items,total,page,page_size,has_more}` |
| `POST /patients/` | `POST /api/patients` | Include `consent_given`, `local_patient_code`, `facility_id` |
| `GET /consultations/` | `GET /api/consultations` | Supports `patient_id`, `facility_id`, `status_filter` |
| `POST /consultations/` | `POST /api/consultations` | Can include nested `symptoms` and `vital_signs` |
| `POST /consultations/voice` | `POST /api/voice/transcribe` | Mock transcript; confirm before clinical use |
| `GET /referrals/` | `GET /api/referrals` | Role-scoped |
| `PUT /referrals/{id}/advice` | `POST /api/referrals/{id}/reviews` | Doctor submits review; also supports status endpoint |
| `GET /dashboard/` | `GET /api/dashboard/admin` or `/api/dashboard/doctor` | Role-specific dashboards |

Also set frontend base URL to include `/api`, e.g. `VITE_API_URL=http://127.0.0.1:8000/api`.

## Safety and demo behavior

- **No autonomous diagnosis/prescription.** `disclaimer` fields are returned by assessment endpoints.
- **Emergency escalation is local.** The system flags urgency but does not contact emergency services.
- **Triage is deterministic.** Rules live in `app/services/triage_engine.py` and are configurable via env threshold settings.
- **Missing info is explicit.** Missing vitals/transcript confirmation produce `missing_information` / `uncertain_information`; urgency may be `incomplete_information`.
- **No “healthy” claim.** If no rule fires, the result is `further_assessment_required` with explanation.
- **Consent required.** Patient consent is recorded at registration and checked before consultation creation/sync.
- **Audit trail.** Key actions write audit log rows.

## Troubleshooting

- **422 validation errors**: check request body against `/docs` schema. Email fields must be valid (demo emails use `@demo-swasthya.in`).
- **401 Unauthorized**: missing/expired token. Login again and pass `Authorization: Bearer <token>`.
- **403 Forbidden**: role/facility scope does not permit the action.
- **409 Conflict**: duplicate patient code, missing consent, sync conflict, or duplicate review.
- **Alembic on SQLite**: migration was generated for compatibility; PostgreSQL is the target production DB.
- **`DLL load failed` on Windows**: see “Windows Application Control / DLL note” above.
