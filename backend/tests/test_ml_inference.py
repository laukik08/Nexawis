"""
NEXAWIS Backend - Comprehensive Automated Tests for Secure ML Inference Integration (Phase 7).
Covers:
- Model loading, SHA-256 integrity check, version pinning, and synthetic startup self-test.
- Input validation, feature extraction, categorical mappings, and bounds validation.
- Missing and corrupted model artifact handling with graceful degradation.
- Burnout risk prediction: continuous burn rate target semantics, risk tiers, and factor attributions.
- Role-based wellbeing data masking (HR/Admin vs Project Manager).
- Project success prediction: team aggregation, prospective vs retrospective mode.
- Prevention of post-outcome feature leakage (Delivery_Delay_Days, Budget_Variance) in prospective forecasts.
- Clerk authentication, RBAC authorization, and cross-workspace isolation.
- Phase 6 AWIS scoring engine integration with fresh, stale, and absent ML predictions.
"""

import uuid
from datetime import datetime, timezone, timedelta, date
from pathlib import Path
from typing import Dict, List, Optional
import pytest
import pytest_asyncio
import jwt
from pydantic import ValidationError as PydanticValidationError
from httpx import AsyncClient, ASGITransport
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from sqlalchemy import select
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
    EmployeeCertification,
    EmployeeWorkloadHistory,
    Project,
    ProjectRequirement,
    ProjectAllocation,
    TeamFormation,
    TeamFormationMember,
    Skill,
)
from app.models.ml_results import MlBurnoutPrediction, MlProjectSuccessPrediction
from app.core.config import settings
from app.core.database import get_db_session
from app.core.clerk import set_test_verification_key, verify_clerk_token
from app.core.roles import SystemRole, WorkspaceRole
from app.core.exceptions import AppError, ValidationError, AuthorizationError, TokenExpiredError, InvalidTokenError
from app.schemas.ml import BurnoutInferenceOverride
from app.services.ml.loader import ModelLifecycleManager, model_manager
from app.services.ml.burnout import (
    extract_burnout_features,
    map_designation_to_int,
    map_company_type_to_int,
    normalize_mental_fatigue_score,
    derive_risk_tier,
    predict_employee_burnout,
)
from app.services.ml.project_success import (
    aggregate_team_features,
    assemble_project_features,
    derive_risk_level,
    predict_project_success,
)
from app.services.awis.scorers import score_burnout_safety
from app.services.awis import PriorityProfile


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
async def ml_test_db():
    """Provides an isolated async SQLite database for ML inference tests."""
    model_manager.load_models()
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def ml_client(ml_test_db: AsyncSession):
    """Provides an AsyncClient configured with test verification keys and test DB."""
    set_test_verification_key(TEST_PUBLIC_KEY, ["RS256"])

    async def _override_db():
        yield ml_test_db

    app.dependency_overrides[get_db_session] = _override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.pop(get_db_session, None)


async def seed_ml_test_workspace(
    db: AsyncSession,
    ws_name: str = "ML Test Workspace",
    user_role: str = SystemRole.PROJECT_MANAGER.value,
) -> Dict[str, any]:
    """Helper creating workspace, users, and baseline employee and project entities."""
    ws = Workspace(name=ws_name, slug=f"ws-{uuid.uuid4().hex[:8]}")
    db.add(ws)
    await db.flush()

    ws_settings = WorkspaceSettings(workspace_id=ws.id)
    db.add(ws_settings)

    u_id = f"user_{uuid.uuid4().hex[:8]}"
    user = User(
        clerk_user_id=u_id,
        email=f"{u_id}@test.com",
        full_name=f"User {u_id}",
        role=user_role,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    member = WorkspaceMember(
        workspace_id=ws.id,
        user_id=user.id,
        role=WorkspaceRole.ADMIN.value if user_role in (SystemRole.ADMIN.value, SystemRole.HR.value) else WorkspaceRole.MEMBER.value,
        is_active=True,
    )
    db.add(member)

    # Employee 1: Standard engineer
    emp1 = Employee(
        workspace_id=ws.id,
        employee_code=f"EMP-{uuid.uuid4().hex[:4].upper()}",
        full_name="Alice Engineer",
        email=f"alice-{uuid.uuid4().hex[:4]}@test.com",
        department="Engineering",
        designation="Senior Software Engineer",
        experience_years=6.0,
        company_type="Service",
        wfh_setup_available=True,
        current_workload_percent=75.0,
        mental_fatigue_score=25.0,
        performance_score=85.0,
        collaboration_score=80.0,
        growth_potential=75.0,
    )
    db.add(emp1)

    # Employee 2: High fatigue engineer
    emp2 = Employee(
        workspace_id=ws.id,
        employee_code=f"EMP-{uuid.uuid4().hex[:4].upper()}",
        full_name="Bob Overworked",
        email=f"bob-{uuid.uuid4().hex[:4]}@test.com",
        department="Engineering",
        designation="Software Engineer",
        experience_years=3.0,
        company_type="Service",
        wfh_setup_available=False,
        current_workload_percent=95.0,
        mental_fatigue_score=85.0,
        performance_score=78.0,
        collaboration_score=70.0,
        growth_potential=60.0,
    )
    db.add(emp2)
    await db.flush()

    # Workload history for emp1
    wl1 = EmployeeWorkloadHistory(
        employee_id=emp1.id,
        recorded_date=date.today(),
        weekly_work_hours=42.0,
        overtime_hours=2.0,
        utilization_percentage=75.0,
        consecutive_working_days=5,
        active_project_count=1,
    )
    db.add(wl1)

    # Workload history for emp2 (severe overload)
    wl2 = EmployeeWorkloadHistory(
        employee_id=emp2.id,
        recorded_date=date.today(),
        weekly_work_hours=60.0,
        overtime_hours=15.0,
        utilization_percentage=120.0,
        consecutive_working_days=14,
        active_project_count=3,
    )
    db.add(wl2)

    # Project
    proj = Project(
        workspace_id=ws.id,
        project_code=f"PRJ-{uuid.uuid4().hex[:4].upper()}",
        name="Platform Core Architecture",
        department="Engineering",
        priority="Critical",
        complexity="High",
        status="Planning",
        target_team_size=2,
    )
    db.add(proj)
    await db.commit()

    return {
        "workspace": ws,
        "user": user,
        "employee1": emp1,
        "employee2": emp2,
        "project": proj,
    }


# ==============================================================================
# 1. Model Lifecycle, Integrity & Self-Test Tests
# ==============================================================================

def test_model_manager_startup_and_health():
    """Verifies that model_manager loads both models, verifies hashes, and self-tests."""
    model_manager.load_models()
    health = model_manager.get_health_status()

    assert health.status == "healthy"
    assert "burnout" in health.models
    assert "project_success" in health.models

    burnout_st = health.models["burnout"]
    assert burnout_st.is_loaded is True
    assert burnout_st.status == "ready"
    assert burnout_st.checksum_verified is True
    assert burnout_st.expected_features_count == 10
    assert burnout_st.error is None
    assert model_manager.get_burnout_model() is not None

    proj_st = health.models["project_success"]
    assert proj_st.is_loaded is True
    assert proj_st.status == "ready"
    assert proj_st.checksum_verified is True
    assert proj_st.expected_features_count == 23
    assert proj_st.error is None
    assert model_manager.get_project_success_model() is not None


def test_model_manager_missing_artifact_resilience():
    """Verifies graceful degradation when model artifacts are missing or corrupted."""
    mgr = ModelLifecycleManager()
    bogus_path = Path("e:/Nexawis/ml_model/non_existent_model.pkl")
    
    # 1. Non-existent file
    mgr._load_burnout_model(bogus_path)
    health = mgr.get_health_status()
    assert mgr.get_burnout_model() is None
    assert health.models["burnout"].status == "missing"
    assert "not found" in health.models["burnout"].error

    # 2. Checksum mismatch
    valid_burnout_path = Path(settings.ML_MODEL_DIR) / settings.BURNOUT_MODEL_FILENAME
    if valid_burnout_path.exists():
        is_ok, err = mgr._verify_file_integrity(valid_burnout_path, "0000000000000000000000000000000000000000000000000000000000000000")
        assert is_ok is False
        assert "checksum mismatch" in err


# ==============================================================================
# 2. Feature Extraction & Categorical Mapping Tests
# ==============================================================================

def test_categorical_and_fatigue_mappings():
    """Tests deterministic mapping for designations, company types, and fatigue normalization."""
    # Designations
    assert map_designation_to_int("Junior Developer") == 0
    assert map_designation_to_int("Associate Engineer") == 1
    assert map_designation_to_int("Software Engineer") == 2
    assert map_designation_to_int("Senior Full Stack Engineer") == 3
    assert map_designation_to_int("Tech Lead") == 4
    assert map_designation_to_int("Principal Architect") == 5
    assert map_designation_to_int("Unmapped Creative Role") == 2  # default fallback

    # Company type
    assert map_company_type_to_int("Service") == 0
    assert map_company_type_to_int("Product") == 1
    assert map_company_type_to_int("SaaS") == 1

    # Mental fatigue score (0-100 to 0-10)
    assert normalize_mental_fatigue_score(20.0) == 2.0
    assert normalize_mental_fatigue_score(85.0) == 8.5
    assert normalize_mental_fatigue_score(4.5) == 4.5  # already <= 10.0
    with pytest.raises(ValidationError):
        normalize_mental_fatigue_score(None)

    # Risk tiers
    assert derive_risk_tier(0.20) == "Low"
    assert derive_risk_tier(0.50) == "Moderate"
    assert derive_risk_tier(0.85) == "High"


# ==============================================================================
# 3. Burnout Inference & Wellbeing Masking Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_burnout_prediction_service_and_wellbeing_masking(ml_test_db: AsyncSession):
    """
    Verifies burnout inference execution, continuous output semantics,
    and role-based wellbeing data masking.
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    emp1 = seed["employee1"]
    emp2 = seed["employee2"]

    # 1. Unmasked execution (HR/Admin role with EMPLOYEES_WELLBEING_VIEW)
    pred_hr = await predict_employee_burnout(
        db=ml_test_db,
        workspace_id=ws.id,
        employee_id=emp1.id,
        persist=True,
        can_view_wellbeing=True,
    )
    assert 0.0 <= pred_hr.predicted_burn_rate <= 1.0
    assert 0.0 <= pred_hr.normalized_burnout_score <= 100.0
    assert pred_hr.risk_tier in ("Low", "Moderate", "High")
    assert "Not a calibrated psychological probability" in pred_hr.target_semantics
    assert pred_hr.feature_provenance is not None
    assert pred_hr.feature_provenance["Consecutive_Working_Days"] == 5
    assert pred_hr.contributing_factors is not None

    # 2. Masked execution (Project Manager without EMPLOYEES_WELLBEING_VIEW)
    pred_pm = await predict_employee_burnout(
        db=ml_test_db,
        workspace_id=ws.id,
        employee_id=emp1.id,
        persist=False,
        can_view_wellbeing=False,
    )
    assert pred_pm.predicted_burn_rate is None  # Masked
    assert pred_pm.feature_provenance is None   # Masked
    assert pred_pm.contributing_factors is None # Masked
    # High-level operational risk tier is still accessible
    assert pred_pm.normalized_burnout_score == pred_hr.normalized_burnout_score
    assert pred_pm.risk_tier == pred_hr.risk_tier

    # 3. High fatigue employee produces elevated risk
    pred_emp2 = await predict_employee_burnout(
        db=ml_test_db,
        workspace_id=ws.id,
        employee_id=emp2.id,
        persist=True,
        can_view_wellbeing=True,
    )
    assert pred_emp2.predicted_burn_rate > pred_hr.predicted_burn_rate
    assert pred_emp2.risk_tier in ("Moderate", "High")


# ==============================================================================
# 4. Project Success Prediction & Target Leakage Prevention Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_project_success_prospective_leakage_prevention(ml_test_db: AsyncSession):
    """
    CRITICAL TEST: Verifies that prospective project success predictions:
    1. Prevent post-outcome feature leakage (Delivery_Delay_Days, Budget_Variance).
    2. Flag is_prospective = True and forecast_trustworthy = False.
    3. Document the limitation clearly in target_leakage_assessment.
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    emp1 = seed["employee1"]
    emp2 = seed["employee2"]
    proj = seed["project"]

    # Prospective prediction before project delivery
    res = await predict_project_success(
        db=ml_test_db,
        workspace_id=ws.id,
        project_id=proj.id,
        candidate_employee_ids=[emp1.id, emp2.id],
        quarter="Q1-2024",
        is_prospective=True,
        persist=True,
    )

    assert 0.0 <= res.predicted_success_score <= 100.0
    assert res.risk_level in ("Low", "Medium", "High")
    assert res.is_prospective is True
    assert res.has_target_leakage_risk is True
    assert res.forecast_trustworthy is False
    assert "Target Leakage" in res.target_leakage_assessment or "Prospective Advisory" in res.target_leakage_assessment
    assert "Delivery_Delay_Days" in res.target_leakage_assessment

    # Team aggregated attributes
    assert res.aggregated_team_features["Team_Size"] == 2.0
    assert res.aggregated_team_features["Mentor_Ratio"] == 0.5  # emp1 is senior


@pytest.mark.asyncio
async def test_project_success_retrospective_mode(ml_test_db: AsyncSession):
    """Verifies retrospective evaluation with completed project and self-reported vs verified metrics."""
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    emp1 = seed["employee1"]
    proj = seed["project"]

    # 1. Attempt retrospective evaluation while status is 'Planning' -> must fail with ValidationError
    actual_outcomes = {
        "delivery_delay_days": 10.0,
        "budget_variance": 5.0,
        "employee_turnover": 0.0,
        "scope_change": 1.0,
    }
    with pytest.raises(ValidationError) as exc_info:
        await predict_project_success(
            db=ml_test_db,
            workspace_id=ws.id,
            project_id=proj.id,
            candidate_employee_ids=[emp1.id],
            is_prospective=False,
            post_outcome_features=actual_outcomes,
            persist=False,
        )
    assert "only permitted for completed projects" in str(exc_info.value)

    # 2. Update project status to 'Completed' (without verified dates -> self-reported)
    proj.status = "Completed"
    await ml_test_db.commit()

    res_self_reported = await predict_project_success(
        db=ml_test_db,
        workspace_id=ws.id,
        project_id=proj.id,
        candidate_employee_ids=[emp1.id],
        is_prospective=False,
        post_outcome_features=actual_outcomes,
        persist=True,
    )

    assert res_self_reported.is_prospective is False
    assert res_self_reported.is_self_reported is True
    assert res_self_reported.is_verified is False
    assert res_self_reported.forecast_trustworthy is False
    assert "self-reported and unverified" in res_self_reported.target_leakage_assessment

    # 3. Project with verified milestone dates but self-reported budget/turnover/scope (hybrid evaluation)
    proj.deadline = date(2024, 6, 1)
    proj.actual_end_date = date(2024, 6, 11)  # 10 days delay
    await ml_test_db.commit()

    res_hybrid = await predict_project_success(
        db=ml_test_db,
        workspace_id=ws.id,
        project_id=proj.id,
        candidate_employee_ids=[emp1.id],
        is_prospective=False,
        post_outcome_features=actual_outcomes,
        persist=True,
    )

    assert res_hybrid.is_prospective is False
    assert res_hybrid.is_self_reported is True
    assert res_hybrid.is_verified is False
    assert res_hybrid.forecast_trustworthy is False
    assert res_hybrid.outcome_provenance["delivery_delay_days"] == "verified"
    assert res_hybrid.outcome_provenance["budget_variance"] == "self_reported"
    assert "lack independent system verification" in res_hybrid.target_leakage_assessment

    # 4. Project with all required metrics from verified sources
    res_verified = await predict_project_success(
        db=ml_test_db,
        workspace_id=ws.id,
        project_id=proj.id,
        candidate_employee_ids=[emp1.id],
        is_prospective=False,
        post_outcome_features=actual_outcomes,
        verified_sources={
            "budget_variance": "audited_financial_ledger",
            "employee_turnover": "hr_exit_audit",
            "scope_change": "change_control_board",
        },
        persist=True,
    )

    assert res_verified.is_prospective is False
    assert res_verified.is_self_reported is False
    assert res_verified.is_verified is True
    assert res_verified.forecast_trustworthy is True
    assert all(v == "verified" for v in res_verified.outcome_provenance.values())
    assert "reconciled against verified system records" in res_verified.target_leakage_assessment



@pytest.mark.asyncio
async def test_project_success_empty_team_raises(ml_test_db: AsyncSession):
    """Verifies that evaluating an empty team raises a ValidationError."""
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    proj = seed["project"]

    with pytest.raises(ValidationError):
        await predict_project_success(
            db=ml_test_db,
            workspace_id=ws.id,
            project_id=proj.id,
            candidate_employee_ids=[],
            is_prospective=True,
        )


# ==============================================================================
# 5. REST API Authentication, RBAC & Isolation Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_ml_models_health_endpoint(ml_client: AsyncClient, ml_test_db: AsyncSession):
    """
    Verifies SEC-05:
    1. Unauthenticated public call returns sanitized minimal status (no artifact names, versions, or feature counts).
    2. Authenticated operator call (Admin/PM) returns detailed health metadata without leaking internal file paths.
    """
    # 1. Public unauthenticated request -> sanitized response
    resp_pub = await ml_client.get("/api/v1/ml/models/health")
    assert resp_pub.status_code == 200
    data_pub = resp_pub.json()
    assert data_pub["status"] in ("healthy", "degraded", "unavailable")
    assert data_pub["service"] == "ml-inference"
    assert "models" not in data_pub  # Disclosed models dictionary is suppressed for public callers

    # 2. Authenticated operator request (Admin)
    admin_token = create_token(sub="admin_operator_1", role=SystemRole.ADMIN.value)
    admin_user = User(
        clerk_user_id="admin_operator_1",
        email="admin@test.com",
        full_name="Admin Operator",
        role=SystemRole.ADMIN.value,
        is_active=True,
    )
    ml_test_db.add(admin_user)
    await ml_test_db.commit()

    resp_auth = await ml_client.get(
        "/api/v1/ml/models/health",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp_auth.status_code == 200
    data_auth = resp_auth.json()
    assert data_auth["status"] in ("healthy", "degraded", "unavailable")
    assert "models" in data_auth
    assert "burnout" in data_auth["models"]
    assert "project_success" in data_auth["models"]
    assert data_auth["models"]["burnout"]["expected_features_count"] == 10
    assert data_auth["models"]["project_success"]["expected_features_count"] == 23
    # Path secrecy: should not expose absolute filesystem paths
    assert "e:\\" not in str(data_auth).lower()
    assert "c:\\" not in str(data_auth).lower()



@pytest.mark.asyncio
async def test_ml_endpoints_require_authentication(ml_client: AsyncClient):
    """Verifies that ML inference endpoints reject unauthenticated calls with 401."""
    random_id = uuid.uuid4()
    resp = await ml_client.post(f"/api/v1/ml/burnout/predict/{random_id}")
    assert resp.status_code == 401

    resp2 = await ml_client.post(f"/api/v1/ml/project-success/predict/{random_id}")
    assert resp2.status_code == 401


@pytest.mark.asyncio
async def test_ml_wellbeing_masking_via_api(ml_client: AsyncClient, ml_test_db: AsyncSession):
    """
    Verifies wellbeing masking behavior across role boundaries via API:
    - HR / Admin receives unmasked burnout details.
    - Project Manager receives masked wellbeing indicators.
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    emp1 = seed["employee1"]

    # 1. Project Manager request
    pm_token = create_token(sub=seed["user"].clerk_user_id, role=SystemRole.PROJECT_MANAGER.value)
    resp_pm = await ml_client.post(
        f"/api/v1/ml/burnout/predict/{emp1.id}",
        headers={
            "Authorization": f"Bearer {pm_token}",
            "X-Workspace-Id": str(ws.id),
        },
    )
    assert resp_pm.status_code == 200
    data_pm = resp_pm.json()
    assert data_pm["predictedBurnRate"] is None       # Masked
    assert data_pm["featureProvenance"] is None       # Masked
    assert data_pm["contributingFactors"] is None     # Masked
    assert data_pm["normalizedBurnoutScore"] is not None
    assert data_pm["riskTier"] in ("Low", "Moderate", "High")

    # 2. HR request
    # Seed HR user membership
    hr_user = User(
        clerk_user_id="hr_user_1",
        email="hr@test.com",
        full_name="HR Specialist",
        role=SystemRole.HR.value,
        is_active=True,
    )
    ml_test_db.add(hr_user)
    await ml_test_db.flush()
    ml_test_db.add(WorkspaceMember(
        workspace_id=ws.id,
        user_id=hr_user.id,
        role=WorkspaceRole.ADMIN.value,
        is_active=True,
    ))
    await ml_test_db.commit()

    hr_token = create_token(sub="hr_user_1", role=SystemRole.HR.value)
    resp_hr = await ml_client.post(
        f"/api/v1/ml/burnout/predict/{emp1.id}",
        headers={
            "Authorization": f"Bearer {hr_token}",
            "X-Workspace-Id": str(ws.id),
        },
    )
    assert resp_hr.status_code == 200
    data_hr = resp_hr.json()
    assert data_hr["predictedBurnRate"] is not None   # Unmasked
    assert data_hr["featureProvenance"] is not None   # Unmasked
    assert data_hr["contributingFactors"] is not None # Unmasked


@pytest.mark.asyncio
async def test_cross_workspace_ml_isolation_denied(ml_client: AsyncClient, ml_test_db: AsyncSession):
    """Verifies that predicting for an entity from a foreign workspace returns 404."""
    seed1 = await seed_ml_test_workspace(ml_test_db, ws_name="Workspace 1")
    seed2 = await seed_ml_test_workspace(ml_test_db, ws_name="Workspace 2")

    pm_token = create_token(sub=seed1["user"].clerk_user_id, role=SystemRole.PROJECT_MANAGER.value)

    # PM of WS1 attempts to predict burnout for employee in WS2
    resp = await ml_client.post(
        f"/api/v1/ml/burnout/predict/{seed2['employee1'].id}",
        headers={
            "Authorization": f"Bearer {pm_token}",
            "X-Workspace-Id": str(seed1["workspace"].id),
        },
    )
    assert resp.status_code == 404


# ==============================================================================
# 6. AWIS Scoring Engine Integration Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_awis_integration_with_fresh_burnout_prediction(ml_test_db: AsyncSession):
    """
    Verifies that Phase 6 AWIS score_burnout_safety() consumes fresh ML predictions
    and computes safety_score = 100 * (1 - burn_rate).
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    emp1 = seed["employee1"]
    proj = seed["project"]

    # Execute ML burnout prediction for emp1
    pred_res = await predict_employee_burnout(
        db=ml_test_db,
        workspace_id=ws.id,
        employee_id=emp1.id,
        persist=True,
        can_view_wellbeing=True,
    )

    # Re-fetch emp1 with burnout_predictions relation
    await ml_test_db.refresh(emp1, attribute_names=["burnout_predictions"])

    # Score with AWIS
    comp = score_burnout_safety(emp1, proj)
    assert comp.is_available is True
    assert comp.is_stale is False
    assert comp.score is not None
    # safety score = 100 * (1 - burn_rate)
    expected_score = round(100.0 * (1.0 - pred_res.predicted_burn_rate), 1)
    assert abs(comp.score - expected_score) <= 0.1
    assert "Burnout safety index" in comp.evidence


@pytest.mark.asyncio
async def test_awis_integration_with_stale_or_absent_prediction(ml_test_db: AsyncSession):
    """
    Verifies that AWIS handles absent or stale predictions safely via
    Phase 6 provisional scoring rules without fabricating zero-risk scores.
    """
    import types
    seed = await seed_ml_test_workspace(ml_test_db)
    proj = seed["project"]

    # 1. No predictions recorded
    emp_no_pred = types.SimpleNamespace(
        id=uuid.uuid4(),
        burnout_predictions=[],
        mental_fatigue_score=20.0,
    )
    comp_missing = score_burnout_safety(emp_no_pred, proj)
    assert comp_missing.is_available is False
    assert comp_missing.score is None
    assert "unavailable or model offline" in comp_missing.evidence

    # 2. Stale prediction (> 90 days old)
    stale_pred = types.SimpleNamespace(
        model_version=settings.BURNOUT_MODEL_VERSION,
        predicted_burn_rate=0.30,
        normalized_burnout_score=30.0,
        risk_tier="Low",
        predicted_at=datetime.now(timezone.utc) - timedelta(days=120),
    )
    emp_stale_pred = types.SimpleNamespace(
        id=uuid.uuid4(),
        burnout_predictions=[stale_pred],
        mental_fatigue_score=20.0,
    )
    comp_stale = score_burnout_safety(emp_stale_pred, proj)
    assert comp_stale.is_available is True
    assert comp_stale.is_stale is True
    assert "Inference older than" in comp_stale.evidence


# ==============================================================================
# 7. Audit Remediation Regression Tests (SEC-01 through SEC-05)
# ==============================================================================

@pytest.mark.asyncio
async def test_burnout_missing_mental_fatigue_rejected(ml_test_db: AsyncSession):
    """
    SEC-01: Verifies that missing mental fatigue measurement never silently defaults to 2.0
    and instead raises a ValidationError.
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    
    # Create employee with mental_fatigue_score = None
    emp_null_fatigue = Employee(
        workspace_id=ws.id,
        employee_code=f"EMP-NF-{uuid.uuid4().hex[:4].upper()}",
        full_name="No Fatigue Record",
        email=f"nofatigue-{uuid.uuid4().hex[:4]}@test.com",
        department="Engineering",
        designation="Software Engineer",
        experience_years=4.0,
        current_workload_percent=80.0,
        mental_fatigue_score=None,  # Missing sensitive feature
    )
    ml_test_db.add(emp_null_fatigue)
    await ml_test_db.flush()

    # Add valid fresh workload history
    wl = EmployeeWorkloadHistory(
        employee_id=emp_null_fatigue.id,
        recorded_date=date.today(),
        weekly_work_hours=40.0,
        overtime_hours=0.0,
        utilization_percentage=80.0,
        consecutive_working_days=5,
        active_project_count=1,
    )
    ml_test_db.add(wl)
    await ml_test_db.commit()

    with pytest.raises(ValidationError) as exc_info:
        await predict_employee_burnout(
            db=ml_test_db,
            workspace_id=ws.id,
            employee_id=emp_null_fatigue.id,
            persist=False,
            can_view_wellbeing=True,
        )
    assert "mental_fatigue_score" in str(exc_info.value).lower()
    assert "cannot proceed without" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_burnout_nullable_workload_and_experience_fields_safety(ml_test_db: AsyncSession):
    """
    SEC-02: Verifies that nullable database columns (current_workload_percent, experience_years)
    never trigger unhandled TypeError crashes (e.g. float(None)) and raise clean ValidationErrors.
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]

    # 1. Null current_workload_percent
    emp_null_workload = Employee(
        workspace_id=ws.id,
        employee_code=f"EMP-NW-{uuid.uuid4().hex[:4].upper()}",
        full_name="Null Workload Pct",
        email=f"nullworkload-{uuid.uuid4().hex[:4]}@test.com",
        department="Engineering",
        designation="Software Engineer",
        experience_years=3.0,
        current_workload_percent=None,  # Nullable
        mental_fatigue_score=20.0,
    )
    ml_test_db.add(emp_null_workload)
    await ml_test_db.flush()

    wl_workload = EmployeeWorkloadHistory(
        employee_id=emp_null_workload.id,
        recorded_date=date.today(),
        weekly_work_hours=40.0,
        overtime_hours=0.0,
        utilization_percentage=80.0,
        consecutive_working_days=5,
        active_project_count=1,
    )
    ml_test_db.add(wl_workload)
    await ml_test_db.commit()

    with pytest.raises(ValidationError) as exc_workload:
        await predict_employee_burnout(
            db=ml_test_db,
            workspace_id=ws.id,
            employee_id=emp_null_workload.id,
            persist=False,
            can_view_wellbeing=True,
        )
    assert "current_workload_percent" in str(exc_workload.value)

    # 2. Null experience_years
    emp_null_exp = Employee(
        workspace_id=ws.id,
        employee_code=f"EMP-NE-{uuid.uuid4().hex[:4].upper()}",
        full_name="Null Experience",
        email=f"nullexp-{uuid.uuid4().hex[:4]}@test.com",
        department="Engineering",
        designation="Software Engineer",
        experience_years=None,  # Nullable
        current_workload_percent=80.0,
        mental_fatigue_score=20.0,
    )
    ml_test_db.add(emp_null_exp)
    await ml_test_db.flush()

    wl_exp = EmployeeWorkloadHistory(
        employee_id=emp_null_exp.id,
        recorded_date=date.today(),
        weekly_work_hours=40.0,
        overtime_hours=0.0,
        utilization_percentage=80.0,
        consecutive_working_days=5,
        active_project_count=1,
    )
    ml_test_db.add(wl_exp)
    await ml_test_db.commit()

    with pytest.raises(ValidationError) as exc_exp:
        await predict_employee_burnout(
            db=ml_test_db,
            workspace_id=ws.id,
            employee_id=emp_null_exp.id,
            persist=False,
            can_view_wellbeing=True,
        )
    assert "experience_years" in str(exc_exp.value)


@pytest.mark.asyncio
async def test_burnout_missing_and_stale_workload_history_rejected(ml_test_db: AsyncSession):
    """
    SEC-03: Verifies that missing or stale workload history records (> 30 days old)
    never silently default consecutive_working_days to 5 and are rejected.
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]

    # 1. Employee with no workload history records at all
    emp_no_history = Employee(
        workspace_id=ws.id,
        employee_code=f"EMP-NH-{uuid.uuid4().hex[:4].upper()}",
        full_name="No History Employee",
        email=f"nohistory-{uuid.uuid4().hex[:4]}@test.com",
        department="Engineering",
        designation="Software Engineer",
        experience_years=3.0,
        current_workload_percent=80.0,
        mental_fatigue_score=20.0,
    )
    ml_test_db.add(emp_no_history)
    await ml_test_db.commit()

    with pytest.raises(ValidationError) as exc_missing:
        await predict_employee_burnout(
            db=ml_test_db,
            workspace_id=ws.id,
            employee_id=emp_no_history.id,
            persist=False,
            can_view_wellbeing=True,
        )
    assert "no workload history on record" in str(exc_missing.value)

    # 2. Employee with stale workload history (45 days old)
    emp_stale_history = Employee(
        workspace_id=ws.id,
        employee_code=f"EMP-SH-{uuid.uuid4().hex[:4].upper()}",
        full_name="Stale History Employee",
        email=f"stalehistory-{uuid.uuid4().hex[:4]}@test.com",
        department="Engineering",
        designation="Software Engineer",
        experience_years=3.0,
        current_workload_percent=80.0,
        mental_fatigue_score=20.0,
    )
    ml_test_db.add(emp_stale_history)
    await ml_test_db.flush()

    stale_wl = EmployeeWorkloadHistory(
        employee_id=emp_stale_history.id,
        recorded_date=date.today() - timedelta(days=45),  # Stale: > 30 days
        weekly_work_hours=40.0,
        overtime_hours=0.0,
        utilization_percentage=80.0,
        consecutive_working_days=5,
        active_project_count=1,
    )
    ml_test_db.add(stale_wl)
    await ml_test_db.commit()

    with pytest.raises(ValidationError) as exc_stale:
        await predict_employee_burnout(
            db=ml_test_db,
            workspace_id=ws.id,
            employee_id=emp_stale_history.id,
            persist=False,
            can_view_wellbeing=True,
        )
    assert "stale" in str(exc_stale.value).lower()
    assert "freshness policy" in str(exc_stale.value).lower()


@pytest.mark.asyncio
async def test_burnout_fresh_workload_boundary_dates(ml_test_db: AsyncSession):
    """
    SEC-03: Verifies boundary date handling for workload history freshness (<= 30 days accepted, future rejected).
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]

    emp = Employee(
        workspace_id=ws.id,
        employee_code=f"EMP-BD-{uuid.uuid4().hex[:4].upper()}",
        full_name="Boundary Date Employee",
        email=f"boundary-{uuid.uuid4().hex[:4]}@test.com",
        department="Engineering",
        designation="Software Engineer",
        experience_years=3.0,
        current_workload_percent=80.0,
        mental_fatigue_score=20.0,
    )
    ml_test_db.add(emp)
    await ml_test_db.flush()

    # 1. Exactly 29 days old -> Valid
    wl_valid = EmployeeWorkloadHistory(
        employee_id=emp.id,
        recorded_date=date.today() - timedelta(days=29),
        weekly_work_hours=40.0,
        overtime_hours=0.0,
        utilization_percentage=80.0,
        consecutive_working_days=5,
        active_project_count=1,
    )
    ml_test_db.add(wl_valid)
    await ml_test_db.commit()

    res = await predict_employee_burnout(
        db=ml_test_db,
        workspace_id=ws.id,
        employee_id=emp.id,
        persist=False,
        can_view_wellbeing=True,
    )
    assert 0.0 <= res.predicted_burn_rate <= 1.0

    # 2. Future date record -> Rejected
    wl_valid.recorded_date = date.today() + timedelta(days=5)
    await ml_test_db.commit()

    with pytest.raises(ValidationError) as exc_future:
        await predict_employee_burnout(
            db=ml_test_db,
            workspace_id=ws.id,
            employee_id=emp.id,
            persist=False,
            can_view_wellbeing=True,
        )
    assert "future" in str(exc_future.value).lower()


@pytest.mark.asyncio
async def test_burnout_invalid_and_nonfinite_inputs_rejected(ml_test_db: AsyncSession):
    """
    Verifies that NaN, Inf, and out-of-bounds simulation override values are rejected.
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    emp1 = seed["employee1"]

    # Non-finite mental fatigue score in override rejected
    with pytest.raises((ValidationError, PydanticValidationError)):
        BurnoutInferenceOverride(mental_fatigue_score=float("nan"))

    # Non-finite score passed to normalization function rejected
    with pytest.raises(ValidationError):
        normalize_mental_fatigue_score(float("nan"))

    # Out of bounds weekly hours (> 100.0) rejected
    with pytest.raises((ValidationError, PydanticValidationError)):
        BurnoutInferenceOverride(weekly_work_hours=150.0)


@pytest.mark.asyncio
async def test_burnout_simulation_overrides_authorization(ml_test_db: AsyncSession):
    """
    SEC-01/SEC-03: Verifies that supplying sensitive mental fatigue simulation overrides
    requires EMPLOYEES_WELLBEING_VIEW permission and is forbidden to unauthorized callers.
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    emp1 = seed["employee1"]

    override_fatigue = BurnoutInferenceOverride(mental_fatigue_score=60.0)

    # 1. PM without EMPLOYEES_WELLBEING_VIEW -> AuthorizationError
    with pytest.raises(AuthorizationError) as exc_auth:
        await predict_employee_burnout(
            db=ml_test_db,
            workspace_id=ws.id,
            employee_id=emp1.id,
            overrides=override_fatigue,
            persist=False,
            can_view_wellbeing=False,
        )
    assert "EMPLOYEES_WELLBEING_VIEW" in str(exc_auth.value)

    # 2. HR with EMPLOYEES_WELLBEING_VIEW -> Success
    res = await predict_employee_burnout(
        db=ml_test_db,
        workspace_id=ws.id,
        employee_id=emp1.id,
        overrides=override_fatigue,
        persist=False,
        can_view_wellbeing=True,
    )
    assert res.predicted_burn_rate is not None
    assert res.feature_provenance["Mental_Fatigue_Score"] == 6.0


@pytest.mark.asyncio
async def test_burnout_batch_inference_handles_invalid_data_safely(ml_client: AsyncClient, ml_test_db: AsyncSession):
    """
    SEC-03: Verifies batch prediction over a mix of valid and invalid employees reports
    success and failures with per-employee error reasons without manufacturing false scores.
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    emp1 = seed["employee1"]  # Valid, fresh workload

    # Create invalid employee with no workload history
    emp_invalid = Employee(
        workspace_id=ws.id,
        employee_code=f"EMP-INV-{uuid.uuid4().hex[:4].upper()}",
        full_name="Invalid Candidate",
        email=f"invalid-{uuid.uuid4().hex[:4]}@test.com",
        department="Engineering",
        designation="Software Engineer",
        experience_years=3.0,
        current_workload_percent=80.0,
        mental_fatigue_score=None,  # Missing fatigue
    )
    ml_test_db.add(emp_invalid)
    await ml_test_db.commit()

    admin_token = create_token(sub="admin_batch_user", role=SystemRole.ADMIN.value)
    admin_user = User(
        clerk_user_id="admin_batch_user",
        email="admin_batch@test.com",
        full_name="Admin Batch",
        role=SystemRole.ADMIN.value,
        is_active=True,
    )
    ml_test_db.add(admin_user)
    await ml_test_db.flush()
    ml_test_db.add(WorkspaceMember(
        workspace_id=ws.id,
        user_id=admin_user.id,
        role=WorkspaceRole.ADMIN.value,
        is_active=True,
    ))
    await ml_test_db.commit()

    resp = await ml_client.post(
        "/api/v1/ml/burnout/batch-predict",
        headers={
            "Authorization": f"Bearer {admin_token}",
            "X-Workspace-Id": str(ws.id),
        },
        json={"employeeIds": [str(emp1.id), str(emp_invalid.id)]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["totalEvaluated"] == 2
    assert data["successCount"] == 1
    assert data["failureCount"] == 1
    assert len(data["predictions"]) == 1
    assert data["predictions"][0]["employeeId"] == str(emp1.id)
    assert data["errors"] is not None
    assert len(data["errors"]) == 1
    assert data["errors"][0]["employee_id"] == str(emp_invalid.id)


@pytest.mark.asyncio
async def test_retrospective_rejects_non_completed_projects(ml_client: AsyncClient, ml_test_db: AsyncSession):
    """
    SEC-04: Verifies that retrospective project evaluation endpoint strictly rejects
    projects that are not in 'Completed' status.
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    proj = seed["project"]  # Default status is 'Planning'

    pm_token = create_token(sub=seed["user"].clerk_user_id, role=SystemRole.PROJECT_MANAGER.value)

    resp = await ml_client.post(
        f"/api/v1/ml/project-success/retrospective/{proj.id}",
        headers={
            "Authorization": f"Bearer {pm_token}",
            "X-Workspace-Id": str(ws.id),
        },
        json={
            "deliveryDelayDays": 5.0,
            "budgetVariance": 0.0,
            "employeeTurnover": 0.0,
            "scopeChange": 0.0,
        },
    )
    assert resp.status_code == 422
    err_data = resp.json()
    assert "only permitted for completed projects" in str(err_data).lower()


@pytest.mark.asyncio
async def test_retrospective_implausible_metrics_rejected(ml_test_db: AsyncSession):
    """
    SEC-04: Verifies that negative delivery delay days, non-finite values,
    and out-of-bounds metrics are rejected with ValidationError.
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    emp1 = seed["employee1"]
    proj = seed["project"]
    proj.status = "Completed"
    await ml_test_db.commit()

    # 1. Negative delivery delay
    with pytest.raises(ValidationError) as exc_neg:
        await predict_project_success(
            db=ml_test_db,
            workspace_id=ws.id,
            project_id=proj.id,
            candidate_employee_ids=[emp1.id],
            is_prospective=False,
            post_outcome_features={
                "delivery_delay_days": -10.0,
                "budget_variance": 0.0,
                "employee_turnover": 0.0,
                "scope_change": 0.0,
            },
            persist=False,
        )
    assert "cannot be negative" in str(exc_neg.value)

    # 2. Out of bounds budget variance (> 500%)
    with pytest.raises(ValidationError) as exc_budget:
        await predict_project_success(
            db=ml_test_db,
            workspace_id=ws.id,
            project_id=proj.id,
            candidate_employee_ids=[emp1.id],
            is_prospective=False,
            post_outcome_features={
                "delivery_delay_days": 0.0,
                "budget_variance": 600.0,
                "employee_turnover": 0.0,
                "scope_change": 0.0,
            },
            persist=False,
        )
    assert "budget_variance" in str(exc_budget.value)


# ==============================================================================
# Phase 7.1: Retrospective Outcome Provenance Verification Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_retrospective_provenance_all_verified_sources(ml_test_db: AsyncSession):
    """
    Phase 7.1: Verifies that when all 4 required outcome features come from established,
    trustworthy sources (delivery dates from project records, and verified sources for financial/HR metrics):
    - is_verified is True
    - is_self_reported is False
    - forecast_trustworthy is True
    - outcome_provenance flags every metric as 'verified'
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    emp1 = seed["employee1"]
    proj = seed["project"]
    proj.status = "Completed"
    proj.deadline = date(2024, 6, 1)
    proj.actual_end_date = date(2024, 6, 15)  # 14 days delay
    await ml_test_db.commit()

    res = await predict_project_success(
        db=ml_test_db,
        workspace_id=ws.id,
        project_id=proj.id,
        candidate_employee_ids=[emp1.id],
        is_prospective=False,
        post_outcome_features={
            "delivery_delay_days": 14.0,  # Matching verified project completion dates
            "budget_variance": 3.5,
            "employee_turnover": 0.0,
            "scope_change": 5.0,
        },
        verified_sources={
            "budget_variance": "audited_financial_ledger",
            "employee_turnover": "hr_exit_audit",
            "scope_change": "change_control_board",
        },
        persist=True,
    )

    assert res.is_prospective is False
    assert res.is_verified is True
    assert res.is_self_reported is False
    assert res.forecast_trustworthy is True
    assert res.outcome_provenance == {
        "delivery_delay_days": "verified",
        "budget_variance": "verified",
        "employee_turnover": "verified",
        "scope_change": "verified",
    }
    assert "reconciled against verified system records" in res.target_leakage_assessment


@pytest.mark.asyncio
async def test_retrospective_provenance_verified_dates_with_self_reported_budget(ml_test_db: AsyncSession):
    """
    Phase 7.1: Verifies that when delivery dates are verified from project records,
    but budget variance is self-reported:
    - is_verified is False
    - is_self_reported is True
    - forecast_trustworthy is False
    - outcome_provenance['delivery_delay_days'] is 'verified'
    - outcome_provenance['budget_variance'] is 'self_reported'
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    emp1 = seed["employee1"]
    proj = seed["project"]
    proj.status = "Completed"
    proj.deadline = date(2024, 6, 1)
    proj.actual_end_date = date(2024, 6, 15)
    await ml_test_db.commit()

    res = await predict_project_success(
        db=ml_test_db,
        workspace_id=ws.id,
        project_id=proj.id,
        candidate_employee_ids=[emp1.id],
        is_prospective=False,
        post_outcome_features={
            "delivery_delay_days": 14.0,
            "budget_variance": 3.5,
            "employee_turnover": 0.0,
            "scope_change": 5.0,
        },
        verified_sources={
            "employee_turnover": "hr_exit_audit",
            "scope_change": "change_control_board",
            # budget_variance NOT verified -> self-reported
        },
        persist=False,
    )

    assert res.is_verified is False
    assert res.is_self_reported is True
    assert res.forecast_trustworthy is False
    assert res.outcome_provenance["delivery_delay_days"] == "verified"
    assert res.outcome_provenance["budget_variance"] == "self_reported"
    assert res.outcome_provenance["employee_turnover"] == "verified"
    assert res.outcome_provenance["scope_change"] == "verified"
    assert "budget_variance" in res.target_leakage_assessment


@pytest.mark.asyncio
async def test_retrospective_provenance_verified_dates_with_self_reported_turnover_or_scope(ml_test_db: AsyncSession):
    """
    Phase 7.1: Verifies that when delivery dates and budget variance are verified,
    but employee turnover or scope change is self-reported:
    - is_verified is False
    - is_self_reported is True
    - forecast_trustworthy is False
    - per-feature provenance identifies the unverified fields
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    emp1 = seed["employee1"]
    proj = seed["project"]
    proj.status = "Completed"
    proj.deadline = date(2024, 6, 1)
    proj.actual_end_date = date(2024, 6, 11)
    await ml_test_db.commit()

    # Scope change unverified
    res = await predict_project_success(
        db=ml_test_db,
        workspace_id=ws.id,
        project_id=proj.id,
        candidate_employee_ids=[emp1.id],
        is_prospective=False,
        post_outcome_features={
            "delivery_delay_days": 10.0,
            "budget_variance": 0.0,
            "employee_turnover": 5.0,
            "scope_change": 12.0,
        },
        verified_sources={
            "budget_variance": "audited_financial_ledger",
            "employee_turnover": "hr_exit_audit",
            # scope_change unverified
        },
        persist=False,
    )

    assert res.is_verified is False
    assert res.is_self_reported is True
    assert res.forecast_trustworthy is False
    assert res.outcome_provenance["scope_change"] == "self_reported"
    assert res.outcome_provenance["delivery_delay_days"] == "verified"
    assert res.outcome_provenance["budget_variance"] == "verified"
    assert res.outcome_provenance["employee_turnover"] == "verified"


@pytest.mark.asyncio
async def test_retrospective_conflicting_delay_versus_verified_dates_rejected(ml_test_db: AsyncSession):
    """
    Phase 7.1: Verifies that a client-supplied delivery delay that conflicts with
    the persisted system delivery dates is rejected with ValidationError and never overwrites verified dates.
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    emp1 = seed["employee1"]
    proj = seed["project"]
    proj.status = "Completed"
    proj.deadline = date(2024, 6, 1)
    proj.actual_end_date = date(2024, 6, 11)  # Verified delay = 10 days
    await ml_test_db.commit()

    with pytest.raises(ValidationError) as exc_info:
        await predict_project_success(
            db=ml_test_db,
            workspace_id=ws.id,
            project_id=proj.id,
            candidate_employee_ids=[emp1.id],
            is_prospective=False,
            post_outcome_features={
                "delivery_delay_days": 25.0,  # Conflicting delay (10 vs 25)
                "budget_variance": 0.0,
                "employee_turnover": 0.0,
                "scope_change": 0.0,
            },
            persist=False,
        )
    assert "conflicts with verified system delay" in str(exc_info.value)
    assert "10 days" in str(exc_info.value)


@pytest.mark.asyncio
async def test_retrospective_missing_required_outcome_features_rejected(ml_test_db: AsyncSession):
    """
    Phase 7.1: Verifies that omitting required outcome features is rejected with ValidationError,
    and missing values are never silently defaulted or invented.
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    emp1 = seed["employee1"]
    proj = seed["project"]
    proj.status = "Completed"
    proj.deadline = date(2024, 6, 1)
    proj.actual_end_date = date(2024, 6, 11)
    await ml_test_db.commit()

    # 1. Missing budget_variance
    with pytest.raises(ValidationError) as exc_b:
        await predict_project_success(
            db=ml_test_db,
            workspace_id=ws.id,
            project_id=proj.id,
            candidate_employee_ids=[emp1.id],
            is_prospective=False,
            post_outcome_features={"employee_turnover": 0.0, "scope_change": 0.0},
            persist=False,
        )
    assert "budget_variance" in str(exc_b.value)

    # 2. Missing employee_turnover
    with pytest.raises(ValidationError) as exc_t:
        await predict_project_success(
            db=ml_test_db,
            workspace_id=ws.id,
            project_id=proj.id,
            candidate_employee_ids=[emp1.id],
            is_prospective=False,
            post_outcome_features={"budget_variance": 0.0, "scope_change": 0.0},
            persist=False,
        )
    assert "employee_turnover" in str(exc_t.value)

    # 3. Missing scope_change
    with pytest.raises(ValidationError) as exc_s:
        await predict_project_success(
            db=ml_test_db,
            workspace_id=ws.id,
            project_id=proj.id,
            candidate_employee_ids=[emp1.id],
            is_prospective=False,
            post_outcome_features={"budget_variance": 0.0, "employee_turnover": 0.0},
            persist=False,
        )
    assert "scope_change" in str(exc_s.value)

    # 4. Missing delivery_delay_days when project has no dates
    proj.deadline = None
    proj.actual_end_date = None
    await ml_test_db.commit()

    with pytest.raises(ValidationError) as exc_d:
        await predict_project_success(
            db=ml_test_db,
            workspace_id=ws.id,
            project_id=proj.id,
            candidate_employee_ids=[emp1.id],
            is_prospective=False,
            post_outcome_features={"budget_variance": 0.0, "employee_turnover": 0.0, "scope_change": 0.0},
            persist=False,
        )
    assert "delivery_delay_days" in str(exc_d.value)


@pytest.mark.asyncio
async def test_retrospective_returned_and_persisted_provenance_consistency(ml_test_db: AsyncSession):
    """
    Phase 7.1: Verifies that returned API response provenance metadata matches the persisted
    database record in MlProjectSuccessPrediction.explanation_shap exactly.
    """
    seed = await seed_ml_test_workspace(ml_test_db)
    ws = seed["workspace"]
    emp1 = seed["employee1"]
    proj = seed["project"]
    proj.status = "Completed"
    proj.deadline = date(2024, 6, 1)
    proj.actual_end_date = date(2024, 6, 11)
    await ml_test_db.commit()

    res = await predict_project_success(
        db=ml_test_db,
        workspace_id=ws.id,
        project_id=proj.id,
        candidate_employee_ids=[emp1.id],
        is_prospective=False,
        post_outcome_features={
            "delivery_delay_days": 10.0,
            "budget_variance": 2.0,
            "employee_turnover": 0.0,
            "scope_change": 1.0,
        },
        verified_sources={
            "budget_variance": "audited_financial_ledger",
            "employee_turnover": "hr_exit_audit",
            "scope_change": "change_control_board",
        },
        persist=True,
    )

    # Query persisted record
    pred_query = select(MlProjectSuccessPrediction).where(MlProjectSuccessPrediction.id == res.id)
    pred_res = await ml_test_db.execute(pred_query)
    pred_db = pred_res.scalar_one()

    assert pred_db.explanation_shap is not None
    assert pred_db.explanation_shap["is_verified"] == res.is_verified
    assert pred_db.explanation_shap["is_self_reported"] == res.is_self_reported
    assert pred_db.explanation_shap["forecast_trustworthy"] == res.forecast_trustworthy
    assert pred_db.explanation_shap["outcome_provenance"] == res.outcome_provenance
    assert pred_db.explanation_shap["outcome_provenance"]["delivery_delay_days"] == "verified"
    assert pred_db.explanation_shap["outcome_provenance"]["budget_variance"] == "verified"


@pytest.mark.asyncio
async def test_clerk_token_expiry_and_signature_corruption():
    """
    SEC-03 / Security: Verifies that expired Clerk tokens and tokens with invalid signatures
    are strictly rejected by cryptographic verification.
    """
    # 1. Expired Token
    now = datetime.now(timezone.utc)
    expired_payload = {
        "sub": "user_expired_test",
        "exp": int((now - timedelta(seconds=120)).timestamp()),
        "iat": int((now - timedelta(seconds=3600)).timestamp()),
    }
    expired_jwt = jwt.encode(expired_payload, TEST_PRIVATE_KEY, algorithm="RS256")
    with pytest.raises(TokenExpiredError):
        verify_clerk_token(expired_jwt)

    # 2. Invalid Signature Token
    foreign_key = rsa.generate_private_key(public_exponent=65537, key_size=2048).private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")
    invalid_jwt = jwt.encode({"sub": "user_tampered", "exp": int((now + timedelta(seconds=3600)).timestamp())}, foreign_key, algorithm="RS256")
    with pytest.raises(InvalidTokenError):
        verify_clerk_token(invalid_jwt)

