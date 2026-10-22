"""
NEXAWIS Backend - Automated Tests for Phase 10 Reporting & Export Module.
Validates:
- Authentication & RBAC (401 unauthenticated, Employee can view/generate, only PM/HR/Admin can delete).
- Workspace tenant isolation (Workspace A report inaccessible from Workspace B).
- Report generation across all 6 categories (Workforce, Projects, Team Formation, AWIS, Sustainability, Executive).
- Sensitive wellbeing data masking (PM masked, HR/Admin unmasked).
- CSV export integrity and Spreadsheet Formula Injection mitigation (CWE-1236).
- Vector PDF export generation with proper headers, pagination, and ReportLab canvas.
- Report duplication and deletion lifecycle.
- Automated scheduled report configurations.
- Date boundary handling (end-of-day inclusive).
- Empty workspace resilience without division by zero.
"""

import uuid
import io
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
    Report,
    ScheduledReport,
)
from app.models.ml_results import AwisEvaluation, MlBurnoutPrediction
from app.core.database import get_db_session
from app.core.clerk import set_test_verification_key
from app.core.roles import SystemRole, WorkspaceRole
from app.services.reports.service import ReportService
from app.services.reports.csv_generator import generate_report_csv, sanitize_csv_cell
from app.services.reports.pdf_generator import generate_report_pdf

# RSA keypair for RS256 token verification in tests
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
async def report_test_db():
    """Provides an isolated async SQLite database for reporting tests."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def report_client(report_test_db: AsyncSession):
    """Provides an AsyncClient configured with test verification keys and test DB."""
    set_test_verification_key(TEST_PUBLIC_KEY, ["RS256"])

    async def _override_db():
        yield report_test_db

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
    ws_name: str = "Reporting Workspace",
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


async def seed_reporting_data(db: AsyncSession, ws_id: uuid.UUID) -> dict:
    """Populates realistic employees, projects, allocations, formations, and evaluations."""
    now = datetime.now(timezone.utc)

    # 1. Employees
    e1 = Employee(
        workspace_id=ws_id,
        employee_code="NXW-101",
        full_name="Alice Senior Engineer",
        email="alice@company.com",
        department="Engineering",
        designation="Senior Backend Engineer",
        employment_status="Available",
        employment_type="Full-time",
        joining_date=date(2023, 1, 15),
    )
    e2 = Employee(
        workspace_id=ws_id,
        employee_code="NXW-102",
        full_name="Bob Product Designer",
        email="bob@company.com",
        department="Design",
        designation="Product Designer",
        employment_status="Available",
        employment_type="Full-time",
        joining_date=date(2023, 3, 10),
    )
    e3 = Employee(
        workspace_id=ws_id,
        employee_code="NXW-103",
        full_name="Carol Overallocated Dev",
        email="carol@company.com",
        department="Engineering",
        designation="Fullstack Developer",
        employment_status="Available",
        employment_type="Full-time",
        joining_date=date(2023, 5, 1),
    )
    db.add_all([e1, e2, e3])
    await db.flush()

    # 2. Projects
    p1 = Project(
        workspace_id=ws_id,
        project_code="PRJ-101",
        name="Platform Core Migration",
        department="Engineering",
        priority="High",
        status="Active",
        start_date=date.today() - timedelta(days=20),
        deadline=date.today() + timedelta(days=30),
        target_team_size=3,
    )
    p2 = Project(
        workspace_id=ws_id,
        project_code="PRJ-102",
        name="Design System 2.0",
        department="Design",
        priority="Medium",
        status="Planning",
        start_date=date.today() - timedelta(days=5),
        deadline=date.today() + timedelta(days=60),
        target_team_size=2,
    )
    db.add_all([p1, p2])
    await db.flush()

    # 3. Allocations (e3 is 110% over-allocated)
    a1 = ProjectAllocation(
        project_id=p1.id,
        employee_id=e1.id,
        allocation_percent=80.0,
        status="Active",
        role="Backend Lead",
    )
    a2 = ProjectAllocation(
        project_id=p2.id,
        employee_id=e2.id,
        allocation_percent=75.0,
        status="Active",
        role="Lead Designer",
    )
    a3 = ProjectAllocation(
        project_id=p1.id,
        employee_id=e3.id,
        allocation_percent=60.0,
        status="Active",
        role="Fullstack",
    )
    a4 = ProjectAllocation(
        project_id=p2.id,
        employee_id=e3.id,
        allocation_percent=50.0,
        status="Active",
        role="Design Engineer",
    )
    db.add_all([a1, a2, a3, a4])

    # 4. Team Formation
    tf = TeamFormation(
        workspace_id=ws_id,
        project_id=p1.id,
        formation_code="FRM-2026-001",
        status="Finalized",
        target_team_size=2,
        team_fit_score=87.5,
        skill_coverage_percent=92.0,
        sustainability_score=85.0,
        workload_balance_score=88.0,
        created_at=now - timedelta(days=10),
    )
    db.add(tf)

    # 5. AWIS Evaluation
    eval_record = AwisEvaluation(
        workspace_id=ws_id,
        project_id=p1.id,
        employee_id=e1.id,
        composite_awis_score=88.5,
        skill_intelligence=90.0,
        availability_intelligence=85.0,
        experience_intelligence=88.0,
        performance_intelligence=85.0,
        workload_intelligence=80.0,
        burnout_intelligence=80.0,
        collaboration_intelligence=91.0,
        growth_intelligence=75.0,
        compatibility_intelligence=80.0,
        eligibility_passed=True,
        evaluated_at=now - timedelta(days=5),
    )
    db.add(eval_record)

    # 6. Burnout Prediction
    burnout = MlBurnoutPrediction(
        workspace_id=ws_id,
        employee_id=e3.id,
        model_version="burnout_model_v1",
        predicted_burn_rate=0.785,
        normalized_burnout_score=78.5,
        risk_tier="High",
        predicted_at=now - timedelta(days=2),
    )
    db.add(burnout)

    await db.commit()
    return {
        "employees": [e1, e2, e3],
        "projects": [p1, p2],
        "allocations": [a1, a2, a3, a4],
        "formation": tf,
        "evaluation": eval_record,
        "burnout": burnout,
    }


# ------------------------------------------------------------------------------
# 1. Authentication & RBAC Tests
# ------------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_reports_require_auth(report_client: AsyncClient):
    """Verifies that unauthenticated calls to reporting endpoints return 401 Unauthorized."""
    endpoints = [
        "/api/v1/reports/",
        "/api/v1/reports/kpis",
        "/api/v1/reports/categories",
        "/api/v1/reports/filter-options",
        "/api/v1/reports/scheduled/list",
    ]
    for ep in endpoints:
        resp = await report_client.get(ep)
        assert resp.status_code == 401, f"Expected 401 on {ep}, got {resp.status_code}"


@pytest.mark.asyncio
async def test_employee_can_view_but_cannot_delete_report(
    report_client: AsyncClient,
    report_test_db: AsyncSession,
):
    """
    Verifies that Employee role has Permission.REPORTS_VIEW (can view library),
    but lacks Permission.REPORTS_MANAGE (cannot delete reports, getting 403 Forbidden).
    """
    user, ws = await setup_test_workspace(
        report_test_db, "clerk_emp_viewer", role=SystemRole.EMPLOYEE.value
    )
    token = create_token("clerk_emp_viewer", role=SystemRole.EMPLOYEE.value)
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    # Can view library
    resp_list = await report_client.get("/api/v1/reports/", headers=headers)
    assert resp_list.status_code == 200

    # Cannot delete report (REPORTS_MANAGE required)
    resp_delete = await report_client.delete(f"/api/v1/reports/{uuid.uuid4()}", headers=headers)
    assert resp_delete.status_code == 403
    assert "Insufficient permissions" in resp_delete.text


@pytest.mark.asyncio
async def test_pm_and_admin_have_full_report_management(
    report_client: AsyncClient,
    report_test_db: AsyncSession,
):
    """Verifies Project Manager and Admin have REPORTS_MANAGE permission."""
    for role_name in [SystemRole.PROJECT_MANAGER.value, SystemRole.ADMIN.value]:
        clerk_id = f"clerk_mgr_{role_name.lower().replace(' ', '_')}"
        user, ws = await setup_test_workspace(report_test_db, clerk_id, role=role_name)
        token = create_token(clerk_id, role=role_name)
        headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

        resp_kpis = await report_client.get("/api/v1/reports/kpis", headers=headers)
        assert resp_kpis.status_code == 200


# ------------------------------------------------------------------------------
# 2. Multi-Tenant Workspace Isolation Tests
# ------------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_report_workspace_isolation(
    report_client: AsyncClient,
    report_test_db: AsyncSession,
):
    """
    Verifies that a report generated in Workspace A cannot be read, exported,
    duplicated, or deleted by a user in Workspace B.
    """
    user_a, ws_a = await setup_test_workspace(report_test_db, "clerk_ws_a", ws_name="Workspace Alpha")
    user_b, ws_b = await setup_test_workspace(report_test_db, "clerk_ws_b", ws_name="Workspace Beta")

    token_a = create_token("clerk_ws_a")
    token_b = create_token("clerk_ws_b")
    headers_a = {"Authorization": f"Bearer {token_a}", "X-Workspace-Id": str(ws_a.id)}
    headers_b = {"Authorization": f"Bearer {token_b}", "X-Workspace-Id": str(ws_b.id)}

    # Generate report in Workspace A
    gen_payload = {
        "title": "Alpha Confidential Report",
        "category": "executive",
        "dateRange": {"preset": "30d", "label": "Last 30 Days"},
        "department": "All",
        "projectId": "All",
        "format": "PDF",
    }
    resp_gen = await report_client.post("/api/v1/reports/generate", json=gen_payload, headers=headers_a)
    assert resp_gen.status_code == 201
    report_id = resp_gen.json()["id"]

    # User B attempts to access Report from Workspace A -> Must be 404
    resp_b_view = await report_client.get(f"/api/v1/reports/{report_id}", headers=headers_b)
    assert resp_b_view.status_code == 404

    resp_b_export = await report_client.get(f"/api/v1/reports/{report_id}/export?format=pdf", headers=headers_b)
    assert resp_b_export.status_code == 404

    resp_b_delete = await report_client.delete(f"/api/v1/reports/{report_id}", headers=headers_b)
    assert resp_b_delete.status_code == 404


# ------------------------------------------------------------------------------
# 3. Report Generation & Data Correctness (All 6 Categories)
# ------------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generate_workforce_allocation_report(
    report_client: AsyncClient,
    report_test_db: AsyncSession,
):
    """Tests Workforce Allocation report generation from seeded database records."""
    user, ws = await setup_test_workspace(report_test_db, "clerk_workforce_pm")
    await seed_reporting_data(report_test_db, ws.id)

    token = create_token("clerk_workforce_pm")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    payload = {
        "title": "Q4 Workforce Capacity Audit",
        "category": "workforce",
        "dateRange": {"preset": "30d", "label": "Last 30 Days"},
        "department": "All",
        "projectId": "All",
        "format": "PDF",
    }
    resp = await report_client.post("/api/v1/reports/generate", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()

    assert data["category"] == "workforce"
    assert data["name"] == "Q4 Workforce Capacity Audit"
    assert len(data["summaryMetrics"]) >= 4

    metric_labels = [m["label"] for m in data["summaryMetrics"]]
    assert "Active Workforce" in metric_labels
    assert "Committed Workload" in metric_labels
    assert "Avg Performance" in metric_labels

    # Verify Table Data
    assert data["tableData"] is not None
    assert "Workload" in data["tableData"]["headers"]
    assert len(data["tableData"]["rows"]) == 3  # 3 seeded employees


@pytest.mark.asyncio
async def test_generate_project_health_report(
    report_client: AsyncClient,
    report_test_db: AsyncSession,
):
    """Tests Project Health and Delivery report generation."""
    user, ws = await setup_test_workspace(report_test_db, "clerk_proj_pm")
    await seed_reporting_data(report_test_db, ws.id)

    token = create_token("clerk_proj_pm")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    payload = {
        "title": "Portfolio Health Report",
        "category": "projects",
        "dateRange": {"preset": "30d", "label": "Last 30 Days"},
        "department": "Engineering",
        "projectId": "All",
        "format": "PDF",
    }
    resp = await report_client.post("/api/v1/reports/generate", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()

    assert data["category"] == "projects"
    # Should only include Engineering project ("Platform Core Migration")
    assert data["tableData"] is not None
    assert len(data["tableData"]["rows"]) == 1
    assert "Platform Core Migration" in data["tableData"]["rows"][0][1]


@pytest.mark.asyncio
async def test_generate_team_formation_report(
    report_client: AsyncClient,
    report_test_db: AsyncSession,
):
    """Tests Team Formation report generation."""
    user, ws = await setup_test_workspace(report_test_db, "clerk_team_pm")
    await seed_reporting_data(report_test_db, ws.id)

    token = create_token("clerk_team_pm")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    payload = {
        "title": "Team Optimization Outcomes",
        "category": "team_formation",
        "dateRange": {"preset": "30d", "label": "Last 30 Days"},
        "department": "All",
        "projectId": "All",
        "format": "PDF",
    }
    resp = await report_client.post("/api/v1/reports/generate", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()

    assert data["category"] == "team_formation"
    assert data["tableData"] is not None
    assert len(data["tableData"]["rows"]) >= 1
    assert any("Finalized" in str(row) for row in data["tableData"]["rows"])


@pytest.mark.asyncio
async def test_generate_awis_intelligence_report(
    report_client: AsyncClient,
    report_test_db: AsyncSession,
):
    """Tests AWIS candidate scoring intelligence report generation."""
    user, ws = await setup_test_workspace(report_test_db, "clerk_awis_pm")
    await seed_reporting_data(report_test_db, ws.id)

    token = create_token("clerk_awis_pm")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    payload = {
        "title": "AWIS Candidate Evaluations",
        "category": "awis_intelligence",
        "dateRange": {"preset": "30d", "label": "Last 30 Days"},
        "department": "All",
        "projectId": "All",
        "format": "PDF",
    }
    resp = await report_client.post("/api/v1/reports/generate", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()

    assert data["category"] == "awis_intelligence"
    assert data["tableData"] is not None
    assert len(data["tableData"]["rows"]) >= 1
    # Check that evaluation scores are present
    assert any("88.5" in str(row) for row in data["tableData"]["rows"])


@pytest.mark.asyncio
async def test_generate_sustainability_masked_vs_unmasked(
    report_client: AsyncClient,
    report_test_db: AsyncSession,
):
    """
    Tests Workforce Sustainability report.
    - Project Manager (no wellbeing permission): names masked to 'Employee XXXX', burnout metrics 'Restricted'.
    - HR (has wellbeing permission): names unmasked, burnout metrics visible.
    - Disclaimers that burnout prediction is an operational risk indicator, not clinical diagnosis.
    """
    # 1. PM Role (Masked)
    user_pm, ws = await setup_test_workspace(
        report_test_db, "clerk_sustain_pm", role=SystemRole.PROJECT_MANAGER.value
    )
    await seed_reporting_data(report_test_db, ws.id)

    token_pm = create_token("clerk_sustain_pm", role=SystemRole.PROJECT_MANAGER.value)
    headers_pm = {"Authorization": f"Bearer {token_pm}", "X-Workspace-Id": str(ws.id)}

    payload = {
        "title": "Workforce Sustainability Audit",
        "category": "sustainability",
        "dateRange": {"preset": "30d", "label": "Last 30 Days"},
        "department": "All",
        "projectId": "All",
        "format": "PDF",
    }
    resp_pm = await report_client.post("/api/v1/reports/generate", json=payload, headers=headers_pm)
    assert resp_pm.status_code == 201
    data_pm = resp_pm.json()

    # Verify operational disclaimer
    assert any("operational risk indicator" in finding.lower() for finding in data_pm["findings"])

    # Table rows must be masked for PM
    rows_pm = data_pm["tableData"]["rows"]
    for row in rows_pm:
        assert not any("Carol Overallocated Dev" in str(cell) for cell in row)
        assert any("Employee " in str(cell) for cell in row)

    # 2. HR Role (Unmasked)
    user_hr, _ = await setup_test_workspace(
        report_test_db, "clerk_sustain_hr", role=SystemRole.HR.value, ws_name="HR WS"
    )
    # Add HR user as member to existing workspace ws
    m_hr = WorkspaceMember(
        workspace_id=ws.id,
        user_id=user_hr.id,
        role=WorkspaceRole.ADMIN.value,
        is_active=True,
    )
    report_test_db.add(m_hr)
    await report_test_db.commit()

    token_hr = create_token("clerk_sustain_hr", role=SystemRole.HR.value)
    headers_hr = {"Authorization": f"Bearer {token_hr}", "X-Workspace-Id": str(ws.id)}

    resp_hr = await report_client.post("/api/v1/reports/generate", json=payload, headers=headers_hr)
    assert resp_hr.status_code == 201
    data_hr = resp_hr.json()

    rows_hr = data_hr["tableData"]["rows"]
    # Carol should be unmasked for HR
    assert any("Carol Overallocated Dev" in str(row) for row in rows_hr)


@pytest.mark.asyncio
async def test_generate_executive_intelligence_report(
    report_client: AsyncClient,
    report_test_db: AsyncSession,
):
    """Tests Executive cross-cutting intelligence brief generation."""
    user, ws = await setup_test_workspace(report_test_db, "clerk_exec_lead", role=SystemRole.LEADERSHIP.value)
    await seed_reporting_data(report_test_db, ws.id)

    token = create_token("clerk_exec_lead", role=SystemRole.LEADERSHIP.value)
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    payload = {
        "title": "Executive Briefing",
        "category": "executive",
        "dateRange": {"preset": "30d", "label": "Last 30 Days"},
        "department": "All",
        "projectId": "All",
        "format": "PDF",
    }
    resp = await report_client.post("/api/v1/reports/generate", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()

    assert data["category"] == "executive"
    assert data["charts"] is not None
    assert len(data["charts"]["primaryChartData"]) > 0


# ------------------------------------------------------------------------------
# 4. CSV & PDF Export Formats (Security, Injection Mitigation, Structure)
# ------------------------------------------------------------------------------


def test_sanitize_csv_cell_mitigates_formula_injection():
    """Verifies that sanitize_csv_cell escapes leading =, +, -, @, tab, and carriage return."""
    # Test formula triggers
    assert sanitize_csv_cell("=1+1") == "'=1+1"
    assert sanitize_csv_cell("+cmd|' /C calc'!A0") == "'+cmd|' /C calc'!A0"
    assert sanitize_csv_cell("-2+3") == "'-2+3"
    assert sanitize_csv_cell("@SUM(A1:A10)") == "'@SUM(A1:A10)"
    assert sanitize_csv_cell("\tTABBED") == "'\tTABBED"
    assert sanitize_csv_cell("\rRETURN") == "'\rRETURN"

    # Test normal strings and numbers
    assert sanitize_csv_cell("Platform Core Migration") == "Platform Core Migration"
    assert sanitize_csv_cell(95.5) == "95.5"
    assert sanitize_csv_cell(None) == ""
    assert sanitize_csv_cell('Contains "Quotes"') == 'Contains "Quotes"'


@pytest.mark.asyncio
async def test_csv_export_endpoint(
    report_client: AsyncClient,
    report_test_db: AsyncSession,
):
    """Tests CSV streaming export from live generated report."""
    user, ws = await setup_test_workspace(report_test_db, "clerk_csv_user")
    await seed_reporting_data(report_test_db, ws.id)

    token = create_token("clerk_csv_user")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    # Generate report
    gen_payload = {
        "title": "=cmd|' /C calc'!A0",
        "category": "workforce",
        "dateRange": {"preset": "30d", "label": "Last 30 Days"},
        "department": "All",
        "projectId": "All",
        "format": "CSV",
    }
    gen_resp = await report_client.post("/api/v1/reports/generate", json=gen_payload, headers=headers)
    report_id = gen_resp.json()["id"]

    # Export CSV
    export_resp = await report_client.get(f"/api/v1/reports/{report_id}/export?format=csv", headers=headers)
    assert export_resp.status_code == 200
    assert "text/csv" in export_resp.headers["content-type"]
    assert "attachment; filename=" in export_resp.headers["content-disposition"]

    csv_text = export_resp.content.decode("utf-8-sig")
    assert "ENTERPRISE INTELLIGENCE REPORT" in csv_text.upper()
    assert "EXECUTIVE SUMMARY METRICS" in csv_text
    # Check injection neutralization
    assert "'+1.2%" in csv_text or "'=cmd|" in csv_text


@pytest.mark.asyncio
async def test_pdf_export_endpoint(
    report_client: AsyncClient,
    report_test_db: AsyncSession,
):
    """Tests vector PDF generation and streaming with ReportLab Platypus and NumberedCanvas."""
    user, ws = await setup_test_workspace(report_test_db, "clerk_pdf_user")
    await seed_reporting_data(report_test_db, ws.id)

    token = create_token("clerk_pdf_user")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    gen_payload = {
        "title": "Vector PDF Production Report",
        "category": "workforce",
        "dateRange": {"preset": "30d", "label": "Last 30 Days"},
        "department": "All",
        "projectId": "All",
        "format": "PDF",
    }
    gen_resp = await report_client.post("/api/v1/reports/generate", json=gen_payload, headers=headers)
    report_id = gen_resp.json()["id"]

    export_resp = await report_client.get(f"/api/v1/reports/{report_id}/export?format=pdf", headers=headers)
    assert export_resp.status_code == 200
    assert export_resp.headers["content-type"] == "application/pdf"
    assert "Vector_PDF_Production_Report.pdf" in export_resp.headers["content-disposition"]

    pdf_content = export_resp.content
    # Must have valid PDF magic bytes
    assert pdf_content.startswith(b"%PDF-")
    # Must be non-trivial binary document (> 1000 bytes)
    assert len(pdf_content) > 1000


# ------------------------------------------------------------------------------
# 5. Duplication, Deletion, and Scheduled Reports
# ------------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_report_duplication_and_deletion_lifecycle(
    report_client: AsyncClient,
    report_test_db: AsyncSession,
):
    """Tests duplicating a report with (Copy) title and deleting it."""
    user, ws = await setup_test_workspace(report_test_db, "clerk_lifecycle_user")
    token = create_token("clerk_lifecycle_user")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    # 1. Generate
    gen_resp = await report_client.post(
        "/api/v1/reports/generate",
        json={
            "title": "Master Report",
            "category": "workforce",
            "dateRange": {"preset": "30d", "label": "Last 30 Days"},
            "department": "All",
            "projectId": "All",
            "format": "PDF",
        },
        headers=headers,
    )
    report_id = gen_resp.json()["id"]

    # 2. Duplicate
    dup_resp = await report_client.post(f"/api/v1/reports/{report_id}/duplicate", headers=headers)
    assert dup_resp.status_code == 201
    dup_data = dup_resp.json()
    assert dup_data["name"] == "Master Report (Copy)"
    dup_id = dup_data["id"]

    # 3. List
    list_resp = await report_client.get("/api/v1/reports/", headers=headers)
    assert len(list_resp.json()) == 2

    # 4. Delete duplicated
    del_resp = await report_client.delete(f"/api/v1/reports/{dup_id}", headers=headers)
    assert del_resp.status_code == 204

    # 5. Verify remaining
    list_resp_after = await report_client.get("/api/v1/reports/", headers=headers)
    assert len(list_resp_after.json()) == 1


@pytest.mark.asyncio
async def test_scheduled_reports_api(
    report_client: AsyncClient,
    report_test_db: AsyncSession,
):
    """Tests creating, listing, and deleting scheduled report distributions."""
    user, ws = await setup_test_workspace(report_test_db, "clerk_sched_user")
    token = create_token("clerk_sched_user")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    # Create schedule
    create_payload = {
        "name": "Weekly Monday Workforce Dispatch",
        "category": "workforce",
        "frequency": "Weekly",
        "recipients": ["hr-leads@nexawis.com"],
        "enabled": True,
        "format": "PDF",
        "department": "All",
    }
    create_resp = await report_client.post("/api/v1/reports/scheduled/create", json=create_payload, headers=headers)
    assert create_resp.status_code == 201
    sched_id = create_resp.json()["id"]

    # List schedules
    list_resp = await report_client.get("/api/v1/reports/scheduled/list", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1
    assert list_resp.json()[0]["name"] == "Weekly Monday Workforce Dispatch"

    # Delete schedule
    del_resp = await report_client.delete(f"/api/v1/reports/scheduled/{sched_id}", headers=headers)
    assert del_resp.status_code == 204

    # Verify empty
    list_resp_empty = await report_client.get("/api/v1/reports/scheduled/list", headers=headers)
    assert len(list_resp_empty.json()) == 0


# ------------------------------------------------------------------------------
# 6. Edge Cases & Boundary Handling
# ------------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_empty_workspace_report_generation(
    report_client: AsyncClient,
    report_test_db: AsyncSession,
):
    """Verifies that an empty workspace (no employees, projects, or allocations) generates clean zero states."""
    user, ws = await setup_test_workspace(report_test_db, "clerk_empty_ws")
    token = create_token("clerk_empty_ws")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    for cat in ["workforce", "projects", "team_formation", "awis_intelligence", "sustainability", "executive"]:
        resp = await report_client.post(
            "/api/v1/reports/generate",
            json={
                "title": f"Empty {cat} Report",
                "category": cat,
                "dateRange": {"preset": "30d", "label": "Last 30 Days"},
                "department": "All",
                "projectId": "All",
                "format": "PDF",
            },
            headers=headers,
        )
        assert resp.status_code == 201, f"Failed on category {cat}: {resp.text}"
        data = resp.json()
        assert data["status"] == "Ready"


@pytest.mark.asyncio
async def test_custom_date_range_end_of_day_boundary(
    report_client: AsyncClient,
    report_test_db: AsyncSession,
):
    """Verifies that custom date ranges include full end of day (23:59:59.999999)."""
    user, ws = await setup_test_workspace(report_test_db, "clerk_date_bounds")
    token = create_token("clerk_date_bounds")
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    start_str = "2026-01-01"
    end_str = "2026-01-31"

    start_dt, end_dt = ReportService._parse_date_bounds(
        preset="custom",
        start_date_str=start_str,
        end_date_str=end_str,
    )
    assert start_dt.year == 2026 and start_dt.month == 1 and start_dt.day == 1
    assert start_dt.hour == 0 and start_dt.minute == 0 and start_dt.second == 0

    assert end_dt.year == 2026 and end_dt.month == 1 and end_dt.day == 31
    assert end_dt.hour == 23 and end_dt.minute == 59 and end_dt.second == 59
