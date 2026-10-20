"""
NEXAWIS Backend - Database Models Package.
Exports all SQLAlchemy 2.x declarative models and metadata for Alembic migrations and application use.
"""

from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, JSON_TYPE
from app.models.workspace import Workspace, WorkspaceMember, WorkspaceSettings
from app.models.user import User, UserPreference
from app.models.skill import Skill, EmployeeSkill
from app.models.employee import (
    Employee,
    EmployeeCertification,
    EmployeeWorkloadHistory,
    EmployeePerformanceHistory,
)
from app.models.project import (
    Project,
    ProjectRequirement,
    ProjectMilestone,
    ProjectAllocation,
)
from app.models.team_formation import TeamFormation, TeamFormationMember
from app.models.ml_results import (
    AwisEvaluation,
    MlBurnoutPrediction,
    MlProjectSuccessPrediction,
)
from app.models.report import Report, ScheduledReport

__all__ = [
    "Base",
    "UUIDPrimaryKeyMixin",
    "TimestampMixin",
    "JSON_TYPE",
    "Workspace",
    "WorkspaceMember",
    "WorkspaceSettings",
    "User",
    "UserPreference",
    "Skill",
    "EmployeeSkill",
    "Employee",
    "EmployeeCertification",
    "EmployeeWorkloadHistory",
    "EmployeePerformanceHistory",
    "Project",
    "ProjectRequirement",
    "ProjectMilestone",
    "ProjectAllocation",
    "TeamFormation",
    "TeamFormationMember",
    "AwisEvaluation",
    "MlBurnoutPrediction",
    "MlProjectSuccessPrediction",
    "Report",
    "ScheduledReport",
]
