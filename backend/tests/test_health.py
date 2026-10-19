"""
Tests for health check endpoints (liveness, database readiness, combined probe).
"""

from unittest.mock import patch, AsyncMock
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(async_client: AsyncClient):
    """Verify that root endpoint provides basic non-sensitive service details."""
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "NEXAWIS API"
    assert data["status"] == "online"
    assert "version" in data
    assert data["api_v1"] == "/api/v1"


@pytest.mark.asyncio
async def test_api_health_endpoint(async_client: AsyncClient):
    """Verify process-level health check (fast liveness probe)."""
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "NEXAWIS API"
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data
    assert data["uptime_seconds"] >= 0.0


@pytest.mark.asyncio
async def test_db_health_unconfigured(async_client: AsyncClient):
    """Verify database health when no DATABASE_URL is supplied."""
    with patch("app.api.v1.endpoints.health.check_database_readiness", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = {
            "status": "unconfigured",
            "connected": False,
            "message": "Database connection URL is not configured.",
            "latency_ms": None,
            "dialect": "postgresql+asyncpg",
            "database_target": None,
        }
        response = await async_client.get("/api/v1/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "unconfigured"
        assert data["connected"] is False


@pytest.mark.asyncio
async def test_db_health_connected(async_client: AsyncClient):
    """Verify database health when connection and query succeed."""
    with patch("app.api.v1.endpoints.health.check_database_readiness", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = {
            "status": "healthy",
            "connected": True,
            "message": "Database connection verified successfully.",
            "latency_ms": 14.5,
            "dialect": "postgresql+asyncpg",
            "database_target": "postgresql+asyncpg://postgres:***@db.mock.supabase.co:5432/postgres",
        }
        response = await async_client.get("/api/v1/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["connected"] is True
        assert data["latency_ms"] == 14.5
        assert "***" in data["database_target"]


@pytest.mark.asyncio
async def test_db_health_unreachable(async_client: AsyncClient):
    """Verify database health when connection is refused or unreachable (503 Service Unavailable)."""
    with patch("app.api.v1.endpoints.health.check_database_readiness", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = {
            "status": "unreachable",
            "connected": False,
            "message": "Database host is unreachable or rejected connection credentials.",
            "latency_ms": 3005.2,
            "dialect": "postgresql+asyncpg",
            "database_target": "postgresql+asyncpg://postgres:***@db.mock.supabase.co:5432/postgres",
        }
        response = await async_client.get("/api/v1/health/db")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unreachable"
        assert data["connected"] is False


@pytest.mark.asyncio
async def test_system_readiness_probe(async_client: AsyncClient):
    """Verify combined readiness probe behavior."""
    # 1. Healthy state -> 200
    with patch("app.api.v1.endpoints.health.check_database_readiness", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = {
            "status": "healthy",
            "connected": True,
            "message": "Database connection verified successfully.",
            "latency_ms": 12.0,
            "dialect": "postgresql+asyncpg",
            "database_target": "postgresql+asyncpg://postgres:***@db.mock.supabase.co:5432/postgres",
        }
        response = await async_client.get("/api/v1/health/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
        assert data["api"]["status"] == "ok"
        assert data["database"]["connected"] is True

    # 2. Unreachable state -> 503
    with patch("app.api.v1.endpoints.health.check_database_readiness", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = {
            "status": "unreachable",
            "connected": False,
            "message": "Database host unreachable.",
            "latency_ms": 3000.0,
            "dialect": "postgresql+asyncpg",
            "database_target": "postgresql+asyncpg://postgres:***@db.mock.supabase.co:5432/postgres",
        }
        response = await async_client.get("/api/v1/health/ready")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "not_ready"
        assert data["database"]["connected"] is False
