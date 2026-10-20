# NEXAWIS Backend — Architecture & Developer Guide

The backend foundation for NEXAWIS (Adaptive Workforce Intelligence Framework for Sustainable Project Team Formation), built with **Python 3.13**, **FastAPI**, **SQLAlchemy 2.x (async)**, **Supabase PostgreSQL**, **Alembic**, and **Pydantic Settings**.

---

## Architecture Overview

```
backend/
├── .env.example              # Environment variable template with safe placeholders
├── .gitignore                # Excludes .venv, .env, __pycache__, logs, caches
├── pyproject.toml            # Project packaging & pytest configuration
├── requirements.txt          # Production runtime dependencies
├── requirements-dev.txt      # Development & testing dependencies
├── alembic.ini               # Database migration configuration
├── alembic/
│   ├── env.py                # Async migration runner (SQLAlchemy + asyncpg + Supabase Pooler)
│   ├── script.py.mako        # Migration revision template
│   └── versions/             # Migration revision versions (e.g. 087653b3400c_phase2_initial_schema.py)
├── app/
│   ├── __init__.py
│   ├── main.py               # FastAPI application, lifespan, CORS, and security middlewares
│   ├── core/
│   │   ├── __init__.py
│   │   ├── clerk.py          # Cryptographic Clerk JWT verifier (JWKS / PEM)
│   │   ├── config.py         # Pydantic Settings, environment validation, URL sanitization
│   │   ├── database.py       # Async SQLAlchemy engine, session generator, health checker
│   │   ├── exceptions.py     # Custom exceptions & centralized error JSON handlers
│   │   ├── logging.py        # Structured logging with sensitive data redaction filter
│   │   ├── middleware.py     # Security headers, request size limiter, rate limiter
│   │   └── roles.py          # PRD §3 RBAC roles and permissions matrix
│   ├── models/               # SQLAlchemy 2.x Declarative Models (Phase 2)
│   │   ├── __init__.py       # Model package re-exports
│   │   ├── base.py           # DeclarativeBase, UUIDPrimaryKeyMixin, TimestampMixin, JSON_TYPE
│   │   ├── workspace.py      # Workspace, WorkspaceMember, WorkspaceSettings (tenant isolation)
│   │   ├── user.py           # User (Clerk auth linkage), UserPreference
│   │   ├── skill.py          # Skill (normalized), EmployeeSkill (proficiency mappings)
│   │   ├── employee.py       # Employee, EmployeeCertification, WorkloadHistory, PerformanceHistory
│   │   ├── project.py        # Project, ProjectRequirement, ProjectMilestone, ProjectAllocation
│   │   ├── team_formation.py # TeamFormation (runs/history), TeamFormationMember (recommendations)
│   │   ├── ml_results.py     # AwisEvaluation, MlBurnoutPrediction, MlProjectSuccessPrediction
│   │   └── report.py         # Report, ScheduledReport
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py           # Authentication, profile synchronization, and workspace schemas
│   │   ├── common.py         # Standardized error and response envelopes
│   │   └── health.py         # Liveness and readiness diagnostic schemas
│   └── api/
│       ├── __init__.py
│       ├── deps.py           # Authentication, workspace isolation, and RBAC guard dependencies
│       └── v1/
│           ├── __init__.py
│           ├── router.py     # API v1 master router
│           └── endpoints/
│               ├── __init__.py
│               ├── auth.py   # /auth/me, /auth/sync, /auth/workspaces endpoints
│               └── health.py # /health, /health/db, and /health/ready endpoints
└── tests/
    ├── __init__.py
    ├── conftest.py                   # Shared async fixtures (AsyncClient, test DB cleanup)
    ├── test_auth.py                  # Token verification, RBAC, tenant isolation, anti-spoofing
    ├── test_config.py                # Settings validation, origin parsing, secret masking
    ├── test_database.py              # Database engine lifecycle, session rollback, error safety
    ├── test_database_models_async.py # Real SQLite async integration tests for all models
    ├── test_exceptions.py            # Standardized 404/422/500 JSON, log redaction
    ├── test_health.py                # Liveness, DB readiness, and combined probe tests
    ├── test_models.py                # Model instantiation, metadata constraints, repr tests
    └── test_security.py              # CORS, security headers, size limits, rate limiting

```

---

## 1. Setup & Installation

### Prerequisites
- Python 3.11, 3.12, or 3.13
- Git

### 1.1 Create and Activate Virtual Environment

**Windows (PowerShell):**
```powershell
# From the repository root:
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

### 1.2 Install Dependencies

```bash
# Core runtime dependencies:
pip install -r requirements.txt

# Development and testing dependencies (includes aiosqlite, pytest-cov):
pip install -r requirements-dev.txt
```

---

## 2. Environment Configuration & Supabase Connectivity

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate `.env` with your Supabase credentials:

```ini
ENVIRONMENT=development
DEBUG=true

# Supabase IPv4 Transaction Pooler (Port 6543)
DB_HOST=aws-0-ap-south-1.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.your_project_ref
DB_PASSWORD=your_password
DB_NAME=postgres
DB_SSL_REQUIRE=true

# Connection Pool Settings
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=1800
DB_ECHO=false
```

> **Security Note:** `.env` is strictly ignored in `.gitignore`. Passwords containing special characters (`@`, `,`, `#`) are automatically URL-encoded by `app/core/config.py`.

### Supabase Connection Modes & Limitations
- **Transaction Pooler (Port 6543)**: Supabase's transaction pooler (Supavisor) supports IPv4 networks and high concurrency. Because multiple transactions share backend connections, prepared statements are disabled (`statement_cache_size: 0`).
- **Direct Connection (Port 5432)**: Direct connection connects directly to the PostgreSQL instance. Requires IPv6 routing unless the Supabase IPv4 add-on is active.

---

## 3. Database Schema & Relational Design

The NEXAWIS schema is divided into 7 distinct entity clusters:

### 1. Workspaces & Tenant Isolation
- **`workspaces`**: Tenant organization partition (`id`, `name`, `slug`, `created_at`, `updated_at`).
- **`workspace_members`**: User-to-workspace mapping with roles (`owner`, `admin`, `member`, `viewer`).
- **`workspace_settings`**: Workspace-level defaults (reporting periods, default department, custom AWIS weight profiles).

### 2. Users & Preferences
- **`users`**: Application user profiles linked to Clerk via `clerk_user_id`. No passwords or auth tokens are stored here.
- **`user_preferences`**: Personalized settings (theme, density, motion, time formats, notification toggles).

### 3. Skills & Workforce Entities
- **`skills`**: Normalized catalog of organizational competencies (`workspace_id`, `name`, `category`).
- **`employee_skills`**: M:N relational mapping with `proficiency` (0-100), `is_primary`, and `years_experience`.
- **`employees`**: Core workforce entity (`employee_code`, `full_name`, `department`, `designation`, `experience_years`, operational metrics, and sensitive `mental_fatigue_score`).
- **`employee_certifications`**: Professional credentials and certifications.
- **`employee_workload_history`**: Time-series logs of weekly hours, overtime, and utilization percentage.
- **`employee_performance_history`**: Period-by-period evaluation scores and notes.

### 4. Projects & Staffing Allocations
- **`projects`**: Project profile (`project_code`, `name`, `department`, `priority`, `complexity`, dates, plus 11 project success factors).
- **`project_requirements`**: Skill prerequisites demanded by the project with `min_proficiency` and `priority`.
- **`project_milestones`**: Timeline milestones (`Completed`, `Current`, `Upcoming`).
- **`project_allocations`**: Finalized staffing assignments (`role`, `allocation_percent`, `team_fit`).

### 5. Team Formation & Candidate Recommendations
- **`team_formations`**: Team recommendation runs (`formation_code`, `formation_option`, `status`, quality scores).
- **`team_formation_members`**: Candidate team members with `assigned_role`, `match_score`, `is_override`, and qualitative explainability reasons (`why_selected`).

### 6. AWIS & ML Intelligence Results (Separated from Observed Data)
- **`awis_evaluations`**: 9-dimension composite intelligence scores (`composite_awis_score`, `skill_intelligence`, `experience_intelligence`, `performance_intelligence`, `availability_intelligence`, `workload_intelligence`, `burnout_intelligence`, `collaboration_intelligence`, `growth_intelligence`, `compatibility_intelligence`).
- **`ml_burnout_predictions`**: Inference records from `burnout_model.pkl` with `predicted_burn_rate`, `risk_tier`, input feature provenance, and SHAP attributions.
- **`ml_project_success_predictions`**: Inference records from `Project_Success_XGBoost.pkl` with `predicted_success_score`, confidence, aggregated team features, and positive/negative factors.

### 7. Reports & Scheduling
- **`reports`**: Historical report configurations, executive metrics, chart data definitions, and insights (no file binary blobs stored in DB).
- **`scheduled_reports`**: Recurring automated report schedules and recipient email lists.

---

## 4. Alembic Migrations

All schema changes are managed via Alembic and executed over asynchronous connections (`asyncpg`).

### Common Migration Commands

```powershell
cd backend

# Inspect current database revision
.\.venv\Scripts\alembic.exe current

# View migration history
.\.venv\Scripts\alembic.exe history

# Generate a new migration after updating models
.\.venv\Scripts\alembic.exe revision --autogenerate -m "describe_changes"

# Apply pending migrations to the database
.\.venv\Scripts\alembic.exe upgrade head

# Roll back the most recent migration
.\.venv\Scripts\alembic.exe downgrade -1
```

---

## 5. Clerk Authentication & Server-Side Authorization

NEXAWIS enforces **zero-trust identity validation** powered by Clerk and FastAPI:

1. **Cryptographic JWT Verification**:
   - Bearer tokens are validated server-side against Clerk's JWKS key set (`/.well-known/jwks.json`) using `pyjwt[crypto]`.
   - Direct RSA PEM public key verification (`CLERK_PEM_PUBLIC_KEY`) is also supported.
   - Claims verified: Cryptographic signature (RS256), expiration (`exp`), not-before (`nbf`), issuer (`iss`), and authorized party (`azp`).
2. **Persistent User Profiles & Concurrency Safety**:
   - Authenticated identities are resolved to persistent `User` records in PostgreSQL via verified `clerk_user_id`.
   - First-time sign-ins auto-provision user profiles, preferences, and an initial personal workspace with Owner privileges.
   - Profile sync route (`POST /api/v1/auth/sync`) synchronizes name, avatar, title, and department.
3. **Multi-Tenancy & Workspace Isolation**:
   - Every protected request resolves active tenant membership using the `X-Workspace-Id` header.
   - Cross-workspace queries are blocked with `403 Forbidden` (`WORKSPACE_ACCESS_DENIED`), preventing IDOR vulnerabilities.
4. **Role-Based Access Control (RBAC)**:
   - System Roles: `Admin`, `HR`, `Project Manager`, `Employee`, `Leadership` (derived from PRD §3).
   - Fine-grained permission guards protect sensitive endpoints (e.g. `employees:wellbeing_view` for mental fatigue and burnout scores).
   - Role claims in client tokens are strictly ignored; authority is derived exclusively from the server database.

### Protected Authentication Endpoints

| Method | Endpoint | Description | Guard / Protection |
|---|---|---|---|
| `GET` | `/api/v1/auth/me` | Current profile, active workspace, permissions | Bearer Token |
| `POST` | `/api/v1/auth/sync` | Sync profile details from Clerk | Bearer Token |
| `GET` | `/api/v1/auth/workspaces` | List user's active workspaces | Bearer Token |
| `POST` | `/api/v1/auth/workspaces` | Create new workspace (Owner role) | Bearer Token |
| `GET` | `/api/v1/auth/test/protected` | Test token verification | Bearer Token |
| `GET` | `/api/v1/auth/test/admin-only` | Test administrator guard | `SystemRole.ADMIN` |
| `GET` | `/api/v1/auth/test/workspace-owner` | Test workspace isolation | `WorkspaceRole.OWNER` |

---

## 6. Database Security Architecture

1. **Server-Side Authorization via FastAPI**:
   - Application database traffic connects through FastAPI using parameterized SQLAlchemy queries.
   - All tenant queries are scoped by `workspace_id`.
2. **Row Level Security (RLS) Advisory**:
   - Supabase tables are exposed to the PostgREST API when direct client access is enabled.
   - Because NEXAWIS routes all business operations through the FastAPI backend using service connections, direct browser-to-Supabase PostgREST access is not used.
   - If direct frontend-to-Supabase client access is introduced in a future phase, RLS must be enabled with appropriate workspace-scoped policies.
3. **Sensitive Workforce Information Protection**:
   - `mental_fatigue_score`, `wellbeing_risk`, and `burnout_predictions` are treated as sensitive workforce information.
   - Access to these fields is restricted by role (Admin and HR only; hidden from employees and peer managers).
4. **Credential Redaction**:
   - `SensitiveDataFilter` scrubs passwords, JWTs, and full connection strings from server logs (`***REDACTED***`).

---

## 7. Canonical ML Model Directory

The pre-trained machine learning model artifacts are located at the project root:

```
Nexawis/
└── ml_model/
    ├── Project_Success_XGBoost.pkl  # XGBoost project success prediction model
    └── burnout_model.pkl            # Burnout prediction regression model
```

> **Important Rule:** Do not modify, rename, retrain, or delete these artifacts. In the later ML serving phase, they will be loaded in-memory behind dedicated validation pipelines.

---

## 8. Automated Testing & Verification

Run the automated test suite:

```powershell
cd backend
.\.venv\Scripts\pytest.exe -v --cov=app --cov-report=term-missing
```

### Test Coverage Highlights
- **64 tests passing**
- **84% total code coverage**
- Coverage includes:
  - Cryptographic token verification, expired tokens, untrusted keys, anti-spoofing (`test_auth.py`)
  - Multi-tenancy isolation and cross-workspace access rejection (`test_auth.py`)
  - Model structure, column defaults, and table metadata (`test_models.py`)
  - Full relational insertions, unique constraints, and cascade deletions (`test_database_models_async.py`)
  - Settings, password URL encoding, and credential masking (`test_config.py`)
  - Database readiness probes and connection lifecycle (`test_database.py`, `test_health.py`)
  - Security headers, CORS origin filtering, size limits, and rate limiting (`test_security.py`)

