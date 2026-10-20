"""
NEXAWIS Backend - Employee Management Endpoints.
Provides authenticated, workspace-isolated CRUD, search, filter, sorting,
and pagination for workforce records, enforcing role-based and sensitive-data permissions.
"""

import math
import uuid
import urllib.parse
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, desc, asc
from sqlalchemy.orm import selectinload, joinedload

from app.core.database import get_db_session
from app.core.roles import Permission, has_permission
from app.core.exceptions import (
    ResourceNotFoundError,
    ConflictError,
)
from app.api.deps import (
    get_current_workspace_context,
    require_permissions,
    WorkspaceContext,
)
from app.models.employee import (
    Employee,
    EmployeePerformanceHistory,
)
from app.models.skill import Skill, EmployeeSkill
from app.models.project import ProjectAllocation
from app.schemas.employee import (
    EmployeeListItemResponse,
    EmployeeDetailResponse,
    EmployeeListResponse,
    EmployeeStatsResponse,
    EmployeeCreateRequest,
    EmployeeUpdateRequest,
    SkillItem,
    ProjectAllocationItem,
    PerformanceRecordItem,
    AwisInsightsItem,
)

router = APIRouter()


def _mask_wellbeing(emp: Employee, can_view_wellbeing: bool) -> tuple[Optional[str], Optional[float]]:
    """Omit or mask fatigue and burnout indicators if user lacks sensitive permission."""
    if can_view_wellbeing:
        return emp.wellbeing_risk, emp.mental_fatigue_score
    return "Restricted", None


def _format_avatar(emp: Employee) -> str:
    """Returns avatar URL or a deterministic high-contrast UI avatar."""
    if emp.avatar_url and emp.avatar_url.strip():
        return emp.avatar_url
    name_encoded = urllib.parse.quote(emp.full_name)
    return f"https://ui-avatars.com/api/?name={name_encoded}&background=0284c7&color=fff"


def _map_employee_list_item(emp: Employee, can_view_wellbeing: bool) -> EmployeeListItemResponse:
    """Transforms an Employee ORM entity to a directory list item."""
    risk, _ = _mask_wellbeing(emp, can_view_wellbeing)
    skills_list = [
        SkillItem(
            name=es.skill.name if es.skill else "Unknown",
            proficiency=es.proficiency,
            is_primary=es.is_primary,
        )
        for es in (emp.skills or [])
    ]
    return EmployeeListItemResponse(
        id=str(emp.id),
        employee_id=emp.employee_code,
        name=emp.full_name,
        email=emp.email,
        avatar_url=_format_avatar(emp),
        role=emp.designation,
        department=emp.department,
        experience_years=emp.experience_years,
        status=emp.employment_status,
        performance_score=emp.performance_score,
        performance_trend=emp.performance_trend,
        availability_score=emp.availability_score,
        workload_score=emp.current_workload_percent,
        wellbeing_risk=risk,
        growth_potential=emp.growth_potential,
        awis_fit_score=emp.collaboration_score,
        skills=skills_list,
        work_location=emp.work_location,
    )


def _map_employee_detail(emp: Employee, can_view_wellbeing: bool) -> EmployeeDetailResponse:
    """Transforms an Employee ORM entity with relations to full profile schema."""
    risk, fatigue = _mask_wellbeing(emp, can_view_wellbeing)
    skills_list = [
        SkillItem(
            name=es.skill.name if es.skill else "Unknown",
            proficiency=es.proficiency,
            is_primary=es.is_primary,
        )
        for es in (emp.skills or [])
    ]
    current_projects = [
        ProjectAllocationItem(
            id=str(pa.id),
            name=pa.project.name if pa.project else f"Project {str(pa.project_id)[:8]}",
            role=pa.role,
            allocation_percent=pa.allocation_percent,
            priority=pa.project.priority if pa.project else "Medium",
            team_fit=pa.team_fit if pa.team_fit is not None else 80.0,
            status=pa.status or "Active",
        )
        for pa in (emp.project_allocations or [])
    ]

    perf_history = [
        PerformanceRecordItem(
            month=ph.period_label,
            score=ph.performance_score,
        )
        for ph in sorted(emp.performance_history or [], key=lambda x: str(x.period_label))
    ]
    if not perf_history:
        # 6-month baseline from baseline performance score
        perf_history = [
            PerformanceRecordItem(month="Jan", score=max(60.0, round(emp.performance_score - 4, 1))),
            PerformanceRecordItem(month="Feb", score=max(60.0, round(emp.performance_score - 2, 1))),
            PerformanceRecordItem(month="Mar", score=max(60.0, round(emp.performance_score - 3, 1))),
            PerformanceRecordItem(month="Apr", score=max(60.0, round(emp.performance_score - 1, 1))),
            PerformanceRecordItem(month="May", score=max(60.0, round(emp.performance_score - 1, 1))),
            PerformanceRecordItem(month="Jun", score=round(emp.performance_score, 1)),
        ]

    raw_insights = emp.awis_insights or {}
    awis_insights = AwisInsightsItem(
        positive=raw_insights.get("positive", [
            f"Strong competence in {emp.designation}",
            f"Reliable track record with {emp.experience_years} years experience",
        ]),
        negative=raw_insights.get("negative", [
            "Monitor workload balance during peak project periods"
            if emp.current_workload_percent > 80
            else "Operational capacity available for high-priority initiatives"
        ]),
        summary=raw_insights.get(
            "summary",
            f"{emp.full_name} is operating in {emp.department} with a performance score of {emp.performance_score}.",
        ),
    )

    return EmployeeDetailResponse(
        id=str(emp.id),
        employee_id=emp.employee_code,
        name=emp.full_name,
        email=emp.email,
        avatar_url=_format_avatar(emp),
        role=emp.designation,
        department=emp.department,
        experience_years=emp.experience_years,
        status=emp.employment_status,
        performance_score=emp.performance_score,
        performance_trend=emp.performance_trend,
        availability_score=emp.availability_score,
        workload_score=emp.current_workload_percent,
        wellbeing_risk=risk,
        growth_potential=emp.growth_potential,
        awis_fit_score=emp.collaboration_score,
        skills=skills_list,
        work_location=emp.work_location,
        employment_type=emp.employment_type,
        joining_date=emp.joining_date,
        reporting_manager_id=str(emp.reporting_manager_id) if emp.reporting_manager_id else None,
        wfh_setup_available=emp.wfh_setup_available,
        company_type=emp.company_type,
        current_projects=current_projects,
        performance_history=perf_history,
        awis_insights=awis_insights,
        mental_fatigue_score=fatigue,
    )


# ------------------------------------------------------------------------------
# 1. Quick Stats
# ------------------------------------------------------------------------------

@router.get(
    "/stats",
    response_model=EmployeeStatsResponse,
    summary="Get employee overview stats for the active workspace",
)
async def get_employee_stats(
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.EMPLOYEES_VIEW)),
) -> EmployeeStatsResponse:
    """Aggregates headcount, active, available, and at-risk counts in the workspace."""
    ws_id = context.workspace.id
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)

    base_filter = [Employee.workspace_id == ws_id, Employee.employment_status != "Archived"]

    # Total employees
    total_q = select(func.count(Employee.id)).where(*base_filter)
    total = (await db.execute(total_q)).scalar() or 0

    # Active employees (not On Leave and not Archived)
    active_q = select(func.count(Employee.id)).where(*base_filter, Employee.employment_status != "On Leave")
    active = (await db.execute(active_q)).scalar() or 0

    # Available employees
    avail_q = select(func.count(Employee.id)).where(*base_filter, Employee.employment_status == "Available")
    available = (await db.execute(avail_q)).scalar() or 0

    # At-risk employees (only disclosed if user has EMPLOYEES_WELLBEING_VIEW)
    at_risk = 0
    if can_view_wellbeing:
        risk_q = select(func.count(Employee.id)).where(*base_filter, Employee.wellbeing_risk == "High")
        at_risk = (await db.execute(risk_q)).scalar() or 0

    return EmployeeStatsResponse(
        total=total,
        active=active,
        available=available,
        at_risk=at_risk,
    )


# ------------------------------------------------------------------------------
# 2. Directory Listing (Search, Filter, Sort, Paginate)
# ------------------------------------------------------------------------------

@router.get(
    "",
    response_model=EmployeeListResponse,
    summary="List workspace employees with search, filtering, and pagination",
)
async def list_employees(
    search: Optional[str] = Query(None, description="Search by name, employee ID, role, or skill"),
    department: Optional[str] = Query(None, description="Filter by department"),
    role: Optional[str] = Query(None, description="Filter by designation/role"),
    status: Optional[str] = Query(None, description="Filter by status (Available, Allocated, etc.)"),
    risk: Optional[str] = Query(None, description="Filter by wellbeing risk level"),
    sort_by: str = Query("created_at", description="Field to sort by: name, performance, availability, experience, created_at"),
    sort_order: str = Query("desc", description="Sort direction: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    include_archived: bool = Query(False, description="Whether to include archived employees"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.EMPLOYEES_VIEW)),
) -> EmployeeListResponse:
    """Lists employees within the authenticated user's workspace."""
    ws_id = context.workspace.id
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)

    filters = [Employee.workspace_id == ws_id]
    if not include_archived:
        filters.append(Employee.employment_status != "Archived")

    # Department filter
    if department and department.strip() and department.strip().lower() != "all":
        filters.append(func.lower(Employee.department) == department.strip().lower())

    # Role filter
    if role and role.strip() and role.strip().lower() != "all":
        filters.append(func.lower(Employee.designation).contains(role.strip().lower()))

    # Status filter
    if status and status.strip() and status.strip().lower() != "all":
        filters.append(func.lower(Employee.employment_status) == status.strip().lower())

    # Wellbeing risk filter (only applied if user has permission)
    if risk and risk.strip() and risk.strip().lower() != "all" and can_view_wellbeing:
        filters.append(func.lower(Employee.wellbeing_risk) == risk.strip().lower())

    # Free-text Search
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        # Search in employee fields or matching skills
        filters.append(
            or_(
                func.lower(Employee.full_name).ilike(term),
                func.lower(Employee.employee_code).ilike(term),
                func.lower(Employee.designation).ilike(term),
                Employee.skills.any(
                    EmployeeSkill.skill.has(func.lower(Skill.name).ilike(term))
                ),
            )
        )

    # Count total matching
    count_query = select(func.count(Employee.id)).where(and_(*filters))
    total_records = (await db.execute(count_query)).scalar() or 0

    # Determine sorting
    sort_column = Employee.created_at
    if sort_by == "name":
        sort_column = Employee.full_name
    elif sort_by == "performance":
        sort_column = Employee.performance_score
    elif sort_by == "availability":
        sort_column = Employee.availability_score
    elif sort_by == "experience":
        sort_column = Employee.experience_years

    order_clause = asc(sort_column) if sort_order.lower() == "asc" else desc(sort_column)

    # Query with eager loaded skills
    stmt = (
        select(Employee)
        .where(and_(*filters))
        .order_by(order_clause)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .options(
            selectinload(Employee.skills).joinedload(EmployeeSkill.skill),
        )
    )

    result = await db.execute(stmt)
    employees = result.scalars().all()

    items = [_map_employee_list_item(e, can_view_wellbeing) for e in employees]
    total_pages = math.ceil(total_records / page_size) if total_records > 0 else 1

    return EmployeeListResponse(
        items=items,
        total=total_records,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ------------------------------------------------------------------------------
# 3. Retrieve Single Employee Detail
# ------------------------------------------------------------------------------

@router.get(
    "/{employee_id}",
    response_model=EmployeeDetailResponse,
    summary="Get single employee profile with complete qualifications and allocations",
)
async def get_employee_by_id(
    employee_id: str = Path(..., description="Employee UUID or employee code"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.EMPLOYEES_VIEW)),
) -> EmployeeDetailResponse:
    """Retrieves full employee details ensuring tenant isolation and sensitive data masking."""
    ws_id = context.workspace.id
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)

    # Resolve either by UUID or employee_code
    id_condition = None
    try:
        val_uuid = uuid.UUID(employee_id)
        id_condition = or_(Employee.id == val_uuid, Employee.employee_code == employee_id)
    except ValueError:
        id_condition = Employee.employee_code == employee_id

    stmt = (
        select(Employee)
        .where(Employee.workspace_id == ws_id, id_condition)
        .options(
            selectinload(Employee.skills).joinedload(EmployeeSkill.skill),
            selectinload(Employee.project_allocations).joinedload(ProjectAllocation.project),
            selectinload(Employee.performance_history),
        )
    )

    result = await db.execute(stmt)
    employee = result.scalar_one_or_none()

    if not employee:
        raise ResourceNotFoundError(f"Employee '{employee_id}' was not found in this workspace.")

    return _map_employee_detail(employee, can_view_wellbeing)


# ------------------------------------------------------------------------------
# 4. Create Employee
# ------------------------------------------------------------------------------

@router.post(
    "",
    response_model=EmployeeDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new employee profile in the active workspace",
)
async def create_employee(
    payload: EmployeeCreateRequest,
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.EMPLOYEES_MANAGE)),
) -> EmployeeDetailResponse:
    """Creates a persistent employee record with validated qualifications and uniqueness constraints."""
    ws_id = context.workspace.id

    # 1. Check duplicate employee_code in workspace
    code_exists = await db.execute(
        select(Employee.id).where(
            Employee.workspace_id == ws_id,
            Employee.employee_code == payload.employee_code.strip(),
        )
    )
    if code_exists.scalar_one_or_none():
        raise ConflictError(f"Employee code '{payload.employee_code}' already exists in this workspace.")

    # 2. Check duplicate email in workspace
    email_clean = payload.email.strip().lower()
    email_exists = await db.execute(
        select(Employee.id).where(
            Employee.workspace_id == ws_id,
            func.lower(Employee.email) == email_clean,
        )
    )
    if email_exists.scalar_one_or_none():
        raise ConflictError(f"Email '{payload.email}' is already registered to an employee in this workspace.")

    # 3. Create Employee entity
    employee = Employee(
        workspace_id=ws_id,
        employee_code=payload.employee_code.strip(),
        full_name=payload.full_name.strip(),
        email=email_clean,
        avatar_url=payload.avatar_url,
        department=payload.department.strip(),
        designation=payload.designation.strip(),
        experience_years=payload.experience_years,
        employment_status=payload.employment_status,
        employment_type=payload.employment_type,
        work_location=payload.work_location,
        wfh_setup_available=payload.wfh_setup_available,
        company_type=payload.company_type,
        performance_score=payload.performance_score or 80.0,
        performance_trend=payload.performance_trend or "stable",
        availability_score=payload.availability_score or 100.0,
        current_workload_percent=payload.current_workload_percent or 0.0,
        growth_potential=payload.growth_potential or 70.0,
        collaboration_score=payload.collaboration_score or 80.0,
        wellbeing_risk=payload.wellbeing_risk or "Low",
    )
    db.add(employee)
    await db.flush()

    # 4. Process Skills
    if payload.skills:
        for sk_input in payload.skills:
            sk_name = sk_input.name.strip()
            # Find or create skill in workspace
            sk_stmt = select(Skill).where(
                Skill.workspace_id == ws_id,
                func.lower(Skill.name) == sk_name.lower(),
            )
            sk_res = await db.execute(sk_stmt)
            skill_obj = sk_res.scalar_one_or_none()
            if not skill_obj:
                skill_obj = Skill(workspace_id=ws_id, name=sk_name, category=payload.department)
                db.add(skill_obj)
                await db.flush()

            emp_skill = EmployeeSkill(
                employee_id=employee.id,
                skill_id=skill_obj.id,
                proficiency=sk_input.proficiency,
                is_primary=sk_input.is_primary,
            )
            db.add(emp_skill)

    # 5. Seed initial monthly performance records
    for month_label, score_offset in [("Jan", -4), ("Feb", -2), ("Mar", -3), ("Apr", -1), ("May", -1), ("Jun", 0)]:
        ph = EmployeePerformanceHistory(
            employee_id=employee.id,
            period_label=month_label,
            performance_score=max(50.0, min(100.0, employee.performance_score + score_offset)),
            task_completion_rate=88.0,
            deadline_adherence=90.0,
            quality_score=employee.performance_score,
        )
        db.add(ph)

    await db.commit()

    # Reload with relations
    reload_stmt = (
        select(Employee)
        .where(Employee.id == employee.id)
        .options(
            selectinload(Employee.skills).joinedload(EmployeeSkill.skill),
            selectinload(Employee.project_allocations).joinedload(ProjectAllocation.project),
            selectinload(Employee.performance_history),
        )
    )
    reloaded = (await db.execute(reload_stmt)).scalar_one()
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)
    return _map_employee_detail(reloaded, can_view_wellbeing)


# ------------------------------------------------------------------------------
# 5. Update Employee
# ------------------------------------------------------------------------------

@router.put(
    "/{employee_id}",
    response_model=EmployeeDetailResponse,
    summary="Update permitted fields of an existing employee record",
)
async def update_employee(
    payload: EmployeeUpdateRequest,
    employee_id: str = Path(..., description="Employee UUID or code"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.EMPLOYEES_MANAGE)),
) -> EmployeeDetailResponse:
    """Updates permitted employee details and skill associations."""
    ws_id = context.workspace.id

    id_condition = None
    try:
        val_uuid = uuid.UUID(employee_id)
        id_condition = or_(Employee.id == val_uuid, Employee.employee_code == employee_id)
    except ValueError:
        id_condition = Employee.employee_code == employee_id

    stmt = (
        select(Employee)
        .where(Employee.workspace_id == ws_id, id_condition)
        .options(
            selectinload(Employee.skills).joinedload(EmployeeSkill.skill),
            selectinload(Employee.project_allocations).joinedload(ProjectAllocation.project),
            selectinload(Employee.performance_history),
        )
    )
    result = await db.execute(stmt)
    employee = result.scalar_one_or_none()

    if not employee:
        raise ResourceNotFoundError(f"Employee '{employee_id}' was not found in this workspace.")

    # Apply updates
    if payload.full_name is not None:
        employee.full_name = payload.full_name.strip()
    if payload.department is not None:
        employee.department = payload.department.strip()
    if payload.designation is not None:
        employee.designation = payload.designation.strip()
    if payload.experience_years is not None:
        employee.experience_years = payload.experience_years
    if payload.employment_status is not None:
        employee.employment_status = payload.employment_status
    if payload.employment_type is not None:
        employee.employment_type = payload.employment_type
    if payload.work_location is not None:
        employee.work_location = payload.work_location
    if payload.wfh_setup_available is not None:
        employee.wfh_setup_available = payload.wfh_setup_available
    if payload.avatar_url is not None:
        employee.avatar_url = payload.avatar_url
    if payload.performance_score is not None:
        employee.performance_score = payload.performance_score
    if payload.performance_trend is not None:
        employee.performance_trend = payload.performance_trend
    if payload.availability_score is not None:
        employee.availability_score = payload.availability_score
    if payload.current_workload_percent is not None:
        employee.current_workload_percent = payload.current_workload_percent
    if payload.growth_potential is not None:
        employee.growth_potential = payload.growth_potential
    if payload.collaboration_score is not None:
        employee.collaboration_score = payload.collaboration_score
    if payload.wellbeing_risk is not None:
        employee.wellbeing_risk = payload.wellbeing_risk

    # Update skills if provided
    if payload.skills is not None:
        # Clear existing
        for es in list(employee.skills):
            await db.delete(es)
        await db.flush()

        for sk_input in payload.skills:
            sk_name = sk_input.name.strip()
            sk_stmt = select(Skill).where(
                Skill.workspace_id == ws_id,
                func.lower(Skill.name) == sk_name.lower(),
            )
            sk_res = await db.execute(sk_stmt)
            skill_obj = sk_res.scalar_one_or_none()
            if not skill_obj:
                skill_obj = Skill(workspace_id=ws_id, name=sk_name, category=employee.department)
                db.add(skill_obj)
                await db.flush()

            emp_skill = EmployeeSkill(
                employee_id=employee.id,
                skill_id=skill_obj.id,
                proficiency=sk_input.proficiency,
                is_primary=sk_input.is_primary,
            )
            db.add(emp_skill)

    await db.commit()

    # Re-fetch
    reloaded = (await db.execute(stmt)).scalar_one()
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)
    return _map_employee_detail(reloaded, can_view_wellbeing)


# ------------------------------------------------------------------------------
# 6. Archive / Deactivate Employee
# ------------------------------------------------------------------------------

@router.delete(
    "/{employee_id}",
    summary="Archive or deactivate an employee record",
)
async def archive_employee(
    employee_id: str = Path(..., description="Employee UUID or code"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.EMPLOYEES_MANAGE)),
) -> dict:
    """Soft archives an employee record to preserve historical allocations and performance audits."""
    ws_id = context.workspace.id

    id_condition = None
    try:
        val_uuid = uuid.UUID(employee_id)
        id_condition = or_(Employee.id == val_uuid, Employee.employee_code == employee_id)
    except ValueError:
        id_condition = Employee.employee_code == employee_id

    stmt = select(Employee).where(Employee.workspace_id == ws_id, id_condition)
    result = await db.execute(stmt)
    employee = result.scalar_one_or_none()

    if not employee:
        raise ResourceNotFoundError(f"Employee '{employee_id}' was not found in this workspace.")

    employee.employment_status = "Archived"
    await db.commit()

    return {
        "message": "Employee successfully archived",
        "id": str(employee.id),
        "status": "Archived",
    }
