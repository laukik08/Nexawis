"""
Tests for centralized exception handling and log redaction.
"""

import logging
import pytest
from httpx import AsyncClient
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.core.exceptions import register_exception_handlers, AppException
from app.core.logging import SensitiveDataFilter


@pytest.mark.asyncio
async def test_404_not_found_format(async_client: AsyncClient):
    """Verify that accessing non-existent endpoints yields consistent error envelope."""
    response = await async_client.get("/api/v1/nonexistent-route")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"
    assert "Not Found" in data["error"]["message"]


def test_500_unhandled_exception_masks_stack_trace():
    """Verify unhandled 500 exceptions never expose stack traces or DB credentials."""
    test_app = FastAPI()
    register_exception_handlers(test_app)

    @test_app.get("/crash")
    def crash_route():
        raise RuntimeError("FATAL: Failed to connect with postgresql://db_user:SecretPass123@supabase:5432/db")

    client = TestClient(test_app, raise_server_exceptions=False)
    response = client.get("/crash")

    assert response.status_code == 500
    data = response.json()
    assert data["error"]["code"] == "INTERNAL_SERVER_ERROR"
    # Verify no raw password or exception message is leaked to client
    assert "SecretPass123" not in str(data)
    assert "FATAL" not in str(data)
    assert data["error"]["message"] == "An unexpected error occurred. The incident has been recorded securely."


def test_custom_app_exception_handling():
    """Verify custom AppException generates consistent client format."""
    test_app = FastAPI()
    register_exception_handlers(test_app)

    @test_app.get("/custom-error")
    def custom_route():
        raise AppException(
            message="Resource conflict detected.",
            code="CONFLICT_ERROR",
            status_code=409,
            details={"conflict_id": 42},
        )

    client = TestClient(test_app)
    response = client.get("/custom-error")

    assert response.status_code == 409
    data = response.json()
    assert data["error"]["code"] == "CONFLICT_ERROR"
    assert data["error"]["message"] == "Resource conflict detected."
    assert data["error"]["details"] == {"conflict_id": 42}


def test_sensitive_data_filter_redacts_credentials():
    """Verify logging filter scrubs passwords, tokens, and database credentials."""
    log_filter = SensitiveDataFilter()

    # Create dummy log records
    record1 = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname=__file__,
        lineno=10,
        msg="Connecting to postgresql://admin:MySecretPassword123@db.supabase.co:5432/prod",
        args=(),
        exc_info=None,
    )
    log_filter.filter(record1)
    assert "MySecretPassword123" not in record1.msg
    assert "***REDACTED***" in record1.msg

    record2 = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname=__file__,
        lineno=11,
        msg="Authorization header received: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token123",
        args=(),
        exc_info=None,
    )
    log_filter.filter(record2)
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token123" not in record2.msg
    assert "***REDACTED***" in record2.msg


def test_validation_error_formatting():
    """Verify that Pydantic validation errors are transformed into clean, safe JSON envelopes."""
    from pydantic import BaseModel, Field

    class SampleInput(BaseModel):
        username: str = Field(min_length=3)
        count: int = Field(gt=0)

    test_app = FastAPI()
    register_exception_handlers(test_app)

    @test_app.post("/validate")
    def validate_route(payload: SampleInput):
        return {"received": payload.username}

    client = TestClient(test_app)
    # Send invalid payload
    response = client.post("/validate", json={"username": "a", "count": -5})
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "validation failed" in data["error"]["message"].lower()
    assert isinstance(data["error"]["details"], list)
    assert len(data["error"]["details"]) == 2


def test_exception_subclasses():
    """Verify constructor properties of all custom exception classes."""
    from app.core.exceptions import (
        DatabaseConnectionError,
        ConfigurationError,
        ResourceNotFoundError,
        PayloadTooLargeError,
        RateLimitExceededError,
    )

    e1 = DatabaseConnectionError(message="DB timeout", details="extra")
    assert e1.code == "DATABASE_UNAVAILABLE"
    assert e1.status_code == 503

    e2 = ConfigurationError("Bad config")
    assert e2.code == "CONFIGURATION_ERROR"
    assert e2.status_code == 500

    e3 = ResourceNotFoundError("Missing")
    assert e3.code == "NOT_FOUND"
    assert e3.status_code == 404

    e4 = PayloadTooLargeError(1000)
    assert e4.code == "PAYLOAD_TOO_LARGE"
    assert e4.status_code == 413

    e5 = RateLimitExceededError(45)
    assert e5.code == "RATE_LIMIT_EXCEEDED"
    assert e5.status_code == 429
    assert e5.details == {"retry_after_seconds": 45}


def test_common_schemas():
    """Verify serialization of common error schemas."""
    from app.schemas.common import ErrorDetail, ErrorEnvelope, ErrorResponse

    detail = ErrorDetail(field="body.email", issue="Invalid email format", type="value_error")
    envelope = ErrorEnvelope(code="INVALID_INPUT", message="Validation error", details=[detail])
    resp = ErrorResponse(error=envelope)

    dumped = resp.model_dump()
    assert dumped["error"]["code"] == "INVALID_INPUT"
    assert dumped["error"]["details"][0]["field"] == "body.email"


def test_setup_logging_execution():
    """Verify setup_logging runs without error and configures logger."""
    from app.core.logging import setup_logging
    setup_logging(level="DEBUG")
    assert logging.getLogger().level == logging.DEBUG

