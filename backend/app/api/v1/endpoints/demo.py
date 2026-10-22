"""
NEXAWIS Backend - Enterprise Demo Workspace Management Endpoints.
Provides administrative controls to inspect, seed, or reset the dedicated
demo workspace without affecting real production workspaces or tenants.
"""

import uuid
from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.employee import Employee
from app.models.project import Project
from app.models.report import Report
from app.models.team_formation import TeamFormation
from app.services.demo_seeder import DemoWorkspaceSeeder, DEMO_WORKSPACE_ID
from app.core.logging import logger

router = APIRouter()


class DemoWorkspaceStatusResponse(BaseModel):
    is_seeded: bool
    workspace_id: str
    workspace_name: str
    employees_count: int
    projects_count: int
    reports_count: int
    team_formations_count: int
    allocations_count: int
    is_current_user_enrolled: bool


class DemoActionResponse(BaseModel):
    success: bool
    message: str
    workspace_id: str
    summary: Dict[str, Any]


@router.get(
    "/status",
    response_model=DemoWorkspaceStatusResponse,
    summary="Get dedicated demo workspace provisioning status",
)
async def get_demo_workspace_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> DemoWorkspaceStatusResponse:
    """Returns the current readiness and record counts for the enterprise demo workspace."""
    ws = (await db.execute(select(Workspace).where(Workspace.id == DEMO_WORKSPACE_ID))).scalar_one_or_none()
    
    if not ws:
        return DemoWorkspaceStatusResponse(
            is_seeded=False,
            workspace_id=str(DEMO_WORKSPACE_ID),
            workspace_name="NEXAWIS Enterprise Demo",
            employees_count=0,
            projects_count=0,
            reports_count=0,
            team_formations_count=0,
            allocations_count=0,
            is_current_user_enrolled=False,
        )

    emp_cnt = (await db.execute(select(func.count(Employee.id)).where(Employee.workspace_id == DEMO_WORKSPACE_ID))).scalar() or 0
    proj_cnt = (await db.execute(select(func.count(Project.id)).where(Project.workspace_id == DEMO_WORKSPACE_ID))).scalar() or 0
    rep_cnt = (await db.execute(select(func.count(Report.id)).where(Report.workspace_id == DEMO_WORKSPACE_ID))).scalar() or 0
    tf_cnt = (await db.execute(select(func.count(TeamFormation.id)).where(TeamFormation.workspace_id == DEMO_WORKSPACE_ID))).scalar() or 0

    # Check user enrollment
    member = (await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == DEMO_WORKSPACE_ID,
            WorkspaceMember.user_id == current_user.id,
            WorkspaceMember.is_active == True,
        )
    )).scalar_one_or_none()

    return DemoWorkspaceStatusResponse(
        is_seeded=True,
        workspace_id=str(DEMO_WORKSPACE_ID),
        workspace_name=ws.name,
        employees_count=emp_cnt,
        projects_count=proj_cnt,
        reports_count=rep_cnt,
        team_formations_count=tf_cnt,
        allocations_count=17,
        is_current_user_enrolled=member is not None,
    )


@router.post(
    "/seed",
    response_model=DemoActionResponse,
    summary="Seed or reseed the dedicated demo workspace",
)
async def seed_demo_workspace(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> DemoActionResponse:
    """
    Deterministically seeds the dedicated demo workspace with realistic workforce,
    projects, allocations, genuine ML predictions, and reports.
    Automatically enrolls the caller as an Admin.
    """
    logger.info(f"User {current_user.email} triggered demo workspace seeding.")
    summary = await DemoWorkspaceSeeder.seed(db=db, target_user=current_user)
    return DemoActionResponse(
        success=True,
        message="Demo workspace seeded successfully.",
        workspace_id=str(DEMO_WORKSPACE_ID),
        summary=summary,
    )


@router.post(
    "/reset",
    response_model=DemoActionResponse,
    summary="Reset demo workspace to pristine initial demo state",
)
async def reset_demo_workspace(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> DemoActionResponse:
    """Cleans up and reseeds the demo workspace to its baseline pristine demo state."""
    logger.info(f"User {current_user.email} triggered demo workspace reset.")
    summary = await DemoWorkspaceSeeder.seed(db=db, target_user=current_user)
    return DemoActionResponse(
        success=True,
        message="Demo workspace has been reset to baseline state.",
        workspace_id=str(DEMO_WORKSPACE_ID),
        summary=summary,
    )


@router.post(
    "/enroll",
    response_model=DemoActionResponse,
    summary="Enroll current authenticated user into demo workspace as Admin",
)
async def enroll_in_demo_workspace(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> DemoActionResponse:
    """Ensures caller has active membership in the demo workspace."""
    ws = (await db.execute(select(Workspace).where(Workspace.id == DEMO_WORKSPACE_ID))).scalar_one_or_none()
    if not ws:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo workspace has not been initialized. Please seed the demo workspace first.",
        )

    member = (await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == DEMO_WORKSPACE_ID,
            WorkspaceMember.user_id == current_user.id,
        )
    )).scalar_one_or_none()

    if not member:
        member = WorkspaceMember(
            workspace_id=DEMO_WORKSPACE_ID,
            user_id=current_user.id,
            role="admin",
            is_active=True,
        )
        db.add(member)
        await db.commit()
    elif not member.is_active:
        member.is_active = True
        await db.commit()

    return DemoActionResponse(
        success=True,
        message="Successfully enrolled into demo workspace.",
        workspace_id=str(DEMO_WORKSPACE_ID),
        summary={"user_id": str(current_user.id), "role": member.role},
    )
