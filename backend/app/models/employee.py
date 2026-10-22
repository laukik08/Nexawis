"""
NEXAWIS Backend - Employee, Qualifications, and Workforce History Models.
Provides comprehensive tracking of skills, performance trends, workload, and wellbeing metrics.
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
    from app.models.skill import EmployeeSkill
    from app.models.project import ProjectAllocation
    from app.models.team_formation import TeamFormationMember
    from app.models.ml_results import AwisEvaluation, MlBurnoutPrediction


class Employee(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Core employee entity representing workforce profile, operational capacity,
    and inputs for AI intelligence modeling.
    """
    __tablename__ = "employees"
    __table_args__ = (
        UniqueConstraint("workspace_id", "employee_code", name="uq_workspace_employee_code"),
        UniqueConstraint("workspace_id", "email", name="uq_workspace_employee_email"),
        Index("ix_employees_workspace_dept", "workspace_id", "department"),
        Index("ix_employees_status", "workspace_id", "employment_status"),
        Index("ix_employees_wellbeing", "workspace_id", "wellbeing_risk"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    employee_code: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., 'NXW-1042'
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    designation: Mapped[str] = mapped_column(String(100), nullable=False)
    experience_years: Mapped[Optional[float]] = mapped_column(Float, default=None, nullable=True)
    
    # Employment Status and Details
    employment_status: Mapped[str] = mapped_column(
        String(50),
        default="Available",
        nullable=False,
    )  # 'Available', 'Allocated', 'On Leave', 'Overloaded'
    employment_type: Mapped[str] = mapped_column(
        String(50),
        default="Full-time",
        nullable=False,
    )  # 'Full-time', 'Contract', 'Part-time'
    work_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    wfh_setup_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    company_type: Mapped[str] = mapped_column(String(50), default="Service", nullable=False)
    joining_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    reporting_manager_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Operational & Intelligence Baseline Metrics
    performance_score: Mapped[float] = mapped_column(Float, default=80.0, nullable=False)
    performance_trend: Mapped[str] = mapped_column(String(20), default="stable", nullable=False)
    availability_score: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    current_workload_percent: Mapped[Optional[float]] = mapped_column(Float, default=None, nullable=True)
    growth_potential: Mapped[float] = mapped_column(Float, default=70.0, nullable=False)
    collaboration_score: Mapped[float] = mapped_column(Float, default=80.0, nullable=False)
    task_completion_rate: Mapped[float] = mapped_column(Float, default=90.0, nullable=False)

    # Sensitive Wellbeing Metrics (Access restricted by role)
    mental_fatigue_score: Mapped[Optional[float]] = mapped_column(Float, default=None, nullable=True)
    wellbeing_risk: Mapped[str] = mapped_column(String(20), default="Low", nullable=False)

    # Qualitative explainability insights cache
    awis_insights: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="employees")
    user: Mapped[Optional["User"]] = relationship("User", back_populates="employee_profile")
    skills: Mapped[List["EmployeeSkill"]] = relationship(
        "EmployeeSkill",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    certifications: Mapped[List["EmployeeCertification"]] = relationship(
        "EmployeeCertification",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    workload_history: Mapped[List["EmployeeWorkloadHistory"]] = relationship(
        "EmployeeWorkloadHistory",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    performance_history: Mapped[List["EmployeePerformanceHistory"]] = relationship(
        "EmployeePerformanceHistory",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    project_allocations: Mapped[List["ProjectAllocation"]] = relationship(
        "ProjectAllocation",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    formation_memberships: Mapped[List["TeamFormationMember"]] = relationship(
        "TeamFormationMember",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    awis_evaluations: Mapped[List["AwisEvaluation"]] = relationship(
        "AwisEvaluation",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    burnout_predictions: Mapped[List["MlBurnoutPrediction"]] = relationship(
        "MlBurnoutPrediction",
        back_populates="employee",
        cascade="all, delete-orphan",
    )

    # Self-referential reporting hierarchy
    direct_reports: Mapped[List["Employee"]] = relationship(
        "Employee",
        back_populates="reporting_manager",
        foreign_keys=[reporting_manager_id],
    )
    reporting_manager: Mapped[Optional["Employee"]] = relationship(
        "Employee",
        back_populates="direct_reports",
        remote_side="Employee.id",
        foreign_keys=[reporting_manager_id],
    )

    def __repr__(self) -> str:
        return f"<Employee(code='{self.employee_code}', name='{self.full_name}', dept='{self.department}')>"


class EmployeeCertification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Industry and technical certifications earned by employees."""
    __tablename__ = "employee_certifications"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    issuer: Mapped[str] = mapped_column(String(200), nullable=False)
    issue_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    credential_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationship
    employee: Mapped["Employee"] = relationship("Employee", back_populates="certifications")

    def __repr__(self) -> str:
        return f"<EmployeeCertification(name='{self.name}', issuer='{self.issuer}')>"


class EmployeeWorkloadHistory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Time-series records of hours, overtime, fatigue, and utilization."""
    __tablename__ = "employee_workload_history"
    __table_args__ = (
        UniqueConstraint("employee_id", "recorded_date", name="uq_employee_workload_date"),
        Index("ix_workload_history_date", "employee_id", "recorded_date"),
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    recorded_date: Mapped[date] = mapped_column(Date, nullable=False)
    weekly_work_hours: Mapped[float] = mapped_column(Float, default=40.0, nullable=False)
    overtime_hours: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    utilization_percentage: Mapped[float] = mapped_column(Float, default=80.0, nullable=False)
    consecutive_working_days: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    active_project_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    mental_fatigue_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationship
    employee: Mapped["Employee"] = relationship("Employee", back_populates="workload_history")

    def __repr__(self) -> str:
        return f"<EmployeeWorkloadHistory(employee_id={self.employee_id}, date={self.recorded_date}, util={self.utilization_percentage}%)>"


class EmployeePerformanceHistory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Historical performance evaluation logs by period (monthly/quarterly)."""
    __tablename__ = "employee_performance_history"
    __table_args__ = (
        UniqueConstraint("employee_id", "period_label", name="uq_employee_perf_period"),
        Index("ix_perf_history_period", "employee_id", "period_label"),
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    period_label: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., 'Jan 2026', 'Q1 2026'
    performance_score: Mapped[float] = mapped_column(Float, nullable=False)
    task_completion_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    deadline_adherence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationship
    employee: Mapped["Employee"] = relationship("Employee", back_populates="performance_history")

    def __repr__(self) -> str:
        return f"<EmployeePerformanceHistory(employee_id={self.employee_id}, period='{self.period_label}', score={self.performance_score})>"
