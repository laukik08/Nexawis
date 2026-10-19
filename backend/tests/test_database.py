"""
Unit and integration tests for database engine lifecycle and readiness inspection.
"""

from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from app.core.database import (
    check_database_readiness,
    close_db_engine,
    get_engine,
)
from app.core.config import settings


@pytest.mark.asyncio
async def test_database_readiness_when_unconfigured():
    """Verify check_database_readiness handles unconfigured state cleanly."""
    with patch.object(settings, "DATABASE_URL", None), \
         patch.object(settings, "DB_HOST", None):
        result = await check_database_readiness()
        assert result["status"] == "unconfigured"
        assert result["connected"] is False
        assert result["latency_ms"] is None


@pytest.mark.asyncio
async def test_database_readiness_success():
    """Verify check_database_readiness measures latency and reports healthy on success."""
    mock_conn = AsyncMock()
    mock_conn.execute.return_value = None

    mock_connect_context = AsyncMock()
    mock_connect_context.__aenter__.return_value = mock_conn
    mock_connect_context.__aexit__.return_value = None

    mock_engine = MagicMock()
    mock_engine.connect.return_value = mock_connect_context

    with patch("app.core.database.get_engine", return_value=mock_engine), \
         patch.object(settings, "DATABASE_URL", MagicMock(get_secret_value=lambda: "postgresql+asyncpg://user:pass@localhost:5432/db")):
        result = await check_database_readiness()
        assert result["status"] == "healthy"
        assert result["connected"] is True
        assert isinstance(result["latency_ms"], float)
        assert result["latency_ms"] >= 0.0


@pytest.mark.asyncio
async def test_database_readiness_catches_exception_safely():
    """Verify that network/auth failures return unreachable without leaking exceptions."""
    mock_connect_context = AsyncMock()
    mock_connect_context.__aenter__.side_effect = ConnectionRefusedError("Connection refused by target machine")

    mock_engine = MagicMock()
    mock_engine.connect.return_value = mock_connect_context

    with patch("app.core.database.get_engine", return_value=mock_engine), \
         patch.object(settings, "DATABASE_URL", MagicMock(get_secret_value=lambda: "postgresql+asyncpg://user:pass@localhost:5432/db")):
        result = await check_database_readiness()
        assert result["status"] == "unreachable"
        assert result["connected"] is False
        # Sensitive raw exception string must not be leaked into the client message
        assert "Connection refused by target machine" not in result["message"]
        assert "Database host is unreachable" in result["message"]


@pytest.mark.asyncio
async def test_close_db_engine_disposes_resources():
    """Verify that close_db_engine properly invokes engine.dispose()."""
    mock_engine = AsyncMock()

    with patch("app.core.database._engine", mock_engine):
        await close_db_engine()
        mock_engine.dispose.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_db_session_lifecycle():
    """Verify get_db_session commits on success and closes the session."""
    from app.core.database import get_db_session

    mock_session = AsyncMock()
    mock_session_context = AsyncMock()
    mock_session_context.__aenter__.return_value = mock_session
    mock_session_context.__aexit__.return_value = None

    mock_factory = MagicMock(return_value=mock_session_context)

    with patch("app.core.database.get_session_factory", return_value=mock_factory):
        async for session in get_db_session():
            assert session == mock_session

        mock_session.commit.assert_awaited_once()
        mock_session.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_db_session_rollback_on_error():
    """Verify get_db_session rolls back and closes session when exception occurs."""
    from app.core.database import get_db_session

    mock_session = AsyncMock()
    mock_session_context = AsyncMock()
    mock_session_context.__aenter__.return_value = mock_session
    mock_session_context.__aexit__.return_value = None

    mock_factory = MagicMock(return_value=mock_session_context)

    with patch("app.core.database.get_session_factory", return_value=mock_factory):
        gen = get_db_session()
        session = await gen.asend(None)
        assert session == mock_session

        with pytest.raises(ValueError, match="Simulated route error"):
            await gen.athrow(ValueError("Simulated route error"))

        mock_session.rollback.assert_awaited_once()
        mock_session.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_db_session_unconfigured_raises():
    """Verify get_db_session raises RuntimeError when factory cannot be initialized."""
    from app.core.database import get_db_session

    with patch("app.core.database.get_session_factory", return_value=None):
        with pytest.raises(RuntimeError, match="Database engine is not configured"):
            async for _ in get_db_session():
                pass

