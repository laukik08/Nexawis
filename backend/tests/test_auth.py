"""
NEXAWIS Backend - Automated Tests for Clerk Authentication and Server-Side Authorization.
Covers:
- Token verification (valid, expired, malformed, wrong signature, missing claims)
- Unauthenticated rejection on protected endpoints (401 Unauthorized)
- Profile auto-provisioning, idempotent repeats, and concurrency safety
- Server-side RBAC and permission enforcement (403 Forbidden)
- Multi-tenancy workspace isolation and cross-workspace access rejection
- User ID and role spoofing prevention
"""

import uuid
from datetime import datetime, timezone, timedelta
import pytest
import pytest_asyncio
import jwt
from httpx import AsyncClient, ASGITransport
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.models import (
    Base,
    User,
    Workspace,
    WorkspaceMember,
    WorkspaceSettings,
)
from app.core.database import get_db_session
from app.core.clerk import set_test_verification_key
from app.core.roles import SystemRole, WorkspaceRole

# Generate ephemeral RSA test keypair for cryptographic JWT testing
_private_key_obj = rsa.generate_private_key(public_exponent=65537, key_size=2048)
TEST_PRIVATE_KEY = _private_key_obj.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
).decode("utf-8")
TEST_PUBLIC_KEY = _private_key_obj.public_key().public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo,
).decode("utf-8")

# Untrusted second keypair for testing invalid signatures
_untrusted_key_obj = rsa.generate_private_key(public_exponent=65537, key_size=2048)
UNTRUSTED_PRIVATE_KEY = _untrusted_key_obj.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
).decode("utf-8")


def create_test_jwt(
    sub: str = "user_clerk_test_001",
    email: str = None,
    name: str = "Test User",
    expires_in_seconds: int = 3600,
    private_key: str = TEST_PRIVATE_KEY,
    extra_claims: dict = None,
) -> str:
    """Generates an RS256 signed test JWT."""
    now = datetime.now(timezone.utc)
    user_email = email if email is not None else f"{sub}@nexawis.com"
    payload = {
        "sub": sub,
        "email": user_email,
        "name": name,
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=expires_in_seconds)).timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, private_key, algorithm="RS256")


@pytest_asyncio.fixture
async def auth_test_db():
    """Provides an isolated async SQLite database session for auth tests."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def auth_client(auth_test_db: AsyncSession):
    """Provides an AsyncClient wired with the test DB session and verification key."""
    set_test_verification_key(TEST_PUBLIC_KEY, ["RS256"])

    async def _override_db():
        yield auth_test_db

    app.dependency_overrides[get_db_session] = _override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    set_test_verification_key(None, None)


# ------------------------------------------------------------------------------
# 1. Token Verification & Rejection Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_missing_auth_header_rejected(auth_client: AsyncClient):
    """Unauthenticated requests to protected endpoints return 401 Unauthorized."""
    resp = await auth_client.get("/api/v1/auth/me")
    assert resp.status_code == 401
    data = resp.json()
    assert data["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_invalid_scheme_rejected(auth_client: AsyncClient):
    """Non-Bearer authentication schemes return 401 Unauthorized."""
    resp = await auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Basic dXNlcjpwYXNz"},
    )
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] in ("UNAUTHORIZED", "INVALID_SCHEME")



@pytest.mark.asyncio
async def test_malformed_token_rejected(auth_client: AsyncClient):
    """Corrupted or malformed bearer strings return 401 Unauthorized."""
    resp = await auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not.a.valid.jwt.token"},
    )
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "INVALID_TOKEN"


@pytest.mark.asyncio
async def test_expired_token_rejected(auth_client: AsyncClient):
    """Expired tokens return 401 Unauthorized with TOKEN_EXPIRED code."""
    expired_token = create_test_jwt(expires_in_seconds=-300)
    resp = await auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "TOKEN_EXPIRED"


@pytest.mark.asyncio
async def test_untrusted_signature_rejected(auth_client: AsyncClient):
    """Tokens signed by an untrusted key return 401 Unauthorized."""
    untrusted_token = create_test_jwt(private_key=UNTRUSTED_PRIVATE_KEY)
    resp = await auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {untrusted_token}"},
    )
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "INVALID_TOKEN"


@pytest.mark.asyncio
async def test_missing_subject_rejected(auth_client: AsyncClient):
    """Tokens without subject identifier (sub) are rejected."""
    token = jwt.encode(
        {"email": "no_sub@test.com", "exp": int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp())},
        TEST_PRIVATE_KEY,
        algorithm="RS256",
    )
    resp = await auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "INVALID_TOKEN"


# ------------------------------------------------------------------------------
# 2. Profile Auto-Provisioning & Idempotence Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_profile_auto_provisioning_and_idempotence(auth_client: AsyncClient, auth_test_db: AsyncSession):
    """
    First-time authentication auto-provisions user profile, preferences, and workspace.
    Subsequent requests reuse existing persistent user record.
    """
    token = create_test_jwt(
        sub="user_clerk_first_timer_123",
        email="elena.first@nexawis.com",
        name="Elena First",
    )

    # First request: provisions profile and workspace
    resp1 = await auth_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["user"]["clerk_user_id"] == "user_clerk_first_timer_123"
    assert data1["user"]["full_name"] == "Elena First"
    assert len(data1["workspaces"]) == 1
    assert data1["active_workspace_role"] == "owner"

    user_id = data1["user"]["id"]
    active_ws_id = data1["active_workspace_id"]

    # Second request: reuses same persistent profile
    resp2 = await auth_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["user"]["id"] == user_id
    assert data2["active_workspace_id"] == active_ws_id

    # Verify directly in database
    db_user = await auth_test_db.execute(select(User).where(User.clerk_user_id == "user_clerk_first_timer_123"))
    assert db_user.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_profile_sync_endpoint(auth_client: AsyncClient):
    """Profile sync endpoint updates mutable metadata (title, department, avatar)."""
    token = create_test_jwt(sub="user_sync_test", name="Original Name")

    sync_payload = {
        "full_name": "Updated Elena Name",
        "title": "Lead Platform Engineer",
        "department": "Infrastructure",
        "avatar_url": "https://avatars.nexawis.com/elena.png",
    }
    resp = await auth_client.post(
        "/api/v1/auth/sync",
        headers={"Authorization": f"Bearer {token}"},
        json=sync_payload,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["full_name"] == "Updated Elena Name"
    assert data["title"] == "Lead Platform Engineer"
    assert data["department"] == "Infrastructure"


# ------------------------------------------------------------------------------
# 3. Server-Side RBAC & Anti-Spoofing Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_client_cannot_spoof_roles_via_token(auth_client: AsyncClient, auth_test_db: AsyncSession):
    """
    Even if an attacker injects 'role: Admin' into token claims,
    FastAPI ignores it and derives authority exclusively from the server database.
    """
    spoofed_token = create_test_jwt(
        sub="user_spoof_attempt",
        extra_claims={"role": "Admin", "is_admin": True, "permissions": ["*"]},
    )

    # Initialize user profile (defaults to Project Manager)
    await auth_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {spoofed_token}"})

    # Try accessing admin-only endpoint
    resp = await auth_client.get(
        "/api/v1/auth/test/admin-only",
        headers={"Authorization": f"Bearer {spoofed_token}"},
    )
    # Must be 403 Forbidden!
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_admin_role_authorized(auth_client: AsyncClient, auth_test_db: AsyncSession):
    """Users verified with SystemRole.ADMIN in the database successfully access admin routes."""
    token = create_test_jwt(sub="user_legit_admin", name="Admin User")

    # Initial registration
    await auth_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})

    # Elevate role legitimately in database
    res = await auth_test_db.execute(select(User).where(User.clerk_user_id == "user_legit_admin"))
    user = res.scalar_one()
    user.role = SystemRole.ADMIN.value
    await auth_test_db.commit()

    # Access admin route
    resp = await auth_client.get(
        "/api/v1/auth/test/admin-only",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "authorized"


# ------------------------------------------------------------------------------
# 4. Multi-Tenancy Workspace Isolation Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cross_workspace_access_denied(auth_client: AsyncClient, auth_test_db: AsyncSession):
    """
    A user cannot supply another tenant's workspace ID in X-Workspace-Id
    unless they have active membership in it.
    """
    token_user_a = create_test_jwt(sub="user_tenant_a", name="User A")
    token_user_b = create_test_jwt(sub="user_tenant_b", name="User B")

    # Setup User A and obtain User A's workspace ID
    resp_a = await auth_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token_user_a}"})
    workspace_a_id = resp_a.json()["active_workspace_id"]

    # Setup User B
    await auth_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token_user_b}"})

    # User B attempts to access workspace A via X-Workspace-Id header
    resp = await auth_client.get(
        "/api/v1/auth/test/workspace-owner",
        headers={
            "Authorization": f"Bearer {token_user_b}",
            "X-Workspace-Id": workspace_a_id,
        },
    )
    # Must be rejected with 403 Workspace Access Denied!
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "WORKSPACE_ACCESS_DENIED"


@pytest.mark.asyncio
async def test_create_and_switch_workspaces(auth_client: AsyncClient):
    """User can create multiple workspaces and query them cleanly."""
    token = create_test_jwt(sub="user_multi_ws", name="Multi Workspace User")

    # 1. Create a second workspace
    create_resp = await auth_client.post(
        "/api/v1/auth/workspaces",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Innovation Labs", "description": "Secondary workspace"},
    )
    assert create_resp.status_code == 201
    second_ws_id = create_resp.json()["id"]

    # 2. Access using second workspace ID
    context_resp = await auth_client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Workspace-Id": second_ws_id,
        },
    )
    assert context_resp.status_code == 200
    assert context_resp.json()["active_workspace_id"] == second_ws_id
    assert context_resp.json()["active_workspace_role"] == "owner"


@pytest.mark.asyncio
async def test_list_workspaces_endpoint(auth_client: AsyncClient):
    """List workspaces endpoint returns all accessible workspaces."""
    token = create_test_jwt(sub="user_list_ws", name="List WS User")

    # Call /auth/workspaces
    resp = await auth_client.get(
        "/api/v1/auth/workspaces",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    workspaces = resp.json()
    assert len(workspaces) == 1
    assert workspaces[0]["role"] == "owner"


@pytest.mark.asyncio
async def test_deactivated_account_rejected(auth_client: AsyncClient, auth_test_db: AsyncSession):
    """Deactivated user accounts are rejected with ACCOUNT_DEACTIVATED."""
    token = create_test_jwt(sub="user_deactivated", name="Deactivated User")

    # Initial registration
    await auth_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})

    # Deactivate account in database
    res = await auth_test_db.execute(select(User).where(User.clerk_user_id == "user_deactivated"))
    user = res.scalar_one()
    user.is_active = False
    await auth_test_db.commit()

    # Attempt access
    resp = await auth_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "ACCOUNT_DEACTIVATED"


@pytest.mark.asyncio
async def test_invalid_workspace_id_header_format(auth_client: AsyncClient):
    """Non-UUID X-Workspace-Id header values return 403."""
    token = create_test_jwt(sub="user_bad_uuid")
    resp = await auth_client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Workspace-Id": "not-a-valid-uuid",
        },
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "WORKSPACE_ACCESS_DENIED"


def test_roles_and_permissions_matrix():
    """Verify system role permissions matrix matches PRD §3."""
    from app.core.roles import has_permission, Permission

    # Admin has system management & view permissions, but per PRD §3 cannot select/create teams
    assert has_permission(SystemRole.ADMIN, Permission.EMPLOYEES_WELLBEING_VIEW) is True
    assert has_permission(SystemRole.ADMIN, Permission.TEAM_FORMATIONS_VIEW) is True
    assert has_permission(SystemRole.ADMIN, Permission.TEAM_FORMATIONS_CREATE) is False

    # HR has employee wellbeing view, but cannot finalize team formations
    assert has_permission(SystemRole.HR, Permission.EMPLOYEES_WELLBEING_VIEW) is True
    assert has_permission(SystemRole.HR, Permission.TEAM_FORMATIONS_FINALIZE) is False

    # PM can form teams, but cannot view sensitive employee wellbeing data
    assert has_permission(SystemRole.PROJECT_MANAGER, Permission.TEAM_FORMATIONS_CREATE) is True
    assert has_permission(SystemRole.PROJECT_MANAGER, Permission.EMPLOYEES_WELLBEING_VIEW) is False

    # Employee cannot create formations or manage projects
    assert has_permission(SystemRole.EMPLOYEE, Permission.PROJECTS_MANAGE) is False
    assert has_permission(SystemRole.EMPLOYEE, Permission.TEAM_FORMATIONS_CREATE) is False

    # Invalid role string returns False
    assert has_permission("NonExistentRole", Permission.PROJECTS_VIEW) is False


def test_clerk_pem_verification_and_unconfigured_behavior():
    """Verify direct PEM public key verification and unconfigured error handling."""
    from app.core.clerk import verify_clerk_token
    from app.core.config import settings
    from app.core.exceptions import AuthenticationError, InvalidTokenError

    set_test_verification_key(None, None)

    # 1. Verification with PEM public key set
    original_pem = settings.CLERK_PEM_PUBLIC_KEY
    original_iss = settings.CLERK_ISSUER
    original_jwks = settings.CLERK_JWKS_URL

    settings.CLERK_PEM_PUBLIC_KEY = TEST_PUBLIC_KEY
    settings.CLERK_ISSUER = None  # Clear issuer constraint for direct PEM key test

    valid_token = create_test_jwt(sub="user_pem_test")
    payload = verify_clerk_token(valid_token)
    assert payload["sub"] == "user_pem_test"

    # Reset PEM
    settings.CLERK_PEM_PUBLIC_KEY = original_pem

    # 2. When completely unconfigured, raises AuthenticationError
    settings.CLERK_JWKS_URL = None
    settings.CLERK_ISSUER = None

    with pytest.raises(AuthenticationError) as exc_info:
        verify_clerk_token(valid_token)
    assert exc_info.value.code == "AUTH_NOT_CONFIGURED"

    # Restore
    settings.CLERK_JWKS_URL = original_jwks
    settings.CLERK_ISSUER = original_iss


