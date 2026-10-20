"""
Alembic migration environment for NEXAWIS Backend.
Configured for asynchronous execution with SQLAlchemy 2.x and asyncpg.
"""

import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

from app.core.config import settings
from app.models import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# target_metadata is configured with all NEXAWIS declarative models
target_metadata = Base.metadata


def get_url() -> str:
    """Retrieves asyncpg connection URL from centralized Pydantic settings."""
    url = settings.get_async_database_url()
    if not url:
        return "postgresql+asyncpg://postgres:placeholder@localhost:5432/postgres"
    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """In 'online' mode with an AsyncEngine, we must run inside an async loop."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()

    connect_args = {
        "statement_cache_size": 0,
    }
    if settings.DB_SSL_REQUIRE:
        connect_args["ssl"] = "require"

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
