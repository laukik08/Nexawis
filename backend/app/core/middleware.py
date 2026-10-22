"""
NEXAWIS Backend - Security & Operational Protection Middlewares.
Provides security headers, payload size enforcement, and in-memory rate limiting.
"""

import time
from collections import defaultdict
from typing import Dict, List, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.config import settings
from app.core.exceptions import create_error_response, PayloadTooLargeError


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Appends standard industry-grade HTTP security headers to all responses.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Baseline security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # In production or HTTPS, enforce HSTS
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Rejects requests whose body exceeds the configured maximum size.
    Mitigates large payload denial-of-service (DoS) attacks.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        content_length = request.headers.get("content-length")
        max_bytes = settings.MAX_REQUEST_SIZE_BYTES

        if content_length:
            try:
                length = int(content_length)
                if length > max_bytes:
                    return create_error_response(
                        status_code=413,
                        code="PAYLOAD_TOO_LARGE",
                        message=f"Request payload size ({length} bytes) exceeds the limit of {max_bytes} bytes.",
                    )
            except ValueError:
                pass

        return await call_next(request)


class InMemoryRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Lightweight sliding-window rate limiter per client IP.
    Protects public health, readiness, and future auth endpoints.
    """

    _instances: List["InMemoryRateLimitMiddleware"] = []

    def __init__(self, app, requests_per_minute: int = 120):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        # Dict of IP -> list of timestamps
        self.client_records: Dict[str, List[float]] = defaultdict(list)
        self.window_seconds = 60.0
        InMemoryRateLimitMiddleware._instances.append(self)

    @classmethod
    def reset_all(cls) -> None:
        """Resets all tracked rate limit records, used for testing isolation."""
        for inst in cls._instances:
            inst.client_records.clear()


    def _get_client_ip(self, request: Request) -> str:
        # Default to direct connection host to prevent spoofed X-Forwarded-For
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    async def dispatch(self, request: Request, call_next) -> Response:
        # Exempt automated health checks from strict rate-limiting if needed, or apply limit
        client_ip = self._get_client_ip(request)
        now = time.time()
        window_start = now - self.window_seconds

        # Prune older timestamps
        records = [ts for ts in self.client_records[client_ip] if ts > window_start]
        self.client_records[client_ip] = records

        if len(records) >= self.requests_per_minute:
            retry_after = int(self.window_seconds - (now - records[0])) + 1
            return create_error_response(
                status_code=429,
                code="RATE_LIMIT_EXCEEDED",
                message="Too many requests. Please slow down and try again.",
                details={"retry_after_seconds": max(1, retry_after)},
                headers={"Retry-After": str(max(1, retry_after))},
            )

        self.client_records[client_ip].append(now)
        return await call_next(request)
