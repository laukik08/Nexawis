"""
Security integration tests: CORS, security headers, request size limits, and rate limiting.
"""

import pytest
from httpx import AsyncClient
from app.core.config import settings
from app.core.middleware import InMemoryRateLimitMiddleware


@pytest.mark.asyncio
async def test_security_headers_present(async_client: AsyncClient):
    """Verify standard security headers are attached to API responses."""
    response = await async_client.get("/")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


@pytest.mark.asyncio
async def test_cors_allowed_origin(async_client: AsyncClient):
    """Verify that requests from configured origins receive CORS authorization."""
    response = await async_client.get(
        "/api/v1/health",
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert response.headers.get("access-control-allow-credentials") == "true"


@pytest.mark.asyncio
async def test_cors_disallowed_origin(async_client: AsyncClient):
    """Verify that unauthorized origins do not receive allow-origin headers."""
    response = await async_client.get(
        "/api/v1/health",
        headers={"Origin": "http://unauthorized-attacker.com"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") is None


@pytest.mark.asyncio
async def test_request_size_limit_rejection(async_client: AsyncClient):
    """Verify that payloads exceeding MAX_REQUEST_SIZE_BYTES are rejected with 413."""
    oversized_length = settings.MAX_REQUEST_SIZE_BYTES + 5000
    headers = {
        "content-length": str(oversized_length),
        "content-type": "application/json",
    }
    response = await async_client.post(
        "/api/v1/health",  # Any endpoint
        headers=headers,
    )
    assert response.status_code == 413
    data = response.json()
    assert data["error"]["code"] == "PAYLOAD_TOO_LARGE"
    assert "exceeds the limit" in data["error"]["message"]


@pytest.mark.asyncio
async def test_rate_limiter_triggers_429(async_client: AsyncClient):
    """Verify in-memory rate limiter triggers 429 when client exceeds request limit."""
    # Temporarily set limit to 5 requests for this test
    from app.main import app

    rate_limit_middleware = None
    for middleware in app.user_middleware:
        if middleware.cls == InMemoryRateLimitMiddleware:
            rate_limit_middleware = middleware
            break

    # We can also test against a small isolated instance or exercise the middleware directly
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    test_app = FastAPI()
    test_app.add_middleware(InMemoryRateLimitMiddleware, requests_per_minute=3)

    @test_app.get("/test-rate")
    def sample():
        return {"ok": True}

    client = TestClient(test_app)
    # 3 allowed requests
    for _ in range(3):
        res = client.get("/test-rate")
        assert res.status_code == 200

    # 4th request should trigger 429
    res_limited = client.get("/test-rate")
    assert res_limited.status_code == 429
    data = res_limited.json()
    assert data["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    assert "Retry-After" in res_limited.headers
