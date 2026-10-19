"""
NEXAWIS Backend - Health and Readiness Endpoints.
Separates API process health from Supabase PostgreSQL readiness checks.
"""

import time
from datetime import datetime, timezone
from fastapi import APIRouter, Response, status
from app.core.config import settings
from app.core.database import check_database_readiness
from app.schemas.health import (
    APIHealthResponse,
    DatabaseHealthStatus,
    ReadinessResponse,
)

router = APIRouter()

# Track module load / startup time
_startup_time = time.time()


def get_api_health_payload() -> APIHealthResponse:
    """Computes runtime process status."""
    uptime = round(time.time() - _startup_time, 2)
    now_utc = datetime.now(timezone.utc).isoformat()

    return APIHealthResponse(
        status="ok",
        service=settings.PROJECT_NAME,
        version=settings.PROJECT_VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=now_utc,
        uptime_seconds=uptime,
    )


@router.get(
    "/health",
    response_model=APIHealthResponse,
    summary="API Process Health Check",
    description="Verifies that the FastAPI process is running and responding. Fast, lightweight liveness probe.",
    status_code=status.HTTP_200_OK,
)
async def api_health() -> APIHealthResponse:
    """Process-level health check."""
    return get_api_health_payload()


@router.get(
    "/health/db",
    response_model=DatabaseHealthStatus,
    summary="Database Connectivity Check",
    description="Actively verifies Supabase PostgreSQL connectivity and measures query round-trip latency.",
)
async def database_health(response: Response) -> DatabaseHealthStatus:
    """Verifies live database access."""
    db_result = await check_database_readiness()

    # Set HTTP status based on connection outcome
    if db_result["status"] in ("unreachable", "error"):
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    else:
        response.status_code = status.HTTP_200_OK

    return DatabaseHealthStatus(**db_result)


@router.get(
    "/health/ready",
    response_model=ReadinessResponse,
    summary="System Readiness Probe",
    description="Combined readiness probe evaluating both API runtime and database connectivity.",
)
async def system_readiness(response: Response) -> ReadinessResponse:
    """System-wide readiness probe."""
    api_payload = get_api_health_payload()
    db_result = await check_database_readiness()
    db_payload = DatabaseHealthStatus(**db_result)

    is_ready = True
    # If database is configured but unreachable, report not ready
    if db_payload.status in ("unreachable", "error"):
        is_ready = False
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    else:
        response.status_code = status.HTTP_200_OK

    return ReadinessResponse(
        status="ready" if is_ready else "not_ready",
        api=api_payload,
        database=db_payload,
    )
