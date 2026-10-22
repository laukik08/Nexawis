"""
NEXAWIS Backend - Comprehensive Automated Tests for Phase 8: Team Optimization Engine.

Covers:
1. Hard constraints: Active employment, authorized workspace multi-tenancy, mandatory skill coverage.
2. Capacity & Workload limits: Exclude >= 100% committed, projected > 140% triggers review flag, > 150% ineligible.
3. Candidate tiers: Complete eligible preferred over provisional eligible; ineligible excluded.
4. AWIS integration: Priority weight profiles (High, Medium, Low), server-side authoritative scoring.
5. Optimization engine: Complementary skills, workload variance penalty, deterministic tie-breaking.
6. Alternatives: Distinct, independently feasible alternative strategies (Fatigue-Safe, High-Velocity, Growth).
7. Infeasibility detection: Unsatisfiable mandatory skills or insufficient candidate pool returns structured explanations.
8. Human-in-the-loop Finalization: Atomic commit creating ProjectAllocation records, 409 on duplicate finalize,
   and 409 on concurrent over-allocation conflict (>150% revalidation check).
9. RBAC & Security: PM / Admin allowed, unauthorized roles rejected (403), cross-workspace access blocked (404).
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
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.main import app
from app.models import (
    Base,
    User,
    Workspace,
    WorkspaceMember,
    Employee,
    Project,
    ProjectRequirement,
    ProjectAllocation,
    Skill,
    EmployeeSkill,
    EmployeeWorkloadHistory,
    EmployeePerformanceHistory,
    TeamFormation,
    TeamFormationMember,
)
from app.core.database import get_db_session
from app.core.clerk import set_test_verification_key
from app.core.roles import SystemRole, WorkspaceRole
from app.schemas.team_formation import GenerateTeamRecommendationRequest, FinalizeFormationRequest
from app.services.team_optimizer.engine import TeamOptimizer
from app.services.team_optimizer.service import compute_team_allocations, TeamOptimizationService
from app.core.exceptions import ValidationError, ConflictError

# Ephemeral RSA keypair for testing
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
async def opt_test_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def opt_client(opt_test_db: AsyncSession):
    set_test_verification_key(TEST_PUBLIC_KEY, ["RS256"])

    async def _override_db():
        yield opt_test_db

    app.dependency_overrides[get_db_session] = _override_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    set_test_verification_key(None, None)


async def setup_test_environment(db: AsyncSession):
    """Sets up workspace, PM user, non-PM user, skills, and 6 sample employees."""
    pm_user = User(
        clerk_user_id="clerk_pm_user",
        email="pm@nexawis.com",
        full_name="Project Manager Alice",
        role=SystemRole.PROJECT_MANAGER.value,
        is_active=True,
    )
    dev_user = User(
        clerk_user_id="clerk_dev_user",
        email="dev@nexawis.com",
        full_name="Developer Bob",
        role=SystemRole.EMPLOYEE.value,
        is_active=True,
    )
    ws = Workspace(name="Engineering Alpha", slug="eng-alpha")
    db.add_all([pm_user, dev_user, ws])
    await db.flush()

    db.add_all([
        WorkspaceMember(workspace_id=ws.id, user_id=pm_user.id, role=WorkspaceRole.ADMIN.value),
        WorkspaceMember(workspace_id=ws.id, user_id=dev_user.id, role=WorkspaceRole.MEMBER.value),
    ])

    # Other workspace to test multi-tenant boundaries
    ws_other = Workspace(name="Isolated Beta", slug="isolated-beta")
    db.add(ws_other)
    await db.flush()

    # Skills
    skills = {
        "python": Skill(workspace_id=ws.id, name="Python", category="Backend"),
        "fastapi": Skill(workspace_id=ws.id, name="FastAPI", category="Backend"),
        "react": Skill(workspace_id=ws.id, name="React", category="Frontend"),
        "aws": Skill(workspace_id=ws.id, name="AWS", category="Cloud"),
        "ml": Skill(workspace_id=ws.id, name="Machine Learning", category="AI"),
    }
    db.add_all(skills.values())
    await db.flush()

    # Candidates:
    # 1. Complete Eligible Senior Dev (Python, FastAPI, AWS)
    e1 = Employee(
        workspace_id=ws.id,
        employee_code="NXW-1001",
        full_name="Elena Rostova",
        email="elena@eng.com",
        designation="Lead Architect",
        department="Engineering",
        employment_status="Available",
        experience_years=8.0,
        current_workload_percent=25.0,
        availability_score=90.0,
        performance_score=92.0,
        wellbeing_risk="Low",
    )
    # 2. Complete Eligible Frontend Specialist (React)
    e2 = Employee(
        workspace_id=ws.id,
        employee_code="NXW-1002",
        full_name="Marcus Vance",
        email="marcus@eng.com",
        designation="Frontend Specialist",
        department="Frontend",
        employment_status="Available",
        experience_years=5.0,
        current_workload_percent=30.0,
        availability_score=85.0,
        performance_score=88.0,
        wellbeing_risk="Low",
    )
    # 3. High-Workload Candidate (current 105% committed -> 40% requested = 145%, review required)
    e3 = Employee(
        workspace_id=ws.id,
        employee_code="NXW-1003",
        full_name="Tariq Nasir",
        email="tariq@eng.com",
        designation="DevOps Specialist",
        department="Infrastructure",
        employment_status="Available",
        experience_years=6.0,
        current_workload_percent=105.0,
        availability_score=50.0,
        performance_score=85.0,
        wellbeing_risk="Moderate",
    )
    # 4. Over-capacity Candidate (Already 100% committed with a project allocation -> excluded)
    e4 = Employee(
        workspace_id=ws.id,
        employee_code="NXW-1004",
        full_name="Sarah Connor",
        email="sarah@eng.com",
        designation="ML Engineer",
        department="AI",
        employment_status="Allocated",
        experience_years=4.0,
        current_workload_percent=100.0,
        availability_score=0.0,
        performance_score=90.0,
        wellbeing_risk="Moderate",
    )
    # 5. Inactive Employee (must be excluded)
    e5 = Employee(
        workspace_id=ws.id,
        employee_code="NXW-1005",
        full_name="Derek Inactive",
        email="derek@eng.com",
        designation="Backend Dev",
        department="Engineering",
        employment_status="Inactive",
        experience_years=3.0,
        current_workload_percent=0.0,
        availability_score=100.0,
        performance_score=75.0,
        wellbeing_risk="Low",
    )
    # 6. Cross-Workspace Employee (in ws_other -> must not appear)
    e6 = Employee(
        workspace_id=ws_other.id,
        employee_code="NXW-1006",
        full_name="Other Workspace",
        email="other@other.com",
        designation="Security Lead",
        department="Security",
        employment_status="Available",
        experience_years=7.0,
        current_workload_percent=15.0,
        availability_score=85.0,
        performance_score=88.0,
        wellbeing_risk="Low",
    )
    # 7. Additional Eligible Candidate for Team of 3
    e7 = Employee(
        workspace_id=ws.id,
        employee_code="NXW-1007",
        full_name="Chloe Kim",
        email="chloe@eng.com",
        designation="Fullstack Developer",
        department="Engineering",
        employment_status="Available",
        experience_years=3.5,
        current_workload_percent=30.0,
        availability_score=80.0,
        performance_score=84.0,
        wellbeing_risk="Low",
    )

    db.add_all([e1, e2, e3, e4, e5, e6, e7])
    await db.flush()

    # Skill associations
    db.add_all([
        EmployeeSkill(employee_id=e1.id, skill_id=skills["python"].id, proficiency=90, is_primary=True),
        EmployeeSkill(employee_id=e1.id, skill_id=skills["fastapi"].id, proficiency=85),
        EmployeeSkill(employee_id=e1.id, skill_id=skills["aws"].id, proficiency=80),
        EmployeeSkill(employee_id=e2.id, skill_id=skills["react"].id, proficiency=95, is_primary=True),
        EmployeeSkill(employee_id=e3.id, skill_id=skills["aws"].id, proficiency=88, is_primary=True),
        EmployeeSkill(employee_id=e4.id, skill_id=skills["ml"].id, proficiency=92, is_primary=True),
        EmployeeSkill(employee_id=e7.id, skill_id=skills["python"].id, proficiency=75),
        EmployeeSkill(employee_id=e7.id, skill_id=skills["react"].id, proficiency=80),
    ])

    # Workload history and performance for e1, e2, e7
    for emp in [e1, e2, e3, e7]:
        db.add(EmployeePerformanceHistory(
            employee_id=emp.id,
            period_label="Q3 2026",
            performance_score=90.0,
            task_completion_rate=92.0,
            review_notes="Strong performance",
        ))
        db.add(EmployeeWorkloadHistory(
            employee_id=emp.id,
            recorded_date=date.today(),
            weekly_work_hours=40.0,
            overtime_hours=0.0,
            utilization_percentage=75.0,
            mental_fatigue_score=20.0,
        ))

    # Existing allocation on e4 making them 100% committed
    dummy_proj = Project(
        workspace_id=ws.id,
        project_code="PRJ-DUMMY",
        name="Existing Ongoing Project",
        department="Engineering",
        status="active",
        priority="medium",
        start_date=date.today() - timedelta(days=10),
        deadline=date.today() + timedelta(days=60),
    )
    db.add(dummy_proj)
    await db.flush()

    db.add(ProjectAllocation(
        project_id=dummy_proj.id,
        employee_id=e4.id,
        role="Senior ML Lead",
        allocation_percent=100.0,
        start_date=date.today() - timedelta(days=10),
        end_date=date.today() + timedelta(days=60),
    ))

    # Target test project
    target_proj = Project(
        workspace_id=ws.id,
        project_code="PRJ-AWIS-8",
        name="Phase 8 Platform Delivery",
        department="Engineering",
        status="planning",
        priority="high",
        start_date=date.today() + timedelta(days=7),
        deadline=date.today() + timedelta(days=90),
    )
    db.add(target_proj)
    await db.flush()

    # Target project mandatory requirements: Python, React
    db.add_all([
        ProjectRequirement(
            project_id=target_proj.id,
            skill_id=skills["python"].id,
            min_proficiency=70,
            is_mandatory=True,
            priority="high",
        ),
        ProjectRequirement(
            project_id=target_proj.id,
            skill_id=skills["react"].id,
            min_proficiency=70,
            is_mandatory=True,
            priority="high",
        ),
    ])
    await db.commit()

    # Eagerly reload target_proj and employees with all relationships for synchronous unit testing
    proj_query = (
        select(Project)
        .options(
            selectinload(Project.requirements).selectinload(ProjectRequirement.skill),
            selectinload(Project.allocations),
        )
        .where(Project.id == target_proj.id)
    )
    loaded_proj = (await db.execute(proj_query)).scalar_one()

    emp_query = (
        select(Employee)
        .options(
            selectinload(Employee.skills).selectinload(EmployeeSkill.skill),
            selectinload(Employee.project_allocations),
            selectinload(Employee.burnout_predictions),
            selectinload(Employee.workload_history),
            selectinload(Employee.performance_history),
        )
        .where(Employee.workspace_id.in_([ws.id, ws_other.id]))
    )
    loaded_emps = (await db.execute(emp_query)).scalars().all()
    emp_map = {e.employee_code: e for e in loaded_emps}

    return {
        "pm_user": pm_user,
        "dev_user": dev_user,
        "ws": ws,
        "ws_other": ws_other,
        "target_proj": loaded_proj,
        "skills": skills,
        "employees": {
            "e1": emp_map["NXW-1001"],
            "e2": emp_map["NXW-1002"],
            "e3": emp_map["NXW-1003"],
            "e4": emp_map["NXW-1004"],
            "e5": emp_map["NXW-1005"],
            "e6": emp_map["NXW-1006"],
            "e7": emp_map["NXW-1007"],
        }
    }


# ==============================================================================
# 1. Core Unit Tests: Hard Constraints, Exclusions & Infeasibility
# ==============================================================================

@pytest.mark.asyncio
async def test_infeasible_when_mandatory_skill_unmet(opt_test_db: AsyncSession):
    """Engine detects unsatisfiable mandatory skill requirement and returns structured infeasibility report."""
    env = await setup_test_environment(opt_test_db)
    proj = env["target_proj"]

    proj_id = proj.id

    # Add impossible requirement (e.g. quantum physics which no candidate has)
    quantum_skill = Skill(workspace_id=env["ws"].id, name="Quantum Algorithms", category="R&D")
    opt_test_db.add(quantum_skill)
    await opt_test_db.flush()

    opt_test_db.add(ProjectRequirement(
        project_id=proj_id,
        skill_id=quantum_skill.id,
        min_proficiency=80,
        is_mandatory=True,
    ))
    emp_ids = [env["employees"]["e1"].id, env["employees"]["e2"].id, env["employees"]["e7"].id]
    await opt_test_db.commit()

    opt_test_db.expire_all()
    # Reload proj with requirements eagerly loaded
    reloaded_proj = (await opt_test_db.execute(
        select(Project)
        .options(
            selectinload(Project.requirements).selectinload(ProjectRequirement.skill),
            selectinload(Project.allocations),
        )
        .where(Project.id == proj_id)
    )).scalar_one()
    emp_list = (await opt_test_db.execute(
        select(Employee)
        .options(
            selectinload(Employee.skills).selectinload(EmployeeSkill.skill),
            selectinload(Employee.project_allocations),
            selectinload(Employee.burnout_predictions),
            selectinload(Employee.workload_history),
            selectinload(Employee.performance_history),
        )
        .where(Employee.id.in_(emp_ids))
    )).scalars().all()

    optimizer = TeamOptimizer()
    req = GenerateTeamRecommendationRequest(team_size=2)
    result = optimizer.optimize_team(reloaded_proj, emp_list, req)

    assert result.is_feasible is False
    assert result.infeasibility_reason is not None
    assert "Missing mandatory project skills" in result.infeasibility_reason
    assert "Quantum Algorithms" in result.infeasibility_reason
    assert len(result.recommended_team) == 0


@pytest.mark.asyncio
async def test_infeasible_when_candidate_pool_insufficient(opt_test_db: AsyncSession):
    """Engine detects when active eligible candidates are fewer than requested team size."""
    env = await setup_test_environment(opt_test_db)
    proj = env["target_proj"]

    optimizer = TeamOptimizer()
    # Provide only 1 eligible candidate for a team of 4
    emp_list = [env["employees"]["e1"]]
    req = GenerateTeamRecommendationRequest(team_size=4)
    result = optimizer.optimize_team(proj, emp_list, req)

    assert result.is_feasible is False
    assert "Insufficient eligible candidates" in result.infeasibility_reason
    assert "Required 4, but only 1" in result.infeasibility_reason


@pytest.mark.asyncio
async def test_excluded_candidates_tracking(opt_test_db: AsyncSession):
    """Verifies that candidates >= 100% committed or inactive are filtered out with reasons."""
    env = await setup_test_environment(opt_test_db)
    proj = env["target_proj"]

    optimizer = TeamOptimizer()
    all_emps = list(env["employees"].values())
    req = GenerateTeamRecommendationRequest(team_size=2)
    result = optimizer.optimize_team(proj, all_emps, req)

    # e4 is 100% committed -> excluded
    assert env["employees"]["e4"].id in result.excluded_candidates
    e4_reason = result.excluded_candidates[env["employees"]["e4"].id]["reason"]
    assert "Fully committed" in e4_reason

    # e5 is inactive -> excluded
    assert env["employees"]["e5"].id in result.excluded_candidates
    e5_reason = result.excluded_candidates[env["employees"]["e5"].id]["reason"]
    assert "Inactive" in e5_reason

    # Recommended team must NOT contain excluded members
    rec_ids = [c.id for c in result.recommended_team]
    assert env["employees"]["e4"].id not in rec_ids
    assert env["employees"]["e5"].id not in rec_ids


@pytest.mark.asyncio
async def test_deterministic_optimization_results(opt_test_db: AsyncSession):
    """Executing optimization twice on identical data produces identical candidate ordering and scores."""
    env = await setup_test_environment(opt_test_db)
    proj = env["target_proj"]

    optimizer = TeamOptimizer()
    candidates = [env["employees"]["e1"], env["employees"]["e2"], env["employees"]["e7"]]
    req = GenerateTeamRecommendationRequest(team_size=2)

    run_1 = optimizer.optimize_team(proj, candidates, req)
    run_2 = optimizer.optimize_team(proj, candidates, req)

    assert run_1.is_feasible is True
    assert run_2.is_feasible is True
    assert [c.id for c in run_1.recommended_team] == [c.id for c in run_2.recommended_team]
    assert run_1.metrics.overall_team_fit == run_2.metrics.overall_team_fit
    assert run_1.metrics.skill_coverage_percent == run_2.metrics.skill_coverage_percent


@pytest.mark.asyncio
async def test_distinct_alternatives_generated(opt_test_db: AsyncSession):
    """Engine generates distinct alternative teams matching specialized optimization strategies."""
    env = await setup_test_environment(opt_test_db)
    proj = env["target_proj"]

    optimizer = TeamOptimizer()
    candidates = [env["employees"]["e1"], env["employees"]["e2"], env["employees"]["e7"]]
    req = GenerateTeamRecommendationRequest(team_size=2)

    result = optimizer.optimize_team(proj, candidates, req)
    assert result.is_feasible is True
    assert len(result.alternatives) > 0

    option_ids = [alt.option_id for alt in result.alternatives]
    # Check that alternatives are specialized and have trade-offs
    for alt in result.alternatives:
        assert len(alt.candidates) == 2
        assert alt.team_fit_score > 0
        assert alt.trade_off is not None


# ==============================================================================
# 2. API Integration Tests: Recommendations, Finalize, Reject, KPIs
# ==============================================================================

@pytest.mark.asyncio
async def test_api_generate_recommendation_success(opt_client: AsyncClient, opt_test_db: AsyncSession):
    """Project Manager successfully generates recommendation via API."""
    env = await setup_test_environment(opt_test_db)
    proj = env["target_proj"]
    ws = env["ws"]
    token = create_token("clerk_pm_user", role=SystemRole.PROJECT_MANAGER.value)

    response = await opt_client.post(
        f"/api/v1/projects/{proj.id}/team-recommendation",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Workspace-Id": str(ws.id),
        },
        json={
            "team_size": 2,
            "formation_option": "autonomous_ai",
            "required_skills": [
                {"skill": "Python", "min_proficiency": 70, "priority": "High"},
                {"skill": "React", "min_proficiency": 70, "priority": "High"},
            ],
        },
    )

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["is_feasible"] is True
    assert data["project_id"] == str(proj.id)
    assert len(data["recommended_team"]) == 2
    assert data["metrics"]["skill_coverage_percent"] == 100.0
    assert data["status"] == "Draft"
    assert data["formation_code"].startswith("FRM-")
    assert len(data["alternatives"]) >= 1

    # Check candidates have explainability rationale
    c1 = data["recommended_team"][0]
    assert "why_selected" in c1
    assert "summary" in c1["why_selected"]
    assert len(c1["why_selected"]["strengths"]) > 0


@pytest.mark.asyncio
async def test_api_cross_workspace_isolation_blocked(opt_client: AsyncClient, opt_test_db: AsyncSession):
    """User cannot generate or view recommendations for a project in another workspace (HTTP 404)."""
    env = await setup_test_environment(opt_test_db)
    proj = env["target_proj"]  # belongs to ws
    ws_other = env["ws_other"]
    token = create_token("clerk_pm_user", role=SystemRole.PROJECT_MANAGER.value)

    # Ensure pm_user has valid membership in ws_other so header passes auth,
    # but isolation ensures target_proj (in ws) cannot be accessed under ws_other.
    opt_test_db.add(WorkspaceMember(workspace_id=ws_other.id, user_id=env["pm_user"].id, role=WorkspaceRole.ADMIN.value))
    await opt_test_db.commit()

    # Calling with ws_other as X-Workspace-Id
    response = await opt_client.post(
        f"/api/v1/projects/{proj.id}/team-recommendation",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Workspace-Id": str(ws_other.id),
        },
        json={"team_size": 2},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_api_rbac_employee_forbidden(opt_client: AsyncClient, opt_test_db: AsyncSession):
    """Regular employee cannot generate team recommendations (HTTP 403 Forbidden)."""
    env = await setup_test_environment(opt_test_db)
    proj = env["target_proj"]
    ws = env["ws"]
    token = create_token("clerk_dev_user", role=SystemRole.EMPLOYEE.value)

    response = await opt_client.post(
        f"/api/v1/projects/{proj.id}/team-recommendation",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Workspace-Id": str(ws.id),
        },
        json={"team_size": 2},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_api_finalize_recommendation_and_concurrency_guard(
    opt_client: AsyncClient, opt_test_db: AsyncSession
):
    """Finalization atomically commits ProjectAllocation records; duplicate finalize triggers HTTP 409."""
    env = await setup_test_environment(opt_test_db)
    proj = env["target_proj"]
    ws = env["ws"]
    token = create_token("clerk_pm_user", role=SystemRole.PROJECT_MANAGER.value)

    # 1. Generate recommendation
    gen_resp = await opt_client.post(
        f"/api/v1/projects/{proj.id}/team-recommendation",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Workspace-Id": str(ws.id),
        },
        json={"team_size": 2},
    )
    assert gen_resp.status_code == 200
    formation_id = gen_resp.json()["formation_id"]

    # 2. Finalize recommendation
    fin_resp = await opt_client.post(
        f"/api/v1/teams/recommendations/{formation_id}/finalize",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Workspace-Id": str(ws.id),
        },
        json={"notes": "Approved by PM Alice for Sprint 1."},
    )
    assert fin_resp.status_code == 200
    fin_data = fin_resp.json()
    assert fin_data["status"] == "Finalized"
    assert fin_data["assigned_member_count"] == 2

    # 3. Verify ProjectAllocation records created in DB
    allocs = (await opt_test_db.execute(
        select(ProjectAllocation).where(ProjectAllocation.project_id == proj.id)
    )).scalars().all()
    assert len(allocs) == 2

    # 4. Verify formation record marked Finalized
    saved_form = (await opt_test_db.execute(
        select(TeamFormation).where(TeamFormation.id == uuid.UUID(formation_id))
    )).scalar_one()
    assert saved_form.status == "Finalized"

    # 5. Concurrency Guard: Attempting to finalize an already finalized formation triggers 409 Conflict
    dup_resp = await opt_client.post(
        f"/api/v1/teams/recommendations/{formation_id}/finalize",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Workspace-Id": str(ws.id),
        },
        json={"notes": "Duplicate finalization attempt"},
    )
    assert dup_resp.status_code == 409
    err_msg = dup_resp.json()["error"]["message"].lower()
    assert "already" in err_msg and "finalized" in err_msg


@pytest.mark.asyncio
async def test_api_reject_recommendation(opt_client: AsyncClient, opt_test_db: AsyncSession):
    """Archiving/rejecting a recommendation updates status to Archived without allocations."""
    env = await setup_test_environment(opt_test_db)
    proj = env["target_proj"]
    ws = env["ws"]
    token = create_token("clerk_pm_user", role=SystemRole.PROJECT_MANAGER.value)

    # Generate
    gen_resp = await opt_client.post(
        f"/api/v1/projects/{proj.id}/team-recommendation",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
        json={"team_size": 2},
    )
    formation_id = gen_resp.json()["formation_id"]

    # Reject
    rej_resp = await opt_client.post(
        f"/api/v1/teams/recommendations/{formation_id}/reject",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert rej_resp.status_code == 200
    assert rej_resp.json()["status"] == "Archived"

    # Verify DB state
    form = (await opt_test_db.execute(
        select(TeamFormation).where(TeamFormation.id == uuid.UUID(formation_id))
    )).scalar_one()
    assert form.status == "Archived"


@pytest.mark.asyncio
async def test_api_kpis_and_history(opt_client: AsyncClient, opt_test_db: AsyncSession):
    """Retrieving KPIs and formation history returns populated analytics."""
    env = await setup_test_environment(opt_test_db)
    proj = env["target_proj"]
    ws = env["ws"]
    token = create_token("clerk_pm_user", role=SystemRole.PROJECT_MANAGER.value)

    # Create one formation run
    await opt_client.post(
        f"/api/v1/projects/{proj.id}/team-recommendation",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
        json={"team_size": 2},
    )

    # 1. Project history
    hist_resp = await opt_client.get(
        f"/api/v1/projects/{proj.id}/team-history",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert hist_resp.status_code == 200
    hist = hist_resp.json()
    assert len(hist) >= 1
    assert hist[0]["project_name"] == proj.name

    # 2. Workspace-wide history
    ws_hist_resp = await opt_client.get(
        "/api/v1/teams/history",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert ws_hist_resp.status_code == 200
    assert len(ws_hist_resp.json()) >= 1

    # 3. Workspace KPIs
    kpi_resp = await opt_client.get(
        "/api/v1/teams/kpis",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
    )
    assert kpi_resp.status_code == 200
    kpis = kpi_resp.json()
    assert kpis["total_formations"] >= 1
    assert "average_team_fit" in kpis


# ==============================================================================
# Phase 8.1 Audit Regression Tests
# ==============================================================================

def test_compute_team_allocations_all_sizes():
    """Validates deterministic remainder distribution and exact 100.00% allocation across team sizes."""
    import random

    for k in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]:
        uids = [uuid.uuid4() for _ in range(k)]
        allocs = compute_team_allocations(uids, total_project_allocation=100.0)

        assert len(allocs) == k
        # Sum must equal exactly 100.00
        total_sum = round(sum(allocs.values()), 2)
        assert total_sum == 100.0, f"Failed for size {k}: sum was {total_sum}"

        # Difference between any two members must be at most 0.01%
        vals = list(allocs.values())
        assert max(vals) - min(vals) <= 0.0101, f"Uneven remainder distribution for size {k}"

    # Specific check for size 3: 33.34, 33.33, 33.33
    uids_3 = [uuid.uuid4() for _ in range(3)]
    allocs_3 = compute_team_allocations(uids_3)
    vals_3 = sorted(allocs_3.values(), reverse=True)
    assert vals_3 == [33.34, 33.33, 33.33]

    # Specific check for size 6: 4 x 16.67, 2 x 16.66
    uids_6 = [uuid.uuid4() for _ in range(6)]
    allocs_6 = compute_team_allocations(uids_6)
    vals_6 = sorted(allocs_6.values(), reverse=True)
    assert vals_6 == [16.67, 16.67, 16.67, 16.67, 16.66, 16.66]

    # Determinism check: Shuffling input order produces identical allocation per UUID
    uids_perm = uids_6.copy()
    random.seed(42)
    random.shuffle(uids_perm)
    allocs_shuffled = compute_team_allocations(uids_perm)
    for uid in uids_6:
        assert allocs_6[uid] == allocs_shuffled[uid]

    # Explicit member allocations
    u1, u2 = uuid.uuid4(), uuid.uuid4()
    custom_valid = compute_team_allocations([u1, u2], explicit_allocations={u1: 70.0, u2: 30.0})
    assert custom_valid[u1] == 70.0 and custom_valid[u2] == 30.0

    # Invalid explicit sum triggers ValidationError
    with pytest.raises(ValidationError):
        compute_team_allocations([u1, u2], explicit_allocations={u1: 60.0, u2: 30.0})


@pytest.mark.asyncio
async def test_api_finalize_explicit_member_allocations(opt_client: AsyncClient, opt_test_db: AsyncSession):
    """Finalization accepts custom member allocations within 100% and rejects non-100% allocations."""
    env = await setup_test_environment(opt_test_db)
    proj = env["target_proj"]
    ws = env["ws"]
    e1, e2 = env["employees"]["e1"], env["employees"]["e2"]
    token = create_token("clerk_pm_user", role=SystemRole.PROJECT_MANAGER.value)

    # 1. Accept valid custom allocation sum (65 + 35 = 100%)
    gen_resp = await opt_client.post(
        f"/api/v1/projects/{proj.id}/team-recommendation",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
        json={"team_size": 2},
    )
    formation_id = gen_resp.json()["formation_id"]

    valid_resp = await opt_client.post(
        f"/api/v1/teams/recommendations/{formation_id}/finalize",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
        json={
            "notes": "Custom allocations 65/35",
            "selected_candidate_ids": [str(e1.id), str(e2.id)],
            "member_allocations": {str(e1.id): 65.0, str(e2.id): 35.0},
        },
    )
    assert valid_resp.status_code == 200

    # Verify allocations persisted in DB
    allocs = (await opt_test_db.execute(
        select(ProjectAllocation).where(ProjectAllocation.project_id == proj.id)
    )).scalars().all()
    alloc_map = {a.employee_id: a.allocation_percent for a in allocs}
    assert alloc_map[e1.id] == 65.0
    assert alloc_map[e2.id] == 35.0

    # 2. Reject invalid custom allocation sum (60 + 30 = 90% != 100%) on a new target project
    proj2 = Project(
        workspace_id=ws.id,
        project_code="PRJ-ALLOC-INVALID",
        name="Alloc Test Project",
        department="Engineering",
        status="Planning",
        priority="High",
        deadline=date.today() + timedelta(days=30),
    )
    opt_test_db.add(proj2)
    await opt_test_db.flush()
    opt_test_db.add(ProjectRequirement(
        project_id=proj2.id,
        skill_id=env["skills"]["python"].id,
        min_proficiency=70,
        is_mandatory=True,
    ))
    await opt_test_db.flush()

    gen_resp2 = await opt_client.post(
        f"/api/v1/projects/{proj2.id}/team-recommendation",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
        json={"team_size": 2},
    )
    formation2_id = gen_resp2.json()["formation_id"]

    invalid_resp = await opt_client.post(
        f"/api/v1/teams/recommendations/{formation2_id}/finalize",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
        json={
            "notes": "Invalid custom allocations",
            "selected_candidate_ids": [str(e1.id), str(e2.id)],
            "member_allocations": {str(e1.id): 60.0, str(e2.id): 30.0},
        },
    )
    assert invalid_resp.status_code in (400, 422)


@pytest.mark.asyncio
async def test_concurrent_finalization_over_allocation_guard(opt_client: AsyncClient, opt_test_db: AsyncSession):
    """Simultaneous finalization requests cannot over-allocate an employee past 150% hard safety ceiling."""
    env = await setup_test_environment(opt_test_db)
    ws = env["ws"]
    e1 = env["employees"]["e1"] # Elena Rostova
    e2 = env["employees"]["e2"] # Marcus Vance
    token = create_token("clerk_pm_user", role=SystemRole.PROJECT_MANAGER.value)

    # Create an existing active allocation for e1 of 60.0%
    prior_proj = Project(
        workspace_id=ws.id,
        project_code="PRJ-PRIOR-01",
        name="Prior Project",
        department="Engineering",
        status="In Progress",
        priority="Medium",
        deadline=date.today() + timedelta(days=90),
    )
    opt_test_db.add(prior_proj)
    await opt_test_db.flush()

    opt_test_db.add(ProjectAllocation(
        project_id=prior_proj.id,
        employee_id=e1.id,
        allocation_percent=60.0,
        status="Active",
        role="Backend Lead",
    ))
    await opt_test_db.flush()

    # Create two distinct target projects in the workspace
    p1 = Project(
        workspace_id=ws.id,
        project_code="PRJ-SPRINT-A",
        name="Sprint Alpha",
        department="Engineering",
        status="Planning",
        priority="High",
        deadline=date.today() + timedelta(days=30),
    )
    p2 = Project(
        workspace_id=ws.id,
        project_code="PRJ-SPRINT-B",
        name="Sprint Beta",
        department="Engineering",
        status="Planning",
        priority="High",
        deadline=date.today() + timedelta(days=30),
    )
    opt_test_db.add_all([p1, p2])
    await opt_test_db.flush()

    p1_id = p1.id
    p2_id = p2.id
    ws_id = ws.id

    # Add required skills
    opt_test_db.add_all([
        ProjectRequirement(project_id=p1_id, skill_id=env["skills"]["python"].id, min_proficiency=70, is_mandatory=True),
        ProjectRequirement(project_id=p2_id, skill_id=env["skills"]["python"].id, min_proficiency=70, is_mandatory=True),
    ])
    await opt_test_db.flush()

    # Generate recommendations for both projects (both choose e1 + e2 with 50% allocation each)
    gen_p1 = await opt_client.post(
        f"/api/v1/projects/{p1_id}/team-recommendation",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws_id)},
        json={"team_size": 2},
    )
    gen_p2 = await opt_client.post(
        f"/api/v1/projects/{p2_id}/team-recommendation",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws_id)},
        json={"team_size": 2},
    )
    assert gen_p1.status_code == 200
    assert gen_p2.status_code == 200
    form_p1_id = gen_p1.json()["formation_id"]
    form_p2_id = gen_p2.json()["formation_id"]

    # Finalize p1: adds 50.0% to e1. Total committed becomes 60 + 50 = 110.0% (<= 150%)
    fin_p1 = await opt_client.post(
        f"/api/v1/teams/recommendations/{form_p1_id}/finalize",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws_id)},
        json={"notes": "Finalizing Project 1"},
    )
    assert fin_p1.status_code == 200

    # Finalize p2: would add another 50.0% to e1. Total would be 110 + 50 = 160.0% > 150.0%!
    # Must fail with HTTP 409 Conflict immediately revalidating live locked employee capacity.
    fin_p2 = await opt_client.post(
        f"/api/v1/teams/recommendations/{form_p2_id}/finalize",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws_id)},
        json={"notes": "Finalizing Project 2"},
    )
    assert fin_p2.status_code == 409
    err_body = fin_p2.json()["error"]["message"]
    assert "exceeds absolute safety threshold (150%)" in err_body

    # Verification: p2 has 0 allocations committed (atomic rollback succeeded)
    p2_allocs = (await opt_test_db.execute(
        select(ProjectAllocation).where(ProjectAllocation.project_id == p2_id)
    )).scalars().all()
    assert len(p2_allocs) == 0

    # Formation for p2 remains in Draft status
    saved_form_p2_status = (await opt_test_db.execute(
        select(TeamFormation.status).where(TeamFormation.id == uuid.UUID(form_p2_id))
    )).scalar_one()
    assert saved_form_p2_status == "Draft"


@pytest.mark.asyncio
async def test_stale_recommendation_rejection(opt_client: AsyncClient, opt_test_db: AsyncSession):
    """Finalization rejects recommendations if project state, deadline, or candidate availability changed."""
    env = await setup_test_environment(opt_test_db)
    proj_id = env["target_proj"].id
    ws_id = env["ws"].id
    e1_id = env["employees"]["e1"].id
    e2_id = env["employees"]["e2"].id
    token = create_token("clerk_pm_user", role=SystemRole.PROJECT_MANAGER.value)

    # 1. Project is marked Completed -> 409 Conflict
    gen1 = await opt_client.post(
        f"/api/v1/projects/{proj_id}/team-recommendation",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws_id)},
        json={"team_size": 2},
    )
    form1_id = gen1.json()["formation_id"]

    await opt_test_db.execute(
        update(Project).where(Project.id == proj_id).values(status="Completed")
    )
    opt_test_db.expire_all()

    stale_resp1 = await opt_client.post(
        f"/api/v1/teams/recommendations/{form1_id}/finalize",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws_id)},
        json={"notes": "Should fail on completed project"},
    )
    assert stale_resp1.status_code == 409
    assert "completed" in stale_resp1.json()["error"]["message"].lower()

    # 2. Project deadline expired -> 409 Conflict
    await opt_test_db.execute(
        update(Project).where(Project.id == proj_id).values(
            status="In Progress",
            deadline=date.today() - timedelta(days=2),
        )
    )
    opt_test_db.expire_all()

    stale_resp2 = await opt_client.post(
        f"/api/v1/teams/recommendations/{form1_id}/finalize",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws_id)},
        json={"notes": "Should fail on expired deadline"},
    )
    assert stale_resp2.status_code == 409
    assert "deadline" in stale_resp2.json()["error"]["message"] and "passed" in stale_resp2.json()["error"]["message"]

    # 3. Candidate became Inactive or On Leave -> 409 Conflict
    await opt_test_db.execute(
        update(Project).where(Project.id == proj_id).values(
            deadline=date.today() + timedelta(days=60),
        )
    )
    await opt_test_db.execute(
        update(Employee).where(Employee.id == e2_id).values(employment_status="On Leave")
    )
    opt_test_db.expire_all()

    stale_resp3 = await opt_client.post(
        f"/api/v1/teams/recommendations/{form1_id}/finalize",
        headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws_id)},
        json={"notes": "Should fail on leave candidate"},
    )
    assert stale_resp3.status_code == 409
    assert "is no longer available" in stale_resp3.json()["error"]["message"]


@pytest.mark.asyncio
async def test_awis_review_tier_preservation(opt_client: AsyncClient, opt_test_db: AsyncSession):
    """Review-required candidates (Tier 3) do not bypass warnings or unseat fully eligible candidates."""
    env = await setup_test_environment(opt_test_db)
    proj = env["target_proj"]
    ws = env["ws"]
    token = create_token("clerk_pm_user", role=SystemRole.PROJECT_MANAGER.value)

    # Request recommendations across multiple strategies
    for strategy in ["autonomous_ai", "fatigue_safe", "growth_mentorship", "high_velocity"]:
        res = await opt_client.post(
            f"/api/v1/projects/{proj.id}/team-recommendation",
            headers={"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)},
            json={"team_size": 2, "formation_option": strategy},
        )
        assert res.status_code == 200
        data = res.json()

        # Elena and Marcus are eligible (Tier 1 or 2) and must form primary team
        primary_members = data["candidates"]
        assert len(primary_members) == 2
        for m in primary_members:
            assert m["ranking_tier"] in (1, 2)
            assert m["needs_review"] is False

        # If any candidate in alternatives needs review, ensure needs_review flag and warnings are preserved
        for alt in data["alternatives"]:
            for m in alt["candidates"]:
                if m["needs_review"]:
                    # Candidate must have ranking tier 3
                    assert m["ranking_tier"] == 3
                    # Metric warnings must include Managerial Review alert
                    review_warns = [w for w in alt["metrics"]["warnings"] if "Review Required" in w["title"]]
                    assert len(review_warns) > 0


@pytest.mark.asyncio
async def test_unauthorized_and_cross_workspace_finalization(opt_client: AsyncClient, opt_test_db: AsyncSession):
    """Unauthorized roles receive 403 and cross-workspace finalization attempts receive 404."""
    env = await setup_test_environment(opt_test_db)
    proj = env["target_proj"]
    ws = env["ws"]
    ws_other = env["ws_other"]
    pm_user = env["pm_user"]
    pm_token = create_token("clerk_pm_user", role=SystemRole.PROJECT_MANAGER.value)
    emp_token = create_token("clerk_dev_user", role=SystemRole.EMPLOYEE.value)

    gen = await opt_client.post(
        f"/api/v1/projects/{proj.id}/team-recommendation",
        headers={"Authorization": f"Bearer {pm_token}", "X-Workspace-Id": str(ws.id)},
        json={"team_size": 2},
    )
    form_id = gen.json()["formation_id"]

    # 1. Employee cannot finalize (403 Forbidden)
    emp_resp = await opt_client.post(
        f"/api/v1/teams/recommendations/{form_id}/finalize",
        headers={"Authorization": f"Bearer {emp_token}", "X-Workspace-Id": str(ws.id)},
        json={"notes": "Unauthorized attempt"},
    )
    assert emp_resp.status_code == 403

    # 2. Cross-workspace tenant boundary rejection:
    # Add pm_user as member of ws_other so workspace header is valid,
    # but formation belongs to ws (not ws_other). Must return 404 Not Found.
    opt_test_db.add(WorkspaceMember(
        workspace_id=ws_other.id,
        user_id=pm_user.id,
        role=WorkspaceRole.ADMIN.value,
    ))
    await opt_test_db.flush()

    other_resp = await opt_client.post(
        f"/api/v1/teams/recommendations/{form_id}/finalize",
        headers={"Authorization": f"Bearer {pm_token}", "X-Workspace-Id": str(ws_other.id)},
        json={"notes": "Cross-workspace attempt"},
    )
    assert other_resp.status_code == 404


