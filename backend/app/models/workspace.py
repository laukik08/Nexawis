"""
NEXAWIS Backend - Workspace and Organization Models.
Supports tenant isolation, workspace membership, and workspace-level configuration.
"""

import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Boolean, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, JSON_TYPE

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.employee import Employee
    from app.models.skill import Skill
    from app.models.project import Project
    from app.models.team_formation import TeamFormation
    from app.models.report import Report


class Workspace(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Represents a tenant organization or workspace partition."""
    __tablename__ = "workspaces"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    members: Mapped[List["WorkspaceMember"]] = relationship(
        "WorkspaceMember",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )
    settings: Mapped[Optional["WorkspaceSettings"]] = relationship(
        "WorkspaceSettings",
        back_populates="workspace",
        uselist=False,
        cascade="all, delete-orphan",
    )
    employees: Mapped[List["Employee"]] = relationship(
        "Employee",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )
    skills: Mapped[List["Skill"]] = relationship(
        "Skill",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )
    projects: Mapped[List["Project"]] = relationship(
        "Project",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )
    team_formations: Mapped[List["TeamFormation"]] = relationship(
        "TeamFormation",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )
    reports: Mapped[List["Report"]] = relationship(
        "Report",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Workspace(id={self.id}, slug='{self.slug}', name='{self.name}')>"


class WorkspaceMember(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Associates a User with a Workspace under a specific role."""
    __tablename__ = "workspace_members"
    __table_args__ = (
        UniqueConstraint("workspace_id", "user_id", name="uq_workspace_member"),
        Index("ix_workspace_member_user", "workspace_id", "user_id"),
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
    role: Mapped[str] = mapped_column(
        String(50),
        default="member",
        nullable=False,
    )  # e.g., 'owner', 'admin', 'member', 'viewer'
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="workspace_memberships")

    def __repr__(self) -> str:
        return f"<WorkspaceMember(workspace_id={self.workspace_id}, user_id={self.user_id}, role='{self.role}')>"


class WorkspaceSettings(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Workspace-level settings and configuration defaults."""
    __tablename__ = "workspace_settings"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    default_department: Mapped[Optional[str]] = mapped_column(String(100), default="All", nullable=True)
    default_reporting_period: Mapped[str] = mapped_column(String(50), default="30d", nullable=False)
    default_project_view: Mapped[str] = mapped_column(String(20), default="grid", nullable=False)
    default_report_format: Mapped[str] = mapped_column(String(10), default="PDF", nullable=False)
    preferred_analytics_tab: Mapped[str] = mapped_column(String(50), default="overview", nullable=False)
    
    # Custom configurable AWIS dimension weight profiles for different project types
    awis_weight_profiles: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)
    
    # Generic flexible workspace preferences
    custom_settings: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)

    # Relationship
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="settings")

    def __repr__(self) -> str:
        return f"<WorkspaceSettings(workspace_id={self.workspace_id}, default_department='{self.default_department}')>"
