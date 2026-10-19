"""
NEXAWIS Backend - Supabase PostgreSQL Database Connectivity.
SQLAlchemy 2.x asynchronous engine, session factory, and safe health inspection.
"""

import time
from typing import AsyncGenerator, Dict, Any, Optional
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy import text
from app.core.config import settings
from app.core.logging import logger

# Module-level engine and session factory references
_engine: Optional[AsyncEngine] = None
_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


def get_engine() -> Optional[AsyncEngine]:
    """
    Lazily creates and returns the singleton AsyncEngine.
    Configured with connection pooling and Supabase pooler compatibility.
    """
    global _engine, _session_factory

    if _engine is not None:
        return _engine

    db_url = settings.get_async_database_url()
    if not db_url:
        logger.warning("No database URL configured. Database features are currently inactive.")
        return None

    # Connect args tailored for asyncpg and Supabase (direct or transaction pooler)
    connect_args: Dict[str, Any] = {
        # Disabling prepared statement caching avoids collisions with PgBouncer / Supavisor pooler
        "statement_cache_size": 0,
    }

    if settings.DB_SSL_REQUIRE:
        connect_args["ssl"] = "require"

    sanitized_url = settings.get_sanitized_database_url()
    logger.info(f"Initializing async SQLAlchemy engine for: {sanitized_url}")

    _engine = create_async_engine(
        db_url,
        echo=settings.DB_ECHO,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
        pool_recycle=settings.DB_POOL_RECYCLE,
        pool_pre_ping=True,  # Proactively test connection before dispensing from pool
        connect_args=connect_args,
    )

    _session_factory = async_sessionmaker(
        bind=_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    return _engine


def get_session_factory() -> Optional[async_sessionmaker[AsyncSession]]:
    """Returns the configured async session factory."""
    if _session_factory is None:
        get_engine()
    return _session_factory


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding a managed AsyncSession.
    Ensures safe rollback on errors and guaranteed session closure.
    """
    factory = get_session_factory()
    if factory is None:
        raise RuntimeError("Database engine is not configured.")

    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception as exc:
            await session.rollback()
            logger.error(f"Database session rolled back due to error: {exc}")
            raise
        finally:
            await session.close()


async def close_db_engine() -> None:
    """Gracefully disposes the async engine and cleans up pool resources on shutdown."""
    global _engine, _session_factory
    if _engine is not None:
        logger.info("Disposing database connection pool...")
        await _engine.dispose()
        _engine = None
        _session_factory = None
        logger.info("Database connection pool successfully disposed.")


async def check_database_readiness(timeout_seconds: float = 3.0) -> Dict[str, Any]:
    """
    Verifies actual database connectivity by executing a lightweight query ('SELECT 1').
    Measures round-trip latency and returns a clean, sanitized diagnostic report.
    Never raises unhandled exceptions or leaks credentials.
    """
    db_url = settings.get_async_database_url()
    sanitized_url = settings.get_sanitized_database_url()

    if not db_url:
        return {
            "status": "unconfigured",
            "connected": False,
            "message": "Database connection URL is not configured.",
            "latency_ms": None,
            "dialect": "postgresql+asyncpg",
            "database_target": None,
        }

    engine = get_engine()
    if not engine:
        return {
            "status": "error",
            "connected": False,
            "message": "Database engine failed to initialize.",
            "latency_ms": None,
            "dialect": "postgresql+asyncpg",
            "database_target": sanitized_url,
        }

    start_time = time.perf_counter()
    try:
        # Use an isolated connection to verify connectivity
        async with engine.connect() as conn:
            # Enforce strict statement timeout
            await conn.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "status": "healthy",
            "connected": True,
            "message": "Database connection verified successfully.",
            "latency_ms": latency_ms,
            "dialect": "postgresql+asyncpg",
            "database_target": sanitized_url,
        }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        # Log sanitized error message server-side
        logger.warning(f"Database readiness verification failed ({latency_ms}ms): {type(exc).__name__}")
        
        return {
            "status": "unreachable",
            "connected": False,
            "message": "Database host is unreachable or rejected connection credentials.",
            "latency_ms": latency_ms,
            "dialect": "postgresql+asyncpg",
            "database_target": sanitized_url,
        }
