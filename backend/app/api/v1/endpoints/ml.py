"""
NEXAWIS Backend - Machine Learning Inference REST Endpoints.
Provides authenticated, workspace-isolated endpoints for model health,
burnout risk inference, and prospective/retrospective project success predictions.
"""

import uuid
from typing import List, Optional, Union, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import (
    WorkspaceContext,
    get_current_workspace_context,
    get_current_user,
    get_db_session,
    require_permissions,
    bearer_scheme,
)
from app.core.clerk import verify_clerk_token
from app.core.roles import SystemRole, Permission, has_permission
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.models.employee import Employee
from app.models.project import Project
from app.models.ml_results import MlBurnoutPrediction, MlProjectSuccessPrediction
from app.schemas.ml import (
    MlModelsHealthResponse,
    MlPublicHealthResponse,
    BurnoutInferenceRequest,
    BurnoutPredictionResponse,
    BurnoutBatchPredictRequest,
    BurnoutBatchPredictResponse,
    ProjectSuccessProspectiveRequest,
    ProjectSuccessRetrospectiveRequest,
    ProjectSuccessPredictionResponse,
)
from app.services.ml.loader import model_manager
from app.services.ml.burnout import predict_employee_burnout, derive_risk_tier
from app.services.ml.project_success import predict_project_success, derive_risk_level

router = APIRouter()


# ------------------------------------------------------------------------------
# 1. Model Lifecycle & Health (PRD §6, §9, SEC-05)
# ------------------------------------------------------------------------------

@router.get(
    "/models/health",
    response_model=Union[MlModelsHealthResponse, MlPublicHealthResponse],
    summary="Get ML Models Subsystem Health",
    description=(
        "Returns runtime subsystem health. Sanitized minimal health indicators are returned for public/unauthorized callers. "
        "Detailed model metadata, versioning, and feature dimensions are restricted to authenticated operators."
    ),
    status_code=status.HTTP_200_OK,
)
async def get_models_health(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db_session),
) -> Union[MlModelsHealthResponse, MlPublicHealthResponse]:
    """Returns runtime model readiness with role-based detail restriction (SEC-05)."""
    health = model_manager.get_health_status()

    # Check if caller has valid credentials
    if credentials and credentials.credentials:
        try:
            token_payload = verify_clerk_token(credentials.credentials)
            clerk_sub = token_payload.get("sub")
            if clerk_sub:
                user_res = await db.execute(select(User).where(User.clerk_user_id == clerk_sub))
                user = user_res.scalar_one_or_none()
                if user and (
                    user.role in (SystemRole.ADMIN.value, SystemRole.HR.value, SystemRole.PROJECT_MANAGER.value)
                    or has_permission(user.role, Permission.WORKSPACE_MANAGE)
                ):
                    return health
        except Exception:
            pass  # Fall back to sanitized public response on any token validation failure

    # Public / unauthorized callers receive only sanitized minimal status (SEC-05)
    return MlPublicHealthResponse(
        status=health.status,
        service="ml-inference",
        timestamp=health.timestamp,
    )


# ------------------------------------------------------------------------------
# 2. Burnout Risk Prediction (PRD §6.1, §7.2, §10.2)
# ------------------------------------------------------------------------------

@router.post(
    "/burnout/predict/{employee_id}",
    response_model=BurnoutPredictionResponse,
    summary="Predict Employee Burnout Risk",
    description=(
        "Executes verified inference using burnout_model.pkl. "
        "Enforces workspace tenancy isolation. Sensitive wellbeing features and continuous burn rate "
        "are masked for callers without EMPLOYEES_WELLBEING_VIEW permission."
    ),
    status_code=status.HTTP_200_OK,
)
async def predict_burnout(
    employee_id: uuid.UUID,
    payload: Optional[BurnoutInferenceRequest] = None,
    context: WorkspaceContext = Depends(get_current_workspace_context),
    _: None = Depends(require_permissions(Permission.EMPLOYEES_VIEW)),
    db: AsyncSession = Depends(get_db_session),
) -> BurnoutPredictionResponse:
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)
    overrides = payload.overrides if payload else None

    return await predict_employee_burnout(
        db=db,
        workspace_id=context.workspace.id,
        employee_id=employee_id,
        overrides=overrides,
        persist=True,
        can_view_wellbeing=can_view_wellbeing,
    )


@router.post(
    "/burnout/batch-predict",
    response_model=BurnoutBatchPredictResponse,
    summary="Batch Predict Burnout Risk for Workspace",
    description="Evaluates multiple employees in the active workspace and updates their inference records.",
    status_code=status.HTTP_200_OK,
)
async def batch_predict_burnout(
    payload: Optional[BurnoutBatchPredictRequest] = None,
    context: WorkspaceContext = Depends(get_current_workspace_context),
    _: None = Depends(require_permissions(Permission.EMPLOYEES_MANAGE)),
    db: AsyncSession = Depends(get_db_session),
) -> BurnoutBatchPredictResponse:
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)
    
    # Resolve target employees
    if payload and payload.employee_ids:
        emp_query = select(Employee.id).where(
            Employee.id.in_(payload.employee_ids),
            Employee.workspace_id == context.workspace.id,
            Employee.employment_status.notin_(["Archived", "Terminated"]),
        )
    else:
        emp_query = select(Employee.id).where(
            Employee.workspace_id == context.workspace.id,
            Employee.employment_status.notin_(["Archived", "Terminated"]),
        )

    res = await db.execute(emp_query)
    target_ids = list(res.scalars().all())

    predictions: List[BurnoutPredictionResponse] = []
    failures = 0
    errors: List[Dict[str, Any]] = []

    for emp_id in target_ids:
        try:
            pred = await predict_employee_burnout(
                db=db,
                workspace_id=context.workspace.id,
                employee_id=emp_id,
                persist=True,
                can_view_wellbeing=can_view_wellbeing,
            )
            predictions.append(pred)
        except Exception as exc:
            failures += 1
            errors.append({
                "employee_id": str(emp_id),
                "error": str(exc),
            })

    return BurnoutBatchPredictResponse(
        total_evaluated=len(target_ids),
        success_count=len(predictions),
        failure_count=failures,
        predictions=predictions,
        errors=errors if errors else None,
    )


@router.get(
    "/employees/{employee_id}/burnout-history",
    response_model=List[BurnoutPredictionResponse],
    summary="Get Employee Burnout Inference History",
    description="Retrieves historical burnout inference snapshots with role-based wellbeing data masking.",
    status_code=status.HTTP_200_OK,
)
async def get_employee_burnout_history(
    employee_id: uuid.UUID,
    limit: int = Query(default=10, ge=1, le=50),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    _: None = Depends(require_permissions(Permission.EMPLOYEES_VIEW)),
    db: AsyncSession = Depends(get_db_session),
) -> List[BurnoutPredictionResponse]:
    # Check employee exists in workspace
    emp_res = await db.execute(
        select(Employee).where(
            Employee.id == employee_id,
            Employee.workspace_id == context.workspace.id,
        )
    )
    if not emp_res.scalar_one_or_none():
        raise NotFoundError(f"Employee '{employee_id}' not found in workspace.")

    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)

    query = (
        select(MlBurnoutPrediction)
        .where(
            MlBurnoutPrediction.employee_id == employee_id,
            MlBurnoutPrediction.workspace_id == context.workspace.id,
        )
        .order_by(MlBurnoutPrediction.predicted_at.desc())
        .limit(limit)
    )
    res = await db.execute(query)
    records = list(res.scalars().all())

    responses = []
    for rec in records:
        if can_view_wellbeing:
            responses.append(
                BurnoutPredictionResponse(
                    id=rec.id,
                    employee_id=rec.employee_id,
                    model_version=rec.model_version,
                    predicted_burn_rate=rec.predicted_burn_rate,
                    normalized_burnout_score=rec.normalized_burnout_score,
                    risk_tier=rec.risk_tier,
                    feature_provenance=rec.feature_provenance,
                    contributing_factors=rec.explanation_shap.get("contributing_factors") if rec.explanation_shap else None,
                    predicted_at=rec.predicted_at,
                )
            )
        else:
            responses.append(
                BurnoutPredictionResponse(
                    id=rec.id,
                    employee_id=rec.employee_id,
                    model_version=rec.model_version,
                    predicted_burn_rate=None,
                    normalized_burnout_score=rec.normalized_burnout_score,
                    risk_tier=rec.risk_tier,
                    feature_provenance=None,
                    contributing_factors=None,
                    predicted_at=rec.predicted_at,
                )
            )

    return responses


# ------------------------------------------------------------------------------
# 3. Project Success Prediction (PRD §6.2)
# ------------------------------------------------------------------------------

@router.post(
    "/project-success/predict/{project_id}",
    response_model=ProjectSuccessPredictionResponse,
    summary="Predict Project Success (Prospective Simulation)",
    description=(
        "Executes prospective inference for candidate teams using Project_Success_XGBoost.pkl. "
        "Strictly flags target leakage caveats for ex-ante forecasting."
    ),
    status_code=status.HTTP_200_OK,
)
async def predict_prospective_project_success(
    project_id: uuid.UUID,
    payload: Optional[ProjectSuccessProspectiveRequest] = None,
    context: WorkspaceContext = Depends(get_current_workspace_context),
    _: None = Depends(require_permissions(Permission.PROJECTS_VIEW)),
    db: AsyncSession = Depends(get_db_session),
) -> ProjectSuccessPredictionResponse:
    formation_id = payload.formation_id if payload else None
    cand_ids = payload.candidate_employee_ids if payload else None
    quarter = payload.quarter if payload and payload.quarter else "Q1-2024"

    return await predict_project_success(
        db=db,
        workspace_id=context.workspace.id,
        project_id=project_id,
        formation_id=formation_id,
        candidate_employee_ids=cand_ids,
        quarter=quarter,
        is_prospective=True,
        persist=True,
    )


@router.post(
    "/project-success/retrospective/{project_id}",
    response_model=ProjectSuccessPredictionResponse,
    summary="Evaluate Project Success Retrospective (Closed-Out Outcomes)",
    description=(
        "Runs diagnostic evaluation using verified post-project delivery outcomes "
        "(delivery delay days, budget variance, turnover, scope change)."
    ),
    status_code=status.HTTP_200_OK,
)
async def evaluate_retrospective_project_success(
    project_id: uuid.UUID,
    payload: ProjectSuccessRetrospectiveRequest,
    context: WorkspaceContext = Depends(get_current_workspace_context),
    _: None = Depends(require_permissions(Permission.PROJECTS_MANAGE)),
    db: AsyncSession = Depends(get_db_session),
) -> ProjectSuccessPredictionResponse:
    post_outcomes = {
        "delivery_delay_days": payload.delivery_delay_days,
        "budget_variance": payload.budget_variance,
        "employee_turnover": payload.employee_turnover,
        "scope_change": payload.scope_change,
    }

    return await predict_project_success(
        db=db,
        workspace_id=context.workspace.id,
        project_id=project_id,
        formation_id=payload.formation_id,
        candidate_employee_ids=payload.candidate_employee_ids,
        quarter=payload.quarter or "Q1-2024",
        is_prospective=False,
        post_outcome_features=post_outcomes,
        verified_sources=payload.verified_sources,
        persist=True,
    )


@router.get(
    "/projects/{project_id}/success-history",
    response_model=List[ProjectSuccessPredictionResponse],
    summary="Get Project Success Prediction History",
    description="Retrieves historical success inference records for a project.",
    status_code=status.HTTP_200_OK,
)
async def get_project_success_history(
    project_id: uuid.UUID,
    limit: int = Query(default=10, ge=1, le=50),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    _: None = Depends(require_permissions(Permission.PROJECTS_VIEW)),
    db: AsyncSession = Depends(get_db_session),
) -> List[ProjectSuccessPredictionResponse]:
    # Check project exists in workspace
    p_res = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.workspace_id == context.workspace.id,
        )
    )
    if not p_res.scalar_one_or_none():
        raise NotFoundError(f"Project '{project_id}' not found in workspace.")

    query = (
        select(MlProjectSuccessPrediction)
        .where(
            MlProjectSuccessPrediction.project_id == project_id,
            MlProjectSuccessPrediction.workspace_id == context.workspace.id,
        )
        .order_by(MlProjectSuccessPrediction.predicted_at.desc())
        .limit(limit)
    )
    res = await db.execute(query)
    records = list(res.scalars().all())

    responses = []
    for rec in records:
        shap = rec.explanation_shap or {}
        is_prosp = shap.get("is_prospective", True)
        forecast_trust = shap.get("forecast_trustworthy", not is_prosp)
        leakage_assess = shap.get("target_leakage_assessment", "Target leakage not evaluated.")

        responses.append(
            ProjectSuccessPredictionResponse(
                id=rec.id,
                project_id=rec.project_id,
                formation_id=rec.formation_id,
                model_version=rec.model_version,
                predicted_success_score=rec.predicted_success_score,
                risk_level=derive_risk_level(rec.predicted_success_score),
                confidence_score=rec.confidence_score,
                is_prospective=is_prosp,
                has_target_leakage_risk=is_prosp,
                forecast_trustworthy=forecast_trust,
                target_leakage_assessment=leakage_assess,
                aggregated_team_features=rec.aggregated_team_features,
                positive_factors=rec.positive_factors,
                negative_factors=rec.negative_factors,
                predicted_at=rec.predicted_at,
            )
        )

    return responses
