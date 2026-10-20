"""
NEXAWIS Backend - API v1 Master Router.
Aggregates and organizes all v1 sub-routers.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, employees

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

