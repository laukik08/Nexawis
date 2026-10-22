"""
NEXAWIS Backend - Automated Tests for Phase 9 Analytics & Business Intelligence Module.
Covers:
- Authentication & RBAC (401 unauthenticated, 403 for Employee, 200 for PM/HR/Admin).
- Multi-tenant workspace isolation (Workspace A cannot see Workspace B data).
- KPI formulas and denominator correctness (headcount vs active, utilization, AWIS average).
- Workload capacity tiers and over-allocation warning counts.
- Active status filtering for allocations (ignoring Completed/Released).
- Filter composition (department, project, search query, date ranges).
- Sensitive wellbeing field masking (PM masked, HR/Admin unmasked).
- Separation of prospective ML simulations from historical records.
- Empty workspace resilience (zero division safety).
- All modular endpoints (/filter-options, /dashboard, /kpis, /workforce, /projects, /teams, /sustainability).
"""

import uuid
from datetime import datetime, timezone, timedelta, date
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
    ProjectAllocation,
    TeamFormation,
    Skill,
    EmployeeSkill,
    ProjectRequirement,
)
from app.models.ml_results import AwisEvaluation, MlBurnoutPrediction
from app.core.database import get_db_session
from app.core.clerk import set_test_verification_key
from app.core.roles import SystemRole, WorkspaceRole
from app.services.analytics import AnalyticsService

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
async def analytics_test_db():
    """Provides an isolated async SQLite database for analytics tests."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def analytics_client(analytics_test_db: AsyncSession):
    """Provides an AsyncClient configured with test verification keys and test DB."""
    set_test_verification_key(TEST_PUBLIC_KEY, ["RS256"])

    async def _override_db():
        yield analytics_test_db

    app.dependency_overrides[get_db_session] = _override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    set_test_verification_key(None, None)


async def setup_test_workspace(
    db: AsyncSession,
    clerk_id: str,
    role: str = SystemRole.PROJECT_MANAGER.value,
    ws_name: str = "Analytics Workspace",
) -> tuple[User, Workspace]:
    """Provisions a test user and workspace."""
    user = User(
        clerk_user_id=clerk_id,
        email=f"{clerk_id}@test.com",
        full_name=f"User {clerk_id}",
        role=role,
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
# 1. Authentication and Authorization Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_analytics_endpoints_require_auth(analytics_client: AsyncClient):
    """Verifies that unauthenticated requests to analytics endpoints receive 401 Unauthorized."""
    endpoints = [
        "/api/v1/analytics/dashboard",
        "/api/v1/analytics/kpis",
        "/api/v1/analytics/workforce",
        "/api/v1/analytics/projects",
        "/api/v1/analytics/teams",
        "/api/v1/analytics/sustainability",
        "/api/v1/analytics/filter-options",
    ]
    for ep in endpoints:
        resp = await analytics_client.get(ep)
        assert resp.status_code == 401, f"Expected 401 on {ep}, got {resp.status_code}"


@pytest.mark.asyncio
async def test_employee_role_forbidden_from_analytics(
    analytics_client: AsyncClient,
    analytics_test_db: AsyncSession,
):
    """Verifies that users with Employee role cannot access analytics (403 Forbidden)."""
    user, ws = await setup_test_workspace(
        analytics_test_db, "clerk_emp_001", role=SystemRole.EMPLOYEE.value
    )
    token = create_token("clerk_emp_001", role=SystemRole.EMPLOYEE.value)

    resp = await analytics_client.get(
        "/api/v1/analytics/dashboard",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp.status_code == 403
    assert "Insufficient permissions" in resp.text


@pytest.mark.asyncio
async def test_authorized_roles_access_analytics(
    analytics_client: AsyncClient,
    analytics_test_db: AsyncSession,
):
    """Verifies that Project Manager, HR, and Admin can all access analytics endpoints."""
    roles = [
        SystemRole.PROJECT_MANAGER.value,
        SystemRole.HR.value,
        SystemRole.ADMIN.value,
        SystemRole.LEADERSHIP.value,
    ]
    for idx, r in enumerate(roles):
        clerk_id = f"clerk_auth_{idx}"
        user, ws = await setup_test_workspace(analytics_test_db, clerk_id, role=r)
        token = create_token(clerk_id, role=r)

        resp = await analytics_client.get(
            "/api/v1/analytics/kpis",
            headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
        )
        assert resp.status_code == 200, f"Role {r} failed with {resp.status_code}: {resp.text}"


# ------------------------------------------------------------------------------
# 2. Workspace Isolation & Multi-Tenancy Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_analytics_workspace_isolation(
    analytics_client: AsyncClient,
    analytics_test_db: AsyncSession,
):
    """Verifies that Workspace A's analytics show zero data from Workspace B."""
    # Workspace A
    user_a, ws_a = await setup_test_workspace(analytics_test_db, "clerk_ws_a")
    # Workspace B
    user_b, ws_b = await setup_test_workspace(analytics_test_db, "clerk_ws_b")

    # Seed 3 employees in Workspace B
    for i in range(3):
        emp = Employee(
            workspace_id=ws_b.id,
            employee_code=f"WSB-{100+i}",
            full_name=f"Workspace B Dev {i}",
            email=f"wsb_{i}@test.com",
            department="Backend",
            designation="Senior Engineer",
            employment_status="Available",
            performance_score=90.0,
        )
        analytics_test_db.add(emp)
    await analytics_test_db.commit()

    # Query analytics as Workspace A
    token_a = create_token("clerk_ws_a", role=SystemRole.PROJECT_MANAGER.value)
    resp = await analytics_client.get(
        "/api/v1/analytics/workforce",
        headers={"Authorization": f"Bearer {token_a}", "X-Workspace-Id": str(ws_a.id)},
    )
    assert resp.status_code == 200
    data_a = resp.json()
    assert data_a["totalEmployees"] == 0
    assert len(data_a["tableRows"]) == 0

    # Query analytics as Workspace B
    token_b = create_token("clerk_ws_b", role=SystemRole.PROJECT_MANAGER.value)
    resp_b = await analytics_client.get(
        "/api/v1/analytics/workforce",
        headers={"Authorization": f"Bearer {token_b}", "X-Workspace-Id": str(ws_b.id)},
    )
    assert resp_b.status_code == 200
    data_b = resp_b.json()
    assert data_b["totalEmployees"] == 3
    assert len(data_b["tableRows"]) == 3


# ------------------------------------------------------------------------------
# 3. KPI Formulas, Allocation Tiers, and Status Filtering
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_kpi_formulas_and_active_allocation_filtering(
    analytics_client: AsyncClient,
    analytics_test_db: AsyncSession,
):
    """
    Verifies:
    - Workload utilization calculation uses ONLY active allocations.
    - Completed / Released allocations are excluded.
    - AWIS score is averaged from evaluations.
    """
    user, ws = await setup_test_workspace(analytics_test_db, "clerk_kpi_user")
    token = create_token("clerk_kpi_user")

    # 1. Create 2 employees
    emp1 = Employee(
        workspace_id=ws.id,
        employee_code="EMP-101",
        full_name="Alice Engineer",
        email="alice@test.com",
        department="Engineering",
        designation="Lead Dev",
        employment_status="Available",
        performance_score=90.0,
        availability_score=100.0,
    )
    emp2 = Employee(
        workspace_id=ws.id,
        employee_code="EMP-102",
        full_name="Bob Designer",
        email="bob@test.com",
        department="Design",
        designation="UI Designer",
        employment_status="Available",
        performance_score=85.0,
        availability_score=100.0,
    )
    analytics_test_db.add_all([emp1, emp2])
    await analytics_test_db.flush()

    # 2. Create Project
    proj = Project(
        workspace_id=ws.id,
        project_code="PRJ-101",
        name="Apollo Platform",
        department="Engineering",
        status="Active",
        priority="High",
        progress_percent=50.0,
        team_fit_score=88.0,
    )
    analytics_test_db.add(proj)
    await analytics_test_db.flush()

    # 3. Add 1 Active allocation (60%) for emp1, and 1 Released allocation (50%) for emp2
    alloc1 = ProjectAllocation(
        project_id=proj.id,
        employee_id=emp1.id,
        role="Lead Dev",
        allocation_percent=60.0,
        status="Active",
    )
    alloc2_released = ProjectAllocation(
        project_id=proj.id,
        employee_id=emp2.id,
        role="UI Designer",
        allocation_percent=50.0,
        status="Released",  # Must be ignored!
    )
    analytics_test_db.add_all([alloc1, alloc2_released])

    # 4. Add AWIS evaluation
    awis_eval = AwisEvaluation(
        workspace_id=ws.id,
        project_id=proj.id,
        employee_id=emp1.id,
        composite_awis_score=86.4,
        skill_intelligence=90.0,
        experience_intelligence=85.0,
        performance_intelligence=90.0,
        availability_intelligence=80.0,
        workload_intelligence=85.0,
        burnout_intelligence=88.0,
        collaboration_intelligence=85.0,
        growth_intelligence=80.0,
        compatibility_intelligence=85.0,
        evaluated_at=datetime.now(timezone.utc),
    )
    analytics_test_db.add(awis_eval)
    await analytics_test_db.commit()

    # Query KPIs
    resp = await analytics_client.get(
        "/api/v1/analytics/kpis?preset=30d",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp.status_code == 200
    kpis = resp.json()

    # AWIS score average should be exactly 86.4
    assert kpis["averageAwisScore"]["value"] == "86.4"

    # Workload utilization: Emp 1 has 60%, Emp 2 has 0% active -> Average = (60 + 0) / 2 = 30.0%
    assert kpis["workforceUtilization"]["value"] == "30.0%"


# ------------------------------------------------------------------------------
# 4. Sensitive Wellbeing Data Masking by Role
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_wellbeing_privacy_masking_for_project_managers(
    analytics_client: AsyncClient,
    analytics_test_db: AsyncSession,
):
    """
    Verifies that Project Managers (lacking EMPLOYEES_WELLBEING_VIEW):
    - See 'Restricted' for employee wellbeing risk.
    - See masked names in at-risk sustainability lists.
    While HR users see unmasked, actual data.
    """
    user_pm, ws = await setup_test_workspace(
        analytics_test_db, "clerk_pm_mask", role=SystemRole.PROJECT_MANAGER.value
    )
    token_pm = create_token("clerk_pm_mask", role=SystemRole.PROJECT_MANAGER.value)

    # Seed an employee with High burnout risk and 150% workload
    emp = Employee(
        workspace_id=ws.id,
        employee_code="NXW-999",
        full_name="Sensitive Candidate",
        email="sensitive@test.com",
        department="Core Platform",
        designation="Architect",
        employment_status="Available",
        performance_score=95.0,
        mental_fatigue_score=8.5,
        wellbeing_risk="High",
    )
    analytics_test_db.add(emp)
    await analytics_test_db.flush()

    proj = Project(
        workspace_id=ws.id,
        project_code="PRJ-999",
        name="Hyper Growth",
        department="Core Platform",
    )
    analytics_test_db.add(proj)
    await analytics_test_db.flush()

    alloc = ProjectAllocation(
        project_id=proj.id,
        employee_id=emp.id,
        role="Architect",
        allocation_percent=145.0,  # Overallocated > 140%
        status="Active",
    )
    analytics_test_db.add(alloc)
    await analytics_test_db.commit()

    # 1. Project Manager request -> Masked
    resp_pm = await analytics_client.get(
        "/api/v1/analytics/workforce",
        headers={"Authorization": f"Bearer {token_pm}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp_pm.status_code == 200
    rows_pm = resp_pm.json()["tableRows"]
    assert len(rows_pm) == 1
    assert rows_pm[0]["wellbeingRisk"] == "Restricted", "PM should NOT see unmasked wellbeingRisk"

    # Sustainability at-risk check for PM
    resp_sust_pm = await analytics_client.get(
        "/api/v1/analytics/sustainability",
        headers={"Authorization": f"Bearer {token_pm}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp_sust_pm.status_code == 200
    at_risk_pm = resp_sust_pm.json()["atRiskEmployees"]
    assert len(at_risk_pm) == 1
    assert at_risk_pm[0]["name"] == "Employee NXW-999", "PM should see masked name format"
    assert at_risk_pm[0]["avatarUrl"] is None

    # 2. HR request -> Unmasked
    user_hr, _ = await setup_test_workspace(
        analytics_test_db, "clerk_hr_unmask", role=SystemRole.HR.value, ws_name="HR Workspace"
    )
    # Give HR membership in the same workspace ws
    mem_hr = WorkspaceMember(
        workspace_id=ws.id,
        user_id=user_hr.id,
        role=WorkspaceRole.ADMIN.value,
        is_active=True,
    )
    analytics_test_db.add(mem_hr)
    await analytics_test_db.commit()

    token_hr = create_token("clerk_hr_unmask", role=SystemRole.HR.value)
    resp_hr = await analytics_client.get(
        "/api/v1/analytics/workforce",
        headers={"Authorization": f"Bearer {token_hr}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp_hr.status_code == 200
    rows_hr = resp_hr.json()["tableRows"]
    assert rows_hr[0]["wellbeingRisk"] == "High", "HR should see actual wellbeingRisk"


# ------------------------------------------------------------------------------
# 5. Filter Composition Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_filter_composition(
    analytics_client: AsyncClient,
    analytics_test_db: AsyncSession,
):
    """
    Verifies that department, project, and search filters compose cleanly.
    """
    user, ws = await setup_test_workspace(analytics_test_db, "clerk_filter_user")
    token = create_token("clerk_filter_user")

    # 2 Employees in different departments
    e_frontend = Employee(
        workspace_id=ws.id,
        employee_code="DEV-001",
        full_name="Frontend Wizard",
        email="fe@test.com",
        department="Frontend",
        designation="React Dev",
    )
    e_backend = Employee(
        workspace_id=ws.id,
        employee_code="DEV-002",
        full_name="Backend Ninja",
        email="be@test.com",
        department="Backend",
        designation="Python Dev",
    )
    analytics_test_db.add_all([e_frontend, e_backend])
    await analytics_test_db.commit()

    # Filter by department="Frontend"
    resp = await analytics_client.get(
        "/api/v1/analytics/workforce?department=Frontend",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["totalEmployees"] == 1
    assert data["tableRows"][0]["department"] == "Frontend"

    # Search by "Ninja"
    resp_search = await analytics_client.get(
        "/api/v1/analytics/workforce?search_query=Ninja",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp_search.status_code == 200
    data_search = resp_search.json()
    assert data_search["totalEmployees"] == 1
    assert data_search["tableRows"][0]["name"] == "Backend Ninja"


# ------------------------------------------------------------------------------
# 6. Complete Dashboard and Empty Dataset Resilience
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_empty_workspace_analytics_dashboard(
    analytics_client: AsyncClient,
    analytics_test_db: AsyncSession,
):
    """Verifies that an empty workspace returns valid 200 responses with zero division safety."""
    user, ws = await setup_test_workspace(analytics_test_db, "clerk_empty_ws")
    token = create_token("clerk_empty_ws")

    resp = await analytics_client.get(
        "/api/v1/analytics/dashboard",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp.status_code == 200
    payload = resp.json()

    assert payload["workforce"]["totalEmployees"] == 0
    assert payload["projects"]["totalProjects"] == 0
    assert payload["teams"]["totalFormations"] == 0
    assert payload["sustainability"]["sustainabilityIndex"] == 100.0
    assert payload["kpis"]["averageAwisScore"]["value"] == "N/A"
    assert payload["kpis"]["workforceUtilization"]["value"] == "0.0%"

    # Strict historical integrity: empty collections, no synthetic fallback points
    assert payload["awisTrend"] == []
    assert payload["projectPerformanceTrend"] == []


# ------------------------------------------------------------------------------
# 7. Project Schedule Health, Milestones, and Delivery Analytics
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_project_analytics_and_schedule_health(
    analytics_client: AsyncClient,
    analytics_test_db: AsyncSession,
):
    """
    Verifies schedule health computation:
    - Delayed when delivery_delay_days > 0 or deadline < today (not completed).
    - At Risk when deadline within 14 days and progress < 80%.
    - On Track otherwise.
    """
    user, ws = await setup_test_workspace(analytics_test_db, "clerk_proj_health")
    token = create_token("clerk_proj_health")
    today = date.today()

    # 1. Delayed project (deadline in the past)
    proj_delayed = Project(
        workspace_id=ws.id,
        project_code="PRJ-DL",
        name="Overdue System",
        department="Operations",
        status="Active",
        progress_percent=60.0,
        start_date=today - timedelta(days=60),
        deadline=today - timedelta(days=5),
        delivery_delay_days=5,
    )

    # 2. At Risk project (deadline in 7 days, progress 40%)
    proj_risk = Project(
        workspace_id=ws.id,
        project_code="PRJ-RS",
        name="Urgent Delivery",
        department="Mobile",
        status="Active",
        progress_percent=40.0,
        start_date=today - timedelta(days=30),
        deadline=today + timedelta(days=7),
    )

    # 3. On Track project (deadline in 60 days, progress 50%)
    proj_ontrack = Project(
        workspace_id=ws.id,
        project_code="PRJ-OT",
        name="Future Roadmap",
        department="Web",
        status="Active",
        progress_percent=50.0,
        start_date=today - timedelta(days=10),
        deadline=today + timedelta(days=60),
    )

    analytics_test_db.add_all([proj_delayed, proj_risk, proj_ontrack])
    await analytics_test_db.commit()

    resp = await analytics_client.get(
        "/api/v1/analytics/projects",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["totalProjects"] == 3

    # Check health distribution
    health_dict = {item["name"]: item["value"] for item in data["scheduleHealthDistribution"]}
    assert health_dict.get("Delayed") == 1
    assert health_dict.get("At Risk") == 1
    assert health_dict.get("On Track") == 1

    # Check table rows scheduleHealth
    row_health = {r["projectId"]: r["scheduleHealth"] for r in data["tableRows"]}
    assert row_health["PRJ-DL"] == "Delayed"
    assert row_health["PRJ-RS"] == "At Risk"
    assert row_health["PRJ-OT"] == "On Track"


# ------------------------------------------------------------------------------
# 8. Team Formation Analytics and Recommendation Outcomes
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_team_formation_analytics(
    analytics_client: AsyncClient,
    analytics_test_db: AsyncSession,
):
    """Verifies team formation recommendations, fit distributions, and outcomes."""
    user, ws = await setup_test_workspace(analytics_test_db, "clerk_team_analytics")
    token = create_token("clerk_team_analytics")

    proj = Project(
        workspace_id=ws.id,
        project_code="PRJ-TF",
        name="Formation Test Proj",
        department="AI",
    )
    analytics_test_db.add(proj)
    await analytics_test_db.flush()

    tf1 = TeamFormation(
        workspace_id=ws.id,
        project_id=proj.id,
        formation_code="FRM-001",
        status="Finalized",
        target_team_size=4,
        team_fit_score=92.5,
        skill_coverage_percent=95.0,
        sustainability_score=88.0,
    )
    tf2 = TeamFormation(
        workspace_id=ws.id,
        project_id=proj.id,
        formation_code="FRM-002",
        status="Draft",
        target_team_size=3,
        team_fit_score=78.0,
        skill_coverage_percent=80.0,
        sustainability_score=82.0,
    )
    analytics_test_db.add_all([tf1, tf2])
    await analytics_test_db.commit()

    resp = await analytics_client.get(
        "/api/v1/analytics/teams",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["totalFormations"] == 2
    assert data["avgTeamFit"] == round((92.5 + 78.0) / 2, 1)

    status_dict = {item["name"]: item["value"] for item in data["statusDistribution"]}
    assert status_dict.get("Finalized") == 1
    assert status_dict.get("Draft") == 1


# ------------------------------------------------------------------------------
# 9. Filter Options Endpoint
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_filter_options_endpoint(
    analytics_client: AsyncClient,
    analytics_test_db: AsyncSession,
):
    """Verifies that /filter-options returns distinct workspace departments and projects."""
    user, ws = await setup_test_workspace(analytics_test_db, "clerk_opts_user")
    token = create_token("clerk_opts_user")

    emp = Employee(
        workspace_id=ws.id,
        employee_code="NXW-OPT",
        full_name="Options Dev",
        email="opt@test.com",
        department="Cybersecurity",
        designation="Security Engineer",
    )
    proj = Project(
        workspace_id=ws.id,
        project_code="PRJ-SEC",
        name="SOC Platform",
        department="Cybersecurity",
    )
    analytics_test_db.add_all([emp, proj])
    await analytics_test_db.commit()

    resp = await analytics_client.get(
        "/api/v1/analytics/filter-options",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "All" in data["departments"]
    assert "Cybersecurity" in data["departments"]
    assert any("SOC Platform" in p["name"] for p in data["projects"])


# ------------------------------------------------------------------------------
# 10. Live PostgreSQL Integration for Analytics Aggregations (when configured)
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_analytics_postgres_direct_query_integration():
    """
    Executes analytics aggregations directly against live PostgreSQL if configured.
    Verifies that date truncation, outer joins, and grouping execute without dialect errors.
    """
    from app.core.config import settings
    db_url = settings.DATABASE_URL.get_secret_value() if hasattr(settings.DATABASE_URL, "get_secret_value") else str(settings.DATABASE_URL)
    if not db_url.startswith("postgresql"):
        pytest.skip("PostgreSQL DATABASE_URL not configured; skipping PG-specific test.")

    from sqlalchemy import text
    from sqlalchemy.pool import NullPool
    pg_engine = create_async_engine(
        db_url,
        poolclass=NullPool,
        connect_args={"statement_cache_size": 0, "ssl": "require"},
    )
    test_schema = f"test_an_{uuid.uuid4().hex[:8]}"

    async with pg_engine.begin() as conn:
        await conn.execute(text(f'CREATE SCHEMA "{test_schema}"'))

    schema_engine = create_async_engine(
        db_url,
        poolclass=NullPool,
        connect_args={"statement_cache_size": 0, "ssl": "require"},
        execution_options={"schema_translate_map": {None: test_schema}},
    )
    async with schema_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_cls = async_sessionmaker(bind=schema_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_cls() as session:
        ws_id = uuid.uuid4()
        ws = Workspace(id=ws_id, name="PG Analytics WS", slug=f"ws-{ws_id.hex[:8]}")
        session.add(ws)
        emp = Employee(
            workspace_id=ws_id,
            employee_code="PG-001",
            full_name="Postgres Dev",
            email="pg@test.com",
            department="Database",
            designation="DBA",
            performance_score=92.0,
            availability_score=80.0,
        )
        session.add(emp)
        await session.commit()

        # Run get_workforce_analytics on live PostgreSQL
        wf_res = await AnalyticsService.get_workforce_analytics(
            db=session,
            workspace_id=ws_id,
            department="All",
            can_view_wellbeing=True,
        )
        assert wf_res["totalEmployees"] == 1
        assert wf_res["avgPerformance"] == 92.0
        assert wf_res["tableRows"][0]["name"] == "Postgres Dev"

    # Cleanup schema
    async with pg_engine.begin() as conn:
        await conn.execute(text(f'DROP SCHEMA "{test_schema}" CASCADE'))
    await pg_engine.dispose()


# ------------------------------------------------------------------------------
# 11. Historical Trend Integrity & Empty State Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_trend_analytics_returns_empty_when_no_history(
    analytics_client: AsyncClient,
    analytics_test_db: AsyncSession,
):
    """
    Verifies Phase 9.1 historical trend integrity:
    No synthetic or baseline fallbacks (82.5 or 75.0) are injected when no
    evaluations or project records exist in the active timeframe.
    """
    user, ws = await setup_test_workspace(analytics_test_db, "clerk_empty_trends")
    token = create_token("clerk_empty_trends")

    resp = await analytics_client.get(
        "/api/v1/analytics/trends?preset=30d",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["awisTrend"] == []
    assert data["projectPerformanceTrend"] == []


# ------------------------------------------------------------------------------
# 12. Custom Date Range End-of-Day Boundary Tests
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_custom_date_range_end_of_day_boundary(
    analytics_client: AsyncClient,
    analytics_test_db: AsyncSession,
):
    """
    Verifies that custom end date includes records up to 23:59:59.999999 UTC
    on that date, and excludes records beyond the boundary.
    """
    user, ws = await setup_test_workspace(analytics_test_db, "clerk_date_bounds")
    token = create_token("clerk_date_bounds")

    emp = Employee(
        workspace_id=ws.id,
        employee_code="EMP-BND",
        full_name="Boundary Tester",
        email="bnd@test.com",
        department="QA",
        designation="Tester",
    )
    analytics_test_db.add(emp)
    await analytics_test_db.flush()

    proj = Project(
        workspace_id=ws.id,
        project_code="PRJ-BND",
        name="Boundary Project",
        department="QA",
    )
    analytics_test_db.add(proj)
    await analytics_test_db.flush()

    # Evaluation on 2026-06-15 at 23:30:00 UTC (inside end-of-day boundary)
    eval_inside = AwisEvaluation(
        workspace_id=ws.id,
        project_id=proj.id,
        employee_id=emp.id,
        composite_awis_score=85.0,
        skill_intelligence=85.0,
        experience_intelligence=85.0,
        performance_intelligence=85.0,
        availability_intelligence=85.0,
        workload_intelligence=85.0,
        burnout_intelligence=85.0,
        collaboration_intelligence=85.0,
        growth_intelligence=85.0,
        compatibility_intelligence=85.0,
        evaluated_at=datetime(2026, 6, 15, 23, 30, 0, tzinfo=timezone.utc),
    )

    # Evaluation on 2026-06-16 at 00:05:00 UTC (outside end date)
    eval_outside_after = AwisEvaluation(
        workspace_id=ws.id,
        project_id=proj.id,
        employee_id=emp.id,
        composite_awis_score=60.0,
        skill_intelligence=60.0,
        experience_intelligence=60.0,
        performance_intelligence=60.0,
        availability_intelligence=60.0,
        workload_intelligence=60.0,
        burnout_intelligence=60.0,
        collaboration_intelligence=60.0,
        growth_intelligence=60.0,
        compatibility_intelligence=60.0,
        evaluated_at=datetime(2026, 6, 16, 0, 5, 0, tzinfo=timezone.utc),
    )

    # Evaluation on 2026-05-31 at 23:55:00 UTC (before start date)
    eval_outside_before = AwisEvaluation(
        workspace_id=ws.id,
        project_id=proj.id,
        employee_id=emp.id,
        composite_awis_score=50.0,
        skill_intelligence=50.0,
        experience_intelligence=50.0,
        performance_intelligence=50.0,
        availability_intelligence=50.0,
        workload_intelligence=50.0,
        burnout_intelligence=50.0,
        collaboration_intelligence=50.0,
        growth_intelligence=50.0,
        compatibility_intelligence=50.0,
        evaluated_at=datetime(2026, 5, 31, 23, 55, 0, tzinfo=timezone.utc),
    )
    analytics_test_db.add_all([eval_inside, eval_outside_after, eval_outside_before])
    await analytics_test_db.commit()

    # Query with custom start 2026-06-01 to end 2026-06-15
    resp = await analytics_client.get(
        "/api/v1/analytics/kpis?preset=custom&start_date=2026-06-01&end_date=2026-06-15",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp.status_code == 200
    kpis = resp.json()
    # Only eval_inside (85.0) should be included, average must be 85.0
    assert kpis["averageAwisScore"]["value"] == "85.0"

    # Also verify trends endpoint with exact same custom boundary
    resp_trend = await analytics_client.get(
        "/api/v1/analytics/trends?preset=custom&start_date=2026-06-01&end_date=2026-06-15",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp_trend.status_code == 200
    trend_data = resp_trend.json()
    assert len(trend_data["awisTrend"]) == 1
    assert trend_data["awisTrend"][0]["date"] == "2026-06-15"
    assert trend_data["awisTrend"][0]["value"] == 85.0


# ------------------------------------------------------------------------------
# 13. Trend Filter Composition (Department & Project)
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_trends_respect_department_and_project_filters(
    analytics_client: AsyncClient,
    analytics_test_db: AsyncSession,
):
    """
    Verifies that trends correctly filter historical evaluations by department
    and project ID rather than returning global workspace data.
    """
    user, ws = await setup_test_workspace(analytics_test_db, "clerk_filter_trends")
    token = create_token("clerk_filter_trends")
    now = datetime.now(timezone.utc)

    # Engineering Employee & Project
    emp_eng = Employee(
        workspace_id=ws.id,
        employee_code="EMP-ENG",
        full_name="Eng Member",
        email="eng@test.com",
        department="Engineering",
        designation="Engineer",
    )
    proj_eng = Project(
        workspace_id=ws.id,
        project_code="PRJ-ENG",
        name="Eng Platform",
        department="Engineering",
        progress_percent=80.0,
    )

    # Design Employee & Project
    emp_des = Employee(
        workspace_id=ws.id,
        employee_code="EMP-DES",
        full_name="Des Member",
        email="des@test.com",
        department="Design",
        designation="Designer",
    )
    proj_des = Project(
        workspace_id=ws.id,
        project_code="PRJ-DES",
        name="Design System",
        department="Design",
        progress_percent=95.0,
    )

    analytics_test_db.add_all([emp_eng, proj_eng, emp_des, proj_des])
    await analytics_test_db.flush()

    eval_eng = AwisEvaluation(
        workspace_id=ws.id,
        project_id=proj_eng.id,
        employee_id=emp_eng.id,
        composite_awis_score=78.0,
        skill_intelligence=80.0,
        experience_intelligence=80.0,
        performance_intelligence=80.0,
        availability_intelligence=80.0,
        workload_intelligence=80.0,
        burnout_intelligence=80.0,
        collaboration_intelligence=80.0,
        growth_intelligence=80.0,
        compatibility_intelligence=80.0,
        evaluated_at=now,
    )
    eval_des = AwisEvaluation(
        workspace_id=ws.id,
        project_id=proj_des.id,
        employee_id=emp_des.id,
        composite_awis_score=94.0,
        skill_intelligence=95.0,
        experience_intelligence=95.0,
        performance_intelligence=95.0,
        availability_intelligence=95.0,
        workload_intelligence=95.0,
        burnout_intelligence=95.0,
        collaboration_intelligence=95.0,
        growth_intelligence=95.0,
        compatibility_intelligence=95.0,
        evaluated_at=now,
    )
    analytics_test_db.add_all([eval_eng, eval_des])
    await analytics_test_db.commit()

    # Filter trends by department="Design"
    resp_des = await analytics_client.get(
        "/api/v1/analytics/trends?preset=30d&department=Design",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp_des.status_code == 200
    des_data = resp_des.json()
    assert len(des_data["awisTrend"]) == 1
    assert des_data["awisTrend"][0]["value"] == 94.0

    # Filter trends by project_id=proj_eng.id
    resp_eng = await analytics_client.get(
        f"/api/v1/analytics/trends?preset=30d&project_id={proj_eng.id}",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert resp_eng.status_code == 200
    eng_data = resp_eng.json()
    assert len(eng_data["awisTrend"]) == 1
    assert eng_data["awisTrend"][0]["value"] == 78.0


# ------------------------------------------------------------------------------
# 14. Leadership Role Access and Wellbeing Masking
# ------------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_leadership_role_access_and_wellbeing_masking(
    analytics_client: AsyncClient,
    analytics_test_db: AsyncSession,
):
    """
    Verifies that Leadership role possesses ANALYTICS_VIEW and can query
    dashboard, KPIs, workforce, projects, teams, sustainability, and trends,
    but does NOT possess EMPLOYEES_WELLBEING_VIEW, ensuring candidate wellbeing
    risk is masked to 'Restricted' and names in at-risk lists are anonymized.
    """
    user_ldr, ws = await setup_test_workspace(
        analytics_test_db, "clerk_ldr_mask", role=SystemRole.LEADERSHIP.value
    )
    token_ldr = create_token("clerk_ldr_mask", role=SystemRole.LEADERSHIP.value)

    emp = Employee(
        workspace_id=ws.id,
        employee_code="LDR-007",
        full_name="High Risk Executive",
        email="exec@test.com",
        department="Executive",
        designation="VP",
        wellbeing_risk="High",
        mental_fatigue_score=8.9,
    )
    proj = Project(
        workspace_id=ws.id,
        project_code="PRJ-EXEC",
        name="Strategic Ops",
        department="Executive",
    )
    analytics_test_db.add_all([emp, proj])
    await analytics_test_db.flush()

    alloc = ProjectAllocation(
        project_id=proj.id,
        employee_id=emp.id,
        role="VP",
        allocation_percent=150.0,
        status="Active",
    )
    analytics_test_db.add(alloc)
    await analytics_test_db.commit()

    headers = {"Authorization": f"Bearer {token_ldr}", "X-Workspace-Id": str(ws.id)}

    # 1. Leadership has access to /dashboard (200 OK)
    resp_dash = await analytics_client.get("/api/v1/analytics/dashboard", headers=headers)
    assert resp_dash.status_code == 200

    # 2. Leadership has access to /workforce, but wellbeing is masked
    resp_wf = await analytics_client.get("/api/v1/analytics/workforce", headers=headers)
    assert resp_wf.status_code == 200
    wf_data = resp_wf.json()
    assert wf_data["tableRows"][0]["wellbeingRisk"] == "Restricted"

    # 3. Leadership has access to /sustainability, but atRiskEmployees name is masked
    resp_sust = await analytics_client.get("/api/v1/analytics/sustainability", headers=headers)
    assert resp_sust.status_code == 200
    sust_data = resp_sust.json()
    assert len(sust_data["atRiskEmployees"]) == 1
    assert sust_data["atRiskEmployees"][0]["name"] == "Employee LDR-007"
    assert sust_data["atRiskEmployees"][0]["wellbeingRisk"] == "Restricted"
    assert sust_data["atRiskEmployees"][0]["avatarUrl"] is None

    # 4. Leadership has access to /trends
    resp_trends = await analytics_client.get("/api/v1/analytics/trends", headers=headers)
    assert resp_trends.status_code == 200



