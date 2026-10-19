# NEXAWIS Backend — Phase 1: Secure Backend Foundation

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
│   ├── env.py                # Async migration runner (SQLAlchemy + asyncpg)
│   ├── script.py.mako        # Migration revision template
│   └── versions/             # Migration versions directory
├── app/
│   ├── __init__.py
│   ├── main.py               # FastAPI application, lifespan, CORS, and security middlewares
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py         # Pydantic Settings, environment validation, URL sanitization
│   │   ├── database.py       # Async SQLAlchemy engine, session generator, health checker
│   │   ├── exceptions.py     # Custom exceptions & centralized error JSON handlers
│   │   ├── logging.py        # Structured logging with sensitive data redaction filter
│   │   └── middleware.py     # Security headers, request size limiter, rate limiter
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py         # Standardized error and response envelopes
│   │   └── health.py         # Liveness and readiness diagnostic schemas
│   └── api/
│       ├── __init__.py
│       └── v1/
│           ├── __init__.py
│           ├── router.py     # API v1 master router
│           └── endpoints/
│               ├── __init__.py
│               └── health.py # /health, /health/db, and /health/ready endpoints
└── tests/
    ├── __init__.py
    ├── conftest.py           # Shared async fixtures (AsyncClient, test DB cleanup)
    ├── test_config.py        # Settings validation, origin parsing, secret masking
    ├── test_database.py      # Database engine lifecycle, session rollback, error safety
    ├── test_exceptions.py    # Standardized 404/422/500 JSON, log redaction
    ├── test_health.py        # Liveness, DB readiness, and combined probe tests
    └── test_security.py      # CORS, security headers, size limits, rate limiting
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
# Core dependencies:
pip install -r requirements.txt

# Development and test dependencies:
pip install -r requirements-dev.txt
```

---

## 2. Environment Configuration & Secrets Management

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in the required parameters.
   > **Important Security Rule:** The `.env` file contains sensitive secrets and is strictly ignored in `.gitignore`. **Never commit `.env` to Git.**

### Configuration Keys

| Parameter | Default | Description |
|---|---|---|
| `ENVIRONMENT` | `development` | Target environment: `development`, `testing`, `production` |
| `DEBUG` | `false` | Debug mode (automatically forced `false` in production) |
| `HOST` | `0.0.0.0` | Host interface to bind |
| `PORT` | `8000` | Port to listen on |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated list of allowed frontend origins (CORS) |
| `MAX_REQUEST_SIZE_BYTES` | `2097152` (2 MB) | Maximum accepted request payload size |
| `RATE_LIMIT_PER_MINUTE` | `120` | Max requests per minute per IP for public endpoints |
| `DATABASE_URL` | *(None)* | Supabase PostgreSQL asyncpg URL |
| `DB_POOL_SIZE` | `5` | SQLAlchemy connection pool size |
| `DB_MAX_OVERFLOW` | `10` | Max overflow connections in pool |
| `DB_SSL_REQUIRE` | `true` | Enforce TLS/SSL for database connectivity |
| `CLERK_SECRET_KEY` | *(None)* | Clerk backend secret key (Phase 2 integration) |
| `CLERK_PUBLISHABLE_KEY` | *(None)* | Clerk public key (Phase 2 integration) |

---

## 3. Configuring Supabase PostgreSQL

NEXAWIS connects to Supabase PostgreSQL using `asyncpg` via SQLAlchemy 2.x asynchronous engine.

### Connecting to Supabase
In Supabase dashboard (**Project Settings > Database**), copy your Connection URI:

- **Direct Connection (port 5432):**
  ```env
  DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
  ```

- **Transaction Pooler (port 6543 / Supavisor):**
  ```env
  DATABASE_URL=postgresql+asyncpg://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
  ```

### Supabase Pooler Compatibility
When using transaction pooling (PgBouncer/Supavisor), prepared statements can cause collisions. The engine in `app/core/database.py` is configured with:
```python
connect_args={"statement_cache_size": 0, "ssl": "require"}
```
This ensures seamless operation whether connecting directly to PostgreSQL or through the Supabase connection pooler.

If `DATABASE_URL` is omitted, the application starts gracefully in decoupled local development mode, reporting `unconfigured` on database readiness checks without throwing unhandled crashes.

---

## 4. Running the Backend Locally

Run the development server with hot-reload enabled:

```bash
# Using Python inside .venv:
uvicorn app.main:app --reload --port 8000 --host 127.0.0.1
```

Or on Windows:
```powershell
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000 --host 127.0.0.1
```

The API will be accessible at:
- **Root info:** `http://127.0.0.1:8000/`
- **Interactive OpenAPI Docs:** `http://127.0.0.1:8000/docs`
- **ReDoc Documentation:** `http://127.0.0.1:8000/redoc`
- **Health check:** `http://127.0.0.1:8000/api/v1/health`
- **Database readiness:** `http://127.0.0.1:8000/api/v1/health/db`
- **Combined readiness:** `http://127.0.0.1:8000/api/v1/health/ready`

*(Note: In production environments, `/docs` and `/redoc` are automatically disabled for attack surface reduction.)*

---

## 5. Health vs. Database Readiness Checks

The foundation decouples process liveness from external database connectivity:

### 1. Process Liveness (`GET /api/v1/health`)
- **Purpose:** Fast runtime check confirming the FastAPI process and event loop are responsive.
- **Performance:** Instant (< 5ms), does **not** query the database.
- **Status Code:** `200 OK`
- **Response Format:**
  ```json
  {
    "status": "ok",
    "service": "NEXAWIS API",
    "version": "0.1.0",
    "environment": "development",
    "timestamp": "2026-10-19T13:20:53.156182+00:00",
    "uptime_seconds": 120.83
  }
  ```

### 2. Database Readiness (`GET /api/v1/health/db`)
- **Purpose:** Actively verifies connection to Supabase PostgreSQL by executing `SELECT 1`. Measures round-trip query latency in milliseconds.
- **Status Codes:**
  - `200 OK`: Database connected (`status: "healthy"`) or unconfigured.
  - `503 Service Unavailable`: Database unreachable, timeout, or credentials rejected (`status: "unreachable"`).
- **Safety Guarantee:** Passwords and internal connection details are redacted with `***` in the response (`database_target`).
- **Response Format:**
  ```json
  {
    "status": "healthy",
    "connected": true,
    "message": "Database connection verified successfully.",
    "latency_ms": 14.5,
    "dialect": "postgresql+asyncpg",
    "database_target": "postgresql+asyncpg://postgres:***@db.YOUR_REF.supabase.co:5432/postgres"
  }
  ```

### 3. Combined Readiness Probe (`GET /api/v1/health/ready`)
- **Purpose:** Used by container orchestrators, Kubernetes, or load balancers to determine traffic routing.
- **Status Codes:**
  - `200 OK`: Process is running and database is verified (`status: "ready"`).
  - `503 Service Unavailable`: Database is configured but unreachable (`status: "not_ready"`).

---

## 6. Security Controls Implemented

| Security Control | Implementation |
|---|---|
| **Secret Masking** | Pydantic `SecretStr` protects `DATABASE_URL` and `CLERK_SECRET_KEY` from stringification, prints, and log leaks. |
| **Log Redaction** | `SensitiveDataFilter` scrubs passwords, bearer tokens, API keys, and connection strings from all application logs before write. |
| **CORS Restriction** | `CORSMiddleware` restricts access to explicitly allowed frontend origins. Wildcard `*` is prohibited when credentials are enabled. |
| **Security Headers** | `SecurityHeadersMiddleware` injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`. Enforces HSTS in production. |
| **DoS Payload Limiting** | `RequestSizeLimitMiddleware` inspects `Content-Length` and rejects oversized payloads (> 2 MB) with `413 Payload Too Large`. |
| **Rate Limiting** | `InMemoryRateLimitMiddleware` enforces a sliding-window limit per IP with a standard `429 Too Many Requests` envelope and `Retry-After` header. |
| **Safe Error Envelopes** | Centralized exception handlers catch all 400, 404, 422, and 500 errors. Stack traces and raw ORM exception strings are logged server-side only; clients receive a standardized, safe error envelope. |
| **Parameterized Queries** | SQLAlchemy 2.x parameterized statements prevent SQL injection. |
| **Database Pool Safety** | Asynchronous connection pooling with `pool_pre_ping=True`, timeout safeguards, statement cache size 0 for pooler compatibility, and graceful engine disposal on shutdown. |

---

## 7. Running Automated Tests

Run the complete test suite:

```bash
# From the backend directory:
pytest -v
```

Run tests with code coverage analysis:
```bash
pytest -v --cov=app --cov-report=term-missing
```

### Test Suite Summary
- **Total Tests:** 32 automated tests across 5 test suites.
- **Coverage:** 89% total code coverage.
- **Test Categories:**
  - `test_config.py`: Settings validation, origin parsing, async URL conversion, credential masking.
  - `test_health.py`: Process liveness, database health (connected, unconfigured, unreachable), combined readiness.
  - `test_database.py`: Async engine lifecycle, connection pool disposal, session rollback on error.
  - `test_security.py`: CORS origin validation, security headers, request size limits, rate limiting.
  - `test_exceptions.py`: 404 envelope, 422 validation details, 500 stack trace suppression, log redaction.

---

## 8. Remaining Limitations & Phase 2 Roadmap

In accordance with Phase 1 scope:
- **Authentication**: Clerk configuration parameters are prepared in `Settings`. Full server-side JWT verification, claims extraction, and role authorization will be implemented in Phase 2.
- **Database Schema**: No business tables (Employees, Projects, Skills, Team Formation) or business endpoints are created in Phase 1. Alembic is configured and ready to execute migrations once schemas are defined in subsequent phases.
- **Live Supabase Verification**: In environments where real Supabase credentials have not yet been provided in `.env`, the database readiness check cleanly reports `status: "unconfigured"` and remains unverified against live cloud infrastructure until valid credentials are supplied.
