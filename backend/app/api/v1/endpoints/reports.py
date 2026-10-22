"""
NEXAWIS Backend - Reporting & Export API Endpoints.
Provides authorized, workspace-scoped endpoints for report catalog, KPI metrics,
preview generation, library listings, binary PDF/CSV streaming exports, and scheduled distributions.
Enforces strict RBAC and wellbeing privacy protections.
"""

import io
import re
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.roles import Permission, has_permission
from app.api.deps import (
    WorkspaceContext,
    get_current_workspace_context,
    require_permissions,
)
from app.schemas.report import (
    ReportConfigSchema,
    ReportRecordSchema,
    ReportKpiMetricsSchema,
    ReportCategoryDefSchema,
    ScheduledReportDefSchema,
    ScheduledReportCreateSchema,
    ReportFilterOptionsResponse,
)
from app.services.reports.service import ReportService
from app.services.reports.pdf_generator import generate_report_pdf
from app.services.reports.csv_generator import generate_report_csv

router = APIRouter()


def sanitize_filename(name: str, ext: str) -> str:
    """Sanitizes user/report title to safe ASCII filename, preventing header injection or path traversal."""
    safe = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", name.strip())
    safe = re.sub(r"_+", "_", safe).strip("._")
    if not safe:
        safe = "nexawis_report"
    safe = safe[:60]
    return f"{safe}.{ext.lstrip('.')}"


@router.get(
    "/kpis",
    response_model=ReportKpiMetricsSchema,
    summary="Retrieve report center macro KPI metrics",
)
async def get_report_kpis(
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.REPORTS_VIEW)),
) -> ReportKpiMetricsSchema:
    """Returns top-level metric counters for report library, schedules, and active coverage."""
    metrics = await ReportService.get_report_kpis(db, context.workspace.id)
    return ReportKpiMetricsSchema(**metrics)


@router.get(
    "/categories",
    response_model=List[ReportCategoryDefSchema],
    summary="Retrieve standard report category definitions",
)
async def get_categories(
    context: WorkspaceContext = Depends(get_current_workspace_context),
    _: None = Depends(require_permissions(Permission.REPORTS_VIEW)),
) -> List[ReportCategoryDefSchema]:
    """Returns the 6 authorized report catalog definitions."""
    categories = ReportService.get_categories()
    return [ReportCategoryDefSchema(**c) for c in categories]


@router.get(
    "/filter-options",
    response_model=ReportFilterOptionsResponse,
    summary="Retrieve distinct departments and projects for report configuration",
)
async def get_filter_options(
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.REPORTS_VIEW)),
) -> ReportFilterOptionsResponse:
    """Returns available departments and projects scoped to the workspace."""
    opts = await ReportService.get_filter_options(db, context.workspace.id)
    return ReportFilterOptionsResponse(**opts)


@router.get(
    "/",
    response_model=List[ReportRecordSchema],
    summary="List generated reports in workspace library",
)
async def list_reports(
    category: Optional[str] = Query(None, description="Filter by category key"),
    search: Optional[str] = Query(None, description="Search by report name or period"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.REPORTS_VIEW)),
) -> List[ReportRecordSchema]:
    """Returns all generated reports for the workspace, ordered by newest first."""
    reports = await ReportService.list_reports(
        db=db,
        workspace_id=context.workspace.id,
        category=category,
        search=search,
    )
    return reports


@router.post(
    "/generate",
    response_model=ReportRecordSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Generate and persist a new report based on live workspace data",
)
async def generate_report(
    config: ReportConfigSchema,
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.REPORTS_VIEW)),
) -> ReportRecordSchema:
    """
    Executes live analytical aggregations across workforce, projects, team formations,
    AWIS scores, or sustainability models, persisting the report artifact to the database.
    """
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)
    user_id = context.user.id if context.user else "usr_system"

    report = await ReportService.generate_report(
        db=db,
        workspace_id=context.workspace.id,
        user_id=user_id,
        config=config,
        can_view_wellbeing=can_view_wellbeing,
    )
    return report


@router.get(
    "/{report_id}",
    response_model=ReportRecordSchema,
    summary="Retrieve a specific report by ID",
)
async def get_report_by_id(
    report_id: str,
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.REPORTS_VIEW)),
) -> ReportRecordSchema:
    """Returns the complete persisted report record including tables, charts, and metrics."""
    report = await ReportService.get_report_by_id(
        db=db,
        workspace_id=context.workspace.id,
        report_id=report_id,
    )
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or belongs to another workspace.",
        )
    return report


@router.get(
    "/{report_id}/export",
    summary="Export and stream binary PDF or CSV report file",
)
async def export_report_file(
    report_id: str,
    format: str = Query("pdf", pattern="^(pdf|csv|PDF|CSV)$", description="Export format"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.REPORTS_VIEW)),
):
    """
    Dynamically renders and streams vector PDF or sanitized CSV artifact
    with proper headers, pagination, and formula injection mitigations.
    """
    report = await ReportService.get_report_by_id(
        db=db,
        workspace_id=context.workspace.id,
        report_id=report_id,
    )
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or belongs to another workspace.",
        )

    export_fmt = format.lower()
    report_dict = report.model_dump() if hasattr(report, "model_dump") else report
    report_name = report.name if hasattr(report, "name") else report_dict.get("name", "nexawis_report")
    workspace_name = getattr(context.workspace, "name", "NEXAWIS Workspace")

    if export_fmt == "csv":
        csv_bytes = generate_report_csv(report_dict)
        filename = sanitize_filename(report_name, "csv")
        return StreamingResponse(
            io.BytesIO(csv_bytes),
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        )
    else:
        # Default to PDF
        pdf_bytes = generate_report_pdf(report_dict, workspace_name=workspace_name)
        filename = sanitize_filename(report_name, "pdf")
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        )


@router.post(
    "/{report_id}/duplicate",
    response_model=ReportRecordSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate an existing report configuration",
)
async def duplicate_report(
    report_id: str,
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.REPORTS_VIEW)),
) -> ReportRecordSchema:
    """Clones an existing report with fresh timestamp and '(Copy)' label."""
    user_id = context.user.id if context.user else "usr_system"
    new_report = await ReportService.duplicate_report(
        db=db,
        workspace_id=context.workspace.id,
        user_id=user_id,
        report_id=report_id,
    )
    if not new_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or belongs to another workspace.",
        )
    return new_report


@router.delete(
    "/{report_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a report from the workspace library",
)
async def delete_report(
    report_id: str,
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.REPORTS_MANAGE)),
):
    """Deletes the specified report. Requires REPORTS_MANAGE permission."""
    deleted = await ReportService.delete_report(
        db=db,
        workspace_id=context.workspace.id,
        report_id=report_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or belongs to another workspace.",
        )
    return None


# ==============================================================================
# SCHEDULED REPORTS ENDPOINTS
# ==============================================================================


@router.get(
    "/scheduled/list",
    response_model=List[ScheduledReportDefSchema],
    summary="List automated scheduled reports",
)
async def get_scheduled_reports(
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.REPORTS_VIEW)),
) -> List[ScheduledReportDefSchema]:
    """Returns all scheduled report configurations for the workspace."""
    schedules = await ReportService.get_scheduled_reports(db, context.workspace.id)
    return schedules


@router.post(
    "/scheduled/create",
    response_model=ScheduledReportDefSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new automated report schedule",
)
async def create_scheduled_report(
    data: ScheduledReportCreateSchema,
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.REPORTS_MANAGE)),
) -> ScheduledReportDefSchema:
    """Configures a recurring report distribution. Requires REPORTS_MANAGE permission."""
    user_id = context.user.id if context.user else "usr_system"
    schedule = await ReportService.create_scheduled_report(
        db=db,
        workspace_id=context.workspace.id,
        user_id=user_id,
        data=data,
    )
    return schedule


@router.delete(
    "/scheduled/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an automated report schedule",
)
async def delete_scheduled_report(
    schedule_id: str,
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.REPORTS_MANAGE)),
):
    """Deletes the specified report schedule. Requires REPORTS_MANAGE permission."""
    deleted = await ReportService.delete_scheduled_report(
        db=db,
        workspace_id=context.workspace.id,
        schedule_id=schedule_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled report not found or belongs to another workspace.",
        )
    return None
