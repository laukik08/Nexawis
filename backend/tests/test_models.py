"""
NEXAWIS Backend - Tests for SQLAlchemy 2.x Declarative Models.
Validates model initialization, table names, primary keys, relationships, and metadata structure.
"""

import uuid
from datetime import date
import pytest
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


def test_base_metadata_contains_all_phase2_tables():
    """Verify that all 22 core domain tables are registered in Base.metadata."""
    expected_tables = {
        "workspaces",
        "workspace_members",
        "workspace_settings",
        "users",
        "user_preferences",
        "skills",
        "employee_skills",
        "employees",
        "employee_certifications",
        "employee_workload_history",
        "employee_performance_history",
        "projects",
        "project_requirements",
        "project_milestones",
        "project_allocations",
        "team_formations",
        "team_formation_members",
        "awis_evaluations",
        "ml_burnout_predictions",
        "ml_project_success_predictions",
        "reports",
        "scheduled_reports",
    }
    registered_tables = set(Base.metadata.tables.keys())
    assert expected_tables.issubset(registered_tables)


def test_workspace_instantiation_and_repr():
    """Verify Workspace model defaults and __repr__."""
    ws = Workspace(name="Acme Corp", slug="acme-corp")
    assert ws.name == "Acme Corp"
    assert ws.slug == "acme-corp"
    assert "acme-corp" in repr(ws)


def test_user_model_initialization():
    """Verify User model attributes and safe Clerk linkage."""
    user = User(
        clerk_user_id="user_clerk_test_123",
        email="elena@nexawis.com",
        full_name="Elena Rostova",
        role="Project Manager",
        is_active=True,
    )
    assert user.clerk_user_id == "user_clerk_test_123"
    assert user.email == "elena@nexawis.com"
    assert user.is_active is True
    assert "elena@nexawis.com" in repr(user)
    assert User.__table__.columns["is_active"].default.arg is True


def test_employee_and_skills_initialization():
    """Verify Employee and Skill model defaults."""
    ws_id = uuid.uuid4()
    emp = Employee(
        workspace_id=ws_id,
        employee_code="NXW-1042",
        full_name="Elena Rostova",
        email="elena.r@nexawis.com",
        department="Engineering",
        designation="Senior Frontend Engineer",
        experience_years=6.0,
        employment_status="Available",
        availability_score=100.0,
        wellbeing_risk="Low",
    )
    assert emp.employee_code == "NXW-1042"
    assert emp.employment_status == "Available"
    assert emp.availability_score == 100.0
    assert emp.wellbeing_risk == "Low"
    assert "NXW-1042" in repr(emp)
    assert Employee.__table__.columns["employment_status"].default.arg == "Available"
    assert Employee.__table__.columns["availability_score"].default.arg == 100.0

    skill = Skill(workspace_id=ws_id, name="React", category="Frontend")
    assert skill.name == "React"
    assert "React" in repr(skill)

    emp_skill = EmployeeSkill(
        employee_id=emp.id,
        skill_id=skill.id,
        proficiency=95,
        is_primary=True,
    )
    assert emp_skill.proficiency == 95
    assert emp_skill.is_primary is True
    assert "proficiency=95" in repr(emp_skill)


def test_project_and_allocations_initialization():
    """Verify Project and ProjectAllocation defaults."""
    ws_id = uuid.uuid4()
    project = Project(
        workspace_id=ws_id,
        project_code="PRJ-101",
        name="Project Alpha",
        department="Engineering",
        priority="High",
        complexity="High",
        status="Planning",
        target_team_size=4,
        priority_score=50.0,
    )
    assert project.project_code == "PRJ-101"
    assert project.status == "Planning"
    assert project.target_team_size == 4
    assert project.priority_score == 50.0
    assert "PRJ-101" in repr(project)
    assert Project.__table__.columns["status"].default.arg == "Planning"
    assert Project.__table__.columns["target_team_size"].default.arg == 4

    alloc = ProjectAllocation(
        project_id=project.id,
        employee_id=uuid.uuid4(),
        role="Lead Frontend",
        allocation_percent=80.0,
        status="Active",
    )
    assert alloc.allocation_percent == 80.0
    assert alloc.status == "Active"
    assert "Lead Frontend" in repr(alloc)


def test_team_formation_initialization():
    """Verify TeamFormation and TeamFormationMember structures."""
    ws_id = uuid.uuid4()
    proj_id = uuid.uuid4()
    formation = TeamFormation(
        workspace_id=ws_id,
        project_id=proj_id,
        formation_code="FRM-2026-001",
        formation_option="fatigue_safe",
        status="Draft",
    )
    assert formation.formation_code == "FRM-2026-001"
    assert formation.status == "Draft"
    assert formation.formation_option == "fatigue_safe"
    assert "FRM-2026-001" in repr(formation)
    assert TeamFormation.__table__.columns["status"].default.arg == "Draft"

    member = TeamFormationMember(
        formation_id=formation.id,
        employee_id=uuid.uuid4(),
        assigned_role="Senior Architect",
        allocation_percent=60.0,
        is_override=False,
        is_selected=True,
    )
    assert member.assigned_role == "Senior Architect"
    assert member.is_override is False
    assert "Senior Architect" in repr(member)


def test_awis_evaluation_initialization():
    """Verify AWIS 9-dimension composite evaluation model."""
    ws_id = uuid.uuid4()
    proj_id = uuid.uuid4()
    emp_id = uuid.uuid4()

    eval_record = AwisEvaluation(
        workspace_id=ws_id,
        project_id=proj_id,
        employee_id=emp_id,
        scoring_version="1.0.0",
        composite_awis_score=88.5,
        skill_intelligence=92.0,
        experience_intelligence=85.0,
        performance_intelligence=90.0,
        availability_intelligence=80.0,
        workload_intelligence=85.0,
        burnout_intelligence=90.0,
        collaboration_intelligence=88.0,
        growth_intelligence=84.0,
        compatibility_intelligence=87.0,
        eligibility_passed=True,
    )
    assert eval_record.composite_awis_score == 88.5
    assert eval_record.scoring_version == "1.0.0"
    assert eval_record.eligibility_passed is True
    assert "88.5" in repr(eval_record)


def test_ml_prediction_models_initialization():
    """Verify separate Burnout and Project Success prediction inference models."""
    ws_id = uuid.uuid4()
    emp_id = uuid.uuid4()
    proj_id = uuid.uuid4()

    burnout = MlBurnoutPrediction(
        workspace_id=ws_id,
        employee_id=emp_id,
        model_version="burnout_model_v1",
        predicted_burn_rate=0.42,
        normalized_burnout_score=42.0,
        risk_tier="Moderate",
    )
    assert burnout.risk_tier == "Moderate"
    assert burnout.predicted_burn_rate == 0.42
    assert "burnout_model_v1" in repr(burnout) or "Moderate" in repr(burnout)

    success = MlProjectSuccessPrediction(
        workspace_id=ws_id,
        project_id=proj_id,
        model_version="Project_Success_XGBoost_v1",
        predicted_success_score=84.2,
        confidence_score=0.91,
    )
    assert success.predicted_success_score == 84.2
    assert "84.2" in repr(success)


def test_reports_initialization():
    """Verify Report and ScheduledReport models."""
    ws_id = uuid.uuid4()
    report = Report(
        workspace_id=ws_id,
        title="Q1 Workforce Intelligence Report",
        category="workforce",
        reporting_period="Last 30 Days",
        status="Ready",
        format="PDF",
        config={"sections": ["summary", "skills"], "department": "Engineering"},
    )
    assert report.status == "Ready"
    assert report.format == "PDF"
    assert "Q1 Workforce Intelligence Report" in repr(report)
    assert Report.__table__.columns["status"].default.arg == "Ready"
    assert Report.__table__.columns["format"].default.arg == "PDF"

    sched = ScheduledReport(
        workspace_id=ws_id,
        name="Weekly Executive Digest",
        category="executive",
        frequency="Weekly",
        recipients=["exec@nexawis.com"],
        enabled=True,
    )
    assert sched.frequency == "Weekly"
    assert sched.enabled is True
    assert "Weekly Executive Digest" in repr(sched)
    assert ScheduledReport.__table__.columns["enabled"].default.arg is True

