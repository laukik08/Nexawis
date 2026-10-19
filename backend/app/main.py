"""
NEXAWIS Backend - Main FastAPI Application Entrypoint.
Initializes middlewares, exception handlers, lifecycle events, and versioned routes.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.core.database import get_engine, close_db_engine
from app.core.exceptions import register_exception_handlers
from app.core.middleware import (
    SecurityHeadersMiddleware,
    RequestSizeLimitMiddleware,
    InMemoryRateLimitMiddleware,
)
from app.api.v1.router import api_v1_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifecycle context manager.
    Handles clean, graceful startup initialization and shutdown resource cleanup.
    """
    # 1. Startup phase
    setup_logging(level="DEBUG" if settings.DEBUG else "INFO")
    logger.info(
        f"Starting {settings.PROJECT_NAME} v{settings.PROJECT_VERSION} in [{settings.ENVIRONMENT}] mode"
    )

    # Initialize database pool if connection string is configured
    db_target = settings.get_sanitized_database_url()
    if db_target:
        logger.info(f"Database target detected: {db_target}")
        get_engine()
    else:
        logger.info("No DATABASE_URL provided. Operating in decoupled local development mode.")

    yield

    # 2. Shutdown phase
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")
    await close_db_engine()
    logger.info("Graceful shutdown completed.")


def create_application() -> FastAPI:
    """Factory function constructing and configuring the FastAPI app instance."""
    # In production, docs can be disabled for additional attack surface reduction
    docs_url = "/docs" if not settings.is_production else None
    redoc_url = "/redoc" if not settings.is_production else None
    openapi_url = f"{settings.API_V1_STR}/openapi.json" if not settings.is_production else None

    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.PROJECT_VERSION,
        description="NEXAWIS - Adaptive Workforce Intelligence Framework Secure Backend Foundation",
        docs_url=docs_url,
        redoc_url=redoc_url,
        openapi_url=openapi_url,
        lifespan=lifespan,
    )

    # 1. Register Custom Security Middlewares (order: outermost to innermost)
    application.add_middleware(SecurityHeadersMiddleware)
    application.add_middleware(RequestSizeLimitMiddleware)
    application.add_middleware(
        InMemoryRateLimitMiddleware, requests_per_minute=settings.RATE_LIMIT_PER_MINUTE
    )

    # 2. Register CORS Middleware with explicitly restricted allowed origins
    # Ensure wildcard is not used with allow_credentials=True
    cors_origins = [str(origin) for origin in settings.ALLOWED_ORIGINS if origin != "*"]
    application.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
        expose_headers=["Retry-After"],
        max_age=600,
    )

    # 3. Register Centralized Exception Handlers
    register_exception_handlers(application)

    # 4. Mount Versioned API Master Router
    application.include_router(api_v1_router, prefix=settings.API_V1_STR)

    # 5. Root Info Endpoint (Convenience & health verification)
    @application.get(
        "/",
        tags=["System & Health"],
        summary="Root Service Summary",
        description="Returns basic, non-sensitive service identity and versioning info.",
        status_code=status.HTTP_200_OK,
    )
    async def root_info() -> JSONResponse:
        return JSONResponse(
            content={
                "service": settings.PROJECT_NAME,
                "version": settings.PROJECT_VERSION,
                "status": "online",
                "api_v1": settings.API_V1_STR,
                "docs": docs_url,
                "environment": settings.ENVIRONMENT,
            }
        )

    return application


app = create_application()
