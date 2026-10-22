"""
NEXAWIS Backend - In-App Notification and Scheduled Execution Tracking Models.
Supports real-time alerts, operational event monitoring, and recurring report delivery tracking.
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from sqlalchemy import (
    String,
    Text,
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
    from app.models.report import Report, ScheduledReport


class Notification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Persisted in-app user notification scoped to a specific recipient and workspace.
    Supports operational alerts, project deadlines, workload violations, and report updates.
    """
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_ws_read", "user_id", "workspace_id", "is_read"),
        Index("ix_notifications_workspace_created", "workspace_id", "created_at"),
        Index("ix_notifications_dedup", "workspace_id", "dedup_key"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )  # 'project', 'workload', 'team_formation', 'report', 'ml_risk', 'system'
    severity: Mapped[str] = mapped_column(
        String(20),
        default="info",
        nullable=False,
    )  # 'info', 'warning', 'critical', 'success'
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Navigation & related entity metadata
    link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    resource_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # 'project', 'employee', 'report', 'team_formation'
    resource_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notification_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)

    # Deduplication key to prevent repetitive identical alerts
    dedup_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace")
    user: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user_id={self.user_id}, category='{self.category}', severity='{self.severity}', is_read={self.is_read})>"


class ScheduledReportExecution(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Audit log and state machine tracking every execution cycle of a recurring scheduled report.
    Guarantees idempotency, records generation/delivery outcome, and prevents double-processing.
    """
    __tablename__ = "scheduled_report_executions"
    __table_args__ = (
        Index("ix_sched_exec_report_started", "scheduled_report_id", "started_at"),
        Index("ix_sched_exec_ws_status", "workspace_id", "status"),
    )

    scheduled_report_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("scheduled_reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    report_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("reports.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    idempotency_key: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
    )  # 'pending', 'running', 'completed', 'failed'
    attempt_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Delivery tracking
    recipients: Mapped[list] = mapped_column(JSON_TYPE, nullable=False)
    delivery_status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
    )  # 'pending', 'delivered', 'partial_failure', 'failed', 'simulated'
    delivery_results: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Relationships
    scheduled_report: Mapped["ScheduledReport"] = relationship("ScheduledReport")
    workspace: Mapped["Workspace"] = relationship("Workspace")
    report: Mapped[Optional["Report"]] = relationship("Report")

    def __repr__(self) -> str:
        return f"<ScheduledReportExecution(id={self.id}, schedule_id={self.scheduled_report_id}, status='{self.status}', delivery='{self.delivery_status}')>"
