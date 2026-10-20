"""
NEXAWIS Backend - Role-Based Access Control (RBAC) and Permissions Architecture.
Defines system roles, workspace roles, granular permissions, and authorization matrix
derived from the NEXAWIS Product Requirements Document (PRD §3).
"""

from enum import Enum
from typing import Set, List, Union


class SystemRole(str, Enum):
    """System-level roles defining functional capabilities across NEXAWIS."""
    ADMIN = "Admin"                     # System Administrator: org settings, users, audit, integrations
    HR = "HR"                           # HR: employee profiles, skills, availability, workforce analytics
    PROJECT_MANAGER = "Project Manager" # PM: projects, requirements, team formations, allocations
    EMPLOYEE = "Employee"               # Employee: view own profile, assignments, submit feedback
    LEADERSHIP = "Leadership"           # Leadership: org-level analytics, workforce utilization, trends


class WorkspaceRole(str, Enum):
    """Workspace-level membership roles for multi-tenant isolation."""
    OWNER = "owner"     # Workspace owner: full administrative control and billing
    ADMIN = "admin"     # Workspace admin: manage settings, members, and resources
    MEMBER = "member"   # Standard member: interact with assigned projects & formations
    VIEWER = "viewer"   # Read-only stakeholder access


class Permission(str, Enum):
    """Fine-grained permission identifiers."""
    # Workspace & Administration
    WORKSPACE_MANAGE = "workspace:manage"
    USERS_MANAGE = "users:manage"
    USERS_VIEW = "users:view"

    # Employees & Workforce Information
    EMPLOYEES_VIEW = "employees:view"
    EMPLOYEES_MANAGE = "employees:manage"
    EMPLOYEES_WELLBEING_VIEW = "employees:wellbeing_view"  # Sensitive fatigue & burnout data

    # Projects
    PROJECTS_VIEW = "projects:view"
    PROJECTS_MANAGE = "projects:manage"

    # Team Formation
    TEAM_FORMATIONS_VIEW = "team_formations:view"
    TEAM_FORMATIONS_CREATE = "team_formations:create"
    TEAM_FORMATIONS_FINALIZE = "team_formations:finalize"
    TEAM_FORMATIONS_OVERRIDE = "team_formations:override"

    # Analytics & Reports
    ANALYTICS_VIEW = "analytics:view"
    ANALYTICS_ORG_VIEW = "analytics:org_view"
    REPORTS_VIEW = "reports:view"
    REPORTS_MANAGE = "reports:manage"


# Role-to-Permissions Mapping Table (PRD §3)
ROLE_PERMISSIONS: dict[SystemRole, Set[Permission]] = {
    SystemRole.ADMIN: {
        Permission.WORKSPACE_MANAGE,
        Permission.USERS_MANAGE,
        Permission.USERS_VIEW,
        Permission.EMPLOYEES_VIEW,
        Permission.EMPLOYEES_MANAGE,
        Permission.EMPLOYEES_WELLBEING_VIEW,
        Permission.PROJECTS_VIEW,
        Permission.PROJECTS_MANAGE,
        Permission.TEAM_FORMATIONS_VIEW,
        Permission.ANALYTICS_VIEW,
        Permission.ANALYTICS_ORG_VIEW,
        Permission.REPORTS_VIEW,
        Permission.REPORTS_MANAGE,
    },
    SystemRole.HR: {
        Permission.USERS_VIEW,
        Permission.EMPLOYEES_VIEW,
        Permission.EMPLOYEES_MANAGE,
        Permission.EMPLOYEES_WELLBEING_VIEW,
        Permission.PROJECTS_VIEW,
        Permission.ANALYTICS_VIEW,
        Permission.ANALYTICS_ORG_VIEW,
        Permission.REPORTS_VIEW,
        Permission.REPORTS_MANAGE,
    },
    SystemRole.PROJECT_MANAGER: {
        Permission.USERS_VIEW,
        Permission.EMPLOYEES_VIEW,
        Permission.PROJECTS_VIEW,
        Permission.PROJECTS_MANAGE,
        Permission.TEAM_FORMATIONS_VIEW,
        Permission.TEAM_FORMATIONS_CREATE,
        Permission.TEAM_FORMATIONS_FINALIZE,
        Permission.TEAM_FORMATIONS_OVERRIDE,
        Permission.ANALYTICS_VIEW,
        Permission.REPORTS_VIEW,
        Permission.REPORTS_MANAGE,
    },
    SystemRole.EMPLOYEE: {
        Permission.PROJECTS_VIEW,
        Permission.REPORTS_VIEW,
    },
    SystemRole.LEADERSHIP: {
        Permission.USERS_VIEW,
        Permission.PROJECTS_VIEW,
        Permission.ANALYTICS_VIEW,
        Permission.ANALYTICS_ORG_VIEW,
        Permission.REPORTS_VIEW,
    },
}


def has_permission(role: Union[SystemRole, str], permission: Permission) -> bool:
    """Evaluates whether a given system role possesses a specified permission."""
    try:
        if isinstance(role, str):
            role = SystemRole(role)
        return permission in ROLE_PERMISSIONS.get(role, set())
    except ValueError:
        return False
