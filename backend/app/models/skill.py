"""
NEXAWIS Backend - Skill and Employee-Skill Association Models.
Normalized entity representation avoiding repeated skill strings across the system.
"""

import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, Float, Boolean, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.workspace import Workspace
    from app.models.employee import Employee
    from app.models.project import ProjectRequirement


class Skill(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Normalized repository of organizational technical and domain skills."""
    __tablename__ = "skills"
    __table_args__ = (
        UniqueConstraint("workspace_id", "name", name="uq_workspace_skill_name"),
        Index("ix_skills_workspace_name", "workspace_id", "name"),
        Index("ix_skills_category", "workspace_id", "category"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="skills")
    employee_skills: Mapped[List["EmployeeSkill"]] = relationship(
        "EmployeeSkill",
        back_populates="skill",
        cascade="all, delete-orphan",
    )
    project_requirements: Mapped[List["ProjectRequirement"]] = relationship(
        "ProjectRequirement",
        back_populates="skill",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Skill(id={self.id}, name='{self.name}', category='{self.category}')>"


class EmployeeSkill(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Relational mapping linking an employee to a skill with proficiency and primary designation."""
    __tablename__ = "employee_skills"
    __table_args__ = (
        UniqueConstraint("employee_id", "skill_id", name="uq_employee_skill"),
        Index("ix_emp_skill_prof", "employee_id", "proficiency"),
    )

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    proficiency: Mapped[int] = mapped_column(
        Integer,
        default=70,
        nullable=False,
    )  # 0 to 100 percentage proficiency scale
    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    years_experience: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    employee: Mapped["Employee"] = relationship("Employee", back_populates="skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="employee_skills")

    def __repr__(self) -> str:
        return f"<EmployeeSkill(employee_id={self.employee_id}, skill_id={self.skill_id}, proficiency={self.proficiency})>"
