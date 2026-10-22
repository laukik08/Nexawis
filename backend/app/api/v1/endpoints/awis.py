"""
NEXAWIS Backend - AWIS Candidate Recommendation and Scoring Endpoints.
Provides versioned, workspace-isolated API endpoints for candidate evaluation,
profile transparency, detailed factor explainability, and evaluation snapshot persistence.
"""

import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.api.deps import get_current_workspace_context, require_permissions, WorkspaceContext
from app.core.roles import Permission, has_permission
from app.models.project import Project, ProjectRequirement, ProjectMilestone, ProjectAllocation
from app.models.employee import (
    Employee,
    EmployeePerformanceHistory,
    EmployeeWorkloadHistory,
)
from app.models.skill import Skill, EmployeeSkill
from app.models.ml_results import AwisEvaluation, MlBurnoutPrediction
from app.core.exceptions import (
    ResourceNotFoundError,
    ConflictError,
    AppException,
)
from app.services.awis import (
    AwisFactor,
    PriorityProfile,
    SCORING_PROFILES,
    CRITICAL_FACTORS,
    COMPLETENESS_THRESHOLD,
    FRESHNESS_POLICIES_DAYS,
    FORMULA_VERSION,
    WORKLOAD_POLICY,
    AwisScoringEngine,
    AwisCandidateResult,
)
from app.schemas.awis import (
    AwisCandidateItem,
    AwisCandidateListResponse,
    AwisComponentScoreItem,
    AwisEligibilityResponse,
    AwisConfigResponse,
    AwisSnapshotRequest,
    AwisSnapshotResponse,
)

router = APIRouter()


def _serialize_candidate(
    cand: AwisCandidateResult,
    has_wellbeing_permission: bool,
) -> AwisCandidateItem:
    """Serializes an AwisCandidateResult into an AwisCandidateItem, masking sensitive data if required."""
    components_dict: Dict[str, AwisComponentScoreItem] = {}

    for factor, res in cand.component_scores.items():
        evidence = res.evidence
        metadata = dict(res.metadata)

        # Apply least privilege / wellbeing masking for users lacking EMPLOYEES_WELLBEING_VIEW
        if factor == AwisFactor.BURNOUT_SAFETY and not has_wellbeing_permission:
            # Mask raw internal burn rates or psychological fatigue scores
            metadata = {
                "risk_tier": metadata.get("risk_tier", "Protected"),
                "is_stale": metadata.get("is_stale", False),
            }
            if res.score is not None:
                evidence = f"Burnout safety index: {res.score:.1f}/100."

        components_dict[factor.value] = AwisComponentScoreItem(
            factor=factor.value,
            score=res.score,
            weight=cand.component_weights.get(factor, 0.0),
            isAvailable=res.is_available,
            isStale=res.is_stale,
            evidence=evidence,
            metadata=metadata,
        )

    return AwisCandidateItem(
        employeeId=cand.employee_id,
        employeeCode=cand.employee_code,
        name=cand.employee_name,
        department=cand.department,
        designation=cand.designation,
        avatarUrl=cand.avatar_url,
        compositeScore=cand.composite_score,
        rankPosition=cand.rank_position,
        rankingTier=cand.ranking_tier,
        eligibility=AwisEligibilityResponse(
            status=cand.eligibility.status.value,
            isActionable=cand.eligibility.is_actionable,
            reasons=cand.eligibility.reasons,
            explanations=cand.eligibility.explanations,
            failedMandatorySkills=cand.eligibility.failed_mandatory_skills,
        ),
        isActionable=cand.is_actionable,
        isComplete=cand.is_complete,
        isProvisional=cand.is_provisional,
        weightedCompleteness=cand.weighted_completeness_pct,
        components=components_dict,
        missingFactors=cand.missing_factors,
        staleFactors=cand.stale_factors,
        positiveFactors=cand.positive_factors,
        concernFactors=cand.concern_factors,
        summaryExplanation=cand.summary_explanation,
        formulaVersion=cand.formula_version,
    )


async def _get_project_with_specs(
    project_id: str,
    workspace_id: uuid.UUID,
    db: AsyncSession,
) -> Project:
    """Retrieves a project within the authorized workspace with all required relationship collections."""
    try:
        val_uuid = uuid.UUID(project_id)
        proj_filter = or_(Project.id == val_uuid, Project.project_code == project_id)
    except ValueError:
        proj_filter = Project.project_code == project_id

    query = (
        select(Project)
        .where(
            Project.workspace_id == workspace_id,
            proj_filter,
        )
        .options(
            selectinload(Project.requirements).selectinload(ProjectRequirement.skill),
            selectinload(Project.milestones),
            selectinload(Project.allocations),
        )
    )
    result = await db.execute(query)
    project = result.scalars().first()
    if not project:
        raise ResourceNotFoundError(f"Project '{project_id}' was not found in this workspace.")
    return project


async def _get_workspace_employees(
    workspace_id: uuid.UUID,
    db: AsyncSession,
    department: Optional[str] = None,
) -> List[Employee]:
    """Retrieves all workspace employees with eager-loaded skills, allocations, and history."""
    query = (
        select(Employee)
        .where(
            Employee.workspace_id == workspace_id,
            Employee.employment_status.notin_(["Archived", "Terminated"]),
        )
        .options(
            selectinload(Employee.skills).selectinload(EmployeeSkill.skill),
            selectinload(Employee.certifications),
            selectinload(Employee.project_allocations),
            selectinload(Employee.performance_history),
            selectinload(Employee.workload_history),
            selectinload(Employee.burnout_predictions),
        )
    )
    if department and department.strip() and department.lower() != "all":
        query = query.where(Employee.department == department.strip())

    result = await db.execute(query)
    return list(result.scalars().all())


@router.get(
    "/config",
    response_model=AwisConfigResponse,
    dependencies=[Depends(require_permissions(Permission.PROJECTS_VIEW))],
    summary="Get AWIS scoring configuration and versioned profiles",
)
async def get_awis_config(
    project_id: str = Path(..., description="Project ID or code"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
) -> AwisConfigResponse:
    """Returns the versioned scoring configuration, weight matrix, and operational thresholds."""
    await _get_project_with_specs(project_id, context.workspace.id, db)

    profiles_dict = {
        prof.value: {factor.value: weight for factor, weight in weights.items()}
        for prof, weights in SCORING_PROFILES.items()
    }
    return AwisConfigResponse(
        profiles=profiles_dict,
        criticalFactors=[f.value for f in CRITICAL_FACTORS],
        completenessThreshold=COMPLETENESS_THRESHOLD,
        freshnessPoliciesDays={k.value: v for k, v in FRESHNESS_POLICIES_DAYS.items()},
        formulaVersion=FORMULA_VERSION,
        workloadPolicy=WORKLOAD_POLICY.to_dict(),
    )


@router.get(
    "/candidates",
    response_model=AwisCandidateListResponse,
    dependencies=[Depends(require_permissions(Permission.PROJECTS_VIEW))],
    summary="Score and rank workspace employees for a project",
)
async def get_project_candidates(
    project_id: str = Path(..., description="Project ID or code"),
    department: Optional[str] = Query(None, description="Filter candidate pool by department"),
    min_score: Optional[float] = Query(None, ge=0.0, le=100.0, description="Minimum composite AWIS score"),
    include_non_actionable: bool = Query(False, description="Whether to include ineligible candidates"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
) -> AwisCandidateListResponse:
    """
    Evaluates workspace employees against project requirements, selects the priority profile,
    enforces hard constraints, and returns ranked recommendations with full explainability.
    """
    project = await _get_project_with_specs(project_id, context.workspace.id, db)
    employees = await _get_workspace_employees(context.workspace.id, db, department)

    engine = AwisScoringEngine()
    actionable_results, non_actionable_results = engine.rank_candidates(employees, project)

    has_wellbeing_perm = has_permission(context.user.role, Permission.EMPLOYEES_WELLBEING_VIEW)

    # Filter actionable by min_score if requested
    filtered_actionable = actionable_results
    if min_score is not None:
        filtered_actionable = [
            c for c in actionable_results
            if c.composite_score is not None and c.composite_score >= min_score
        ]

    # Re-assign rank positions after filtering
    for idx, c in enumerate(filtered_actionable, start=1):
        c.rank_position = idx

    # Paginate actionable items
    total_actionable = len(filtered_actionable)
    start_idx = (page - 1) * page_size
    paged_cands = filtered_actionable[start_idx : start_idx + page_size]

    items = [_serialize_candidate(c, has_wellbeing_perm) for c in paged_cands]
    non_actionable_items = None
    if include_non_actionable:
        non_actionable_items = [
            _serialize_candidate(c, has_wellbeing_perm) for c in non_actionable_results
        ]

    selected_prof = engine.evaluate_employee(employees[0], project).selected_profile if employees else PriorityProfile.MEDIUM

    return AwisCandidateListResponse(
        projectId=str(project.id),
        projectCode=project.project_code,
        projectPriority=project.priority,
        selectedProfile=selected_prof.value,
        formulaVersion=FORMULA_VERSION,
        completenessThreshold=COMPLETENESS_THRESHOLD,
        actionableCount=total_actionable,
        nonActionableCount=len(non_actionable_results),
        items=items,
        nonActionableItems=non_actionable_items,
        total=total_actionable,
        page=page,
        pageSize=page_size,
    )


@router.get(
    "/candidates/{employee_id}",
    response_model=AwisCandidateItem,
    dependencies=[Depends(require_permissions(Permission.PROJECTS_VIEW))],
    summary="Get detailed AWIS evaluation and explainability for a single employee",
)
async def get_candidate_detail(
    project_id: str = Path(..., description="Project ID or code"),
    employee_id: str = Path(..., description="Employee UUID or code"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
) -> AwisCandidateItem:
    """Returns complete 7-factor AWIS breakdown and explainability for an individual employee."""
    project = await _get_project_with_specs(project_id, context.workspace.id, db)

    # Fetch employee
    try:
        emp_uuid = uuid.UUID(employee_id)
        emp_filter = or_(Employee.id == emp_uuid, Employee.employee_code == employee_id)
    except ValueError:
        emp_filter = Employee.employee_code == employee_id

    emp_query = (
        select(Employee)
        .where(
            Employee.workspace_id == context.workspace.id,
            emp_filter,
        )
        .options(
            selectinload(Employee.skills).selectinload(EmployeeSkill.skill),
            selectinload(Employee.certifications),
            selectinload(Employee.project_allocations),
            selectinload(Employee.performance_history),
            selectinload(Employee.workload_history),
            selectinload(Employee.burnout_predictions),
        )
    )
    res = await db.execute(emp_query)
    employee = res.scalars().first()
    if not employee:
        raise ResourceNotFoundError("Employee", employee_id)

    engine = AwisScoringEngine()
    result = engine.evaluate_employee(employee, project)
    has_wellbeing_perm = has_permission(context.user.role, Permission.EMPLOYEES_WELLBEING_VIEW)

    return _serialize_candidate(result, has_wellbeing_perm)


@router.post(
    "/snapshot",
    response_model=AwisSnapshotResponse,
    dependencies=[Depends(require_permissions(Permission.PROJECTS_MANAGE))],
    summary="Persist an AWIS evaluation run snapshot for auditing",
)
async def create_awis_snapshot(
    project_id: str = Path(..., description="Project ID or code"),
    payload: AwisSnapshotRequest = AwisSnapshotRequest(),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
) -> AwisSnapshotResponse:
    """
    Persists evaluation records to the awis_evaluations table for reproducibility and audit history.
    """
    project = await _get_project_with_specs(project_id, context.workspace.id, db)
    employees = await _get_workspace_employees(context.workspace.id, db)

    engine = AwisScoringEngine()
    actionable_results, non_actionable_results = engine.rank_candidates(employees, project)

    candidates_to_save = actionable_results[: payload.save_top_n]
    if payload.include_ineligible:
        candidates_to_save.extend(non_actionable_results)

    eval_records: List[AwisEvaluation] = []
    now_ts = datetime.now(timezone.utc)

    for cand in candidates_to_save:
        explanation_data = {
            "positives": cand.positive_factors,
            "concerns": cand.concern_factors,
            "summary": cand.summary_explanation,
            "completeness_pct": cand.weighted_completeness_pct,
            "is_provisional": cand.is_provisional,
            "ranking_tier": cand.ranking_tier,
            "profile": cand.selected_profile.value,
            "missing_factors": cand.missing_factors,
            "notes": payload.notes,
        }

        eval_obj = AwisEvaluation(
            workspace_id=context.workspace.id,
            project_id=project.id,
            employee_id=uuid.UUID(cand.employee_id),
            scoring_version=FORMULA_VERSION,
            composite_awis_score=cand.composite_score if cand.composite_score is not None else 0.0,
            skill_intelligence=cand.component_scores[AwisFactor.SKILL_MATCH].score or 0.0,
            experience_intelligence=cand.component_scores[AwisFactor.RELEVANT_EXPERIENCE].score or 0.0,
            performance_intelligence=cand.component_scores[AwisFactor.PERFORMANCE].score or 0.0,
            availability_intelligence=cand.component_scores[AwisFactor.AVAILABILITY].score or 0.0,
            workload_intelligence=cand.component_scores[AwisFactor.WORKLOAD_SUSTAINABILITY].score or 0.0,
            burnout_intelligence=cand.component_scores[AwisFactor.BURNOUT_SAFETY].score or 0.0,
            collaboration_intelligence=getattr(
                next((e for e in employees if str(e.id) == cand.employee_id), None),
                "collaboration_score",
                80.0,
            ) or 80.0,
            growth_intelligence=cand.component_scores[AwisFactor.GROWTH_POTENTIAL].score or 0.0,
            compatibility_intelligence=80.0,
            rank_position=cand.rank_position,
            eligibility_passed=cand.eligibility.is_actionable,
            explanation_metadata=explanation_data,
            evaluated_at=now_ts,
        )
        eval_records.append(eval_obj)
        db.add(eval_obj)

    await db.commit()

    return AwisSnapshotResponse(
        savedCount=len(eval_records),
        scoringVersion=FORMULA_VERSION,
        projectId=str(project.id),
        evaluatedAt=now_ts.isoformat(),
        message=f"Successfully persisted {len(eval_records)} AWIS candidate evaluation records.",
    )
