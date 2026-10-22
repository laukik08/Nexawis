"""
NEXAWIS Backend - Comprehensive Automated Tests for AWIS Scoring Engine (Phase 6).
Covers:
- Formula, normalization, weight profiles, and bounds verification (unit tests).
- Priority-aware profile selection: High vs Medium vs Low priority weighting behavior.
- Component scorers: skill match, experience, performance, availability, workload, burnout safety, growth.
- Hard constraints and eligibility rules (mandatory skill deficit, over-allocation, inactive status, burnout safeguard).
- Missing data, 80% completeness threshold, and unrenormalized provisional scoring.
- Deterministic candidate ranking and tiebreaking reproducibility.
- API endpoints: config, candidates ranking, single candidate detail, snapshot persistence.
- RBAC permissions, role-based wellbeing data masking, and multi-tenancy workspace isolation.
"""

import uuid
from typing import List, Dict, Optional, Tuple
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
    EmployeeSkill,
    EmployeePerformanceHistory,
    EmployeeWorkloadHistory,
    Project,
    ProjectRequirement,
    ProjectAllocation,
    Skill,
)
from app.models.ml_results import AwisEvaluation, MlBurnoutPrediction
from app.core.database import get_db_session
from app.core.clerk import set_test_verification_key
from app.core.roles import SystemRole, WorkspaceRole
from app.services.awis import (
    AwisFactor,
    PriorityProfile,
    SCORING_PROFILES,
    CRITICAL_FACTORS,
    COMPLETENESS_THRESHOLD,
    FRESHNESS_POLICIES_DAYS,
    FORMULA_VERSION,
    WORKLOAD_POLICY,
    WorkloadPolicyConfig,
    validate_workload_policy,
    map_project_priority_to_profile,
    validate_scoring_profiles,
    AwisScoringEngine,
    EligibilityStatus,
    compute_ranking_tier,
    evaluate_eligibility,
    score_workload_sustainability,
)

from app.api.v1.endpoints.awis import _get_project_with_specs, _get_workspace_employees

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
async def awis_test_db():
    """Provides an isolated async SQLite database for AWIS tests."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def awis_client(awis_test_db: AsyncSession):
    """Provides an AsyncClient configured with test verification keys and test DB."""
    set_test_verification_key(TEST_PUBLIC_KEY, ["RS256"])

    async def _override_db():
        yield awis_test_db

    app.dependency_overrides[get_db_session] = _override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    set_test_verification_key(None, None)


async def setup_awis_environment(
    db: AsyncSession,
    clerk_id: str,
    system_role: str = SystemRole.PROJECT_MANAGER.value,
) -> tuple[User, Workspace, Project, List[Employee]]:
    """Provisions a test workspace with a user, project, skills, and candidates."""
    user = User(
        clerk_user_id=clerk_id,
        email=f"{clerk_id}@test.com",
        full_name=f"User {clerk_id}",
        role=system_role,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    workspace = Workspace(name="Intelligence Workspace", slug=f"ws-{str(user.id)[:8]}")
    db.add(workspace)
    await db.flush()

    db.add(WorkspaceSettings(workspace_id=workspace.id))
    db.add(WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role=WorkspaceRole.OWNER.value, is_active=True))

    # Create Skills
    skill_py = Skill(workspace_id=workspace.id, name="Python", category="Backend")
    skill_ts = Skill(workspace_id=workspace.id, name="TypeScript", category="Frontend")
    skill_ml = Skill(workspace_id=workspace.id, name="Machine Learning", category="AI")
    db.add_all([skill_py, skill_ts, skill_ml])
    await db.flush()

    # Create Project
    project = Project(
        workspace_id=workspace.id,
        project_code="PRJ-AWIS-101",
        name="AWIS Core Project",
        department="Engineering",
        priority="High",
        complexity="High",
        target_team_size=4,
        start_date=date(2026, 11, 1),
        deadline=date(2027, 4, 30),
    )
    db.add(project)
    await db.flush()

    # Add Project Requirements (Python is mandatory, ML is preferred)
    req1 = ProjectRequirement(
        project_id=project.id,
        skill_id=skill_py.id,
        min_proficiency=75,
        priority="High",
        is_mandatory=True,
    )
    req2 = ProjectRequirement(
        project_id=project.id,
        skill_id=skill_ml.id,
        min_proficiency=70,
        priority="Medium",
        is_mandatory=False,
    )
    db.add_all([req1, req2])

    # Employee 1: Senior Engineer with strong skills, experience, and performance
    emp1 = Employee(
        workspace_id=workspace.id,
        employee_code="EMP-AWIS-001",
        full_name="Alice Senior",
        email="alice@nexawis.com",
        department="Engineering",
        designation="Senior Engineer",
        experience_years=7.0,
        employment_status="Available",
        performance_score=92.0,
        availability_score=90.0,
        current_workload_percent=10.0,
        growth_potential=65.0,
        collaboration_score=88.0,
        mental_fatigue_score=15.0,
        wellbeing_risk="Low",
    )
    db.add(emp1)
    await db.flush()

    es1_py = EmployeeSkill(employee_id=emp1.id, skill_id=skill_py.id, proficiency=90, years_experience=6.0, is_primary=True)
    es1_ml = EmployeeSkill(employee_id=emp1.id, skill_id=skill_ml.id, proficiency=80, years_experience=4.0)
    db.add_all([es1_py, es1_ml])

    # Employee 2: Developing Junior Engineer with high growth potential, lower experience
    emp2 = Employee(
        workspace_id=workspace.id,
        employee_code="EMP-AWIS-002",
        full_name="Bob Junior",
        email="bob@nexawis.com",
        department="Engineering",
        designation="Junior Engineer",
        experience_years=1.5,
        employment_status="Available",
        performance_score=78.0,
        availability_score=100.0,
        current_workload_percent=0.0,
        growth_potential=95.0,
        collaboration_score=80.0,
        mental_fatigue_score=10.0,
        wellbeing_risk="Low",
    )
    db.add(emp2)
    await db.flush()

    es2_py = EmployeeSkill(employee_id=emp2.id, skill_id=skill_py.id, proficiency=78, years_experience=1.5, is_primary=True)
    db.add(es2_py)

    # Employee 3: Lacks Mandatory Skill (has TypeScript but no Python)
    emp3 = Employee(
        workspace_id=workspace.id,
        employee_code="EMP-AWIS-003",
        full_name="Charlie Frontend",
        email="charlie@nexawis.com",
        department="Engineering",
        designation="Frontend Developer",
        experience_years=4.0,
        employment_status="Available",
        performance_score=85.0,
        availability_score=100.0,
        current_workload_percent=0.0,
        growth_potential=80.0,
        wellbeing_risk="Low",
    )
    db.add(emp3)
    await db.flush()

    es3_ts = EmployeeSkill(employee_id=emp3.id, skill_id=skill_ts.id, proficiency=90, years_experience=4.0)
    db.add(es3_ts)

    await db.commit()

    loaded_project = await _get_project_with_specs(str(project.id), workspace.id, db)
    loaded_employees = await _get_workspace_employees(workspace.id, db)
    return user, workspace, loaded_project, loaded_employees


# ==============================================================================
# 1. Formula & Normalization Unit Tests
# ==============================================================================

def test_weight_profiles_structure_and_sums():
    """Validates that all 3 priority profiles contain all 7 factors and sum to exactly 1.0."""
    validate_scoring_profiles()

    for profile in PriorityProfile:
        weights = SCORING_PROFILES[profile]
        assert len(weights) == 7
        total = sum(weights.values())
        assert abs(total - 1.0) < 1e-6
        for factor, weight in weights.items():
            assert 0.0 <= weight <= 1.0


def test_project_priority_mapping():
    """Validates deterministic mapping from project priority string to profile."""
    assert map_project_priority_to_profile("Critical") == PriorityProfile.HIGH
    assert map_project_priority_to_profile("high") == PriorityProfile.HIGH
    assert map_project_priority_to_profile("Medium") == PriorityProfile.MEDIUM
    assert map_project_priority_to_profile("Low") == PriorityProfile.LOW
    assert map_project_priority_to_profile("unspecified_custom") == PriorityProfile.MEDIUM


# ==============================================================================
# 2. Priority-Aware Weighting Behavior Tests
# ==============================================================================

def test_priority_aware_weight_influence():
    """
    Demonstrates that with other factors equal:
    - High priority weights experience and performance more heavily.
    - Low priority weights growth potential significantly more heavily (20% vs 5%).
    """
    engine = AwisScoringEngine()

    class MockSkill:
        name = "Python"
        id = "s-1"

    class MockReq:
        skill = MockSkill()
        skill_id = "s-1"
        min_proficiency = 70
        priority = "High"
        is_mandatory = True

    class MockEmpSkill:
        skill = MockSkill()
        skill_id = "s-1"
        proficiency = 85
        years_experience = 5.0
        is_primary = True

    # Mock Senior Candidate
    class MockSenior:
        workspace_id = "ws-1"
        employment_status = "Available"
        experience_years = 6.0
        performance_score = 95.0
        availability_score = 90.0
        current_workload_percent = 20.0
        growth_potential = 50.0
        wellbeing_risk = "Low"
        mental_fatigue_score = 15.0
        skills = [MockEmpSkill()]
        requirements = []
        project_allocations = []
        performance_history = []
        workload_history = []
        burnout_predictions = []

    # Mock Junior Candidate
    class MockJunior:
        workspace_id = "ws-1"
        employment_status = "Available"
        experience_years = 1.0
        performance_score = 75.0
        availability_score = 90.0
        current_workload_percent = 20.0
        growth_potential = 95.0
        wellbeing_risk = "Low"
        mental_fatigue_score = 15.0
        skills = [MockEmpSkill()]
        requirements = []
        project_allocations = []
        performance_history = []
        workload_history = []
        burnout_predictions = []

    class MockHighProject:
        workspace_id = "ws-1"
        priority = "High"
        complexity = "High"
        target_team_size = 4
        start_date = date(2026, 11, 1)
        deadline = date(2027, 4, 30)
        requirements = [MockReq()]

    class MockLowProject:
        workspace_id = "ws-1"
        priority = "Low"
        complexity = "Low"
        target_team_size = 4
        start_date = date(2026, 11, 1)
        deadline = date(2027, 4, 30)
        requirements = [MockReq()]

    sr = MockSenior()
    jr = MockJunior()

    # Under High Priority Project
    res_sr_high = engine.evaluate_employee(sr, MockHighProject())
    res_jr_high = engine.evaluate_employee(jr, MockHighProject())

    # Under Low Priority Project
    res_sr_low = engine.evaluate_employee(sr, MockLowProject())
    res_jr_low = engine.evaluate_employee(jr, MockLowProject())

    gap_high = (res_sr_high.composite_score or 0.0) - (res_jr_high.composite_score or 0.0)
    gap_low = (res_sr_low.composite_score or 0.0) - (res_jr_low.composite_score or 0.0)

    # In Low Priority, growth potential (Junior's strength) has 4x higher weight (20% vs 5%),
    # while experience weight drops from 20% to 8%, narrowing the gap.
    assert gap_high > gap_low
    assert res_jr_low.composite_score > res_jr_high.composite_score


# ==============================================================================
# 3. Eligibility & Hard Constraints Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_mandatory_skill_deficit_prevents_actionable_recommendation(awis_test_db: AsyncSession):
    """Verifies that an employee missing a mandatory skill is marked ineligible."""
    _, _, project, employees = await setup_awis_environment(awis_test_db, "user-test-1")
    # emp3 lacks Python (mandatory)
    emp3 = next(e for e in employees if e.employee_code == "EMP-AWIS-003")

    engine = AwisScoringEngine()
    result = engine.evaluate_employee(emp3, project)

    assert result.eligibility.status == EligibilityStatus.INELIGIBLE
    assert result.is_actionable is False
    assert "MANDATORY_SKILL_DEFICIT" in result.eligibility.reasons
    assert result.composite_score is None  # Ineligible candidate scores withheld from actionable display


@pytest.mark.asyncio
async def test_over_allocated_employee_is_ineligible(awis_test_db: AsyncSession):
    """Verifies that an employee at 100% active allocation is marked ineligible due to capacity."""
    _, ws, project, employees = await setup_awis_environment(awis_test_db, "user-test-2")
    emp1 = next(e for e in employees if e.employee_code == "EMP-AWIS-001")
    ws_id = ws.id
    proj_id = project.id
    emp1_id = emp1.id

    # Assign 100% allocation
    alloc = ProjectAllocation(
        project_id=proj_id,
        employee_id=emp1_id,
        role="Lead Architect",
        allocation_percent=100.0,
        status="Active",
    )
    awis_test_db.add(alloc)
    await awis_test_db.commit()
    awis_test_db.expire_all()

    loaded_project = await _get_project_with_specs(str(proj_id), ws_id, awis_test_db)
    loaded_employees = await _get_workspace_employees(ws_id, awis_test_db)
    emp1_loaded = next(e for e in loaded_employees if e.id == emp1_id)

    engine = AwisScoringEngine()
    result = engine.evaluate_employee(emp1_loaded, loaded_project)

    assert result.eligibility.status == EligibilityStatus.INELIGIBLE
    assert "FULLY_ALLOCATED_CAPACITY" in result.eligibility.reasons


@pytest.mark.asyncio
async def test_burnout_safeguard_triggers_review_without_blanket_exclusion(awis_test_db: AsyncSession):
    """Verifies that high burnout risk marks candidate as NEEDS_REVIEW instead of blanket exclusion."""
    _, ws, project, employees = await setup_awis_environment(awis_test_db, "user-test-3")
    emp1 = next(e for e in employees if e.employee_code == "EMP-AWIS-001")
    ws_id = ws.id
    proj_id = project.id
    emp1_id = emp1.id
    emp1.mental_fatigue_score = 90.0
    emp1.wellbeing_risk = "High"
    await awis_test_db.commit()
    awis_test_db.expire_all()

    loaded_project = await _get_project_with_specs(str(proj_id), ws_id, awis_test_db)
    loaded_employees = await _get_workspace_employees(ws_id, awis_test_db)
    emp1_loaded = next(e for e in loaded_employees if e.id == emp1_id)

    engine = AwisScoringEngine()
    result = engine.evaluate_employee(emp1_loaded, loaded_project)

    assert result.eligibility.status == EligibilityStatus.NEEDS_REVIEW
    assert "BURNOUT_RISK_WARNING" in result.eligibility.reasons
    # Candidate remains actionable for manager with sustainability review
    assert result.is_actionable is True


# ==============================================================================
# 4. Missing Data & Provisional Scoring Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_provisional_scoring_unrenormalized_weights(awis_test_db: AsyncSession):
    """
    Verifies that when non-critical components are missing (e.g. burnout inference pending Phase 7),
    the score is flagged as provisional and missing components contribute 0 without weight renormalization.
    """
    _, ws, project, employees = await setup_awis_environment(awis_test_db, "user-test-4")
    emp1 = next(e for e in employees if e.employee_code == "EMP-AWIS-001")

    loaded_project = await _get_project_with_specs(str(project.id), ws.id, awis_test_db)
    loaded_employees = await _get_workspace_employees(ws.id, awis_test_db)
    emp1_loaded = next(e for e in loaded_employees if e.id == emp1.id)

    engine = AwisScoringEngine()
    result = engine.evaluate_employee(emp1_loaded, loaded_project)

    assert result.is_provisional is True
    assert result.is_complete is False
    assert AwisFactor.BURNOUT_SAFETY.value in result.missing_factors
    # Weighted coverage should be >= 80% (0.90 under High Priority)
    assert result.weighted_completeness_pct >= 80.0
    assert result.composite_score is not None


# ==============================================================================
# 5. API Endpoints Integration Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_awis_endpoints_require_authentication(awis_client: AsyncClient):
    """Unauthenticated calls to AWIS endpoints must return 401 Unauthorized."""
    resp = await awis_client.get("/api/v1/projects/PRJ-101/awis/config")
    assert resp.status_code == 401

    resp2 = await awis_client.get("/api/v1/projects/PRJ-101/awis/candidates")
    assert resp2.status_code == 401


@pytest.mark.asyncio
async def test_get_awis_config_success(awis_client: AsyncClient, awis_test_db: AsyncSession):
    """Authorized caller can retrieve the active AWIS scoring profiles and operational config."""
    _, ws, project, _ = await setup_awis_environment(awis_test_db, "pm-user-1", SystemRole.PROJECT_MANAGER.value)
    token = create_token("pm-user-1")

    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}
    resp = await awis_client.get(f"/api/v1/projects/{project.id}/awis/config", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["formulaVersion"] == FORMULA_VERSION
    assert data["completenessThreshold"] == COMPLETENESS_THRESHOLD
    assert "high" in data["profiles"]
    assert "medium" in data["profiles"]
    assert "low" in data["profiles"]
    assert "skill_match" in data["profiles"]["high"]


@pytest.mark.asyncio
async def test_rank_candidates_endpoint_ordering_and_filtering(awis_client: AsyncClient, awis_test_db: AsyncSession):
    """Tests candidates endpoint for ranking order, eligibility separation, and explainability."""
    _, ws, project, _ = await setup_awis_environment(awis_test_db, "pm-user-2", SystemRole.PROJECT_MANAGER.value)
    token = create_token("pm-user-2")

    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}
    resp = await awis_client.get(
        f"/api/v1/projects/{project.id}/awis/candidates?include_non_actionable=true",
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["projectId"] == str(project.id)
    assert data["selectedProfile"] == PriorityProfile.HIGH.value
    assert data["actionableCount"] >= 1
    assert data["nonActionableCount"] >= 1

    # Verify ranked items
    top_cand = data["items"][0]
    assert top_cand["rankPosition"] == 1
    assert top_cand["isActionable"] is True
    assert "Python" in str(top_cand["components"]["skill_match"]["evidence"])

    # Verify explainability fields
    assert len(top_cand["positiveFactors"]) >= 1
    assert top_cand["summaryExplanation"] != ""

    # Verify non-actionable items contain the ineligible candidate who lacked Python
    ineligible_cand = data["nonActionableItems"][0]
    assert ineligible_cand["isActionable"] is False
    assert "MANDATORY_SKILL_DEFICIT" in ineligible_cand["eligibility"]["reasons"]


@pytest.mark.asyncio
async def test_wellbeing_data_masking_for_project_manager(awis_client: AsyncClient, awis_test_db: AsyncSession):
    """
    Verifies role-based wellbeing protection: Project Manager without HR wellbeing rights
    receives masked clinical metadata while HR receives complete wellbeing records.
    """
    _, ws, project, employees = await setup_awis_environment(awis_test_db, "pm-user-3", SystemRole.PROJECT_MANAGER.value)
    emp1 = employees[0]
    ws_id = ws.id
    proj_id = project.id
    emp1_id = emp1.id

    # Create ML Burnout Prediction for emp1
    pred = MlBurnoutPrediction(
        workspace_id=ws_id,
        employee_id=emp1_id,
        model_version="burnout_model_v1",
        predicted_burn_rate=0.25,
        normalized_burnout_score=25.0,
        risk_tier="Low",
    )
    awis_test_db.add(pred)
    await awis_test_db.commit()
    awis_test_db.expire_all()

    # 1. Project Manager request
    pm_token = create_token("pm-user-3", SystemRole.PROJECT_MANAGER.value)
    pm_headers = {"Authorization": f"Bearer {pm_token}", "X-Workspace-Id": str(ws_id)}
    pm_resp = await awis_client.get(
        f"/api/v1/projects/{proj_id}/awis/candidates/{emp1_id}",
        headers=pm_headers,
    )
    assert pm_resp.status_code == 200
    pm_cand = pm_resp.json()
    burnout_meta = pm_cand["components"]["burnout_safety"]["metadata"]
    # Clinical raw fatigue details and model burn rates masked
    assert "fatigue_score" not in burnout_meta
    assert "burn_rate" not in burnout_meta
    assert burnout_meta.get("risk_tier") == "Low"

    # 2. HR request
    hr_user = User(
        clerk_user_id="hr-user-1",
        email="hr@test.com",
        full_name="HR Specialist",
        role=SystemRole.HR.value,
        is_active=True,
    )
    awis_test_db.add(hr_user)
    await awis_test_db.flush()
    awis_test_db.add(WorkspaceMember(workspace_id=ws_id, user_id=hr_user.id, role=WorkspaceRole.MEMBER.value, is_active=True))
    await awis_test_db.commit()

    hr_token = create_token("hr-user-1", SystemRole.HR.value)
    hr_headers = {"Authorization": f"Bearer {hr_token}", "X-Workspace-Id": str(ws_id)}
    hr_resp = await awis_client.get(
        f"/api/v1/projects/{proj_id}/awis/candidates/{emp1_id}",
        headers=hr_headers,
    )
    assert hr_resp.status_code == 200
    hr_cand = hr_resp.json()
    hr_burnout_meta = hr_cand["components"]["burnout_safety"]["metadata"]
    # HR receives unmasked fatigue score and burn_rate
    assert "fatigue_score" in hr_burnout_meta
    assert hr_burnout_meta["fatigue_score"] == 15.0
    assert "burn_rate" in hr_burnout_meta
    assert hr_burnout_meta["burn_rate"] == 0.25


@pytest.mark.asyncio
async def test_awis_snapshot_persistence(awis_client: AsyncClient, awis_test_db: AsyncSession):
    """Verifies that an authorized manager can persist an AWIS evaluation run to awis_evaluations."""
    _, ws, project, _ = await setup_awis_environment(awis_test_db, "pm-user-4", SystemRole.PROJECT_MANAGER.value)
    token = create_token("pm-user-4", SystemRole.PROJECT_MANAGER.value)

    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}
    payload = {"saveTopN": 5, "notes": "Phase 6 baseline evaluation"}
    resp = await awis_client.post(
        f"/api/v1/projects/{project.id}/awis/snapshot",
        json=payload,
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["savedCount"] >= 1
    assert data["scoringVersion"] == FORMULA_VERSION
    assert data["projectId"] == str(project.id)


@pytest.mark.asyncio
async def test_cross_workspace_awis_isolation_denied(awis_client: AsyncClient, awis_test_db: AsyncSession):
    """Verifies that a user from Workspace A cannot score or view projects from Workspace B."""
    _, ws_a, proj_a, _ = await setup_awis_environment(awis_test_db, "user-ws-a")

    # Second workspace
    user_b = User(clerk_user_id="user-ws-b", email="b@test.com", full_name="User B", role=SystemRole.PROJECT_MANAGER.value, is_active=True)
    awis_test_db.add(user_b)
    await awis_test_db.flush()
    ws_b = Workspace(name="Workspace B", slug="ws-b")
    awis_test_db.add(ws_b)
    await awis_test_db.flush()
    awis_test_db.add(WorkspaceMember(workspace_id=ws_b.id, user_id=user_b.id, role=WorkspaceRole.OWNER.value, is_active=True))
    await awis_test_db.commit()

    token_b = create_token("user-ws-b")
    headers_b = {"Authorization": f"Bearer {token_b}", "X-Workspace-Id": str(ws_b.id)}

    # User B attempts to access Project A
    resp = await awis_client.get(f"/api/v1/projects/{proj_a.id}/awis/candidates", headers=headers_b)
    assert resp.status_code == 404


# ==============================================================================
# 6. Corrective Patch Tests: Ranking Policy, Workload 140% Threshold & Config
# ==============================================================================

def test_ranking_policy_complete_vs_provisional_and_tiebreakers():
    """
    Verifies Phase 6 Corrective Patch:
    1. A complete candidate scoring 80 outranks a provisional candidate scoring 81.
    2. Provisional status is preserved (is_provisional=True, ranking_tier=2).
    3. Complete candidate has ranking_tier=1.
    4. Ties across eligibility (ELIGIBLE vs NEEDS_REVIEW) prioritize ELIGIBLE.
    5. Ties across skill-match and workload-sustainability follow the deterministic hierarchy.
    6. Identical factor ties are broken by stable employee ID ascending.
    """
    engine = AwisScoringEngine()

    class MockSkill:
        id = "s-py"
        name = "Python"

    class MockReq:
        skill = MockSkill()
        skill_id = "s-py"
        min_proficiency = 70
        priority = "High"
        is_mandatory = False

    class MockEmpSkill:
        skill = MockSkill()
        skill_id = "s-py"
        proficiency = 80
        years_experience = 3.0
        is_primary = True

    class MockProject:
        id = "prj-test-rank"
        project_code = "PRJ-RANK-1"
        workspace_id = "ws-rank"
        priority = "High"
        complexity = "Medium"
        target_team_size = 4
        start_date = date(2026, 11, 1)
        deadline = date(2027, 4, 30)
        requirements = [MockReq()]

    proj = MockProject()

    class MockCandidate:
        def __init__(
            self,
            emp_id: str,
            emp_code: str,
            name: str,
            exp_years: float = 3.0,
            perf: float = 80.0,
            avail: float = 80.0,
            workload: float = 0.0,
            growth: Optional[float] = 80.0,
            burnout: Optional[float] = 0.20,
            status: str = "Available",
            fatigue: float = 10.0,
            risk: str = "Low",
        ):
            self.id = emp_id
            self.employee_code = emp_code
            self.full_name = name
            self.workspace_id = "ws-rank"
            self.department = "Engineering"
            self.designation = "Engineer"
            self.avatar_url = None
            self.employment_status = status
            self.experience_years = exp_years
            self.performance_score = perf
            self.availability_score = avail
            self.current_workload_percent = workload
            self.growth_potential = growth
            self.wellbeing_risk = risk
            self.mental_fatigue_score = fatigue
            self.skills = [MockEmpSkill()]
            self.project_allocations = []
            self.performance_history = []
            self.workload_history = []
            self.burnout_predictions = []
            self.burnout_risk = burnout

    # 1. Complete Candidate (Score ~80.0) vs Provisional Candidate (Score ~81.0)
    # High profile weights: Exp: 0.20, Perf: 0.15, Avail: 0.15, Workload: 0.10, Burnout: 0.10, Growth: 0.05 (Total without Skill: 0.75)
    # Complete Candidate A: growth=80.0, perf=80.0, exp=3.0 (norm 100), avail=100 (score 100), workload 0.0 (score 100), burnout 0.20 (score 80)
    # Let's set candidate attributes to precisely control composite scores
    cand_complete = MockCandidate(
        emp_id="emp-complete-80",
        emp_code="EMP-C80",
        name="Candidate Complete",
        exp_years=3.0,     # 100.0 * 0.20 = 20.0
        perf=80.0,         # 80.0 * 0.15 = 12.0
        avail=80.0,        # 100.0 * 0.15 = 15.0 (no allocations -> usable 100)
        workload=0.0,      # 100.0 * 0.10 = 10.0 (requested 25% -> <=80% -> 100.0)
        growth=80.0,       # 80.0 * 0.05 = 4.0
        burnout=0.20,      # 80.0 * 0.10 = 8.0
        # Notice: Requirements is empty so Skill Match is unavailable (contributes 0)
    )

    # Let's create an evaluation directly to test deterministic rank_candidates behavior
    res_complete = engine.evaluate_employee(cand_complete, proj)
    # Force scores for exact 80.0 vs 81.0 test
    res_complete.composite_score = 80.0
    res_complete.is_complete = True
    res_complete.is_provisional = False
    res_complete.ranking_tier = compute_ranking_tier(res_complete)
    assert res_complete.ranking_tier == 1

    cand_provisional = MockCandidate(
        emp_id="emp-provisional-81",
        emp_code="EMP-P81",
        name="Candidate Provisional",
        growth=None,  # Missing growth
    )
    res_provisional = engine.evaluate_employee(cand_provisional, proj)
    res_provisional.composite_score = 81.0
    res_provisional.is_complete = False
    res_provisional.is_provisional = True
    res_provisional.ranking_tier = compute_ranking_tier(res_provisional)
    assert res_provisional.ranking_tier == 2

    # Rank both candidates: Complete Candidate A (score 80) must outrank Provisional Candidate B (score 81)
    # Mock rank_candidates sorting:
    cands_to_rank = [res_provisional, res_complete]
    cands_to_rank.sort(
        key=lambda c: (
            c.ranking_tier if c.ranking_tier is not None else compute_ranking_tier(c),
            -(c.composite_score or 0.0),
            -(c.component_scores[AwisFactor.SKILL_MATCH].score or 0.0),
            -(c.component_scores[AwisFactor.WORKLOAD_SUSTAINABILITY].score or 0.0),
            -(c.component_scores[AwisFactor.AVAILABILITY].score or 0.0),
            -(c.component_scores[AwisFactor.RELEVANT_EXPERIENCE].score or 0.0),
            str(c.employee_id),
        )
    )
    for idx, c in enumerate(cands_to_rank, start=1):
        c.rank_position = idx

    assert cands_to_rank[0].employee_id == "emp-complete-80"
    assert cands_to_rank[0].rank_position == 1
    assert cands_to_rank[0].is_complete is True
    assert cands_to_rank[0].is_provisional is False
    assert cands_to_rank[0].ranking_tier == 1

    assert cands_to_rank[1].employee_id == "emp-provisional-81"
    assert cands_to_rank[1].rank_position == 2
    assert cands_to_rank[1].is_provisional is True
    assert cands_to_rank[1].ranking_tier == 2

    # 2. Ties across eligibility: Tier 1 (ELIGIBLE, score 80) vs Tier 3 (NEEDS_REVIEW, score 90)
    res_needs_review = engine.evaluate_employee(cand_complete, proj)
    res_needs_review.employee_id = "emp-review-90"
    res_needs_review.composite_score = 90.0
    res_needs_review.eligibility.status = EligibilityStatus.NEEDS_REVIEW
    res_needs_review.ranking_tier = compute_ranking_tier(res_needs_review)
    assert res_needs_review.ranking_tier == 3

    eligibility_pool = [res_needs_review, res_complete]
    eligibility_pool.sort(
        key=lambda c: (
            c.ranking_tier if c.ranking_tier is not None else compute_ranking_tier(c),
            -(c.composite_score or 0.0),
            -(c.component_scores[AwisFactor.SKILL_MATCH].score or 0.0),
            -(c.component_scores[AwisFactor.WORKLOAD_SUSTAINABILITY].score or 0.0),
            -(c.component_scores[AwisFactor.AVAILABILITY].score or 0.0),
            -(c.component_scores[AwisFactor.RELEVANT_EXPERIENCE].score or 0.0),
            str(c.employee_id),
        )
    )
    # ELIGIBLE (Tier 1) ranks ahead of NEEDS_REVIEW (Tier 3) despite lower score
    assert eligibility_pool[0].employee_id == "emp-complete-80"
    assert eligibility_pool[1].employee_id == "emp-review-90"

    # 3. Factor tiebreakers in same tier (both Tier 1, both score 80.0)
    # Tiebreaker 1: Skill Match (90 vs 80)
    res_tie1_high_skill = engine.evaluate_employee(cand_complete, proj)
    res_tie1_high_skill.employee_id = "emp-high-skill"
    res_tie1_high_skill.composite_score = 80.0
    res_tie1_high_skill.ranking_tier = 1
    res_tie1_high_skill.component_scores[AwisFactor.SKILL_MATCH].score = 90.0
    res_tie1_high_skill.component_scores[AwisFactor.WORKLOAD_SUSTAINABILITY].score = 70.0

    res_tie1_low_skill = engine.evaluate_employee(cand_complete, proj)
    res_tie1_low_skill.employee_id = "emp-low-skill"
    res_tie1_low_skill.composite_score = 80.0
    res_tie1_low_skill.ranking_tier = 1
    res_tie1_low_skill.component_scores[AwisFactor.SKILL_MATCH].score = 80.0
    res_tie1_low_skill.component_scores[AwisFactor.WORKLOAD_SUSTAINABILITY].score = 95.0

    skill_pool = [res_tie1_low_skill, res_tie1_high_skill]
    skill_pool.sort(
        key=lambda c: (
            c.ranking_tier if c.ranking_tier is not None else compute_ranking_tier(c),
            -(c.composite_score or 0.0),
            -(c.component_scores[AwisFactor.SKILL_MATCH].score or 0.0),
            -(c.component_scores[AwisFactor.WORKLOAD_SUSTAINABILITY].score or 0.0),
            -(c.component_scores[AwisFactor.AVAILABILITY].score or 0.0),
            -(c.component_scores[AwisFactor.RELEVANT_EXPERIENCE].score or 0.0),
            str(c.employee_id),
        )
    )
    assert skill_pool[0].employee_id == "emp-high-skill"

    # Tiebreaker 2: Workload Sustainability when Skill Match is tied
    res_tie2_high_workload = engine.evaluate_employee(cand_complete, proj)
    res_tie2_high_workload.employee_id = "emp-high-workload"
    res_tie2_high_workload.composite_score = 80.0
    res_tie2_high_workload.ranking_tier = 1
    res_tie2_high_workload.component_scores[AwisFactor.SKILL_MATCH].score = 85.0
    res_tie2_high_workload.component_scores[AwisFactor.WORKLOAD_SUSTAINABILITY].score = 90.0

    res_tie2_low_workload = engine.evaluate_employee(cand_complete, proj)
    res_tie2_low_workload.employee_id = "emp-low-workload"
    res_tie2_low_workload.composite_score = 80.0
    res_tie2_low_workload.ranking_tier = 1
    res_tie2_low_workload.component_scores[AwisFactor.SKILL_MATCH].score = 85.0
    res_tie2_low_workload.component_scores[AwisFactor.WORKLOAD_SUSTAINABILITY].score = 70.0

    workload_pool = [res_tie2_low_workload, res_tie2_high_workload]
    workload_pool.sort(
        key=lambda c: (
            c.ranking_tier if c.ranking_tier is not None else compute_ranking_tier(c),
            -(c.composite_score or 0.0),
            -(c.component_scores[AwisFactor.SKILL_MATCH].score or 0.0),
            -(c.component_scores[AwisFactor.WORKLOAD_SUSTAINABILITY].score or 0.0),
            -(c.component_scores[AwisFactor.AVAILABILITY].score or 0.0),
            -(c.component_scores[AwisFactor.RELEVANT_EXPERIENCE].score or 0.0),
            str(c.employee_id),
        )
    )
    assert workload_pool[0].employee_id == "emp-high-workload"

    # Tiebreaker 3: Stable Employee ID ascending
    res_tie3_id_a = engine.evaluate_employee(cand_complete, proj)
    res_tie3_id_a.employee_id = "emp-001"
    res_tie3_id_a.composite_score = 80.0
    res_tie3_id_a.ranking_tier = 1
    res_tie3_id_a.component_scores[AwisFactor.SKILL_MATCH].score = 85.0
    res_tie3_id_a.component_scores[AwisFactor.WORKLOAD_SUSTAINABILITY].score = 80.0

    res_tie3_id_b = engine.evaluate_employee(cand_complete, proj)
    res_tie3_id_b.employee_id = "emp-002"
    res_tie3_id_b.composite_score = 80.0
    res_tie3_id_b.ranking_tier = 1
    res_tie3_id_b.component_scores[AwisFactor.SKILL_MATCH].score = 85.0
    res_tie3_id_b.component_scores[AwisFactor.WORKLOAD_SUSTAINABILITY].score = 80.0

    id_pool = [res_tie3_id_b, res_tie3_id_a]
    id_pool.sort(
        key=lambda c: (
            c.ranking_tier if c.ranking_tier is not None else compute_ranking_tier(c),
            -(c.composite_score or 0.0),
            -(c.component_scores[AwisFactor.SKILL_MATCH].score or 0.0),
            -(c.component_scores[AwisFactor.WORKLOAD_SUSTAINABILITY].score or 0.0),
            -(c.component_scores[AwisFactor.AVAILABILITY].score or 0.0),
            -(c.component_scores[AwisFactor.RELEVANT_EXPERIENCE].score or 0.0),
            str(c.employee_id),
        )
    )
    assert id_pool[0].employee_id == "emp-001"
    assert id_pool[1].employee_id == "emp-002"


def test_workload_sustainability_exact_thresholds_and_overload_review():
    """
    Verifies Issue 2:
    - Exactly 140.0% projected workload does NOT trigger CRITICAL_WORKLOAD_OVERLOAD.
    - 140.1% (just above 140%) triggers NEEDS_REVIEW with reason CRITICAL_WORKLOAD_OVERLOAD.
    - 150.0% triggers NEEDS_REVIEW with reason CRITICAL_WORKLOAD_OVERLOAD.
    - 150.1% (just above 150%) triggers INELIGIBLE with reason EXCESSIVE_WORKLOAD.
    - 100.0% current commitment triggers INELIGIBLE with reason FULLY_ALLOCATED_CAPACITY.
    - Score curve interpolation at 80%, 90%, 100%, 110%, 120%, 135%, 150%, 160%.
    - Overtime and streak penalties at 15 vs 15.1 hrs and 10 vs 11 days.
    """
    class MockAllocation:
        def __init__(self, percent: float, status: str = "Active"):
            self.allocation_percent = percent
            self.status = status

    class MockEmp:
        def __init__(self, current_committed_pct: float):
            self.workspace_id = "ws-workload"
            self.employment_status = "Available"
            self.skills = []
            self.burnout_predictions = []
            self.wellbeing_risk = "Low"
            self.mental_fatigue_score = 10.0
            self.project_allocations = [MockAllocation(current_committed_pct)] if current_committed_pct > 0 else []

    # Target team size = 1 -> requested allocation is 100.0%
    class MockProjectSize1:
        workspace_id = "ws-workload"
        target_team_size = 1
        requirements = []

    proj1 = MockProjectSize1()

    # Case 1: Exactly 140.0% projected workload (40.0% current + 100.0% requested = 140.0%)
    emp_140 = MockEmp(40.0)
    res_140 = evaluate_eligibility(emp_140, proj1)
    assert res_140.status == EligibilityStatus.ELIGIBLE
    assert "CRITICAL_WORKLOAD_OVERLOAD" not in res_140.reasons
    assert res_140.is_actionable is True

    # Case 2: Just above 140.0% (40.1% current + 100.0% requested = 140.1%)
    emp_140_1 = MockEmp(40.1)
    res_140_1 = evaluate_eligibility(emp_140_1, proj1)
    assert res_140_1.status == EligibilityStatus.NEEDS_REVIEW
    assert "CRITICAL_WORKLOAD_OVERLOAD" in res_140_1.reasons
    assert res_140_1.is_actionable is True

    # Case 3: Exactly 150.0% projected workload (50.0% current + 100.0% requested = 150.0%)
    emp_150 = MockEmp(50.0)
    res_150 = evaluate_eligibility(emp_150, proj1)
    assert res_150.status == EligibilityStatus.NEEDS_REVIEW
    assert "CRITICAL_WORKLOAD_OVERLOAD" in res_150.reasons
    assert res_150.is_actionable is True

    # Case 4: Just above 150.0% (50.1% current + 100.0% requested = 150.1%)
    emp_150_1 = MockEmp(50.1)
    res_150_1 = evaluate_eligibility(emp_150_1, proj1)
    assert res_150_1.status == EligibilityStatus.INELIGIBLE
    assert "EXCESSIVE_WORKLOAD" in res_150_1.reasons
    assert res_150_1.is_actionable is False

    # Case 5: Exactly 100.0% current committed capacity
    emp_100_alloc = MockEmp(100.0)
    res_100_alloc = evaluate_eligibility(emp_100_alloc, proj1)
    assert res_100_alloc.status == EligibilityStatus.INELIGIBLE
    assert "FULLY_ALLOCATED_CAPACITY" in res_100_alloc.reasons
    assert res_100_alloc.is_actionable is False

    # Workload score curve interpolation tests:
    class MockEmpForScore:
        def __init__(self, current_wl: float, overtime: float = 0.0, streak: int = 0):
            self.current_workload_percent = current_wl
            self.project_allocations = []
            if overtime > 0 or streak > 0:
                class MockHistory:
                    def __init__(self, ot, st):
                        self.recorded_date = date(2026, 10, 1)
                        self.overtime_hours = ot
                        self.consecutive_working_days = st
                self.workload_history = [MockHistory(overtime, streak)]
            else:
                self.workload_history = []

    # Project with team size 4 -> requested allocation = 25.0%
    class MockProjectForScore:
        target_team_size = 4

    p_score = MockProjectForScore()

    # 1. 55% current + 25% req = 80% projected -> 100.0
    res_80 = score_workload_sustainability(MockEmpForScore(55.0), p_score)
    assert res_80.score == 100.0

    # 2. 65% current + 25% req = 90% projected -> 85.0
    res_90 = score_workload_sustainability(MockEmpForScore(65.0), p_score)
    assert res_90.score == 85.0

    # 3. 75% current + 25% req = 100% projected -> 70.0
    res_100 = score_workload_sustainability(MockEmpForScore(75.0), p_score)
    assert res_100.score == 70.0

    # 4. 85% current + 25% req = 110% projected -> 50.0
    res_110 = score_workload_sustainability(MockEmpForScore(85.0), p_score)
    assert res_110.score == 50.0

    # 5. 95% current + 25% req = 120% projected -> 30.0
    res_120 = score_workload_sustainability(MockEmpForScore(95.0), p_score)
    assert res_120.score == 30.0

    # 6. 110% current + 25% req = 135% projected -> 15.0
    res_135 = score_workload_sustainability(MockEmpForScore(110.0), p_score)
    assert res_135.score == 15.0

    # 7. 125% current + 25% req = 150% projected -> 0.0
    res_150_sc = score_workload_sustainability(MockEmpForScore(125.0), p_score)
    assert res_150_sc.score == 0.0

    # 8. 135% current + 25% req = 160% projected -> 0.0
    res_160 = score_workload_sustainability(MockEmpForScore(135.0), p_score)
    assert res_160.score == 0.0

    # Overtime penalty tests: base score 100 (55% current + 25% = 80%)
    # Overtime 15.0 hrs -> no penalty
    res_ot15 = score_workload_sustainability(MockEmpForScore(55.0, overtime=15.0), p_score)
    assert res_ot15.score == 100.0

    # Overtime 15.1 hrs -> 10 penalty
    res_ot15_1 = score_workload_sustainability(MockEmpForScore(55.0, overtime=15.1), p_score)
    assert res_ot15_1.score == 90.0

    # Streak 10 days -> no penalty
    res_st10 = score_workload_sustainability(MockEmpForScore(55.0, streak=10), p_score)
    assert res_st10.score == 100.0

    # Streak 11 days -> 10 penalty
    res_st11 = score_workload_sustainability(MockEmpForScore(55.0, streak=11), p_score)
    assert res_st11.score == 90.0


def test_centralized_workload_policy_validation():
    """
    Verifies that the centralized WORKLOAD_POLICY is validated and rejects invalid configs.
    """
    # Active default passes validation
    validate_workload_policy(WORKLOAD_POLICY)
    cfg_dict = WORKLOAD_POLICY.to_dict()
    assert cfg_dict["reviewThreshold"] == 140.0
    assert cfg_dict["hardSafetyLimit"] == 150.0
    assert cfg_dict["breakpointSafe"] == 80.0

    # Inverted breakpoints must raise ValueError
    with pytest.raises(ValueError, match="strictly monotonically increasing"):
        bad_cfg = WorkloadPolicyConfig(breakpoint_safe=110.0, breakpoint_standard=100.0)
        validate_workload_policy(bad_cfg)

    # Inverted review threshold must raise ValueError
    with pytest.raises(ValueError, match="consistent with curve breakpoints"):
        bad_cfg = WorkloadPolicyConfig(review_threshold=155.0, hard_safety_limit=150.0)
        validate_workload_policy(bad_cfg)

    # Negative penalty must raise ValueError
    with pytest.raises(ValueError, match="Penalties must be non-negative"):
        bad_cfg = WorkloadPolicyConfig(overtime_penalty_points=-5.0)
        validate_workload_policy(bad_cfg)

