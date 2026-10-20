"""
NEXAWIS Backend - Project, Requirements, Milestones, and Allocations Models.
Represents project profiles, staffing assignments, and input parameters for project success modeling.
"""

import uuid
from datetime import date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import (
    String,
    Text,
    Integer,
    Float,
    Boolean,
    Date,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, JSON_TYPE

if TYPE_CHECKING:
    from app.models.workspace import Workspace
    from app.models.user import User
    from app.models.skill import Skill
    from app.models.employee import Employee
    from app.models.team_formation import TeamFormation
    from app.models.ml_results import AwisEvaluation, MlProjectSuccessPrediction


class Project(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Project profile entity representing operational timelines, required technical specs,
    and complexity features for project success prediction.
    """
    __tablename__ = "projects"
    __table_args__ = (
        UniqueConstraint("workspace_id", "project_code", name="uq_workspace_project_code"),
        Index("ix_projects_workspace_dept", "workspace_id", "department"),
        Index("ix_projects_status", "workspace_id", "status"),
        Index("ix_projects_priority", "workspace_id", "priority"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_code: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., 'PRJ-101'
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    client: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    
    project_manager_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="Planning",
        nullable=False,
    )  # 'Planning', 'Active', 'On Track', 'At Risk', 'Completed', 'On Hold'
    priority: Mapped[str] = mapped_column(
        String(20),
        default="Medium",
        nullable=False,
    )  # 'Critical', 'High', 'Medium', 'Low'
    complexity: Mapped[str] = mapped_column(
        String(20),
        default="Medium",
        nullable=False,
    )  # 'High', 'Medium', 'Low'
    target_team_size: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    progress_percent: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    overall_risk: Mapped[str] = mapped_column(String(20), default="Low", nullable=False)
    team_fit_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Complexity & Contextual Indicators (Inputs for Project Success Prediction Model)
    priority_score: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    complexity_score: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    requirement_stability: Mapped[float] = mapped_column(Float, default=70.0, nullable=False)
    technical_risk: Mapped[float] = mapped_column(Float, default=30.0, nullable=False)
    schedule_pressure: Mapped[float] = mapped_column(Float, default=40.0, nullable=False)
    client_engagement: Mapped[float] = mapped_column(Float, default=80.0, nullable=False)
    innovation_index: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    scope_change: Mapped[float] = mapped_column(Float, default=10.0, nullable=False)
    budget_variance: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    delivery_delay_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    employee_turnover_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Risk and fit metadata
    risks_metadata: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)
    awis_fit_metadata: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="projects")
    project_manager: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="managed_projects",
        foreign_keys=[project_manager_id],
    )
    requirements: Mapped[List["ProjectRequirement"]] = relationship(
        "ProjectRequirement",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    milestones: Mapped[List["ProjectMilestone"]] = relationship(
        "ProjectMilestone",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    allocations: Mapped[List["ProjectAllocation"]] = relationship(
        "ProjectAllocation",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    team_formations: Mapped[List["TeamFormation"]] = relationship(
        "TeamFormation",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    awis_evaluations: Mapped[List["AwisEvaluation"]] = relationship(
        "AwisEvaluation",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    success_predictions: Mapped[List["MlProjectSuccessPrediction"]] = relationship(
        "MlProjectSuccessPrediction",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Project(code='{self.project_code}', name='{self.name}', status='{self.status}')>"


class ProjectRequirement(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Specific skill prerequisites demanded by a project."""
    __tablename__ = "project_requirements"
    __table_args__ = (
        UniqueConstraint("project_id", "skill_id", name="uq_project_skill_requirement"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    min_proficiency: Mapped[int] = mapped_column(Integer, default=70, nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="High", nullable=False)  # 'High', 'Medium', 'Low'
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="requirements")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="project_requirements")

    def __repr__(self) -> str:
        return f"<ProjectRequirement(project_id={self.project_id}, skill_id={self.skill_id}, min_prof={self.min_proficiency})>"


class ProjectMilestone(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Project delivery timeline milestones."""
    __tablename__ = "project_milestones"

    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50),
        default="Upcoming",
        nullable=False,
    )  # 'Completed', 'Current', 'Upcoming'
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationship
    project: Mapped["Project"] = relationship("Project", back_populates="milestones")

    def __repr__(self) -> str:
        return f"<ProjectMilestone(name='{self.name}', status='{self.status}')>"


class ProjectAllocation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Finalized assignment of an employee to a project."""
    __tablename__ = "project_allocations"
    __table_args__ = (
        UniqueConstraint("project_id", "employee_id", name="uq_project_employee_allocation"),
        Index("ix_project_alloc_emp", "project_id", "employee_id"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., 'Lead Frontend', 'ML Engineer'
    allocation_percent: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    team_fit: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50),
        default="Active",
        nullable=False,
    )  # 'Active', 'Completed', 'Released'
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="allocations")
    employee: Mapped["Employee"] = relationship("Employee", back_populates="project_allocations")

    def __repr__(self) -> str:
        return f"<ProjectAllocation(project_id={self.project_id}, employee_id={self.employee_id}, role='{self.role}')>"
