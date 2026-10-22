"""
NEXAWIS Backend - Shared Project Allocation Service.
Provides a unified, authoritative transaction and concurrency-control protocol
for all allocation-writing code paths (Team Formation finalization, manual assignments,
and member releases). Enforces deterministic row locking, workspace isolation,
authoritative database capacity recalculation, and the 150% hard safety ceiling.
"""

import uuid
from datetime import datetime, timezone, date
from typing import List, Dict, Optional, Tuple, Set
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.core.exceptions import (
    ResourceNotFoundError,
    ConflictError,
    ValidationError,
)
from app.core.logging import logger
from app.models.project import Project, ProjectAllocation
from app.models.employee import Employee
from app.models.team_formation import TeamFormation
from app.services.awis.config import WORKLOAD_POLICY


class AllocationService:
    """
    Centralized allocation service ensuring that every concurrent writer follows
    the exact same locking hierarchy, workspace boundaries, and capacity limits.
    """

    @staticmethod
    async def lock_and_validate_project(
        db: AsyncSession,
        project_id: uuid.UUID,
        workspace_id: uuid.UUID,
        enforce_deadline: bool = False,
    ) -> Project:
        """
        Pessimistically locks a Project row with FOR UPDATE and revalidates its
        status and schedule. Prevents concurrent completion or archival from
        racing with active allocations.
        """
        proj_q = (
            select(Project)
            .where(
                Project.id == project_id,
                Project.workspace_id == workspace_id,
            )
            .with_for_update()
        )
        res = await db.execute(proj_q)
        project = res.scalar_one_or_none()
        if not project:
            raise ResourceNotFoundError(f"Project '{project_id}' was not found in this workspace.")

        now_date = datetime.now(timezone.utc).date()
        p_status = (project.status or "").strip().lower()
        if p_status in ("completed", "archived"):
            raise ConflictError(
                f"Cannot allocate team members: Project '{project.name}' is already {p_status}."
            )

        if enforce_deadline and project.deadline and project.deadline < now_date:
            raise ConflictError(
                f"Cannot allocate team members: Project '{project.name}' deadline ({project.deadline}) has already passed."
            )

        return project

    @staticmethod
    async def lock_and_validate_formation(
        db: AsyncSession,
        formation_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> TeamFormation:
        """
        Pessimistically locks a TeamFormation row with FOR UPDATE and revalidates status.
        Ensures duplicate or concurrent finalizations are rejected with 409 Conflict.
        """
        form_q = (
            select(TeamFormation)
            .options(
                selectinload(TeamFormation.project),
                selectinload(TeamFormation.members),
            )
            .where(
                TeamFormation.id == formation_id,
                TeamFormation.workspace_id == workspace_id,
            )
            .with_for_update()
        )
        res = await db.execute(form_q)
        formation = res.scalar_one_or_none()
        if not formation:
            raise ResourceNotFoundError(f"Team formation '{formation_id}' not found in active workspace.")

        if formation.status == "Finalized":
            raise ConflictError(
                f"Team formation '{formation.formation_code}' has already been finalized and committed."
            )

        if formation.status == "Archived":
            raise ValidationError("Cannot finalize an archived team formation recommendation.")

        return formation

    @staticmethod
    async def lock_employees_deterministic(
        db: AsyncSession,
        employee_ids: List[uuid.UUID],
        workspace_id: uuid.UUID,
    ) -> List[uuid.UUID]:
        """
        Acquires row-level pessimistic locks (FOR UPDATE) on all target employee rows
        in deterministic sorted UUID order.
        Eliminates deadlock potential between multi-employee transactions.
        """
        if not employee_ids:
            return []

        sorted_ids = sorted(list(set(employee_ids)))
        lock_q = (
            select(Employee.id)
            .where(
                Employee.id.in_(sorted_ids),
                Employee.workspace_id == workspace_id,
            )
            .order_by(Employee.id)
            .with_for_update()
        )
        res = await db.execute(lock_q)
        locked_ids = res.scalars().all()

        missing = set(sorted_ids) - set(locked_ids)
        if missing:
            first_missing = list(missing)[0]
            raise ResourceNotFoundError(f"Employee '{first_missing}' was not found in active workspace.")

        return list(locked_ids)

    @staticmethod
    async def get_authoritative_committed_workload(
        db: AsyncSession,
        employee_id: uuid.UUID,
        exclude_project_id: Optional[uuid.UUID] = None,
    ) -> float:
        """
        Directly queries active ProjectAllocation rows from the database under lock,
        bypassing in-memory ORM identity caches. Excludes the current project's allocation
        if modifying an existing assignment to prevent double-counting.
        """
        alloc_q = select(ProjectAllocation.allocation_percent).where(
            ProjectAllocation.employee_id == employee_id,
            func.lower(ProjectAllocation.status) == "active",
        )
        if exclude_project_id is not None:
            alloc_q = alloc_q.where(ProjectAllocation.project_id != exclude_project_id)

        res = await db.execute(alloc_q)
        active_allocs = res.scalars().all()
        return sum(float(pct or 0.0) for pct in active_allocs)

    @staticmethod
    def validate_employee_capacity(
        employee: Employee,
        current_committed: float,
        requested_allocation: float,
        is_pinned: bool = False,
    ) -> Tuple[float, float]:
        """
        Revalidates candidate employment status, existing capacity, and the hard safety limit.
        Returns (current_committed, projected_workload).
        """
        status_clean = (employee.employment_status or "").strip().lower()
        if status_clean in ("terminated", "inactive", "archived", "on leave"):
            raise ConflictError(
                f"Candidate '{employee.full_name}' ({employee.employee_code}) is no longer available or active in the organization (status: '{employee.employment_status}')."
            )

        projected_workload = current_committed + requested_allocation

        # Hard safety threshold (150%)
        if projected_workload > WORKLOAD_POLICY.hard_safety_limit:
            raise ConflictError(
                f"Concurrency conflict: Candidate '{employee.full_name}' was concurrently allocated to another project and has {current_committed:.1f}% committed workload. Adding {requested_allocation:.2f}% exceeds absolute safety threshold ({WORKLOAD_POLICY.hard_safety_limit:.0f}%)."
            )

        # Existing 100% full capacity limit per AWIS policy
        if current_committed >= WORKLOAD_POLICY.full_allocation_limit and not is_pinned:
            raise ConflictError(
                f"Candidate '{employee.full_name}' ({employee.employee_code}) is already 100% committed across active projects ({current_committed:.1f}%)."
            )

        return (current_committed, projected_workload)

    @classmethod
    async def assign_single_member_atomic(
        cls,
        db: AsyncSession,
        project_id: uuid.UUID,
        employee_id: uuid.UUID,
        workspace_id: uuid.UUID,
        role: str,
        allocation_percent: float,
        team_fit: Optional[float] = None,
    ) -> ProjectAllocation:
        """
        Atomically assigns a single employee to a project following the shared
        locking and capacity validation protocol.
        """
        try:
            # 1. Lock Project row in deterministic hierarchy (Project -> Employee)
            project = await cls.lock_and_validate_project(db, project_id, workspace_id)

            # 2. Lock Employee row
            await cls.lock_employees_deterministic(db, [employee_id], workspace_id)

            # Fetch fresh employee entity under lock
            emp_q = select(Employee).where(Employee.id == employee_id, Employee.workspace_id == workspace_id)
            employee = (await db.execute(emp_q)).scalar_one()

            # 3. Check for existing allocation to this project
            existing_alloc_q = select(ProjectAllocation).where(
                ProjectAllocation.project_id == project_id,
                ProjectAllocation.employee_id == employee_id,
            )
            existing_alloc = (await db.execute(existing_alloc_q)).scalar_one_or_none()
            if existing_alloc:
                raise ConflictError(f"{employee.full_name} is already assigned to this project.")

            # 4. Authoritatively calculate current committed workload across all other active projects
            current_committed = await cls.get_authoritative_committed_workload(
                db, employee_id, exclude_project_id=project_id
            )

            # 5. Enforce capacity semantics
            cls.validate_employee_capacity(
                employee=employee,
                current_committed=current_committed,
                requested_allocation=allocation_percent,
            )

            # 6. Create allocation record
            allocation = ProjectAllocation(
                project_id=project.id,
                employee_id=employee.id,
                role=role.strip() if role else (employee.designation or "Engineer"),
                allocation_percent=allocation_percent,
                team_fit=team_fit if team_fit is not None else 85.0,
                status="Active",
                start_date=project.start_date or datetime.now(timezone.utc).date(),
                end_date=project.deadline,
            )
            db.add(allocation)
            await db.commit()
            return allocation
        except Exception:
            await db.rollback()
            raise

    @classmethod
    async def remove_member_atomic(
        cls,
        db: AsyncSession,
        project_id: uuid.UUID,
        employee_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> None:
        """
        Atomically releases an employee allocation under the shared locking protocol.
        """
        try:
            # 1. Lock Project row
            await cls.lock_and_validate_project(db, project_id, workspace_id)

            # 2. Lock Employee row
            await cls.lock_employees_deterministic(db, [employee_id], workspace_id)

            # 3. Find allocation
            alloc_stmt = select(ProjectAllocation).where(
                ProjectAllocation.project_id == project_id,
                ProjectAllocation.employee_id == employee_id,
            )
            alloc = (await db.execute(alloc_stmt)).scalar_one_or_none()
            if not alloc:
                raise ResourceNotFoundError("Team member is not allocated to this project.")

            await db.delete(alloc)
            await db.commit()
        except Exception:
            await db.rollback()
            raise
