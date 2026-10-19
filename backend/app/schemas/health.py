"""
NEXAWIS Backend - Health & Readiness Pydantic Schemas.
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field


class APIHealthResponse(BaseModel):
    """Process-level health status showing API runtime status."""

    status: Literal["ok", "degraded", "maintenance"] = Field(
        default="ok", description="Process runtime health status."
    )
    service: str = Field(default="NEXAWIS API", description="Service name.")
    version: str = Field(default="0.1.0", description="Semantic service version.")
    environment: str = Field(description="Active runtime environment.")
    timestamp: str = Field(description="ISO-8601 UTC timestamp of the health check.")
    uptime_seconds: float = Field(description="Uptime in seconds since process startup.")


class DatabaseHealthStatus(BaseModel):
    """Database connectivity diagnostic report."""

    status: Literal["healthy", "unreachable", "unconfigured", "error"] = Field(
        description="Database connectivity status."
    )
    connected: bool = Field(description="True if test query was executed successfully.")
    message: str = Field(description="Safe, non-sensitive connectivity summary.")
    latency_ms: Optional[float] = Field(
        default=None, description="Round-trip query latency in milliseconds."
    )
    dialect: str = Field(default="postgresql+asyncpg", description="Database driver dialect.")
    database_target: Optional[str] = Field(
        default=None, description="Redacted connection target host/db."
    )


class ReadinessResponse(BaseModel):
    """Combined system readiness response for orchestrators and monitoring."""

    status: Literal["ready", "not_ready"] = Field(
        description="Overall readiness (ready requires connected database when configured)."
    )
    api: APIHealthResponse
    database: DatabaseHealthStatus
