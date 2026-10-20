"""
Tests for application configuration, settings validation, and credential masking.
"""

import pytest
from pydantic import SecretStr
from app.core.config import Settings


def test_default_settings():
    """Verify standard default configuration parameters."""
    cfg = Settings(ENVIRONMENT="development")
    assert cfg.PROJECT_NAME == "NEXAWIS API"
    assert cfg.API_V1_STR == "/api/v1"
    assert cfg.is_development is True
    assert cfg.is_production is False
    assert cfg.is_testing is False
    assert cfg.MAX_REQUEST_SIZE_BYTES > 0
    assert cfg.RATE_LIMIT_PER_MINUTE > 0


def test_production_disables_debug():
    """Ensure DEBUG cannot be forced True when ENVIRONMENT is production."""
    cfg = Settings(ENVIRONMENT="production", DEBUG=True)
    assert cfg.DEBUG is False
    assert cfg.is_production is True


def test_allowed_origins_parsing():
    """Test parsing of various CORS origin string formats."""
    # Comma-separated format
    cfg1 = Settings(ALLOWED_ORIGINS="http://localhost:5173, https://app.nexawis.com/")
    assert "http://localhost:5173" in cfg1.ALLOWED_ORIGINS
    assert "https://app.nexawis.com" in cfg1.ALLOWED_ORIGINS  # Trailing slash stripped

    # JSON format
    cfg2 = Settings(ALLOWED_ORIGINS='["http://localhost:3000", "https://staging.nexawis.com"]')
    assert "http://localhost:3000" in cfg2.ALLOWED_ORIGINS
    assert "https://staging.nexawis.com" in cfg2.ALLOWED_ORIGINS


def test_async_database_url_normalization():
    """Test normalization from standard postgres URLs to asyncpg."""
    # Standard postgres://
    cfg1 = Settings(DATABASE_URL="postgres://user:secret123@db.supabase.co:5432/postgres")
    assert cfg1.get_async_database_url() == "postgresql+asyncpg://user:secret123@db.supabase.co:5432/postgres"

    # Standard postgresql:// with query parameters
    cfg2 = Settings(DATABASE_URL="postgresql://user:secret123@db.supabase.co:6543/postgres?sslmode=require&pgbouncer=true")
    assert cfg2.get_async_database_url() == "postgresql+asyncpg://user:secret123@db.supabase.co:6543/postgres"

    # None when unset
    cfg3 = Settings(DATABASE_URL=None)
    assert cfg3.get_async_database_url() is None


def test_sanitized_database_url_masks_password():
    """Verify that get_sanitized_database_url() redacts sensitive credentials."""
    cfg = Settings(DATABASE_URL="postgresql://db_admin:SuperSecretPassword999@aws-0-eu.pooler.supabase.com:6543/postgres")
    sanitized = cfg.get_sanitized_database_url()
    assert sanitized is not None
    assert "SuperSecretPassword999" not in sanitized
    assert "postgresql+asyncpg://db_admin:***@aws-0-eu.pooler.supabase.com:6543/postgres" == sanitized


def test_secret_str_masks_representation():
    """Verify that printing or casting SecretStr never reveals the plain password."""
    cfg = Settings(
        DATABASE_URL="postgresql://user:HiddenPassword123@localhost:5432/db",
        CLERK_SECRET_KEY="sk_live_very_secret_key_abc123",
    )
    assert "HiddenPassword123" not in str(cfg.DATABASE_URL)
    assert "very_secret_key" not in str(cfg.CLERK_SECRET_KEY)
    assert "**********" in str(cfg.DATABASE_URL)


def test_db_components_with_special_characters_encoded():
    """Verify separate DB config fields URL-encode passwords containing special characters."""
    cfg = Settings(
        DATABASE_URL=None,
        DB_HOST="aws-0-ap-south-1.pooler.supabase.com",
        DB_PORT=6543,
        DB_USER="postgres.myproject",
        DB_PASSWORD="p@ssword,with#symbols!",
        DB_NAME="postgres",
    )
    async_url = cfg.get_async_database_url()
    assert async_url is not None
    # Ensure @ and , are URL-encoded in the password portion
    assert "p%40ssword%2Cwith%23symbols%21" in async_url
    assert "postgres.myproject:" in async_url
    assert "@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" in async_url

