"""
NEXAWIS Backend - Report Configuration and Scheduled Distribution Models.
Persists report metadata, filters, metrics, and schedules without storing file blobs in PostgreSQL.
"""

import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import (
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, JSON_TYPE

if TYPE_CHECKING:
    from app.models.workspace import Workspace
    from app.models.user import User


class Report(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Persisted report record containing analytical summaries, configuration, and insights.
    File documents (PDF/CSV) are generated on demand or held in object storage.
    """
    __tablename__ = "reports"
    __table_args__ = (
        Index("ix_reports_workspace_cat", "workspace_id", "category"),
        Index("ix_reports_status", "workspace_id", "status"),
        Index("ix_reports_created", "workspace_id", "created_at"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )  # 'workforce', 'projects', 'team_formation', 'awis_intelligence', 'sustainability', 'executive'
    reporting_period: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., 'Last 30 Days'
    status: Mapped[str] = mapped_column(
        String(50),
        default="Ready",
        nullable=False,
    )  # 'Ready', 'Scheduled', 'Draft'
    format: Mapped[str] = mapped_column(String(10), default="PDF", nullable=False)  # 'PDF', 'CSV'
    file_size_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Detailed report configuration (preset, dateRange, department, sections, toggles)
    config: Mapped[dict] = mapped_column(JSON_TYPE, nullable=False)

    # Pre-calculated analytics summaries and executive highlights
    summary_metrics: Mapped[Optional[list]] = mapped_column(JSON_TYPE, nullable=True)
    findings: Mapped[Optional[list]] = mapped_column(JSON_TYPE, nullable=True)
    warnings: Mapped[Optional[list]] = mapped_column(JSON_TYPE, nullable=True)
    insights: Mapped[Optional[list]] = mapped_column(JSON_TYPE, nullable=True)

    # Visualizations and tabular data structures
    charts: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)
    table_data: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)

    created_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="reports")
    creator: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="created_reports",
        foreign_keys=[created_by_user_id],
    )

    def __repr__(self) -> str:
        return f"<Report(id={self.id}, title='{self.title}', category='{self.category}', status='{self.status}')>"


class ScheduledReport(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Configuration for recurring automated report generation and distribution."""
    __tablename__ = "scheduled_reports"
    __table_args__ = (
        Index("ix_sched_reports_workspace", "workspace_id"),
        Index("ix_sched_reports_next_run", "next_run_date"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    frequency: Mapped[str] = mapped_column(
        String(50),
        default="Weekly",
        nullable=False,
    )  # 'Daily', 'Weekly', 'Monthly'
    next_run_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    recipients: Mapped[list] = mapped_column(JSON_TYPE, nullable=False)  # List of recipient email addresses
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    format: Mapped[str] = mapped_column(String(10), default="PDF", nullable=False)
    department: Mapped[str] = mapped_column(String(100), default="All", nullable=False)

    created_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace")
    creator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by_user_id])

    def __repr__(self) -> str:
        return f"<ScheduledReport(name='{self.name}', frequency='{self.frequency}', enabled={self.enabled})>"
