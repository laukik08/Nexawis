"""
NEXAWIS Backend - Operational Alert Engine.
Detects project deadlines, workload policy violations (>140%, >150%),
team formation milestones, and fresh ML burnout risk indicators with deduplication and RBAC privacy.
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from app.models.project import Project, ProjectAllocation
from app.models.employee import Employee
from app.models.team_formation import TeamFormation
from app.models.ml_results import MlBurnoutPrediction
from app.models.workspace import WorkspaceMember
from app.models.user import User
from app.models.report import ScheduledReport
from app.models.notification import ScheduledReportExecution
from app.core.roles import SystemRole, Permission, has_permission
from app.services.notifications.service import NotificationService
from app.core.logging import logger


class OperationalAlertService:
    """Automated operational event detection and alert dispatching."""

    @classmethod
    async def _get_authorized_recipients(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        required_permission: Optional[Permission] = None,
    ) -> List[uuid.UUID]:
        """Finds active workspace members possessing the required permission."""
        q = (
            select(User.id, User.role)
            .join(WorkspaceMember, WorkspaceMember.user_id == User.id)
            .where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.is_active == True,  # noqa: E712
            )
        )
        rows = (await db.execute(q)).all()
        if not required_permission:
            return [r[0] for r in rows]

        return [
            r[0] for r in rows
            if has_permission(r[1], required_permission)
        ]

    # --------------------------------------------------------------------------
    # 1. Project Deadline Alerts
    # --------------------------------------------------------------------------
    @classmethod
    async def scan_project_deadlines(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
    ) -> int:
        """Scans for overdue projects and upcoming deadlines (within 3 and 7 days)."""
        now = datetime.now(timezone.utc)
        today_date = now.date()

        # Target active projects
        q = select(Project).where(
            Project.workspace_id == workspace_id,
            Project.status.notin_(["Completed", "Cancelled", "Archived"]),
            Project.deadline.isnot(None),
        )
        projects = (await db.execute(q)).scalars().all()

        recipients = await cls._get_authorized_recipients(
            db, workspace_id, Permission.PROJECTS_VIEW
        )
        if not recipients:
            return 0

        alert_count = 0
        for p in projects:
            p_deadline = p.deadline.date() if isinstance(p.deadline, datetime) else p.deadline
            days_left = (p_deadline - today_date).days

            alert_type = None
            severity = "info"
            title = ""
            msg = ""

            if days_left < 0:
                alert_type = "overdue"
                severity = "critical"
                title = f"Project Overdue: {p.title}"
                msg = f"Project '{p.title}' ({p.project_code}) was due on {p_deadline} ({abs(days_left)} days overdue)."
            elif days_left <= 3:
                alert_type = "imminent"
                severity = "warning"
                title = f"Deadline Imminent: {p.title}"
                msg = f"Project '{p.title}' ({p.project_code}) deadline is in {days_left} day(s) on {p_deadline}."
            elif days_left <= 7:
                alert_type = "approaching"
                severity = "info"
                title = f"Upcoming Deadline: {p.title}"
                msg = f"Project '{p.title}' ({p.project_code}) deadline is scheduled for {p_deadline}."

            if alert_type:
                # Deduplication key includes date bucket to prevent repeated alerts on the same day
                dedup = f"project_deadline:{p.id}:{p_deadline}:{alert_type}:{today_date}"
                for uid in recipients:
                    notif = await NotificationService.create_notification(
                        db=db,
                        workspace_id=workspace_id,
                        user_id=uid,
                        title=title,
                        message=msg,
                        category="project",
                        severity=severity,
                        link=f"/app/projects/{p.id}",
                        resource_type="project",
                        resource_id=str(p.id),
                        dedup_key=dedup,
                        dedup_window_hours=24,
                    )
                    if notif:
                        alert_count += 1

        return alert_count

    # --------------------------------------------------------------------------
    # 2. Workload & Capacity Alerts (>140%, >150%, 100%)
    # --------------------------------------------------------------------------
    @classmethod
    async def scan_workload_thresholds(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
    ) -> int:
        """
        Calculates employee total allocation and creates alerts for:
        - >150% allocation (Critical: prohibited by allocation policy)
        - >140% allocation (Warning: manager review required)
        - ==100% allocation (Info: fully committed capacity milestone)
        """
        now = datetime.now(timezone.utc)
        today_date = now.date()

        # Query all active employees in the workspace
        emp_q = select(Employee).where(
            Employee.workspace_id == workspace_id,
            Employee.employment_status == "Active",
        )
        employees = (await db.execute(emp_q)).scalars().all()

        # Recipient managers (Admin, HR, PM)
        recipients = await cls._get_authorized_recipients(
            db, workspace_id, Permission.EMPLOYEES_MANAGE
        )
        if not recipients:
            return 0

        alert_count = 0
        for emp in employees:
            # Query active allocations
            alloc_q = select(func.coalesce(func.sum(ProjectAllocation.allocation_percent), 0.0)).where(
                ProjectAllocation.employee_id == emp.id,
                or_(ProjectAllocation.end_date.is_(None), ProjectAllocation.end_date >= today_date),
            )
            total_alloc = float((await db.execute(alloc_q)).scalar() or 0.0)

            tier = None
            severity = "info"
            title = ""
            msg = ""

            if total_alloc > 150.0:
                tier = "prohibited_150"
                severity = "critical"
                title = f"Prohibited Over-Allocation: {emp.full_name}"
                msg = (
                    f"CRITICAL POLICY VIOLATION: {emp.full_name} ({emp.employee_code}) is allocated at "
                    f"{total_alloc:.0f}%, exceeding the hard 150% policy limit. Immediate rebalancing required."
                )
            elif total_alloc > 140.0:
                tier = "review_required_140"
                severity = "warning"
                title = f"Workload Review Required: {emp.full_name}"
                msg = (
                    f"WARNING: {emp.full_name} ({emp.employee_code}) is allocated at "
                    f"{total_alloc:.0f}%, exceeding the 140% workload warning threshold."
                )
            elif total_alloc >= 100.0 and total_alloc <= 105.0:
                tier = "fully_allocated_100"
                severity = "info"
                title = f"Full Capacity Milestone: {emp.full_name}"
                msg = f"{emp.full_name} ({emp.employee_code}) has reached 100% committed project allocation."

            if tier:
                dedup = f"workload_alert:{emp.id}:{tier}:{today_date}"
                for uid in recipients:
                    notif = await NotificationService.create_notification(
                        db=db,
                        workspace_id=workspace_id,
                        user_id=uid,
                        title=title,
                        message=msg,
                        category="workload",
                        severity=severity,
                        link=f"/app/employees/{emp.id}",
                        resource_type="employee",
                        resource_id=str(emp.id),
                        dedup_key=dedup,
                        dedup_window_hours=24,
                    )
                    if notif:
                        alert_count += 1

        return alert_count

    # --------------------------------------------------------------------------
    # 3. Fresh ML Burnout Risk Alerts (Strict Wellbeing RBAC)
    # --------------------------------------------------------------------------
    @classmethod
    async def scan_ml_burnout_risks(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
    ) -> int:
        """
        Scans for fresh ML burnout predictions (within 30 days) with High or Severe risk.
        CRITICAL PRIVACY: Only delivered to users with EMPLOYEES_WELLBEING_VIEW permission (Admin, HR).
        Burnout metrics are explicitly disclaimed as operational risk indicators, not clinical diagnoses.
        """
        now = datetime.now(timezone.utc)
        freshness_cutoff = now - timedelta(days=30)

        # Recipients MUST possess EMPLOYEES_WELLBEING_VIEW
        recipients = await cls._get_authorized_recipients(
            db, workspace_id, Permission.EMPLOYEES_WELLBEING_VIEW
        )
        if not recipients:
            return 0

        # Query latest fresh predictions with High/Severe tier
        q = (
            select(MlBurnoutPrediction, Employee)
            .join(Employee, MlBurnoutPrediction.employee_id == Employee.id)
            .where(
                Employee.workspace_id == workspace_id,
                MlBurnoutPrediction.predicted_at >= freshness_cutoff,
                MlBurnoutPrediction.risk_tier.in_(["High", "Severe"]),
            )
        )
        rows = (await db.execute(q)).all()

        alert_count = 0
        for pred, emp in rows:
            severity = "critical" if pred.risk_tier == "Severe" else "warning"
            score = float(pred.normalized_burnout_score or 0.0)
            disclaimer = (
                "Note: Burnout metrics represent an operational risk indicator for workload balancing, "
                "not a clinical diagnosis."
            )
            title = f"Operational Risk Alert: {emp.full_name} ({pred.risk_tier} Risk)"
            msg = (
                f"{emp.full_name} ({emp.employee_code}) has an operational burnout risk score of {score:.1f}/100 "
                f"({pred.risk_tier} tier). {disclaimer}"
            )
            dedup = f"ml_burnout:{emp.id}:{pred.id}"

            for uid in recipients:
                notif = await NotificationService.create_notification(
                    db=db,
                    workspace_id=workspace_id,
                    user_id=uid,
                    title=title,
                    message=msg,
                    category="ml_risk",
                    severity=severity,
                    link=f"/app/employees/{emp.id}",
                    resource_type="employee",
                    resource_id=str(emp.id),
                    dedup_key=dedup,
                    dedup_window_hours=72,  # 3 days cooldown for same prediction
                )
                if notif:
                    alert_count += 1

        return alert_count

    # --------------------------------------------------------------------------
    # 4. Team Formation Event Notifications
    # --------------------------------------------------------------------------
    @classmethod
    async def notify_team_formation_event(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        formation: TeamFormation,
        event_type: str,  # 'finalized', 'rejected', 'ready'
    ) -> int:
        """Dispatches notification when a team formation is finalized, rejected, or ready."""
        recipients = await cls._get_authorized_recipients(
            db, workspace_id, Permission.TEAM_FORMATIONS_VIEW
        )
        if not recipients:
            return 0

        severity_map = {
            "finalized": "success",
            "rejected": "warning",
            "ready": "info",
        }
        severity = severity_map.get(event_type, "info")
        title = f"Team Formation {event_type.capitalize()}: {formation.formation_code}"
        msg = (
            f"Team formation recommendation '{formation.formation_code}' has been {event_type}. "
            f"Target size: {formation.target_team_size}, Skill coverage: {formation.skill_coverage_percent:.0f}%."
        )
        dedup = f"team_formation:{formation.id}:{event_type}"

        alert_count = 0
        for uid in recipients:
            notif = await NotificationService.create_notification(
                db=db,
                workspace_id=workspace_id,
                user_id=uid,
                title=title,
                message=msg,
                category="team_formation",
                severity=severity,
                link=f"/app/teams?formation={formation.id}",
                resource_type="team_formation",
                resource_id=str(formation.id),
                dedup_key=dedup,
                dedup_window_hours=24,
            )
            if notif:
                alert_count += 1
        return alert_count

    # --------------------------------------------------------------------------
    # 5. Scheduled Report Execution Notifications
    # --------------------------------------------------------------------------
    @classmethod
    async def notify_scheduled_report_result(
        cls,
        db: AsyncSession,
        workspace_id: uuid.UUID,
        schedule: ScheduledReport,
        execution: ScheduledReportExecution,
    ) -> Optional[Any]:
        """Notifies the schedule creator/owner about execution and delivery outcomes."""
        if not schedule.created_by_user_id:
            return None

        is_success = execution.status == "completed"
        severity = "success" if is_success else "critical"
        delivery_str = (
            f"Delivered ({execution.delivery_status})"
            if execution.delivery_status in ["delivered", "simulated"]
            else f"Delivery: {execution.delivery_status}"
        )

        title = (
            f"Scheduled Report Ready: {schedule.name}"
            if is_success
            else f"Scheduled Report Failed: {schedule.name}"
        )
        msg = (
            f"Scheduled execution of '{schedule.name}' ({schedule.frequency}) finished with status: "
            f"{execution.status}. {delivery_str} to {len(execution.recipients)} recipient(s)."
            if is_success
            else f"Failed to execute scheduled report '{schedule.name}': {execution.error_message or 'Unknown error'}."
        )

        link = f"/app/reports?reportId={execution.report_id}" if execution.report_id else "/app/reports"
        dedup = f"sched_exec:{execution.id}"

        return await NotificationService.create_notification(
            db=db,
            workspace_id=workspace_id,
            user_id=schedule.created_by_user_id,
            title=title,
            message=msg,
            category="report",
            severity=severity,
            link=link,
            resource_type="report",
            resource_id=str(execution.report_id) if execution.report_id else None,
            dedup_key=dedup,
            dedup_window_hours=24,
        )
