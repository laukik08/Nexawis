"""
NEXAWIS Backend - SQLAlchemy 2.x Declarative Base and Common Mixins.
"""

import uuid
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import DateTime, Uuid, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# Cross-dialect JSON type: compiles to native JSONB on PostgreSQL/Supabase, falls back to JSON on SQLite
JSON_TYPE: Any = JSON().with_variant(JSONB(), "postgresql")


def utc_now() -> datetime:
    """Returns the current timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """Base declarative class for all NEXAWIS database models."""
    pass


class UUIDPrimaryKeyMixin:
    """Mixin that provides a UUID primary key default."""
    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        sort_order=-10,
    )


class TimestampMixin:
    """Mixin that provides timezone-aware created_at and updated_at timestamps."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )
