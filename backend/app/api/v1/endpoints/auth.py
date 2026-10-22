"""
NEXAWIS Backend - Authentication and User Profile API Endpoints.
Provides profile synchronization, workspace discovery, and verification routes
backed by server-side cryptographic Clerk token validation.
"""

import uuid
import re
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db_session
from app.core.roles import SystemRole, WorkspaceRole, ROLE_PERMISSIONS
from app.core.exceptions import AppException
from app.api.deps import (
    get_current_user,
    get_current_workspace_context,
    require_system_roles,
    require_workspace_roles,
    WorkspaceContext,
    DEMO_WORKSPACE_ID,
)
from app.models import User, Workspace, WorkspaceMember, WorkspaceSettings
from app.schemas.auth import (
    UserProfileResponse,
    WorkspaceBriefResponse,
    ProfileSyncRequest,
    CreateWorkspaceRequest,
    AuthMeResponse,
)

router = APIRouter()


async def _ensure_demo_membership(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Ensures user has active membership in the enterprise demo workspace."""
    try:
        demo_ws = (await db.execute(select(Workspace).where(Workspace.id == DEMO_WORKSPACE_ID))).scalar_one_or_none()
        if demo_ws:
            mem = (await db.execute(
                select(WorkspaceMember).where(
                    WorkspaceMember.workspace_id == DEMO_WORKSPACE_ID,
                    WorkspaceMember.user_id == user_id,
                )
            )).scalar_one_or_none()
            if not mem:
                mem = WorkspaceMember(
                    workspace_id=DEMO_WORKSPACE_ID,
                    user_id=user_id,
                    role=WorkspaceRole.ADMIN.value,
                    is_active=True,
                )
                db.add(mem)
                await db.commit()
            elif not mem.is_active:
                mem.is_active = True
                await db.commit()
    except Exception:
        await db.rollback()


@router.get(
    "/me",
    response_model=AuthMeResponse,
    summary="Get current authenticated user profile and active workspace context",
)
async def get_my_profile(
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
) -> AuthMeResponse:
    """
    Returns the verified user profile, authorized permissions, and accessible workspaces.
    Never trusts client identity claims; derived from verified bearer token.
    """
    user = context.user
    await _ensure_demo_membership(db, user.id)

    # Fetch all workspaces the user has active membership in
    query = (
        select(WorkspaceMember, Workspace)
        .join(Workspace, WorkspaceMember.workspace_id == Workspace.id)
        .where(
            WorkspaceMember.user_id == user.id,
            WorkspaceMember.is_active == True,  # noqa: E712
        )
        .order_by(Workspace.name.asc())
    )
    res = await db.execute(query)

    workspaces_data = []
    for member, ws in res.all():
        workspaces_data.append(
            WorkspaceBriefResponse(
                id=ws.id,
                name=ws.name,
                slug=ws.slug,
                role=member.role,
                is_active=member.is_active,
            )
        )

    # Derive permissions based on current user's system role
    try:
        sys_role = SystemRole(user.role)
        permissions = [p.value for p in ROLE_PERMISSIONS.get(sys_role, set())]
    except ValueError:
        permissions = []

    return AuthMeResponse(
        user=UserProfileResponse.model_validate(user),
        workspaces=workspaces_data,
        active_workspace_id=context.workspace.id,
        active_workspace_role=context.workspace_role,
        permissions=sorted(permissions),
    )


@router.post(
    "/sync",
    response_model=UserProfileResponse,
    summary="Synchronize verified user profile details from Clerk",
)
async def sync_user_profile(
    payload: ProfileSyncRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> UserProfileResponse:
    """
    Safely updates mutable user profile metadata from Clerk frontend hooks
    (e.g., name, avatar, title, department).
    """
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url.strip()
    if payload.title is not None:
        current_user.title = payload.title.strip()
    if payload.department is not None:
        current_user.department = payload.department.strip()
    if payload.email is not None and not current_user.email.endswith(".internal"):
        current_user.email = payload.email.strip().lower()

    await db.commit()
    await db.refresh(current_user)
    return UserProfileResponse.model_validate(current_user)


@router.get(
    "/workspaces",
    response_model=List[WorkspaceBriefResponse],
    summary="List all workspaces accessible to current user",
)
async def list_my_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> List[WorkspaceBriefResponse]:
    """Retrieves all workspaces where the user has active membership."""
    await _ensure_demo_membership(db, current_user.id)
    query = (
        select(WorkspaceMember, Workspace)
        .join(Workspace, WorkspaceMember.workspace_id == Workspace.id)
        .where(
            WorkspaceMember.user_id == current_user.id,
            WorkspaceMember.is_active == True,  # noqa: E712
        )

        .order_by(Workspace.name.asc())
    )
    res = await db.execute(query)
    workspaces = []
    for member, ws in res.all():
        workspaces.append(
            WorkspaceBriefResponse(
                id=ws.id,
                name=ws.name,
                slug=ws.slug,
                role=member.role,
                is_active=member.is_active,
            )
        )
    return workspaces


@router.post(
    "/workspaces",
    response_model=WorkspaceBriefResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new workspace partition with current user as owner",
)
async def create_workspace(
    payload: CreateWorkspaceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> WorkspaceBriefResponse:
    """Provisions a new workspace tenant partition and binds current user as owner."""
    slug = payload.slug
    if not slug:
        clean_name = re.sub(r"[^a-zA-Z0-9]+", "-", payload.name.lower()).strip("-")
        slug = f"{clean_name}-{uuid.uuid4().hex[:6]}"

    # Check for slug conflict
    existing = await db.execute(select(Workspace).where(Workspace.slug == slug))
    if existing.scalar_one_or_none():
        slug = f"{slug}-{uuid.uuid4().hex[:4]}"

    workspace = Workspace(
        name=payload.name.strip(),
        slug=slug,
        description=payload.description,
    )
    db.add(workspace)
    await db.flush()

    ws_settings = WorkspaceSettings(workspace_id=workspace.id)
    db.add(ws_settings)

    membership = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role=WorkspaceRole.OWNER.value,
        is_active=True,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(workspace)

    return WorkspaceBriefResponse(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        role=WorkspaceRole.OWNER.value,
        is_active=True,
    )


# ------------------------------------------------------------------------------
# Demonstration & Integration Verification Protected Endpoints
# ------------------------------------------------------------------------------

@router.get(
    "/test/protected",
    summary="Verify generic token authentication",
)
async def test_protected_route(
    current_user: User = Depends(get_current_user),
):
    """Accessible by any verified authenticated user."""
    return {
        "status": "authenticated",
        "user_id": str(current_user.id),
        "clerk_user_id": current_user.clerk_user_id,
        "email": current_user.email,
        "role": current_user.role,
    }


@router.get(
    "/test/admin-only",
    summary="Verify SystemRole.ADMIN guard",
)
async def test_admin_only_route(
    current_user: User = Depends(require_system_roles(SystemRole.ADMIN)),
):
    """Strictly restricted to users with Admin system role."""
    return {
        "status": "authorized",
        "message": "Welcome, Administrator.",
        "user_id": str(current_user.id),
    }


@router.get(
    "/test/workspace-owner",
    summary="Verify WorkspaceRole.OWNER tenancy guard",
)
async def test_workspace_owner_route(
    context: WorkspaceContext = Depends(require_workspace_roles(WorkspaceRole.OWNER)),
):
    """Strictly restricted to owners of the active workspace."""
    return {
        "status": "authorized",
        "workspace_id": str(context.workspace.id),
        "workspace_name": context.workspace.name,
        "workspace_role": context.workspace_role,
    }
