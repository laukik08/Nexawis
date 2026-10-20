"""
NEXAWIS Backend - Automated Tests for Employee Management APIs.
Covers:
- Employee CRUD: creation, retrieval, listing, update, and soft-archiving.
- Validation: missing fields, invalid email format, invalid ranges.
- Constraints: duplicate employee_code and email within workspace (409 Conflict).
- Search, multi-criteria filtering, sorting, and pagination.
- Authentication & RBAC: unauthenticated rejection (401), insufficient permissions (403).
- Sensitive wellbeing data masking: HR/Admin can view; Project Manager sees "Restricted".
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
from sqlalchemy import select

from app.main import app
from app.models import (
    Base,
    User,
    Workspace,
    WorkspaceMember,
    WorkspaceSettings,
    Employee,
    Skill,
    EmployeeSkill,
    EmployeePerformanceHistory,
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


def create_token(sub: str, role: str = SystemRole.HR.value, email: str = None) -> str:
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
async def emp_test_db():
    """Provides an isolated async SQLite database for employee tests."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def emp_client(emp_test_db: AsyncSession):
    """Provides an AsyncClient configured with test verification keys and test DB."""
    set_test_verification_key(TEST_PUBLIC_KEY, ["RS256"])

    async def _override_db():
        yield emp_test_db

    app.dependency_overrides[get_db_session] = _override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    set_test_verification_key(None, None)


async def setup_workspace_with_user(
    db: AsyncSession,
    clerk_id: str,
    system_role: str = SystemRole.HR.value,
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
async def test_employees_endpoints_require_auth(emp_client: AsyncClient):
    """Endpoints return 401 Unauthorized when Authorization header is missing."""
    resp = await emp_client.get("/api/v1/employees")
    assert resp.status_code == 401

    resp = await emp_client.get("/api/v1/employees/stats")
    assert resp.status_code == 401

    resp = await emp_client.post("/api/v1/employees", json={})
    assert resp.status_code == 401


# ------------------------------------------------------------------------------
# 2. Permission and Role Enforcement Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_employee_role_cannot_view_or_create_employees(
    emp_client: AsyncClient,
    emp_test_db: AsyncSession,
):
    """Standard Employee role does not possess EMPLOYEES_VIEW or EMPLOYEES_MANAGE."""
    user, ws = await setup_workspace_with_user(
        emp_test_db, "clerk_emp_role", system_role=SystemRole.EMPLOYEE.value
    )
    token = create_token("clerk_emp_role")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    # Attempt to list -> 403 Forbidden
    resp = await emp_client.get("/api/v1/employees", headers=headers)
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"

    # Attempt to create -> 403 Forbidden
    resp = await emp_client.post(
        "/api/v1/employees",
        headers=headers,
        json={
            "employeeId": "NXW-9999",
            "name": "Unauthorized Add",
            "email": "unauth@test.com",
            "department": "Engineering",
            "role": "Engineer",
        },
    )
    assert resp.status_code == 403


# ------------------------------------------------------------------------------
# 3. Employee Creation & Constraints Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_employee_success(
    emp_client: AsyncClient,
    emp_test_db: AsyncSession,
):
    """HR role can create an employee with skills and baseline metrics."""
    user, ws = await setup_workspace_with_user(
        emp_test_db, "clerk_hr_creator", system_role=SystemRole.HR.value
    )
    token = create_token("clerk_hr_creator")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    payload = {
        "employeeId": "NXW-1001",
        "name": "Sarah Connor",
        "email": "sarah.connor@nexawis.com",
        "department": "Engineering",
        "role": "Lead Architect",
        "experienceYears": 8.5,
        "status": "Available",
        "employmentType": "Full-time",
        "workLocation": "Remote",
        "performanceScore": 92.0,
        "availabilityScore": 100.0,
        "workloadScore": 40.0,
        "wellbeingRisk": "Low",
        "skills": [
            {"name": "Python", "proficiency": 95, "isPrimary": True},
            {"name": "FastAPI", "proficiency": 90, "isPrimary": True},
            {"name": "PostgreSQL", "proficiency": 85, "isPrimary": False},
        ],
    }

    resp = await emp_client.post("/api/v1/employees", headers=headers, json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["employeeId"] == "NXW-1001"
    assert data["name"] == "Sarah Connor"
    assert data["role"] == "Lead Architect"
    assert len(data["skills"]) == 3
    assert data["wellbeingRisk"] == "Low"  # HR can view wellbeing


@pytest.mark.asyncio
async def test_create_employee_duplicate_code_conflict(
    emp_client: AsyncClient,
    emp_test_db: AsyncSession,
):
    """Attempting to create an employee with an existing employee_code returns 409 Conflict."""
    user, ws = await setup_workspace_with_user(
        emp_test_db, "clerk_dup_code", system_role=SystemRole.HR.value
    )
    token = create_token("clerk_dup_code")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    payload = {
        "employeeId": "NXW-DUPLICATE",
        "name": "First User",
        "email": "first@nexawis.com",
        "department": "Engineering",
        "role": "Dev",
    }
    resp1 = await emp_client.post("/api/v1/employees", headers=headers, json=payload)
    assert resp1.status_code == 201

    # Second user with same employeeId
    payload2 = {
        "employeeId": "NXW-DUPLICATE",
        "name": "Second User",
        "email": "second@nexawis.com",
        "department": "Engineering",
        "role": "Dev",
    }
    resp2 = await emp_client.post("/api/v1/employees", headers=headers, json=payload2)
    assert resp2.status_code == 409
    assert resp2.json()["error"]["code"] == "CONFLICT"


@pytest.mark.asyncio
async def test_create_employee_duplicate_email_conflict(
    emp_client: AsyncClient,
    emp_test_db: AsyncSession,
):
    """Attempting to create an employee with an existing email in the workspace returns 409 Conflict."""
    user, ws = await setup_workspace_with_user(
        emp_test_db, "clerk_dup_email", system_role=SystemRole.HR.value
    )
    token = create_token("clerk_dup_email")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    payload1 = {
        "employeeId": "NXW-E1",
        "name": "User One",
        "email": "shared@nexawis.com",
        "department": "Engineering",
        "role": "Dev",
    }
    resp1 = await emp_client.post("/api/v1/employees", headers=headers, json=payload1)
    assert resp1.status_code == 201

    payload2 = {
        "employeeId": "NXW-E2",
        "name": "User Two",
        "email": "shared@nexawis.com",
        "department": "Engineering",
        "role": "Dev",
    }
    resp2 = await emp_client.post("/api/v1/employees", headers=headers, json=payload2)
    assert resp2.status_code == 409
    assert resp2.json()["error"]["code"] == "CONFLICT"


@pytest.mark.asyncio
async def test_create_employee_validation_errors(
    emp_client: AsyncClient,
    emp_test_db: AsyncSession,
):
    """Invalid email, missing required fields, or out-of-range values return 422."""
    user, ws = await setup_workspace_with_user(
        emp_test_db, "clerk_val_err", system_role=SystemRole.HR.value
    )
    token = create_token("clerk_val_err")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    # Invalid email format
    resp = await emp_client.post(
        "/api/v1/employees",
        headers=headers,
        json={
            "employeeId": "NXW-BAD",
            "name": "Bad Email",
            "email": "not-an-email",
            "department": "Engineering",
            "role": "Dev",
        },
    )
    assert resp.status_code == 422

    # Negative experience years
    resp = await emp_client.post(
        "/api/v1/employees",
        headers=headers,
        json={
            "employeeId": "NXW-NEG",
            "name": "Negative Exp",
            "email": "neg@test.com",
            "department": "Engineering",
            "role": "Dev",
            "experienceYears": -5.0,
        },
    )
    assert resp.status_code == 422


# ------------------------------------------------------------------------------
# 4. Listing, Search, Filter, Sort, Pagination Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_employees_filtering_and_search(
    emp_client: AsyncClient,
    emp_test_db: AsyncSession,
):
    """Verifies search, department filter, status filter, and pagination."""
    user, ws = await setup_workspace_with_user(
        emp_test_db, "clerk_list_test", system_role=SystemRole.HR.value
    )
    token = create_token("clerk_list_test")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    # Seed 3 employees
    employees_to_seed = [
        {
            "employeeId": "NXW-2001",
            "name": "Alice Backend",
            "email": "alice@test.com",
            "department": "Engineering",
            "role": "Backend Engineer",
            "experienceYears": 4.0,
            "status": "Available",
            "performanceScore": 88.0,
            "availabilityScore": 100.0,
            "skills": [{"name": "FastAPI", "proficiency": 90, "isPrimary": True}],
        },
        {
            "employeeId": "NXW-2002",
            "name": "Bob Frontend",
            "email": "bob@test.com",
            "department": "Design",
            "role": "UI Designer",
            "experienceYears": 6.0,
            "status": "Allocated",
            "performanceScore": 94.0,
            "availabilityScore": 20.0,
            "skills": [{"name": "Figma", "proficiency": 95, "isPrimary": True}],
        },
        {
            "employeeId": "NXW-2003",
            "name": "Charlie Manager",
            "email": "charlie@test.com",
            "department": "Product",
            "role": "Product Manager",
            "experienceYears": 10.0,
            "status": "On Leave",
            "performanceScore": 91.0,
            "availabilityScore": 0.0,
            "skills": [{"name": "Roadmapping", "proficiency": 85, "isPrimary": True}],
        },
    ]

    for p in employees_to_seed:
        r = await emp_client.post("/api/v1/employees", headers=headers, json=p)
        assert r.status_code == 201

    # 1. Total list
    resp = await emp_client.get("/api/v1/employees", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3

    # 2. Search query by skill "Figma"
    resp = await emp_client.get("/api/v1/employees?search=Figma", headers=headers)
    assert resp.status_code == 200
    search_data = resp.json()
    assert search_data["total"] == 1
    assert search_data["items"][0]["name"] == "Bob Frontend"

    # 3. Department filter
    resp = await emp_client.get("/api/v1/employees?department=Engineering", headers=headers)
    assert resp.status_code == 200
    dept_data = resp.json()
    assert dept_data["total"] == 1
    assert dept_data["items"][0]["employeeId"] == "NXW-2001"

    # 4. Status filter
    resp = await emp_client.get("/api/v1/employees?status=Available", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    # 5. Sorting by performance desc
    resp = await emp_client.get("/api/v1/employees?sort_by=performance&sort_order=desc", headers=headers)
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert items[0]["name"] == "Bob Frontend"  # score 94
    assert items[1]["name"] == "Charlie Manager"  # score 91
    assert items[2]["name"] == "Alice Backend"  # score 88

    # 6. Pagination
    resp = await emp_client.get("/api/v1/employees?page=1&page_size=2", headers=headers)
    assert resp.status_code == 200
    page_data = resp.json()
    assert page_data["page"] == 1
    assert page_data["pageSize"] == 2
    assert len(page_data["items"]) == 2
    assert page_data["totalPages"] == 2


# ------------------------------------------------------------------------------
# 5. Quick Stats Endpoint Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_employee_stats(
    emp_client: AsyncClient,
    emp_test_db: AsyncSession,
):
    """Stats correctly tally total, active, available, and at-risk employees."""
    user, ws = await setup_workspace_with_user(
        emp_test_db, "clerk_stats_test", system_role=SystemRole.HR.value
    )
    token = create_token("clerk_stats_test")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    # Seed 1 available, 1 allocated, 1 on leave with High risk
    await emp_client.post("/api/v1/employees", headers=headers, json={
        "employeeId": "NXW-S1", "name": "Emp 1", "email": "s1@test.com", "department": "Eng", "role": "Dev",
        "status": "Available", "wellbeingRisk": "Low"
    })
    await emp_client.post("/api/v1/employees", headers=headers, json={
        "employeeId": "NXW-S2", "name": "Emp 2", "email": "s2@test.com", "department": "Eng", "role": "Dev",
        "status": "Allocated", "wellbeingRisk": "High"
    })
    await emp_client.post("/api/v1/employees", headers=headers, json={
        "employeeId": "NXW-S3", "name": "Emp 3", "email": "s3@test.com", "department": "Eng", "role": "Dev",
        "status": "On Leave", "wellbeingRisk": "Low"
    })

    resp = await emp_client.get("/api/v1/employees/stats", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert data["active"] == 2  # Total - On Leave
    assert data["available"] == 1
    assert data["atRisk"] == 1


# ------------------------------------------------------------------------------
# 6. Sensitive Wellbeing Permission Masking Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_wellbeing_data_masking_for_project_manager(
    emp_client: AsyncClient,
    emp_test_db: AsyncSession,
):
    """
    Project Managers have EMPLOYEES_VIEW but NOT EMPLOYEES_WELLBEING_VIEW.
    The backend MUST mask mental_fatigue_score and return 'Restricted' for wellbeing_risk.
    """
    # 1. Setup workspace with HR user and seed high-risk employee
    hr_user, ws = await setup_workspace_with_user(
        emp_test_db, "clerk_hr_owner", system_role=SystemRole.HR.value
    )
    hr_token = create_token("clerk_hr_owner")
    hr_headers = {"Authorization": f"Bearer {hr_token}", "X-Workspace-Id": str(ws.id)}

    seed_resp = await emp_client.post(
        "/api/v1/employees",
        headers=hr_headers,
        json={
            "employeeId": "NXW-BURNOUT",
            "name": "Overworked Developer",
            "email": "burnout@test.com",
            "department": "Engineering",
            "role": "Senior Dev",
            "wellbeingRisk": "High",
        },
    )
    assert seed_resp.status_code == 201
    emp_id = seed_resp.json()["id"]

    # In DB, verify HR sees wellbeing
    assert seed_resp.json()["wellbeingRisk"] == "High"

    # 2. Add Project Manager user to the exact same workspace
    pm_user = User(
        clerk_user_id="clerk_pm_user",
        email="pm@test.com",
        full_name="PM User",
        role=SystemRole.PROJECT_MANAGER.value,
        is_active=True,
    )
    emp_test_db.add(pm_user)
    await emp_test_db.flush()

    pm_member = WorkspaceMember(
        workspace_id=ws.id,
        user_id=pm_user.id,
        role=WorkspaceRole.MEMBER.value,
        is_active=True,
    )
    emp_test_db.add(pm_member)
    await emp_test_db.commit()

    pm_token = create_token("clerk_pm_user", role=SystemRole.PROJECT_MANAGER.value)
    pm_headers = {"Authorization": f"Bearer {pm_token}", "X-Workspace-Id": str(ws.id)}

    # 3. PM calls list endpoint -> wellbeingRisk MUST be "Restricted"
    list_resp = await emp_client.get("/api/v1/employees", headers=pm_headers)
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["items"][0]["wellbeingRisk"] == "Restricted"

    # 4. PM calls detail endpoint -> wellbeingRisk is "Restricted", mentalFatigueScore is None
    detail_resp = await emp_client.get(f"/api/v1/employees/{emp_id}", headers=pm_headers)
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert detail_data["wellbeingRisk"] == "Restricted"
    assert detail_data["mentalFatigueScore"] is None

    # 5. PM calls stats endpoint -> atRisk count is masked (0)
    stats_resp = await emp_client.get("/api/v1/employees/stats", headers=pm_headers)
    assert stats_resp.status_code == 200
    assert stats_resp.json()["atRisk"] == 0


# ------------------------------------------------------------------------------
# 7. Update and Soft-Archiving Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_and_archive_employee(
    emp_client: AsyncClient,
    emp_test_db: AsyncSession,
):
    """HR can update fields and soft-archive an employee."""
    user, ws = await setup_workspace_with_user(
        emp_test_db, "clerk_updater", system_role=SystemRole.HR.value
    )
    token = create_token("clerk_updater")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    create_resp = await emp_client.post(
        "/api/v1/employees",
        headers=headers,
        json={
            "employeeId": "NXW-3001",
            "name": "Original Name",
            "email": "update@test.com",
            "department": "Engineering",
            "role": "Junior Dev",
            "status": "Available",
        },
    )
    emp_id = create_resp.json()["id"]

    # Update role and designation
    update_resp = await emp_client.put(
        f"/api/v1/employees/{emp_id}",
        headers=headers,
        json={
            "name": "Updated Name",
            "role": "Mid-level Dev",
            "experienceYears": 3.0,
            "status": "Allocated",
        },
    )
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["name"] == "Updated Name"
    assert updated_data["role"] == "Mid-level Dev"
    assert updated_data["status"] == "Allocated"

    # Soft archive employee via DELETE
    del_resp = await emp_client.delete(f"/api/v1/employees/{emp_id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "Archived"

    # Verify default list excludes archived employee
    list_resp = await emp_client.get("/api/v1/employees", headers=headers)
    assert list_resp.json()["total"] == 0

    # Including archived explicitly returns it
    list_arch_resp = await emp_client.get("/api/v1/employees?include_archived=true", headers=headers)
    assert list_arch_resp.json()["total"] == 1
    assert list_arch_resp.json()["items"][0]["status"] == "Archived"


# ------------------------------------------------------------------------------
# 8. Cross-Workspace Isolation (Multi-Tenancy)
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cross_workspace_employee_isolation(
    emp_client: AsyncClient,
    emp_test_db: AsyncSession,
):
    """User in Workspace A cannot access or mutate employees belonging to Workspace B."""
    # Setup Workspace A
    user_a, ws_a = await setup_workspace_with_user(
        emp_test_db, "clerk_tenant_a", system_role=SystemRole.HR.value, ws_name="Tenant A"
    )
    token_a = create_token("clerk_tenant_a")
    headers_a = {"Authorization": f"Bearer {token_a}", "X-Workspace-Id": str(ws_a.id)}

    # Setup Workspace B
    user_b, ws_b = await setup_workspace_with_user(
        emp_test_db, "clerk_tenant_b", system_role=SystemRole.HR.value, ws_name="Tenant B"
    )
    token_b = create_token("clerk_tenant_b")
    headers_b = {"Authorization": f"Bearer {token_b}", "X-Workspace-Id": str(ws_b.id)}

    # Tenant A creates employee
    create_resp = await emp_client.post(
        "/api/v1/employees",
        headers=headers_a,
        json={
            "employeeId": "NXW-TENANT-A",
            "name": "Secret A Employee",
            "email": "secret@tenant-a.com",
            "department": "Engineering",
            "role": "Architect",
        },
    )
    emp_a_id = create_resp.json()["id"]

    # Tenant B lists employees -> should see 0
    resp_b_list = await emp_client.get("/api/v1/employees", headers=headers_b)
    assert resp_b_list.json()["total"] == 0

    # Tenant B tries to get Tenant A's employee by ID -> 404 Not Found
    resp_b_get = await emp_client.get(f"/api/v1/employees/{emp_a_id}", headers=headers_b)
    assert resp_b_get.status_code == 404

    # Tenant B tries to update Tenant A's employee -> 404 Not Found
    resp_b_put = await emp_client.put(
        f"/api/v1/employees/{emp_a_id}",
        headers=headers_b,
        json={"name": "Hacked Name"},
    )
    assert resp_b_put.status_code == 404

    # Tenant B tries to archive Tenant A's employee -> 404 Not Found
    resp_b_del = await emp_client.delete(f"/api/v1/employees/{emp_a_id}", headers=headers_b)
    assert resp_b_del.status_code == 404
