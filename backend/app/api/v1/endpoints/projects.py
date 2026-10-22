"""
NEXAWIS Backend - Project Management Endpoints.
Provides authenticated, workspace-isolated CRUD, search, filter, sorting,
pagination, and team allocation operations for projects.
"""

import math
import uuid
import urllib.parse
from datetime import datetime, date
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
    AppException,
)
from app.api.deps import (
    get_current_workspace_context,
    require_permissions,
    WorkspaceContext,
)
from app.services.allocation_service import AllocationService
from app.models.project import (
    Project,
    ProjectRequirement,
    ProjectMilestone,
    ProjectAllocation,
)
from app.models.employee import Employee
from app.models.skill import Skill, EmployeeSkill
from app.schemas.project import (
    ProjectResponse,
    ProjectListResponse,
    ProjectStatsResponse,
    ProjectCreateRequest,
    ProjectUpdateRequest,
    AddTeamMemberRequest,
    ProjectRequirementItem,
    ProjectTeamMemberItem,
    ProjectMilestoneItem,
    ProjectRiskItem,
    ProjectIntelligenceItem,
    ProjectSuccessPredictionItem,
    ProjectAwisFitItem,
    ProjectAwisFitExplanation,
    ProjectCapacityItem,
)

router = APIRouter()


def _parse_date(val: Optional[str]) -> Optional[date]:
    """Helper to safely parse YYYY-MM-DD date strings."""
    if not val:
        return None
    try:
        return datetime.strptime(val.strip(), "%Y-%m-%d").date()
    except ValueError:
        return None


def _map_project_to_response(project: Project, can_view_wellbeing: bool) -> ProjectResponse:
    """Transforms a Project ORM entity with relations to full API contract."""
    # 1. Requirements
    reqs = [
        ProjectRequirementItem(
            skill=pr.skill.name if pr.skill else "General",
            priority=pr.priority,
            level="Expert" if pr.min_proficiency >= 85 else "Advanced" if pr.min_proficiency >= 75 else "Intermediate",
        )
        for pr in (project.requirements or [])
    ]

    # 2. Current Team & Capacity
    team: List[ProjectTeamMemberItem] = []
    allocated_hours = 0.0
    overloaded_count = 0
    balanced_count = 0

    for alloc in (project.allocations or []):
        emp = alloc.employee
        if not emp:
            continue
        hours = round((alloc.allocation_percent / 100.0) * 40.0)
        allocated_hours += hours
        if alloc.allocation_percent > 100:
            overloaded_count += 1
        else:
            balanced_count += 1

        primary_skill = "Engineering"
        if emp.skills:
            primaries = [s for s in emp.skills if s.is_primary]
            chosen = primaries[0] if primaries else emp.skills[0]
            if chosen.skill:
                primary_skill = chosen.skill.name

        # Mask sensitive wellbeing data if requester lacks permission
        wellbeing = emp.wellbeing_risk if can_view_wellbeing else "Moderate"

        avatar = emp.avatar_url
        if not avatar or not avatar.strip():
            name_encoded = urllib.parse.quote(emp.full_name)
            avatar = f"https://ui-avatars.com/api/?name={name_encoded}&background=0284c7&color=fff"

        team.append(
            ProjectTeamMemberItem(
                id=str(emp.id),
                name=emp.full_name,
                avatar_url=avatar,
                role=alloc.role or emp.designation,
                primary_skill=primary_skill,
                allocation_percent=alloc.allocation_percent,
                performance_score=emp.performance_score,
                team_fit=alloc.team_fit if alloc.team_fit is not None else 85.0,
                wellbeing_risk=wellbeing,
            )
        )

    target_size = project.target_team_size or 4
    total_required = target_size * 40.0
    capacity = ProjectCapacityItem(
        total_required=total_required,
        allocated=allocated_hours,
        available=max(0.0, total_required - allocated_hours),
        overloaded_members=overloaded_count,
        balanced_members=balanced_count,
    )

    # 3. Milestones
    milestones = [
        ProjectMilestoneItem(
            id=str(m.id),
            name=m.name,
            status=m.status,
            date=m.due_date.isoformat() if m.due_date else "",
        )
        for m in sorted(project.milestones or [], key=lambda x: x.order_index)
    ]
    if not milestones:
        start_str = project.start_date.isoformat() if project.start_date else str(date.today())
        deadline_str = project.deadline.isoformat() if project.deadline else str(date.today())
        milestones = [
            ProjectMilestoneItem(id=f"m-{str(project.id)[:8]}-1", name="Discovery & Requirements Lock", status="Completed", date=start_str),
            ProjectMilestoneItem(id=f"m-{str(project.id)[:8]}-2", name="Architecture & System Design", status="Current", date=start_str),
            ProjectMilestoneItem(id=f"m-{str(project.id)[:8]}-3", name="Core Feature Development", status="Upcoming", date=deadline_str),
            ProjectMilestoneItem(id=f"m-{str(project.id)[:8]}-4", name="Final Validation & Deployment", status="Upcoming", date=deadline_str),
        ]

    # 4. Risks
    raw_risks = (project.risks_metadata or {}).get("risks", [])
    if raw_risks:
        risks = [
            ProjectRiskItem(
                category=r.get("category", "General"),
                level=r.get("level", project.overall_risk),
                description=r.get("description", ""),
                trend=r.get("trend", "stable"),
            )
            for r in raw_risks
        ]
    else:
        risks = [
            ProjectRiskItem(
                category="Scope & Alignment",
                level=project.overall_risk,
                description=f"Initial project baseline defined for {project.name}. Continuous AWIS workforce alignment active.",
                trend="stable",
            )
        ]

    # 5. Intelligence & Success Prediction
    is_high_risk = project.overall_risk == "High" or project.priority == "Critical"
    intelligence = ProjectIntelligenceItem(
        priority_score=project.priority_score,
        complexity_score=project.complexity_score,
        requirement_stability=project.requirement_stability,
        technical_risk=project.technical_risk,
        schedule_pressure=project.schedule_pressure,
        client_engagement=project.client_engagement,
        innovation_index=project.innovation_index,
        scope_change=project.scope_change,
        budget_variance=project.budget_variance,
        delivery_delay_risk=float(project.delivery_delay_days or 20),
        success_prediction=ProjectSuccessPredictionItem(
            score=70.0 if is_high_risk else 88.5,
            trend="stable",
            positive_factors=[
                "Structured timeline and cross-functional requirements established",
                "Leadership alignment and defined success benchmarks",
            ],
            negative_factors=[
                "High complexity requires close monitoring of workforce capacity"
            ] if is_high_risk else [],
        ),
    )

    # 6. AWIS Fit
    raw_fit = project.awis_fit_metadata or {}
    awis_fit = ProjectAwisFitItem(
        overall_score=project.team_fit_score or 85.0,
        skills_match=raw_fit.get("skillsMatch", 85.0),
        availability_match=raw_fit.get("availabilityMatch", 80.0),
        experience_match=raw_fit.get("experienceMatch", 88.0),
        workload_balance=raw_fit.get("workloadBalance", 82.0),
        wellbeing_impact=raw_fit.get("wellbeingImpact", 85.0),
        insights=raw_fit.get("insights", [
            "Project workforce baseline formed. Ready for continuous allocation."
        ]),
        explanation=ProjectAwisFitExplanation(
            positives=raw_fit.get("positives", [
                f"Well-structured workforce prerequisites defined for {project.department}."
            ]),
            concerns=raw_fit.get("concerns", [
                "Ensure team size matches delivery complexity."
            ]),
        ),
    )

    start_str = project.start_date.isoformat() if project.start_date else str(date.today())
    deadline_str = project.deadline.isoformat() if project.deadline else str(date.today())

    return ProjectResponse(
        id=str(project.id),
        project_id=project.project_code,
        name=project.name,
        description=project.description or "No project description provided.",
        department=project.department,
        client=project.client,
        project_manager=project.project_manager.full_name if project.project_manager else None,
        status=project.status,
        priority=project.priority,
        complexity=project.complexity,
        team_size=target_size,
        progress=project.progress_percent,
        overall_risk=project.overall_risk,
        team_fit=project.team_fit_score if project.team_fit_score is not None else 85.0,
        start_date=start_str,
        deadline=deadline_str,
        intelligence=intelligence,
        requirements=reqs,
        current_team=team,
        milestones=milestones,
        risks=risks,
        awis_fit=awis_fit,
        capacity=capacity,
    )


# ------------------------------------------------------------------------------
# 1. Quick Stats
# ------------------------------------------------------------------------------

@router.get(
    "/stats",
    response_model=ProjectStatsResponse,
    summary="Get aggregated project execution stats for the active workspace",
)
async def get_project_stats(
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.PROJECTS_VIEW)),
) -> ProjectStatsResponse:
    """Returns workspace project indicators (total, active, on track, at risk)."""
    ws_id = context.workspace.id
    base_filter = [Project.workspace_id == ws_id, Project.status != "Archived"]

    # Total
    total_q = select(func.count(Project.id)).where(*base_filter)
    total = (await db.execute(total_q)).scalar() or 0

    # Active
    active_q = select(func.count(Project.id)).where(*base_filter, Project.status == "Active")
    active = (await db.execute(active_q)).scalar() or 0

    # On Track
    ontrack_q = select(func.count(Project.id)).where(*base_filter, Project.status == "On Track")
    on_track = (await db.execute(ontrack_q)).scalar() or 0

    # At Risk
    risk_q = select(func.count(Project.id)).where(
        *base_filter,
        or_(Project.status == "At Risk", Project.overall_risk == "High"),
    )
    at_risk = (await db.execute(risk_q)).scalar() or 0

    return ProjectStatsResponse(
        total=total,
        active=active,
        on_track=on_track,
        at_risk=at_risk,
    )


# ------------------------------------------------------------------------------
# 2. Directory Listing (Search, Filter, Sort, Paginate)
# ------------------------------------------------------------------------------

@router.get(
    "",
    response_model=ProjectListResponse,
    summary="List workspace projects with search, filtering, and pagination",
)
async def list_projects(
    search: Optional[str] = Query(None, description="Search by name, project ID, client, or skill"),
    department: Optional[str] = Query(None, description="Filter by department"),
    status: Optional[str] = Query(None, description="Filter by status (Active, Planning, etc.)"),
    priority: Optional[str] = Query(None, description="Filter by priority (Critical, High, etc.)"),
    risk: Optional[str] = Query(None, description="Filter by risk level"),
    sort_by: str = Query("created_at", description="Field to sort by: name, priority, progress, deadline, teamfit, created_at"),
    sort_order: str = Query("desc", description="Sort direction: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    include_archived: bool = Query(False, description="Whether to include archived projects"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.PROJECTS_VIEW)),
) -> ProjectListResponse:
    """Lists projects within the authenticated user's workspace."""
    ws_id = context.workspace.id
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)

    filters = [Project.workspace_id == ws_id]
    if not include_archived:
        filters.append(Project.status != "Archived")

    if department and department.strip() and department.strip().lower() != "all departments":
        filters.append(func.lower(Project.department) == department.strip().lower())

    if status and status.strip() and status.strip().lower() != "all":
        # Handle comma-separated statuses if provided
        statuses = [s.strip().lower() for s in status.split(",") if s.strip()]
        if len(statuses) == 1:
            filters.append(func.lower(Project.status) == statuses[0])
        elif len(statuses) > 1:
            filters.append(func.lower(Project.status).in_(statuses))

    if priority and priority.strip() and priority.strip().lower() != "all":
        priorities = [p.strip().lower() for p in priority.split(",") if p.strip()]
        if len(priorities) == 1:
            filters.append(func.lower(Project.priority) == priorities[0])
        elif len(priorities) > 1:
            filters.append(func.lower(Project.priority).in_(priorities))

    if risk and risk.strip() and risk.strip().lower() != "all":
        risks = [r.strip().lower() for r in risk.split(",") if r.strip()]
        if len(risks) == 1:
            filters.append(func.lower(Project.overall_risk) == risks[0])
        elif len(risks) > 1:
            filters.append(func.lower(Project.overall_risk).in_(risks))

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        filters.append(
            or_(
                func.lower(Project.name).ilike(term),
                func.lower(Project.project_code).ilike(term),
                func.lower(Project.department).ilike(term),
                func.lower(Project.client).ilike(term),
                func.lower(Project.description).ilike(term),
                Project.requirements.any(
                    ProjectRequirement.skill.has(func.lower(Skill.name).ilike(term))
                ),
            )
        )

    # Count total
    count_query = select(func.count(Project.id)).where(and_(*filters))
    total_records = (await db.execute(count_query)).scalar() or 0

    # Determine sorting
    sort_column = Project.created_at
    if sort_by == "name":
        sort_column = Project.name
    elif sort_by == "progress":
        sort_column = Project.progress_percent
    elif sort_by == "deadline":
        sort_column = Project.deadline
    elif sort_by == "teamfit":
        sort_column = Project.team_fit_score
    elif sort_by == "priority":
        sort_column = Project.priority_score

    order_clause = asc(sort_column) if sort_order.lower() == "asc" else desc(sort_column)

    stmt = (
        select(Project)
        .where(and_(*filters))
        .order_by(order_clause)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .options(
            selectinload(Project.requirements).joinedload(ProjectRequirement.skill),
            selectinload(Project.milestones),
            selectinload(Project.allocations)
            .joinedload(ProjectAllocation.employee)
            .selectinload(Employee.skills)
            .joinedload(EmployeeSkill.skill),
            joinedload(Project.project_manager),
        )
    )

    result = await db.execute(stmt)
    projects = result.scalars().all()

    items = [_map_project_to_response(p, can_view_wellbeing) for p in projects]
    total_pages = math.ceil(total_records / page_size) if total_records > 0 else 1

    return ProjectListResponse(
        items=items,
        total=total_records,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ------------------------------------------------------------------------------
# 3. Retrieve Single Project Detail
# ------------------------------------------------------------------------------

@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get single project profile by UUID or project code",
)
async def get_project_by_id(
    project_id: str = Path(..., description="Project UUID or project code"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.PROJECTS_VIEW)),
) -> ProjectResponse:
    """Retrieves full project details with requirements, milestones, and allocated team members."""
    ws_id = context.workspace.id
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)

    id_condition = None
    try:
        val_uuid = uuid.UUID(project_id)
        id_condition = or_(Project.id == val_uuid, Project.project_code == project_id)
    except ValueError:
        id_condition = Project.project_code == project_id

    stmt = (
        select(Project)
        .where(Project.workspace_id == ws_id, id_condition)
        .options(
            selectinload(Project.requirements).joinedload(ProjectRequirement.skill),
            selectinload(Project.milestones),
            selectinload(Project.allocations)
            .joinedload(ProjectAllocation.employee)
            .selectinload(Employee.skills)
            .joinedload(EmployeeSkill.skill),
            joinedload(Project.project_manager),
        )
    )

    result = await db.execute(stmt)
    project = result.scalar_one_or_none()

    if not project:
        raise ResourceNotFoundError(f"Project '{project_id}' was not found in this workspace.")

    return _map_project_to_response(project, can_view_wellbeing)


# ------------------------------------------------------------------------------
# 4. Create Project
# ------------------------------------------------------------------------------

@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project profile in the active workspace",
)
async def create_project(
    payload: ProjectCreateRequest,
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.PROJECTS_MANAGE)),
) -> ProjectResponse:
    """Creates a persistent project record with requirements and milestones."""
    ws_id = context.workspace.id

    # 1. Validate dates
    start_d = _parse_date(payload.start_date)
    deadline_d = _parse_date(payload.deadline)
    if not start_d or not deadline_d:
        raise AppException(
            message="Invalid date format. Expected YYYY-MM-DD.",
            code="INVALID_DATE_FORMAT",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    if deadline_d < start_d:
        raise AppException(
            message="Deadline cannot be before start date.",
            code="INVALID_DATE_RANGE",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    # 2. Derive unique project code
    code = payload.project_id.strip() if payload.project_id else f"PRJ-{date.today().year}-{int(datetime.now().timestamp()) % 1000:03d}"
    code_exists = await db.execute(
        select(Project.id).where(
            Project.workspace_id == ws_id,
            Project.project_code == code,
        )
    )
    if code_exists.scalar_one_or_none():
        raise ConflictError(f"Project code '{code}' already exists in this workspace.")

    # 3. Overall risk mapping
    overall_risk: str = "High" if (payload.priority == "Critical" or payload.complexity == "High") else (
        "Medium" if (payload.priority == "High" or payload.complexity == "Medium") else "Low"
    )

    priority_score = 95.0 if payload.priority == "Critical" else (
        80.0 if payload.priority == "High" else (50.0 if payload.priority == "Medium" else 30.0)
    )
    complexity_score = 88.0 if payload.complexity == "High" else (65.0 if payload.complexity == "Medium" else 40.0)

    # 4. Create Project entity
    project = Project(
        workspace_id=ws_id,
        project_code=code,
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else "No project description provided.",
        department=payload.department.strip(),
        client=payload.client.strip() if payload.client else None,
        status=payload.status,
        priority=payload.priority,
        complexity=payload.complexity,
        target_team_size=payload.team_size,
        progress_percent=100.0 if payload.status == "Completed" else (0.0 if payload.status == "Planning" else 15.0),
        overall_risk=overall_risk,
        team_fit_score=85.0,
        start_date=start_d,
        deadline=deadline_d,
        priority_score=priority_score,
        complexity_score=complexity_score,
        requirement_stability=80.0,
        technical_risk=75.0 if payload.complexity == "High" else 40.0,
        schedule_pressure=85.0 if payload.priority == "Critical" else 50.0,
        client_engagement=80.0,
        innovation_index=70.0,
        scope_change=20.0,
        budget_variance=5.0,
        delivery_delay_days=15 if overall_risk == "High" else 0,
    )
    db.add(project)
    await db.flush()

    # 5. Requirements
    if payload.requirements:
        for req_in in payload.requirements:
            sk_name = req_in.skill.strip()
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

            min_prof = 85 if req_in.level == "Expert" else (75 if req_in.level == "Advanced" else 60)
            proj_req = ProjectRequirement(
                project_id=project.id,
                skill_id=skill_obj.id,
                priority=req_in.priority,
                min_proficiency=min_prof,
                is_mandatory=True,
            )
            db.add(proj_req)

    # 6. Default Milestones
    m1 = ProjectMilestone(project_id=project.id, name="Discovery & Requirements Lock", status="Completed", due_date=start_d, order_index=1)
    m2 = ProjectMilestone(project_id=project.id, name="Architecture & System Design", status="Current", due_date=start_d, order_index=2)
    m3 = ProjectMilestone(project_id=project.id, name="Core Feature Development", status="Upcoming", due_date=deadline_d, order_index=3)
    m4 = ProjectMilestone(project_id=project.id, name="Final Validation & Deployment", status="Upcoming", due_date=deadline_d, order_index=4)
    db.add_all([m1, m2, m3, m4])

    await db.commit()

    # Reload with relations
    reload_stmt = (
        select(Project)
        .where(Project.id == project.id)
        .options(
            selectinload(Project.requirements).joinedload(ProjectRequirement.skill),
            selectinload(Project.milestones),
            selectinload(Project.allocations)
            .joinedload(ProjectAllocation.employee)
            .selectinload(Employee.skills)
            .joinedload(EmployeeSkill.skill),
            joinedload(Project.project_manager),
        )
    )
    reloaded = (await db.execute(reload_stmt)).scalar_one()
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)
    return _map_project_to_response(reloaded, can_view_wellbeing)


# ------------------------------------------------------------------------------
# 5. Update Project
# ------------------------------------------------------------------------------

@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update permitted attributes of an existing project",
)
async def update_project(
    payload: ProjectUpdateRequest,
    project_id: str = Path(..., description="Project UUID or code"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.PROJECTS_MANAGE)),
) -> ProjectResponse:
    """Updates permitted project fields and requirement skills."""
    ws_id = context.workspace.id

    id_condition = None
    try:
        val_uuid = uuid.UUID(project_id)
        id_condition = or_(Project.id == val_uuid, Project.project_code == project_id)
    except ValueError:
        id_condition = Project.project_code == project_id

    stmt = (
        select(Project)
        .where(Project.workspace_id == ws_id, id_condition)
        .options(
            selectinload(Project.requirements).joinedload(ProjectRequirement.skill),
            selectinload(Project.milestones),
            selectinload(Project.allocations)
            .joinedload(ProjectAllocation.employee)
            .selectinload(Employee.skills)
            .joinedload(EmployeeSkill.skill),
            joinedload(Project.project_manager),
        )
    )
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()

    if not project:
        raise ResourceNotFoundError(f"Project '{project_id}' was not found in this workspace.")

    # Validate dates if updated
    new_start = _parse_date(payload.start_date) if payload.start_date is not None else project.start_date
    new_deadline = _parse_date(payload.deadline) if payload.deadline is not None else project.deadline
    if new_start and new_deadline and new_deadline < new_start:
        raise AppException(
            message="Deadline cannot be before start date.",
            code="INVALID_DATE_RANGE",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    if payload.name is not None:
        project.name = payload.name.strip()
    if payload.description is not None:
        project.description = payload.description.strip()
    if payload.department is not None:
        project.department = payload.department.strip()
    if payload.client is not None:
        project.client = payload.client.strip() if payload.client else None
    if payload.status is not None:
        project.status = payload.status
        if payload.status == "Completed":
            project.progress_percent = 100.0
    if payload.priority is not None:
        project.priority = payload.priority
        project.priority_score = 95.0 if payload.priority == "Critical" else (
            80.0 if payload.priority == "High" else (50.0 if payload.priority == "Medium" else 30.0)
        )
    if payload.complexity is not None:
        project.complexity = payload.complexity
        project.complexity_score = 88.0 if payload.complexity == "High" else (65.0 if payload.complexity == "Medium" else 40.0)
    if payload.team_size is not None:
        project.target_team_size = payload.team_size
    if payload.progress is not None:
        project.progress_percent = payload.progress
    if payload.start_date is not None:
        project.start_date = new_start
    if payload.deadline is not None:
        project.deadline = new_deadline

    # Update requirements if provided
    if payload.requirements is not None:
        for pr in list(project.requirements):
            await db.delete(pr)
        await db.flush()

        for req_in in payload.requirements:
            sk_name = req_in.skill.strip()
            sk_stmt = select(Skill).where(
                Skill.workspace_id == ws_id,
                func.lower(Skill.name) == sk_name.lower(),
            )
            sk_res = await db.execute(sk_stmt)
            skill_obj = sk_res.scalar_one_or_none()
            if not skill_obj:
                skill_obj = Skill(workspace_id=ws_id, name=sk_name, category=project.department)
                db.add(skill_obj)
                await db.flush()

            min_prof = 85 if req_in.level == "Expert" else (75 if req_in.level == "Advanced" else 60)
            proj_req = ProjectRequirement(
                project_id=project.id,
                skill_id=skill_obj.id,
                priority=req_in.priority,
                min_proficiency=min_prof,
                is_mandatory=True,
            )
            db.add(proj_req)

    await db.commit()

    reloaded = (await db.execute(stmt)).scalar_one()
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)
    return _map_project_to_response(reloaded, can_view_wellbeing)


# ------------------------------------------------------------------------------
# 6. Archive Project
# ------------------------------------------------------------------------------

@router.delete(
    "/{project_id}",
    summary="Archive or soft-deactivate a project record",
)
async def archive_project(
    project_id: str = Path(..., description="Project UUID or code"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.PROJECTS_MANAGE)),
) -> dict:
    """Soft archives a project record to preserve allocations and audit history."""
    ws_id = context.workspace.id

    id_condition = None
    try:
        val_uuid = uuid.UUID(project_id)
        id_condition = or_(Project.id == val_uuid, Project.project_code == project_id)
    except ValueError:
        id_condition = Project.project_code == project_id

    stmt = select(Project).where(Project.workspace_id == ws_id, id_condition)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()

    if not project:
        raise ResourceNotFoundError(f"Project '{project_id}' was not found in this workspace.")

    project.status = "Archived"
    await db.commit()

    return {
        "message": "Project successfully archived",
        "id": str(project.id),
        "status": "Archived",
    }


# ------------------------------------------------------------------------------
# 7. Team Allocation Endpoints
# ------------------------------------------------------------------------------

@router.post(
    "/{project_id}/team",
    response_model=ProjectResponse,
    summary="Allocate an employee to a project team",
)
async def add_team_member(
    payload: AddTeamMemberRequest,
    project_id: str = Path(..., description="Project UUID or code"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.PROJECTS_MANAGE)),
) -> ProjectResponse:
    """Allocates an employee from the authorized workspace to the project."""
    ws_id = context.workspace.id

    # 1. Resolve project
    id_condition = None
    try:
        val_uuid = uuid.UUID(project_id)
        id_condition = or_(Project.id == val_uuid, Project.project_code == project_id)
    except ValueError:
        id_condition = Project.project_code == project_id

    proj_stmt = (
        select(Project)
        .where(Project.workspace_id == ws_id, id_condition)
        .options(
            selectinload(Project.requirements).joinedload(ProjectRequirement.skill),
            selectinload(Project.milestones),
            selectinload(Project.allocations)
            .joinedload(ProjectAllocation.employee)
            .selectinload(Employee.skills)
            .joinedload(EmployeeSkill.skill),
            joinedload(Project.project_manager),
        )
    )
    proj_res = await db.execute(proj_stmt)
    project = proj_res.scalar_one_or_none()
    if not project:
        raise ResourceNotFoundError(f"Project '{project_id}' was not found in this workspace.")

    # 2. Resolve employee within same workspace
    emp_condition = None
    try:
        emp_uuid = uuid.UUID(payload.employee_id)
        emp_condition = or_(Employee.id == emp_uuid, Employee.employee_code == payload.employee_id)
    except ValueError:
        emp_condition = Employee.employee_code == payload.employee_id

    emp_stmt = select(Employee).where(Employee.workspace_id == ws_id, emp_condition)
    emp_res = await db.execute(emp_stmt)
    employee = emp_res.scalar_one_or_none()
    if not employee:
        raise ResourceNotFoundError(f"Employee '{payload.employee_id}' was not found in this workspace.")

    # 3. Delegate to unified allocation service to enforce deterministic locking and capacity safeguards
    await AllocationService.assign_single_member_atomic(
        db=db,
        project_id=project.id,
        employee_id=employee.id,
        workspace_id=ws_id,
        role=payload.role.strip() if payload.role else (employee.designation or "Engineer"),
        allocation_percent=payload.allocation_percent,
        team_fit=payload.team_fit,
    )
    db.expire_all()

    reloaded = (await db.execute(proj_stmt)).scalar_one()
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)
    return _map_project_to_response(reloaded, can_view_wellbeing)


@router.delete(
    "/{project_id}/team/{employee_id}",
    response_model=ProjectResponse,
    summary="Remove an employee allocation from a project",
)
async def remove_team_member(
    project_id: str = Path(..., description="Project UUID or code"),
    employee_id: str = Path(..., description="Employee UUID or code"),
    context: WorkspaceContext = Depends(get_current_workspace_context),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_permissions(Permission.PROJECTS_MANAGE)),
) -> ProjectResponse:
    """Releases an employee from a project team assignment."""
    ws_id = context.workspace.id

    id_condition = None
    try:
        val_uuid = uuid.UUID(project_id)
        id_condition = or_(Project.id == val_uuid, Project.project_code == project_id)
    except ValueError:
        id_condition = Project.project_code == project_id

    proj_stmt = (
        select(Project)
        .where(Project.workspace_id == ws_id, id_condition)
        .options(
            selectinload(Project.requirements).joinedload(ProjectRequirement.skill),
            selectinload(Project.milestones),
            selectinload(Project.allocations)
            .joinedload(ProjectAllocation.employee)
            .selectinload(Employee.skills)
            .joinedload(EmployeeSkill.skill),
            joinedload(Project.project_manager),
        )
    )
    proj_res = await db.execute(proj_stmt)
    project = proj_res.scalar_one_or_none()
    if not project:
        raise ResourceNotFoundError(f"Project '{project_id}' was not found in this workspace.")

    emp_condition = None
    try:
        emp_uuid = uuid.UUID(employee_id)
        emp_condition = or_(Employee.id == emp_uuid, Employee.employee_code == employee_id)
    except ValueError:
        emp_condition = Employee.employee_code == employee_id

    emp_stmt = select(Employee).where(Employee.workspace_id == ws_id, emp_condition)
    employee = (await db.execute(emp_stmt)).scalar_one_or_none()
    if not employee:
        raise ResourceNotFoundError(f"Employee '{employee_id}' was not found in this workspace.")

    # Delegate to unified allocation service to enforce deterministic locking and atomic removal
    await AllocationService.remove_member_atomic(
        db=db,
        project_id=project.id,
        employee_id=employee.id,
        workspace_id=ws_id,
    )
    db.expire_all()

    reloaded = (await db.execute(proj_stmt)).scalar_one()
    can_view_wellbeing = has_permission(context.system_role, Permission.EMPLOYEES_WELLBEING_VIEW)
    return _map_project_to_response(reloaded, can_view_wellbeing)
