"""
NEXAWIS Backend - FastAPI Authentication and Authorization Dependencies.
Enforces cryptographic token verification, automatic profile synchronization,
workspace tenancy isolation, and role-based access control guards.
"""

import uuid
from typing import Optional, List, Union
from dataclasses import dataclass
from fastapi import Depends, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db_session
from app.core.clerk import verify_clerk_token
from app.core.roles import SystemRole, WorkspaceRole, Permission, has_permission
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    WorkspaceAccessDeniedError,
)
from app.core.logging import logger
from app.models import (
    User,
    UserPreference,
    Workspace,
    WorkspaceMember,
    WorkspaceSettings,
)

# Standard HTTP Bearer scheme
bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class WorkspaceContext:
    """Encapsulates the verified tenant and user membership authorization state."""
    user: User
    workspace: Workspace
    membership: WorkspaceMember
    workspace_role: str
    system_role: str

    @property
    def is_workspace_admin_or_owner(self) -> bool:
        return (
            self.workspace_role in (WorkspaceRole.OWNER.value, WorkspaceRole.ADMIN.value)
            or self.system_role == SystemRole.ADMIN.value
        )


async def get_token_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """
    Extracts and cryptographically verifies the incoming Bearer token.
    Rejects missing or invalid credentials with HTTP 401.
    """
    if credentials is None:
        raise AuthenticationError(
            message="Authentication credentials were not provided in the Authorization header.",
            code="UNAUTHORIZED",
        )

    if credentials.scheme.lower() != "bearer":
        raise AuthenticationError(
            message="Invalid authentication scheme. Expected 'Bearer'.",
            code="INVALID_SCHEME",
        )

    return verify_clerk_token(credentials.credentials)


async def get_or_create_user_profile(
    db: AsyncSession,
    clerk_user_id: str,
    email: Optional[str] = None,
    full_name: Optional[str] = None,
    avatar_url: Optional[str] = None,
) -> User:
    """
    Idempotent, concurrency-safe helper that retrieves or creates a persistent
    User record linked to a verified Clerk User ID.
    """
    # 1. Check if user already exists
    result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    user = result.scalar_one_or_none()
    if user:
        if not user.is_active:
            raise AuthenticationError(
                message="User account is deactivated. Please contact support.",
                code="ACCOUNT_DEACTIVATED",
            )
        return user

    # 2. Derive sane defaults for new user
    safe_email = email.strip().lower() if email else f"{clerk_user_id}@nexawis.internal"
    safe_name = full_name.strip() if full_name else "NEXAWIS User"

    # Ensure email uniqueness if another user has the exact same email
    existing_email = await db.execute(select(User).where(User.email == safe_email))
    if existing_email.scalar_one_or_none():
        safe_email = f"{clerk_user_id}_{safe_email}"

    try:
        user = User(
            clerk_user_id=clerk_user_id,
            email=safe_email,
            full_name=safe_name,
            role=SystemRole.PROJECT_MANAGER.value,
            avatar_url=avatar_url,
            is_active=True,
        )

        db.add(user)
        await db.flush()

        # Create default preferences
        pref = UserPreference(
            user_id=user.id,
            theme="dark",
            language="en-US",
            timezone="UTC",
            notification_settings={"projectUpdates": True, "teamFormation": True},
        )
        db.add(pref)

        # Automatically provision initial personal workspace
        ws_slug = f"ws-{str(user.id)[:8]}"
        workspace = Workspace(
            name=f"{user.full_name}'s Workspace",
            slug=ws_slug,
            description="Personal workspace auto-provisioned upon registration.",
        )
        db.add(workspace)
        await db.flush()

        ws_settings = WorkspaceSettings(
            workspace_id=workspace.id,
            default_department="Engineering",
            default_reporting_period="30d",
        )
        db.add(ws_settings)

        membership = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user.id,
            role=WorkspaceRole.OWNER.value,
            is_active=True,
        )
        db.add(membership)
        await db.commit()
        await db.refresh(user)
        logger.info(f"Successfully provisioned new user profile: {user.id} ({clerk_user_id})")
        return user

    except IntegrityError:
        # Concurrent creation race condition: rollback and fetch existing record
        await db.rollback()
        retry_res = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
        retry_user = retry_res.scalar_one_or_none()
        if retry_user:
            return retry_user
        raise


async def get_current_user(
    payload: dict = Depends(get_token_payload),
    db: AsyncSession = Depends(get_db_session),
) -> User:
    """
    FastAPI dependency yielding the authenticated, database-persisted User entity.
    Never trusts client-supplied user parameters; identity is verified from token claims.
    """
    clerk_user_id = payload.get("sub")
    if not clerk_user_id:
        raise AuthenticationError("Token subject identifier is missing.")

    email = payload.get("email") or payload.get("email_address")
    name = (
        payload.get("name")
        or f"{payload.get('first_name', '')} {payload.get('last_name', '')}".strip()
        or None
    )
    avatar_url = payload.get("picture") or payload.get("avatar_url")

    return await get_or_create_user_profile(
        db=db,
        clerk_user_id=clerk_user_id,
        email=email,
        full_name=name,
        avatar_url=avatar_url,
    )


async def get_current_workspace_context(
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> WorkspaceContext:
    """
    Resolves and authorizes the workspace tenant context.
    
    1. If X-Workspace-Id header is supplied, verifies user is an active member.
    2. If omitted, defaults to the user's primary/first active workspace.
    3. Rejects unauthorized access across tenant boundaries with HTTP 403.
    """
    target_ws_id: Optional[uuid.UUID] = None
    if x_workspace_id:
        try:
            target_ws_id = uuid.UUID(x_workspace_id.strip())
        except ValueError:
            raise WorkspaceAccessDeniedError("Invalid X-Workspace-Id header format. Must be a valid UUID.")

    if target_ws_id:
        # Explicit workspace requested: verify active membership
        query = (
            select(WorkspaceMember, Workspace)
            .join(Workspace, WorkspaceMember.workspace_id == Workspace.id)
            .where(
                WorkspaceMember.workspace_id == target_ws_id,
                WorkspaceMember.user_id == current_user.id,
                WorkspaceMember.is_active == True,  # noqa: E712
            )
        )
        res = await db.execute(query)
        row = res.first()
        if not row:
            raise WorkspaceAccessDeniedError(
                f"You do not have active membership in workspace '{target_ws_id}'."
            )
        membership, workspace = row
        return WorkspaceContext(
            user=current_user,
            workspace=workspace,
            membership=membership,
            workspace_role=membership.role,
            system_role=current_user.role,
        )

    # No specific workspace specified: resolve user's primary active workspace
    query = (
        select(WorkspaceMember, Workspace)
        .join(Workspace, WorkspaceMember.workspace_id == Workspace.id)
        .where(
            WorkspaceMember.user_id == current_user.id,
            WorkspaceMember.is_active == True,  # noqa: E712
        )
        .order_by(WorkspaceMember.created_at.asc())
        .limit(1)
    )
    res = await db.execute(query)
    row = res.first()
    if row:
        membership, workspace = row
        return WorkspaceContext(
            user=current_user,
            workspace=workspace,
            membership=membership,
            workspace_role=membership.role,
            system_role=current_user.role,
        )

    # Edge case: user has no active workspaces, auto-provision personal workspace
    ws_slug = f"ws-{str(current_user.id)[:8]}"
    workspace = Workspace(
        name=f"{current_user.full_name}'s Workspace",
        slug=ws_slug,
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
    await db.refresh(membership)

    return WorkspaceContext(
        user=current_user,
        workspace=workspace,
        membership=membership,
        workspace_role=membership.role,
        system_role=current_user.role,
    )


# ------------------------------------------------------------------------------
# Role & Permission Guard Factories
# ------------------------------------------------------------------------------

def require_system_roles(*allowed_roles: Union[SystemRole, str]):
    """
    Dependency guard enforcing that the authenticated user possesses
    one of the allowed system roles.
    """
    valid_roles = {r.value if isinstance(r, SystemRole) else r for r in allowed_roles}

    async def _role_guard(user: User = Depends(get_current_user)) -> User:
        if user.role not in valid_roles:
            raise AuthorizationError(
                f"Action forbidden. Requires one of the following roles: {', '.join(sorted(valid_roles))}."
            )
        return user

    return _role_guard


def require_permissions(*required_permissions: Permission):
    """
    Dependency guard enforcing that the user's role grants all specified permissions.
    """
    async def _permission_guard(user: User = Depends(get_current_user)) -> User:
        missing = [p.value for p in required_permissions if not has_permission(user.role, p)]
        if missing:
            raise AuthorizationError(
                f"Insufficient permissions. Missing required capabilities: {', '.join(missing)}."
            )
        return user

    return _permission_guard


def require_workspace_roles(*allowed_workspace_roles: Union[WorkspaceRole, str]):
    """
    Dependency guard enforcing that the user has a sufficient role within the active workspace.
    System Administrators automatically bypass workspace role constraints.
    """
    valid_roles = {r.value if isinstance(r, WorkspaceRole) else r for r in allowed_workspace_roles}

    async def _ws_role_guard(context: WorkspaceContext = Depends(get_current_workspace_context)) -> WorkspaceContext:
        if context.system_role == SystemRole.ADMIN.value:
            return context  # System administrator bypass

        if context.workspace_role not in valid_roles:
            raise AuthorizationError(
                f"Workspace action forbidden. Requires one of the following workspace roles: {', '.join(sorted(valid_roles))}."
            )
        return context

    return _ws_role_guard
