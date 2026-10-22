"""
NEXAWIS Backend - API v1 Master Router.
Aggregates and organizes all v1 sub-routers.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    employees,
    projects,
    awis,
    ml,
    team_formation,
    analytics,
    reports,
    demo,
)

api_v1_router = APIRouter()

# Mount health & readiness endpoints (public)
api_v1_router.include_router(
    health.router,
    prefix="",
    tags=["System & Health"],
)

# Mount authentication & authorization endpoints (protected)
api_v1_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication & Profiles"],
)

# Mount employee management endpoints (protected, workspace-scoped)
api_v1_router.include_router(
    employees.router,
    prefix="/employees",
    tags=["Employee Management"],
)

# Mount project management endpoints (protected, workspace-scoped)
api_v1_router.include_router(
    projects.router,
    prefix="/projects",
    tags=["Project Management"],
)

# Mount AWIS scoring & candidate intelligence endpoints (protected, workspace-scoped)
api_v1_router.include_router(
    awis.router,
    prefix="/projects/{project_id}/awis",
    tags=["AWIS Scoring Engine"],
)

# Mount ML inference and model lifecycle endpoints (protected, workspace-scoped)
api_v1_router.include_router(
    ml.router,
    prefix="/ml",
    tags=["Machine Learning Inference"],
)

# Mount Team Formation & Optimization endpoints (protected, workspace-scoped)
api_v1_router.include_router(
    team_formation.router,
    prefix="/teams",
    tags=["Team Optimization Engine"],
)

# Mount Analytics and Business Intelligence endpoints (protected, workspace-scoped)
api_v1_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics & Business Intelligence"],
)

# Mount Reporting & Export endpoints (protected, workspace-scoped)
api_v1_router.include_router(
    reports.router,
    prefix="/reports",
    tags=["Reporting & Export"],
)

# Mount alias for direct project recommendations: /projects/{project_id}/team-recommendation
api_v1_router.include_router(
    team_formation.router,
    prefix="",
    tags=["Team Optimization Engine (Aliases)"],
    include_in_schema=False,
)

# Mount dedicated Demo Workspace management endpoints
api_v1_router.include_router(
    demo.router,
    prefix="/demo",
    tags=["Demo Workspace Management"],
)



