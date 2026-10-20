"""
NEXAWIS Backend - Team Formation and Candidate Recommendation Models.
Distinguishes temporary algorithmic recommendations from finalized human-approved assignments.
"""

import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import (
    String,
    Text,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, JSON_TYPE

if TYPE_CHECKING:
    from app.models.workspace import Workspace
    from app.models.project import Project
    from app.models.user import User
    from app.models.employee import Employee
    from app.models.ml_results import AwisEvaluation, MlProjectSuccessPrediction


class TeamFormation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Represents an algorithmic team formation run, candidate selection, or historical record.
    """
    __tablename__ = "team_formations"
    __table_args__ = (
        UniqueConstraint("workspace_id", "formation_code", name="uq_workspace_formation_code"),
        Index("ix_team_formations_proj", "workspace_id", "project_id"),
        Index("ix_team_formations_status", "workspace_id", "status"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    formation_code: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., 'FRM-2026-001'
    formation_option: Mapped[str] = mapped_column(
        String(50),
        default="autonomous_ai",
        nullable=False,
    )  # 'autonomous_ai', 'fatigue_safe', 'high_velocity', 'growth_mentorship', 'rebalance_existing', 'custom_constraints'
    status: Mapped[str] = mapped_column(
        String(50),
        default="Draft",
        nullable=False,
    )  # 'Draft', 'Finalized', 'Active', 'Archived'

    target_team_size: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    selected_member_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    team_fit_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Formation Quality & Sustainability Metrics
    skill_coverage_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    workload_balance_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sustainability_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    availability_coverage_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Input constraints snapshot
    config_parameters: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)

    # Finalization Decision Metadata
    finalized_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    finalized_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="team_formations")
    project: Mapped["Project"] = relationship("Project", back_populates="team_formations")
    finalized_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[finalized_by_user_id])
    members: Mapped[List["TeamFormationMember"]] = relationship(
        "TeamFormationMember",
        back_populates="formation",
        cascade="all, delete-orphan",
    )
    awis_evaluations: Mapped[List["AwisEvaluation"]] = relationship(
        "AwisEvaluation",
        back_populates="formation",
    )
    success_predictions: Mapped[List["MlProjectSuccessPrediction"]] = relationship(
        "MlProjectSuccessPrediction",
        back_populates="formation",
    )

    def __repr__(self) -> str:
        return f"<TeamFormation(code='{self.formation_code}', project_id={self.project_id}, status='{self.status}')>"


class TeamFormationMember(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Candidate team member associated with a formation recommendation or finalized configuration.
    Includes explainability reasons ('why_selected') and override tracking.
    """
    __tablename__ = "team_formation_members"
    __table_args__ = (
        UniqueConstraint("formation_id", "employee_id", name="uq_formation_employee"),
        Index("ix_formation_member_emp", "formation_id", "employee_id"),
    )

    formation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("team_formations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assigned_role: Mapped[str] = mapped_column(String(100), nullable=False)
    allocation_percent: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    match_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    skill_match_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    performance_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    availability_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    workload_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    awis_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    wellbeing_risk: Mapped[str] = mapped_column(String(20), default="Low", nullable=False)

    # Human-in-the-loop decision flags
    is_override: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_selected: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Explainability payload: summary, strengths, considerations
    why_selected: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)

    # Relationships
    formation: Mapped["TeamFormation"] = relationship("TeamFormation", back_populates="members")
    employee: Mapped["Employee"] = relationship("Employee", back_populates="formation_memberships")

    def __repr__(self) -> str:
        return f"<TeamFormationMember(formation_id={self.formation_id}, employee_id={self.employee_id}, role='{self.assigned_role}')>"
