"""
NEXAWIS Backend - User Profile and Preferences Models.
Designed for seamless future integration with Clerk authentication without duplicating auth credentials.
"""

import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, JSON_TYPE

if TYPE_CHECKING:
    from app.models.workspace import WorkspaceMember
    from app.models.employee import Employee
    from app.models.project import Project
    from app.models.report import Report


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Application user profile linked to a verified Clerk user ID.
    Zero passwords or auth secrets are stored here.
    """
    __tablename__ = "users"

    clerk_user_id: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        index=True,
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[str] = mapped_column(
        String(50),
        default="Project Manager",
        nullable=False,
    )  # 'Admin', 'HR', 'Project Manager', 'Employee', 'Leadership'
    title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    workspace_memberships: Mapped[List["WorkspaceMember"]] = relationship(
        "WorkspaceMember",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    preferences: Mapped[Optional["UserPreference"]] = relationship(
        "UserPreference",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    managed_projects: Mapped[List["Project"]] = relationship(
        "Project",
        back_populates="project_manager",
        foreign_keys="Project.project_manager_id",
    )
    created_reports: Mapped[List["Report"]] = relationship(
        "Report",
        back_populates="creator",
        foreign_keys="Report.created_by_user_id",
    )
    employee_profile: Mapped[Optional["Employee"]] = relationship(
        "Employee",
        back_populates="user",
        uselist=False,
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"


class UserPreference(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Personalized UI and notification preferences for an individual user."""
    __tablename__ = "user_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    theme: Mapped[str] = mapped_column(String(20), default="dark", nullable=False)
    language: Mapped[str] = mapped_column(String(20), default="en-US", nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)
    date_format: Mapped[str] = mapped_column(String(30), default="YYYY-MM-DD", nullable=False)
    time_format: Mapped[str] = mapped_column(String(10), default="12h", nullable=False)
    density: Mapped[str] = mapped_column(String(20), default="comfortable", nullable=False)
    motion: Mapped[str] = mapped_column(String(20), default="full", nullable=False)
    high_contrast: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    default_landing_page: Mapped[str] = mapped_column(String(100), default="/app", nullable=False)

    # Detailed notifications configuration
    notification_settings: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)

    # Privacy configuration (telemetry, session visibility, etc.)
    privacy_settings: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="preferences")

    def __repr__(self) -> str:
        return f"<UserPreference(user_id={self.user_id}, theme='{self.theme}')>"
