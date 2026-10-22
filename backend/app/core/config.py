"""
NEXAWIS Backend - Core Application Configuration.
Reads from environment variables and .env file using Pydantic Settings.
"""

from pathlib import Path
from typing import List, Literal, Optional, Union
import re
from urllib.parse import urlparse, urlunparse, quote_plus
from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralized, strongly-typed application settings.
    Excludes sensitive secrets from default string representation.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application metadata & environment
    PROJECT_NAME: str = "NEXAWIS API"
    PROJECT_VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: Literal["development", "testing", "production"] = "development"
    DEBUG: bool = False

    # Server binding
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS configuration: strict list of frontend origins
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # Operational & payload security
    MAX_REQUEST_SIZE_BYTES: int = Field(
        default=2 * 1024 * 1024,  # 2 MB limit
        description="Maximum incoming request body size in bytes to prevent DoS payloads.",
    )
    RATE_LIMIT_PER_MINUTE: int = Field(
        default=120,
        description="Default sliding-window rate limit per client IP on public endpoints.",
    )

    # Machine Learning Canonical Artifact Settings (PRD §6, §9)
    ML_MODEL_DIR: str = Field(
        default_factory=lambda: str(
            (Path(__file__).resolve().parents[3] / "ml_model")
            if (Path(__file__).resolve().parents[3] / "ml_model").exists()
            else Path("e:/Nexawis/ml_model")
        ),
        description="Canonical directory containing pre-trained model artifacts.",
    )
    BURNOUT_MODEL_FILENAME: str = "burnout_model.pkl"
    PROJECT_SUCCESS_MODEL_FILENAME: str = "Project_Success_XGBoost.pkl"
    BURNOUT_MODEL_EXPECTED_SHA256: str = "ce5b9f45570e77152f29c9513f2b3912a885b757c045b63a8a6b2e6569a3ec18"
    PROJECT_SUCCESS_EXPECTED_SHA256: str = "a7c04b7ff90a1e59507dc4ada1c2e86fc939348ad3d1879af95219bd7bf565cf"
    BURNOUT_MODEL_VERSION: str = "burnout_model_v1"
    PROJECT_SUCCESS_MODEL_VERSION: str = "Project_Success_XGBoost_v1"

    # Supabase PostgreSQL connectivity
    DATABASE_URL: Optional[SecretStr] = Field(
        default=None,
        description="Primary async database connection string (postgresql+asyncpg://...)",
    )
    # Fallback individual DB parameters (if DATABASE_URL is not set directly)
    DB_HOST: Optional[str] = None
    DB_PORT: int = 5432
    DB_USER: Optional[str] = None
    DB_PASSWORD: Optional[SecretStr] = None
    DB_NAME: Optional[str] = None
    DB_SSL_REQUIRE: bool = True

    # Database connection pool tuning
    DB_POOL_SIZE: int = Field(default=5, ge=1, le=50)
    DB_MAX_OVERFLOW: int = Field(default=10, ge=0, le=50)
    DB_POOL_TIMEOUT: int = Field(default=30, ge=1)
    DB_POOL_RECYCLE: int = Field(default=1800, ge=60)
    DB_ECHO: bool = False

    # Authentication configuration (Clerk)
    CLERK_SECRET_KEY: Optional[SecretStr] = None
    CLERK_PUBLISHABLE_KEY: Optional[str] = None
    CLERK_ISSUER: Optional[str] = None
    CLERK_JWKS_URL: Optional[str] = None
    CLERK_PEM_PUBLIC_KEY: Optional[str] = None
    CLERK_AUDIENCE: Optional[str] = None
    CLERK_AUTHORIZED_PARTIES: Optional[List[str]] = None
    CLERK_JWT_ALGORITHMS: List[str] = ["RS256"]

    # Notification & Scheduled Report Delivery (Phase 11)
    EMAIL_PROVIDER: Literal["simulated", "smtp"] = "simulated"
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = Field(default=587, ge=1, le=65535)
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[SecretStr] = None
    SMTP_TLS: bool = True
    EMAIL_FROM: str = "notifications@nexawis.internal"
    EMAIL_TIMEOUT_SECONDS: int = Field(default=15, ge=1, le=120)

    # Scheduler Engine Configuration (Phase 11)
    SCHEDULER_ENABLED: bool = True
    SCHEDULER_INTERVAL_SECONDS: int = Field(default=60, ge=5, le=3600)
    ALERT_SCAN_INTERVAL_SECONDS: int = Field(default=300, ge=30, le=86400)
    SCHEDULER_MAX_RETRIES: int = Field(default=3, ge=1, le=10)

    def get_clerk_jwks_url(self) -> Optional[str]:
        """Resolves the canonical JWKS URL from CLERK_JWKS_URL or CLERK_ISSUER."""
        if self.CLERK_JWKS_URL:
            return self.CLERK_JWKS_URL.strip()
        if self.CLERK_ISSUER:
            return f"{self.CLERK_ISSUER.strip().rstrip('/')}/.well-known/jwks.json"
        return None

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: Union[str, List[str]]) -> List[str]:
        """Parse comma-separated origin strings into a clean list of trimmed strings."""
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return []
            if value.startswith("[") and value.endswith("]"):
                # JSON list string
                import json
                try:
                    parsed = json.loads(value)
                    return [str(o).strip().rstrip("/") for o in parsed if str(o).strip()]
                except Exception:
                    pass
            # Comma-separated list
            return [o.strip().rstrip("/") for o in value.split(",") if o.strip()]
        if isinstance(value, list):
            return [str(o).strip().rstrip("/") for o in value if str(o).strip()]
        return []

    @field_validator("DEBUG")
    @classmethod
    def validate_debug_mode(cls, value: bool, info) -> bool:
        """Enforce that DEBUG mode cannot be enabled in production."""
        env = info.data.get("ENVIRONMENT")
        if env == "production" and value:
            # Force debug to False in production for safety
            return False
        return value

    def get_async_database_url(self) -> Optional[str]:
        """
        Builds and validates an asyncpg-compatible PostgreSQL URL.
        Converts standard postgres:// or postgresql:// schemes to postgresql+asyncpg://.
        Strips query params that conflict with asyncpg, while ensuring correct dialect.
        """
        raw_url: Optional[str] = None
        if self.DATABASE_URL:
            raw_url = self.DATABASE_URL.get_secret_value().strip()
        elif self.DB_HOST and self.DB_USER and self.DB_PASSWORD and self.DB_NAME:
            pwd = quote_plus(self.DB_PASSWORD.get_secret_value())
            raw_url = f"postgresql+asyncpg://{self.DB_USER}:{pwd}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

        if not raw_url:
            return None

        # Normalize driver prefix for asyncpg
        if raw_url.startswith("postgres://"):
            raw_url = "postgresql+asyncpg://" + raw_url[len("postgres://"):]
        elif raw_url.startswith("postgresql://"):
            raw_url = "postgresql+asyncpg://" + raw_url[len("postgresql://"):]
        elif not raw_url.startswith("postgresql+asyncpg://"):
            # If standard URL provided without driver, inject asyncpg
            parts = raw_url.split("://", 1)
            if len(parts) == 2:
                raw_url = f"postgresql+asyncpg://{parts[1]}"

        # Remove query parameters like sslmode or pgbouncer from URL string
        # because asyncpg expects them as connect_args, not URL query params.
        parsed = urlparse(raw_url)
        clean_url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            "",  # strip query
            parsed.fragment
        ))
        return clean_url

    def get_sanitized_database_url(self) -> Optional[str]:
        """
        Returns a redacted connection URL with password replaced by ***.
        Safe for logging, debugging, and health status reports.
        """
        url = self.get_async_database_url()
        if not url:
            return None

        # Redact password in user:password@host format
        return re.sub(r":([^:@]+)@", r":***@", url)

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_testing(self) -> bool:
        return self.ENVIRONMENT == "testing"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"


# Singleton instance loaded on demand
settings = Settings()
