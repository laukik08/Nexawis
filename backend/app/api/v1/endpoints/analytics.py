"""
NEXAWIS Backend - Analytics and Business Intelligence API Endpoints.
Provides authorized, workspace-scoped endpoints for executive KPIs, workforce allocation,
project performance, team formation trends, and sustainability metrics.
Enforces RBAC and masks sensitive individual-level wellbeing data for unauthorized roles.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.roles import Permission, has_permission
from app.api.deps import (
    WorkspaceContext,
    get_current_workspace_context,
    require_permissions,
)
from app.services.analytics.service import AnalyticsService
from app.schemas.analytics import (
    FilterOptionsResponse,
    FullAnalyticsPayloadSchema,
    AnalyticsKpiSummarySchema,
    WorkforceAnalyticsDataSchema,
    ProjectAnalyticsDataSchema,
    TeamAnalyticsDataSchema,
    SustainabilityAnalyticsDataSchema,
    AnalyticsTrendsResponseSchema,
)

router = APIRouter()


@router.get(
    "/filter-options",
    response_model=FilterOptionsResponse,
    summary="Retrieve distinct departments and projects for analytics filters",
)
async def get_analytics_filter_options(
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.ANALYTICS_VIEW)),
) -> FilterOptionsResponse:
    """Returns available departments and active project options scoped to the workspace."""
    opts = await AnalyticsService.get_filter_options(db, context.workspace.id)
    return FilterOptionsResponse(**opts)


@router.get(
    "/dashboard",
    response_model=FullAnalyticsPayloadSchema,
    summary="Retrieve comprehensive unified analytics payload for dashboard tabs",
)
async def get_analytics_dashboard(
    preset: str = Query("30d", pattern="^(7d|30d|90d|custom)$", description="Date range preset"),
    department: str = Query("All", description="Department filter"),
    project_id: str = Query("All", description="Project ID filter"),
    search_query: Optional[str] = Query(None, description="Search term for names or codes"),
    start_date: Optional[str] = Query(None, description="Custom start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Custom end date (YYYY-MM-DD)"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.ANALYTICS_VIEW)),
) -> FullAnalyticsPayloadSchema:
    """
    Computes and returns the complete analytics dataset with all distributions,
    KPIs, capacity analyses, and ML risk assessments.
    """
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)

    payload = await AnalyticsService.get_full_dashboard(
        db=db,
        workspace_id=context.workspace.id,
        preset=preset,
        department=department,
        project_id=project_id,
        search_query=search_query,
        start_date_str=start_date,
        end_date_str=end_date,
        can_view_wellbeing=can_view_wellbeing,
    )
    return FullAnalyticsPayloadSchema(**payload)


@router.get(
    "/kpis",
    response_model=AnalyticsKpiSummarySchema,
    summary="Retrieve executive overview macro KPIs",
)
async def get_kpis(
    preset: str = Query("30d", pattern="^(7d|30d|90d|custom)$"),
    department: str = Query("All"),
    project_id: str = Query("All"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.ANALYTICS_VIEW)),
) -> AnalyticsKpiSummarySchema:
    """Calculates the 4 macro KPI cards (AWIS, Utilization, Team Fit, Sustainability)."""
    kpis = await AnalyticsService.get_kpi_summary(
        db=db,
        workspace_id=context.workspace.id,
        preset=preset,
        department=department,
        project_id=project_id,
        start_date_str=start_date,
        end_date_str=end_date,
    )
    return AnalyticsKpiSummarySchema(**kpis)


@router.get(
    "/workforce",
    response_model=WorkforceAnalyticsDataSchema,
    summary="Retrieve workforce demographics, skills, and workload distribution",
)
async def get_workforce_analytics(
    department: str = Query("All"),
    search_query: Optional[str] = Query(None),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.ANALYTICS_VIEW)),
) -> WorkforceAnalyticsDataSchema:
    """Returns workforce analytics with sensitive wellbeing metrics masked if unauthorized."""
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)
    data = await AnalyticsService.get_workforce_analytics(
        db=db,
        workspace_id=context.workspace.id,
        department=department,
        search_query=search_query,
        can_view_wellbeing=can_view_wellbeing,
    )
    return WorkforceAnalyticsDataSchema(**data)


@router.get(
    "/projects",
    response_model=ProjectAnalyticsDataSchema,
    summary="Retrieve project delivery metrics and schedule health",
)
async def get_projects_analytics(
    department: str = Query("All"),
    project_id: str = Query("All"),
    search_query: Optional[str] = Query(None),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.ANALYTICS_VIEW)),
) -> ProjectAnalyticsDataSchema:
    """Calculates project delivery metrics, schedule health, and priority distributions."""
    data = await AnalyticsService.get_projects_analytics(
        db=db,
        workspace_id=context.workspace.id,
        department=department,
        project_id=project_id,
        search_query=search_query,
    )
    return ProjectAnalyticsDataSchema(**data)


@router.get(
    "/teams",
    response_model=TeamAnalyticsDataSchema,
    summary="Retrieve team formation history and fit metrics",
)
async def get_teams_analytics(
    department: str = Query("All"),
    project_id: str = Query("All"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.ANALYTICS_VIEW)),
) -> TeamAnalyticsDataSchema:
    """Returns team formation recommendations, fit scores, and outcomes."""
    data = await AnalyticsService.get_teams_analytics(
        db=db,
        workspace_id=context.workspace.id,
        department=department,
        project_id=project_id,
    )
    return TeamAnalyticsDataSchema(**data)


@router.get(
    "/sustainability",
    response_model=SustainabilityAnalyticsDataSchema,
    summary="Retrieve workload sustainability and authorized burnout risk",
)
async def get_sustainability_analytics(
    department: str = Query("All"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.ANALYTICS_VIEW)),
) -> SustainabilityAnalyticsDataSchema:
    """
    Returns workload sustainability metrics and department burnout risks.
    Masks candidate identities if caller lacks EMPLOYEES_WELLBEING_VIEW.
    """
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)
    data = await AnalyticsService.get_sustainability_analytics(
        db=db,
        workspace_id=context.workspace.id,
        department=department,
        can_view_wellbeing=can_view_wellbeing,
    )
    return SustainabilityAnalyticsDataSchema(**data)


@router.get(
    "/trends",
    response_model=AnalyticsTrendsResponseSchema,
    summary="Retrieve time-series trends for AWIS score and project performance",
)
async def get_trend_analytics(
    preset: str = Query("30d", pattern="^(7d|30d|90d|custom)$"),
    department: str = Query("All"),
    project_id: str = Query("All"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.ANALYTICS_VIEW)),
) -> AnalyticsTrendsResponseSchema:
    """Calculates time-series trends honoring department, project, and custom date bounds without synthetic fallback."""
    awis_trend, proj_trend = await AnalyticsService.get_trend_analytics(
        db=db,
        workspace_id=context.workspace.id,
        preset=preset,
        department=department,
        project_id=project_id,
        start_date_str=start_date,
        end_date_str=end_date,
    )
    return AnalyticsTrendsResponseSchema(
        awisTrend=awis_trend,
        projectPerformanceTrend=proj_trend,
    )
