"""
NEXAWIS Backend - Centralized Exception Handling and Secure Error Formats.
Ensures zero stack traces or credentials leak in client-facing JSON responses.
"""

from typing import Any, Dict, List, Optional, Union
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.logging import logger


class AppException(Exception):
    """Base application exception with standardized code and HTTP status code."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Union[List[Any], Dict[str, Any], str]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details


class DatabaseConnectionError(AppException):
    """Raised when the database connection cannot be established or verified."""

    def __init__(
        self,
        message: str = "Database service is temporarily unavailable.",
        details: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            code="DATABASE_UNAVAILABLE",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details,
        )


class ConfigurationError(AppException):
    """Raised when an invalid or insecure configuration is encountered."""

    def __init__(self, message: str):
        super().__init__(
            message=message,
            code="CONFIGURATION_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class ResourceNotFoundError(AppException):
    """Raised when a requested resource does not exist."""

    def __init__(self, message: str = "The requested resource was not found."):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class PayloadTooLargeError(AppException):
    """Raised when incoming request body exceeds allowed size limit."""

    def __init__(self, max_bytes: int):
        super().__init__(
            message=f"Request entity exceeds allowed maximum size of {max_bytes} bytes.",
            code="PAYLOAD_TOO_LARGE",
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )


class RateLimitExceededError(AppException):
    """Raised when client exceeds the allowed rate limit."""

    def __init__(self, retry_after_seconds: int = 60):
        super().__init__(
            message="Rate limit exceeded. Please retry after some time.",
            code="RATE_LIMIT_EXCEEDED",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details={"retry_after_seconds": retry_after_seconds},
        )


class AuthenticationError(AppException):
    """Raised when bearer token is missing, invalid, or unverified."""

    def __init__(
        self,
        message: str = "Authentication required or token is invalid.",
        code: str = "UNAUTHORIZED",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details,
        )


class InvalidTokenError(AuthenticationError):
    """Raised when JWT token is malformed, has invalid signature, or wrong issuer/audience."""

    def __init__(self, message: str = "Bearer token is invalid or malformed.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="INVALID_TOKEN",
            details=details,
        )


class TokenExpiredError(AuthenticationError):
    """Raised when JWT token has expired."""

    def __init__(self, message: str = "Bearer token has expired.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="TOKEN_EXPIRED",
            details=details,
        )


class AuthorizationError(AppException):
    """Raised when an authenticated user does not have required roles or permissions."""

    def __init__(
        self,
        message: str = "You do not have permission to perform this action.",
        code: str = "FORBIDDEN",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_403_FORBIDDEN,
            details=details,
        )


class WorkspaceAccessDeniedError(AuthorizationError):
    """Raised when an authenticated user does not belong to the requested workspace."""

    def __init__(
        self,
        message: str = "You do not have access to the specified workspace.",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            code="WORKSPACE_ACCESS_DENIED",
            details=details,
        )


def create_error_response(
    status_code: int,
    code: str,
    message: str,
    details: Optional[Any] = None,
    headers: Optional[Dict[str, str]] = None,
) -> JSONResponse:
    """Helper to produce consistent JSON error envelopes."""
    content = {
        "error": {
            "code": code,
            "message": message,
            "details": details,
        }
    }
    return JSONResponse(
        status_code=status_code,
        content=content,
        headers=headers,
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Registers standard and fallback exception handlers on the FastAPI application."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        logger.warning(
            f"Handled application exception [{exc.code}] at {request.method} {request.url.path}: {exc.message}"
        )
        return create_error_response(
            status_code=exc.status_code,
            code=exc.code,
            message=exc.message,
            details=exc.details,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        # Sanitize validation errors to avoid leaking internal structures
        sanitized_details = []
        for err in exc.errors():
            loc = " -> ".join(str(l) for l in err.get("loc", []))
            sanitized_details.append({
                "field": loc,
                "issue": err.get("msg", "Invalid value"),
                "type": err.get("type", "value_error"),
            })

        logger.info(
            f"Validation error at {request.method} {request.url.path}: {len(sanitized_details)} field issues"
        )
        return create_error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="VALIDATION_ERROR",
            message="Request input validation failed.",
            details=sanitized_details,
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        code_map = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            413: "PAYLOAD_TOO_LARGE",
            429: "RATE_LIMIT_EXCEEDED",
            500: "INTERNAL_SERVER_ERROR",
            503: "SERVICE_UNAVAILABLE",
        }
        code = code_map.get(exc.status_code, "HTTP_ERROR")
        logger.info(f"HTTP exception [{exc.status_code}] at {request.method} {request.url.path}: {exc.detail}")
        return create_error_response(
            status_code=exc.status_code,
            code=code,
            message=str(exc.detail),
            headers=exc.headers,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        # CRITICAL SECURITY CONTROL:
        # Stack trace logged server-side only; client receives generic, safe 500 error.
        logger.error(
            f"Unhandled server error during {request.method} {request.url.path}: {type(exc).__name__}: {str(exc)}",
            exc_info=True,
        )
        return create_error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred. The incident has been recorded securely.",
            details=None,
        )
