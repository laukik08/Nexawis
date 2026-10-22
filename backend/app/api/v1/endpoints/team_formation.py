"""
NEXAWIS Backend - Team Formation & Optimization API Endpoints.
Provides constraint-aware algorithmic team recommendation generation,
explanation inspection, distinct alternative exploration, and human-in-the-loop assignment commits.
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, status, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.roles import Permission
from app.api.deps import (
    get_current_user,
    get_current_workspace_context,
    require_permissions,
    WorkspaceContext,
)
from app.models.user import User
from app.schemas.team_formation import (
    GenerateTeamRecommendationRequest,
    TeamRecommendationResponse,
    FinalizeFormationRequest,
    FinalizeFormationResponse,
    FormationHistoryItemResponse,
    TeamFormationKpisResponse,
)
from app.services.team_optimizer.service import TeamOptimizationService

router = APIRouter()


# ------------------------------------------------------------------------------
# 1. Generate Algorithmic Team Recommendation
# ------------------------------------------------------------------------------

@router.post(
    "/projects/{project_id}/team-recommendation",
    response_model=TeamRecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate constraint-aware team recommendation for a project",
)
async def generate_team_recommendation(
    project_id: uuid.UUID = Path(..., description="Target project identifier"),
    payload: GenerateTeamRecommendationRequest = GenerateTeamRecommendationRequest(),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    current_user: User = Depends(require_permissions(Permission.TEAM_FORMATIONS_CREATE)),
    db: AsyncSession = Depends(get_db_session),
) -> TeamRecommendationResponse:
    """
    Evaluates workspace candidate pool against project requirements using Phase 6 AWIS engine,
    enforcing capacity limits, mandatory skill coverage, and deterministic tie-breaking.
    Generates primary optimal team and distinct feasible alternatives.
    """
    return await TeamOptimizationService.generate_and_persist_recommendation(
        db=db,
        project_id=project_id,
        workspace_id=context.workspace.id,
        config=payload,
        current_user=current_user,
    )


# ------------------------------------------------------------------------------
# 2. Recommendation Snapshot & History Inspection
# ------------------------------------------------------------------------------

@router.get(
    "/recommendations/{formation_id}",
    response_model=TeamRecommendationResponse,
    summary="Retrieve details and explanations of a team formation recommendation",
)
async def get_team_recommendation_details(
    formation_id: uuid.UUID = Path(..., description="Team formation snapshot identifier"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    current_user: User = Depends(require_permissions(Permission.TEAM_FORMATIONS_VIEW)),
    db: AsyncSession = Depends(get_db_session),
) -> TeamRecommendationResponse:
    """Retrieves full candidate roster, individual AWIS breakdowns, and team metrics."""
    return await TeamOptimizationService.get_formation_by_id(
        db=db,
        formation_id=formation_id,
        workspace_id=context.workspace.id,
    )


@router.get(
    "/projects/{project_id}/team-history",
    response_model=List[FormationHistoryItemResponse],
    summary="List historical team formation snapshots for a project",
)
async def get_project_formation_history(
    project_id: uuid.UUID = Path(..., description="Project identifier"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    current_user: User = Depends(require_permissions(Permission.TEAM_FORMATIONS_VIEW)),
    db: AsyncSession = Depends(get_db_session),
) -> List[FormationHistoryItemResponse]:
    """Returns chronological list of team formation runs for the specified project."""
    return await TeamOptimizationService.list_project_formation_history(
        db=db,
        project_id=project_id,
        workspace_id=context.workspace.id,
    )


@router.get(
    "/history",
    response_model=List[FormationHistoryItemResponse],
    summary="List all historical team formation snapshots across workspace",
)
async def get_workspace_formation_history(
    context: WorkspaceContext = Depends(get_current_workspace_context),
    current_user: User = Depends(require_permissions(Permission.TEAM_FORMATIONS_VIEW)),
    db: AsyncSession = Depends(get_db_session),
) -> List[FormationHistoryItemResponse]:
    """Returns chronological list of all team formation runs across the active workspace."""
    return await TeamOptimizationService.list_workspace_formation_history(
        db=db,
        workspace_id=context.workspace.id,
    )


@router.get(
    "/kpis",
    response_model=TeamFormationKpisResponse,
    summary="Retrieve workspace team formation performance KPIs",
)
async def get_formation_kpis(
    context: WorkspaceContext = Depends(get_current_workspace_context),
    current_user: User = Depends(require_permissions(Permission.TEAM_FORMATIONS_VIEW)),
    db: AsyncSession = Depends(get_db_session),
) -> TeamFormationKpisResponse:
    """Returns aggregated team formation metrics for the active workspace."""
    return await TeamOptimizationService.get_workspace_formation_kpis(
        db=db,
        workspace_id=context.workspace.id,
    )


# ------------------------------------------------------------------------------
# 3. Finalize & Accept Team Assignment
# ------------------------------------------------------------------------------

@router.post(
    "/recommendations/{formation_id}/finalize",
    response_model=FinalizeFormationResponse,
    status_code=status.HTTP_200_OK,
    summary="Confirm and commit team allocation assignments",
)
@router.post(
    "/recommendations/{formation_id}/accept",
    response_model=FinalizeFormationResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
async def finalize_team_recommendation(
    formation_id: uuid.UUID = Path(..., description="Team formation identifier"),
    payload: FinalizeFormationRequest = FinalizeFormationRequest(),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    current_user: User = Depends(require_permissions(Permission.TEAM_FORMATIONS_FINALIZE)),
    db: AsyncSession = Depends(get_db_session),
) -> FinalizeFormationResponse:
    """
    Revalidates active status, workspace boundaries, and workload headroom before
    atomically committing persistent ProjectAllocation records and marking formation as Finalized.
    """
    return await TeamOptimizationService.finalize_team_formation(
        db=db,
        formation_id=formation_id,
        workspace_id=context.workspace.id,
        request=payload,
        current_user=current_user,
    )


# ------------------------------------------------------------------------------
# 4. Reject / Archive Team Recommendation
# ------------------------------------------------------------------------------

@router.post(
    "/recommendations/{formation_id}/reject",
    status_code=status.HTTP_200_OK,
    summary="Reject and archive a team formation recommendation",
)
async def reject_team_recommendation(
    formation_id: uuid.UUID = Path(..., description="Team formation identifier"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    current_user: User = Depends(require_permissions(Permission.TEAM_FORMATIONS_FINALIZE)),
    db: AsyncSession = Depends(get_db_session),
):
    """Marks the team formation as Archived without creating project allocations."""
    await TeamOptimizationService.reject_team_formation(
        db=db,
        formation_id=formation_id,
        workspace_id=context.workspace.id,
    )
    return {"status": "Archived", "message": "Team recommendation successfully archived."}
