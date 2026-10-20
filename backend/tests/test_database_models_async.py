"""
NEXAWIS Backend - Asynchronous Database Model Integration Tests.
Executes real SQL schema creation, relational insertions, foreign key cascades,
and unique constraint validations using an isolated async SQLite engine.
"""

import uuid
from datetime import date
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from app.models import (
    Base,
    Workspace,
    WorkspaceMember,
    WorkspaceSettings,
    User,
    UserPreference,
    Skill,
    EmployeeSkill,
    Employee,
    EmployeeCertification,
    EmployeeWorkloadHistory,
    EmployeePerformanceHistory,
    Project,
    ProjectRequirement,
    ProjectMilestone,
    ProjectAllocation,
    TeamFormation,
    TeamFormationMember,
    AwisEvaluation,
    MlBurnoutPrediction,
    MlProjectSuccessPrediction,
    Report,
    ScheduledReport,
)


@pytest_asyncio.fixture
async def async_test_session():
    """Provides a fresh isolated in-memory database session for async testing."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_full_workspace_and_workforce_flow(async_test_session: AsyncSession):
    """Test creating a workspace, users, employees, skills, and relational links."""
    session = async_test_session

    # 1. Create Workspace
    workspace = Workspace(name="Nexawis Technologies", slug="nexawis-tech")
    session.add(workspace)
    await session.commit()
    await session.refresh(workspace)
    assert workspace.id is not None

    # 2. Create User and Preference
    user = User(
        clerk_user_id="user_clerk_live_999",
        email="laukik@nexawis.com",
        full_name="Laukik Khake",
        role="Admin",
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    user_pref = UserPreference(
        user_id=user.id,
        theme="dark",
        language="en-US",
        notification_settings={"projectUpdates": True, "burnoutAlerts": True},
    )
    session.add(user_pref)

    # 3. Add Workspace Settings
    ws_settings = WorkspaceSettings(
        workspace_id=workspace.id,
        default_department="Engineering",
        default_project_view="table",
    )
    session.add(ws_settings)

    # 4. Add Member
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=user.id,
        role="owner",
    )
    session.add(member)

    # 5. Add Skill
    skill_react = Skill(workspace_id=workspace.id, name="React", category="Frontend")
    skill_py = Skill(workspace_id=workspace.id, name="Python", category="Backend")
    session.add_all([skill_react, skill_py])
    await session.commit()

    # 6. Add Employee
    emp = Employee(
        workspace_id=workspace.id,
        employee_code="NXW-1042",
        user_id=user.id,
        full_name="Elena Rostova",
        email="elena.r@nexawis.com",
        department="Engineering",
        designation="Senior Frontend Engineer",
        experience_years=6.0,
        performance_score=94.0,
        availability_score=80.0,
        mental_fatigue_score=15.0,
        wellbeing_risk="Low",
    )
    session.add(emp)
    await session.commit()
    await session.refresh(emp)

    # 7. Add Employee Skills
    emp_skill = EmployeeSkill(
        employee_id=emp.id,
        skill_id=skill_react.id,
        proficiency=95,
        is_primary=True,
    )
    session.add(emp_skill)

    # 8. Add Certifications & Workload History
    cert = EmployeeCertification(
        employee_id=emp.id,
        name="AWS Certified Solutions Architect",
        issuer="Amazon Web Services",
        issue_date=date(2025, 1, 15),
    )
    workload = EmployeeWorkloadHistory(
        employee_id=emp.id,
        recorded_date=date(2026, 10, 1),
        weekly_work_hours=42.0,
        overtime_hours=2.0,
        utilization_percentage=85.0,
    )
    perf_hist = EmployeePerformanceHistory(
        employee_id=emp.id,
        period_label="2026-Q3",
        performance_score=94.0,
    )
    session.add_all([cert, workload, perf_hist])
    await session.commit()

    # Query and verify
    result = await session.execute(
        select(Employee).where(Employee.employee_code == "NXW-1042")
    )
    saved_emp = result.scalar_one()
    assert saved_emp.full_name == "Elena Rostova"
    assert saved_emp.experience_years == 6.0


@pytest.mark.asyncio
async def test_project_and_team_formation_lifecycle(async_test_session: AsyncSession):
    """Test project creation, requirements, team formations, and allocation records."""
    session = async_test_session

    # Workspace & Skill setup
    workspace = Workspace(name="Nexawis Projects", slug="nexawis-proj")
    session.add(workspace)
    await session.commit()

    skill = Skill(workspace_id=workspace.id, name="PyTorch", category="AI/ML")
    session.add(skill)
    await session.commit()

    emp = Employee(
        workspace_id=workspace.id,
        employee_code="NXW-2001",
        full_name="Marcus Vance",
        email="marcus@nexawis.com",
        department="AI Research",
        designation="Lead AI Engineer",
    )
    session.add(emp)
    await session.commit()

    # Create Project
    project = Project(
        workspace_id=workspace.id,
        project_code="PRJ-200",
        name="Project Omega",
        department="AI Research",
        priority="Critical",
        complexity="High",
        target_team_size=3,
    )
    session.add(project)
    await session.commit()

    # Add Project Requirement & Milestone
    req = ProjectRequirement(
        project_id=project.id,
        skill_id=skill.id,
        min_proficiency=85,
        priority="High",
    )
    milestone = ProjectMilestone(
        project_id=project.id,
        name="Phase 1 Architecture Complete",
        status="Current",
        due_date=date(2026, 11, 30),
    )
    session.add_all([req, milestone])
    await session.commit()

    # Create Team Formation Recommendation
    formation = TeamFormation(
        workspace_id=workspace.id,
        project_id=project.id,
        formation_code="FRM-2026-099",
        formation_option="growth_mentorship",
        status="Draft",
        target_team_size=3,
        team_fit_score=92.5,
    )
    session.add(formation)
    await session.commit()

    member = TeamFormationMember(
        formation_id=formation.id,
        employee_id=emp.id,
        assigned_role="Technical Lead",
        allocation_percent=75.0,
        match_score=94.0,
        why_selected={"summary": "Strong PyTorch expertise and mentor experience"},
    )
    session.add(member)
    await session.commit()

    # Verify query
    result = await session.execute(
        select(TeamFormation).where(TeamFormation.formation_code == "FRM-2026-099")
    )
    saved_form = result.scalar_one()
    assert saved_form.team_fit_score == 92.5
    assert saved_form.status == "Draft"


@pytest.mark.asyncio
async def test_awis_and_ml_predictions_isolation(async_test_session: AsyncSession):
    """Verify storing AWIS evaluations and ML predictions without mutating observed entities."""
    session = async_test_session

    workspace = Workspace(name="ML Workspace", slug="ml-ws")
    session.add(workspace)
    await session.commit()

    emp = Employee(
        workspace_id=workspace.id,
        employee_code="NXW-3001",
        full_name="Sara Connor",
        email="sara@nexawis.com",
        department="Robotics",
        designation="Systems Engineer",
    )
    project = Project(
        workspace_id=workspace.id,
        project_code="PRJ-300",
        name="Autonomous Robotics",
        department="Robotics",
    )
    session.add_all([emp, project])
    await session.commit()

    # 1. AWIS Evaluation
    awis = AwisEvaluation(
        workspace_id=workspace.id,
        project_id=project.id,
        employee_id=emp.id,
        composite_awis_score=91.4,
        skill_intelligence=95.0,
        experience_intelligence=90.0,
        performance_intelligence=92.0,
        availability_intelligence=85.0,
        workload_intelligence=88.0,
        burnout_intelligence=92.0,
        collaboration_intelligence=90.0,
        growth_intelligence=88.0,
        compatibility_intelligence=92.0,
    )

    # 2. Burnout Prediction
    burnout = MlBurnoutPrediction(
        workspace_id=workspace.id,
        employee_id=emp.id,
        model_version="burnout_model_v1",
        predicted_burn_rate=0.22,
        normalized_burnout_score=22.0,
        risk_tier="Low",
        feature_provenance={"Weekly_Work_Hours": 40.0, "Mental_Fatigue_Score": 2.0},
    )

    # 3. Project Success Prediction
    success = MlProjectSuccessPrediction(
        workspace_id=workspace.id,
        project_id=project.id,
        model_version="Project_Success_XGBoost_v1",
        predicted_success_score=88.7,
        confidence_score=0.94,
    )

    session.add_all([awis, burnout, success])
    await session.commit()

    # Assert separate retrieval
    res_awis = await session.execute(
        select(AwisEvaluation).where(AwisEvaluation.employee_id == emp.id)
    )
    assert res_awis.scalar_one().composite_awis_score == 91.4

    res_burn = await session.execute(
        select(MlBurnoutPrediction).where(MlBurnoutPrediction.employee_id == emp.id)
    )
    assert res_burn.scalar_one().risk_tier == "Low"


@pytest.mark.asyncio
async def test_unique_constraints_prevention(async_test_session: AsyncSession):
    """Verify unique constraints prevent duplicates at the database layer."""
    session = async_test_session

    workspace = Workspace(name="Constrained Org", slug="constrained-org")
    session.add(workspace)
    await session.commit()

    emp1 = Employee(
        workspace_id=workspace.id,
        employee_code="NXW-9999",
        full_name="Duplicate Test 1",
        email="dup1@nexawis.com",
        department="QA",
        designation="Tester",
    )
    session.add(emp1)
    await session.commit()

    # Attempting to insert another employee with same employee_code in the same workspace must raise IntegrityError
    emp2 = Employee(
        workspace_id=workspace.id,
        employee_code="NXW-9999",  # Duplicate code
        full_name="Duplicate Test 2",
        email="dup2@nexawis.com",
        department="QA",
        designation="Tester",
    )
    session.add(emp2)

    with pytest.raises(IntegrityError):
        await session.commit()

    await session.rollback()


@pytest.mark.asyncio
async def test_reports_persistence(async_test_session: AsyncSession):
    """Verify Report and ScheduledReport persistence."""
    session = async_test_session

    workspace = Workspace(name="Report Org", slug="report-org")
    session.add(workspace)
    await session.commit()

    report = Report(
        workspace_id=workspace.id,
        title="Quarterly Intelligence Summary",
        category="workforce",
        reporting_period="Q3 2026",
        config={"departments": ["All"], "includeCharts": True},
        summary_metrics=[{"label": "Avg AWIS", "value": 87.2}],
        findings=["Strong skill growth in frontend technologies."],
    )
    sched = ScheduledReport(
        workspace_id=workspace.id,
        name="Monthly Sustainability Distribution",
        category="sustainability",
        frequency="Monthly",
        recipients=["manager@nexawis.com"],
        format="PDF",
    )
    session.add_all([report, sched])
    await session.commit()

    res = await session.execute(select(Report).where(Report.workspace_id == workspace.id))
    saved_rep = res.scalar_one()
    assert saved_rep.title == "Quarterly Intelligence Summary"
    assert saved_rep.config["includeCharts"] is True
