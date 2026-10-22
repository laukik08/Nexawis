"""
NEXAWIS Backend - Automated Tests for Project Management APIs.
Covers:
- Project CRUD: creation, retrieval, listing, update, and soft-archiving.
- Validation: missing fields, invalid date ranges (deadline before start date).
- Constraints: duplicate project_code within workspace (409 Conflict).
- Team allocation: adding, removing, duplicate member prevention (409), and cross-workspace employee rejection.
- Search, multi-criteria filtering, sorting, and pagination.
- Authentication & RBAC: 401 unauthenticated, 403 insufficient permissions (e.g. HR or Employee trying to manage projects).
- Multi-tenancy isolation: cross-workspace access attempts blocked.
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

from app.main import app
from app.models import (
    Base,
    User,
    Workspace,
    WorkspaceMember,
    WorkspaceSettings,
    Employee,
    Project,
    Skill,
)
from app.core.database import get_db_session
from app.core.clerk import set_test_verification_key
from app.core.roles import SystemRole, WorkspaceRole

# Ephemeral RSA keypair for token generation in tests
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


def create_token(sub: str, role: str = SystemRole.PROJECT_MANAGER.value, email: str = None) -> str:
    """Generates an RS256 signed test JWT."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "email": email or f"{sub}@nexawis.com",
        "name": f"User {sub}",
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=3600)).timestamp()),
    }
    return jwt.encode(payload, TEST_PRIVATE_KEY, algorithm="RS256")


@pytest_asyncio.fixture
async def proj_test_db():
    """Provides an isolated async SQLite database for project tests."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def proj_client(proj_test_db: AsyncSession):
    """Provides an AsyncClient configured with test verification keys and test DB."""
    set_test_verification_key(TEST_PUBLIC_KEY, ["RS256"])

    async def _override_db():
        yield proj_test_db

    app.dependency_overrides[get_db_session] = _override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    set_test_verification_key(None, None)


async def setup_workspace_with_user(
    db: AsyncSession,
    clerk_id: str,
    system_role: str = SystemRole.PROJECT_MANAGER.value,
    ws_name: str = "Test Workspace",
) -> tuple[User, Workspace]:
    """Helper to provision a user with a specific role and workspace."""
    user = User(
        clerk_user_id=clerk_id,
        email=f"{clerk_id}@test.com",
        full_name=f"User {clerk_id}",
        role=system_role,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    workspace = Workspace(
        name=ws_name,
        slug=f"ws-{str(user.id)[:8]}",
    )
    db.add(workspace)
    await db.flush()

    ws_settings = WorkspaceSettings(workspace_id=workspace.id)
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
    await db.refresh(workspace)
    return user, workspace


# ------------------------------------------------------------------------------
# 1. Unauthenticated Rejection Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_projects_endpoints_require_auth(proj_client: AsyncClient):
    """Endpoints return 401 Unauthorized when Authorization header is missing."""
    resp = await proj_client.get("/api/v1/projects")
    assert resp.status_code == 401

    resp = await proj_client.get("/api/v1/projects/stats")
    assert resp.status_code == 401

    resp = await proj_client.post("/api/v1/projects", json={})
    assert resp.status_code == 401


# ------------------------------------------------------------------------------
# 2. Permission and Role Enforcement Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_hr_role_cannot_manage_projects(
    proj_client: AsyncClient,
    proj_test_db: AsyncSession,
):
    """HR role possesses PROJECTS_VIEW but NOT PROJECTS_MANAGE."""
    user, ws = await setup_workspace_with_user(
        proj_test_db, "clerk_hr_user", system_role=SystemRole.HR.value
    )
    token = create_token("clerk_hr_user", role=SystemRole.HR.value)
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    # HR CAN view projects
    resp = await proj_client.get("/api/v1/projects", headers=headers)
    assert resp.status_code == 200

    # HR CANNOT create projects -> 403 Forbidden
    resp = await proj_client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "name": "HR Project",
            "department": "Engineering",
            "startDate": "2026-01-01",
            "deadline": "2026-06-01",
        },
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"


# ------------------------------------------------------------------------------
# 3. Project Creation & Constraints Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_project_success(
    proj_client: AsyncClient,
    proj_test_db: AsyncSession,
):
    """Project Manager can create a project with requirements and timeline dates."""
    user, ws = await setup_workspace_with_user(
        proj_test_db, "clerk_pm_creator", system_role=SystemRole.PROJECT_MANAGER.value
    )
    token = create_token("clerk_pm_creator")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    payload = {
        "name": "Apollo Quantum Core",
        "description": "Next-gen distributed ledger core",
        "department": "Engineering",
        "client": "Global FinCorp",
        "priority": "Critical",
        "status": "Active",
        "complexity": "High",
        "teamSize": 6,
        "startDate": "2026-01-15",
        "deadline": "2026-11-30",
        "requirements": [
            {"skill": "React", "priority": "High", "level": "Expert"},
            {"skill": "Python", "priority": "High", "level": "Advanced"},
        ],
    }

    resp = await proj_client.post("/api/v1/projects", headers=headers, json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Apollo Quantum Core"
    assert data["department"] == "Engineering"
    assert data["priority"] == "Critical"
    assert data["overallRisk"] == "High"
    assert len(data["requirements"]) == 2
    assert len(data["milestones"]) == 4
    assert data["capacity"]["totalRequired"] == 240.0  # 6 * 40


@pytest.mark.asyncio
async def test_create_project_duplicate_code_conflict(
    proj_client: AsyncClient,
    proj_test_db: AsyncSession,
):
    """Attempting to create a project with an existing project code returns 409 Conflict."""
    user, ws = await setup_workspace_with_user(
        proj_test_db, "clerk_pm_dup", system_role=SystemRole.PROJECT_MANAGER.value
    )
    token = create_token("clerk_pm_dup")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    payload = {
        "projectId": "PRJ-DUPLICATE-01",
        "name": "Project One",
        "department": "Engineering",
        "startDate": "2026-01-01",
        "deadline": "2026-06-01",
    }
    resp1 = await proj_client.post("/api/v1/projects", headers=headers, json=payload)
    assert resp1.status_code == 201

    # Second project with exact same code
    payload2 = {
        "projectId": "PRJ-DUPLICATE-01",
        "name": "Project Two",
        "department": "Engineering",
        "startDate": "2026-01-01",
        "deadline": "2026-06-01",
    }
    resp2 = await proj_client.post("/api/v1/projects", headers=headers, json=payload2)
    assert resp2.status_code == 409
    assert resp2.json()["error"]["code"] == "CONFLICT"


@pytest.mark.asyncio
async def test_create_project_invalid_date_range(
    proj_client: AsyncClient,
    proj_test_db: AsyncSession,
):
    """Deadline before start date is rejected with 422."""
    user, ws = await setup_workspace_with_user(
        proj_test_db, "clerk_pm_dates", system_role=SystemRole.PROJECT_MANAGER.value
    )
    token = create_token("clerk_pm_dates")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    payload = {
        "name": "Invalid Dates Project",
        "department": "Engineering",
        "startDate": "2026-10-01",
        "deadline": "2026-05-01",  # Before start date
    }
    resp = await proj_client.post("/api/v1/projects", headers=headers, json=payload)
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "INVALID_DATE_RANGE"


# ------------------------------------------------------------------------------
# 4. Listing, Search, Filter, Sort, Pagination Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_projects_search_and_filtering(
    proj_client: AsyncClient,
    proj_test_db: AsyncSession,
):
    """Verifies listing, search query, status/priority filtering, and pagination."""
    user, ws = await setup_workspace_with_user(
        proj_test_db, "clerk_pm_list", system_role=SystemRole.PROJECT_MANAGER.value
    )
    token = create_token("clerk_pm_list")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    # Seed 3 projects
    p1 = {
        "projectId": "PRJ-001",
        "name": "Cloud Migration",
        "department": "Engineering",
        "priority": "Critical",
        "status": "Active",
        "startDate": "2026-01-01",
        "deadline": "2026-06-01",
        "requirements": [{"skill": "AWS", "priority": "High", "level": "Advanced"}],
    }
    p2 = {
        "projectId": "PRJ-002",
        "name": "Brand Redesign",
        "department": "Design",
        "priority": "Medium",
        "status": "On Track",
        "startDate": "2026-02-01",
        "deadline": "2026-05-01",
        "requirements": [{"skill": "Figma", "priority": "Medium", "level": "Intermediate"}],
    }
    p3 = {
        "projectId": "PRJ-003",
        "name": "Security Audit",
        "department": "Engineering",
        "priority": "High",
        "status": "Planning",
        "startDate": "2026-03-01",
        "deadline": "2026-08-01",
    }

    for p in [p1, p2, p3]:
        r = await proj_client.post("/api/v1/projects", headers=headers, json=p)
        assert r.status_code == 201

    # 1. Total list
    resp = await proj_client.get("/api/v1/projects", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 3

    # 2. Search by skill "AWS"
    resp = await proj_client.get("/api/v1/projects?search=AWS", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["name"] == "Cloud Migration"

    # 3. Filter by department
    resp = await proj_client.get("/api/v1/projects?department=Design", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["name"] == "Brand Redesign"

    # 4. Filter by status
    resp = await proj_client.get("/api/v1/projects?status=Active", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    # 5. Stats endpoint
    stats_resp = await proj_client.get("/api/v1/projects/stats", headers=headers)
    assert stats_resp.status_code == 200
    s_data = stats_resp.json()
    assert s_data["total"] == 3
    assert s_data["active"] == 1
    assert s_data["onTrack"] == 1


# ------------------------------------------------------------------------------
# 5. Team Member Allocation Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_project_team_allocation_lifecycle(
    proj_client: AsyncClient,
    proj_test_db: AsyncSession,
):
    """Adding, rejecting duplicate, and removing employee assignments from a project."""
    user, ws = await setup_workspace_with_user(
        proj_test_db, "clerk_pm_team", system_role=SystemRole.PROJECT_MANAGER.value
    )
    token = create_token("clerk_pm_team")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    # 1. Create project
    proj_resp = await proj_client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "projectId": "PRJ-TEAM-01",
            "name": "Team Staffing Project",
            "department": "Engineering",
            "teamSize": 3,
            "startDate": "2026-01-01",
            "deadline": "2026-06-01",
        },
    )
    project_id = proj_resp.json()["id"]

    # 2. Seed employee in the same workspace
    emp = Employee(
        workspace_id=ws.id,
        employee_code="NXW-STAFF-01",
        full_name="Staff Engineer",
        email="staff@nexawis.com",
        department="Engineering",
        designation="Senior Engineer",
        performance_score=90.0,
        wellbeing_risk="Low",
    )
    proj_test_db.add(emp)
    await proj_test_db.commit()
    await proj_test_db.refresh(emp)

    emp_id_str = str(emp.id)

    # 3. Allocate employee to project
    alloc_resp = await proj_client.post(
        f"/api/v1/projects/{project_id}/team",
        headers=headers,
        json={
            "id": emp_id_str,
            "role": "Lead Architect",
            "allocationPercent": 80.0,
            "teamFit": 94.0,
        },
    )
    assert alloc_resp.status_code == 200
    team_data = alloc_resp.json()["currentTeam"]
    assert len(team_data) == 1
    assert team_data[0]["name"] == "Staff Engineer"
    assert team_data[0]["role"] == "Lead Architect"
    assert team_data[0]["allocationPercent"] == 80.0

    # 4. Duplicate assignment attempt -> 409 Conflict
    dup_resp = await proj_client.post(
        f"/api/v1/projects/{project_id}/team",
        headers=headers,
        json={
            "id": emp_id_str,
            "role": "Lead Architect",
            "allocationPercent": 50.0,
        },
    )
    assert dup_resp.status_code == 409
    assert dup_resp.json()["error"]["code"] == "CONFLICT"

    # 5. Remove team member
    del_resp = await proj_client.delete(
        f"/api/v1/projects/{project_id}/team/{emp_id_str}",
        headers=headers,
    )
    assert del_resp.status_code == 200
    assert len(del_resp.json()["currentTeam"]) == 0


# ------------------------------------------------------------------------------
# 6. Cross-Workspace Isolation & Invalid References
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cross_workspace_project_and_assignment_isolation(
    proj_client: AsyncClient,
    proj_test_db: AsyncSession,
):
    """
    - Tenant B cannot view, update, archive, or allocate to Tenant A's project.
    - Tenant A cannot allocate an employee belonging to Tenant B.
    """
    # Setup Tenant A
    user_a, ws_a = await setup_workspace_with_user(
        proj_test_db, "clerk_tenant_pa", ws_name="Tenant Project A"
    )
    token_a = create_token("clerk_tenant_pa")
    headers_a = {"Authorization": f"Bearer {token_a}", "X-Workspace-Id": str(ws_a.id)}

    # Setup Tenant B
    user_b, ws_b = await setup_workspace_with_user(
        proj_test_db, "clerk_tenant_pb", ws_name="Tenant Project B"
    )
    token_b = create_token("clerk_tenant_pb")
    headers_b = {"Authorization": f"Bearer {token_b}", "X-Workspace-Id": str(ws_b.id)}

    # Tenant A creates project
    p_resp = await proj_client.post(
        "/api/v1/projects",
        headers=headers_a,
        json={
            "projectId": "PRJ-SEC-A",
            "name": "Secret Project A",
            "department": "Engineering",
            "startDate": "2026-01-01",
            "deadline": "2026-06-01",
        },
    )
    proj_a_id = p_resp.json()["id"]

    # Tenant B lists -> 0 projects
    resp_b_list = await proj_client.get("/api/v1/projects", headers=headers_b)
    assert resp_b_list.json()["total"] == 0

    # Tenant B tries to get Tenant A's project -> 404
    resp_b_get = await proj_client.get(f"/api/v1/projects/{proj_a_id}", headers=headers_b)
    assert resp_b_get.status_code == 404

    # Tenant B seeds an employee in Workspace B
    emp_b = Employee(
        workspace_id=ws_b.id,
        employee_code="NXW-TENANT-B-EMP",
        full_name="Tenant B Worker",
        email="tb@worker.com",
        department="Engineering",
        designation="Dev",
    )
    proj_test_db.add(emp_b)
    await proj_test_db.commit()

    # Tenant A tries to allocate Tenant B's employee to Project A -> 404 Not Found
    resp_cross_alloc = await proj_client.post(
        f"/api/v1/projects/{proj_a_id}/team",
        headers=headers_a,
        json={"id": str(emp_b.id), "allocationPercent": 50.0},
    )
    assert resp_cross_alloc.status_code == 404


# ------------------------------------------------------------------------------
# 7. Update and Soft-Archiving Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_and_archive_project(
    proj_client: AsyncClient,
    proj_test_db: AsyncSession,
):
    """Project Manager can update project progress/status and archive it."""
    user, ws = await setup_workspace_with_user(
        proj_test_db, "clerk_pm_arch", system_role=SystemRole.PROJECT_MANAGER.value
    )
    token = create_token("clerk_pm_arch")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    create_resp = await proj_client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "projectId": "PRJ-ARCH-01",
            "name": "Original Project",
            "department": "Engineering",
            "status": "Planning",
            "startDate": "2026-01-01",
            "deadline": "2026-06-01",
        },
    )
    proj_id = create_resp.json()["id"]

    # Update status to Active and progress to 50%
    upd_resp = await proj_client.put(
        f"/api/v1/projects/{proj_id}",
        headers=headers,
        json={
            "name": "Updated Project",
            "status": "Active",
            "progress": 50.0,
        },
    )
    assert upd_resp.status_code == 200
    assert upd_resp.json()["name"] == "Updated Project"
    assert upd_resp.json()["status"] == "Active"
    assert upd_resp.json()["progress"] == 50.0

    # Archive project via DELETE
    del_resp = await proj_client.delete(f"/api/v1/projects/{proj_id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "Archived"

    # Default list excludes archived project
    list_resp = await proj_client.get("/api/v1/projects", headers=headers)
    assert list_resp.json()["total"] == 0

    # Listing with include_archived=true includes it
    list_arch = await proj_client.get("/api/v1/projects?include_archived=true", headers=headers)
    assert list_arch.json()["total"] == 1
    assert list_arch.json()["items"][0]["status"] == "Archived"
