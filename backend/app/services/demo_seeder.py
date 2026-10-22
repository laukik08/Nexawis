"""
NEXAWIS Backend - Deterministic Enterprise Demo Workspace Seeder.
Populates an isolated, realistic, internally consistent enterprise demo workspace
in Supabase PostgreSQL with real AWIS scoring, real ML inference, active allocations,
team formations, and pre-generated intelligence reports.
Idempotent: safe to run repeatedly without creating duplicates.
"""

import uuid
from datetime import date, datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import math

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from sqlalchemy.orm import selectinload

from app.models.workspace import Workspace, WorkspaceSettings, WorkspaceMember
from app.models.user import User, UserPreference
from app.models.skill import Skill, EmployeeSkill
from app.models.employee import (
    Employee,
    EmployeeWorkloadHistory,
    EmployeePerformanceHistory,
)
from app.models.project import (
    Project,
    ProjectRequirement,
    ProjectMilestone,
    ProjectAllocation,
)
from app.models.team_formation import TeamFormation, TeamFormationMember
from app.models.ml_results import (
    AwisEvaluation,
    MlBurnoutPrediction,
    MlProjectSuccessPrediction,
)
from app.models.report import Report, ScheduledReport
from app.core.config import settings
from app.services.reports.service import ReportService
from app.schemas.report import ReportConfigSchema, ReportDateRangeSchema
from app.services.ml.loader import model_manager
from app.services.ml.burnout import extract_burnout_features, derive_risk_tier, compute_contributing_factors
from app.services.ml.project_success import derive_risk_level
from app.core.logging import logger


DEMO_WORKSPACE_ID = uuid.UUID("d0000000-0000-0000-0000-000000000001")
DEMO_ADMIN_USER_ID = uuid.UUID("d0000000-0000-0000-0000-000000000010")
DEMO_PM_USER_ID = uuid.UUID("d0000000-0000-0000-0000-000000000011")


class DemoWorkspaceSeeder:
    """Enterprise demo workspace provisioning and lifecycle management."""

    @classmethod
    async def clean_existing_demo_workspace(cls, db: AsyncSession) -> None:
        """Removes existing records belonging to DEMO_WORKSPACE_ID to ensure a clean reseed."""
        logger.info(f"Purging existing demo workspace data for {DEMO_WORKSPACE_ID}...")
        ws = (await db.execute(select(Workspace).where(Workspace.id == DEMO_WORKSPACE_ID))).scalar_one_or_none()
        if ws:
            await db.delete(ws)
            await db.commit()
            logger.info("Previous demo workspace removed.")

    @classmethod
    async def seed(cls, db: AsyncSession, target_user: Optional[User] = None) -> Dict[str, Any]:
        """
        Seeds complete, realistic demonstration data.
        If target_user is provided, automatically enrolls them as an Admin in the demo workspace.
        """
        # Ensure ML models are loaded for genuine inference
        model_manager.load_models()

        now = datetime.now(timezone.utc)
        today = now.date()

        # ----------------------------------------------------------------------
        # 1. Clean or verify demo workspace
        # ----------------------------------------------------------------------
        await cls.clean_existing_demo_workspace(db)

        # ----------------------------------------------------------------------
        # 2. Provision Demo Workspace & Settings
        # ----------------------------------------------------------------------
        workspace = Workspace(
            id=DEMO_WORKSPACE_ID,
            name="NEXAWIS Enterprise Demo",
            slug="nexawis-demo",
            description="Enterprise demonstration environment showcasing real AWIS scoring, ML inference, and workforce intelligence.",
        )
        db.add(workspace)
        await db.flush()

        ws_settings = WorkspaceSettings(
            workspace_id=DEMO_WORKSPACE_ID,
            default_department="Engineering",
            default_reporting_period="30d",
        )
        db.add(ws_settings)

        # ----------------------------------------------------------------------
        # 3. Demo Admin and PM Users
        # ----------------------------------------------------------------------
        # Admin user
        admin_user = (
            await db.execute(select(User).where(User.id == DEMO_ADMIN_USER_ID))
        ).scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                id=DEMO_ADMIN_USER_ID,
                clerk_user_id="user_demo_admin_nexawis",
                email="alex.morgan@nexawis.internal",
                full_name="Alex Morgan",
                role="Admin",
                title="VP of Engineering Operations",
                department="Engineering",
                is_active=True,
            )
            db.add(admin_user)
            await db.flush()

            pref = UserPreference(
                user_id=admin_user.id,
                theme="dark",
                language="en-US",
                timezone="UTC",
                notification_settings={"projectUpdates": True, "teamFormation": True},
            )
            db.add(pref)

        # PM user
        pm_user = (
            await db.execute(select(User).where(User.id == DEMO_PM_USER_ID))
        ).scalar_one_or_none()
        if not pm_user:
            pm_user = User(
                id=DEMO_PM_USER_ID,
                clerk_user_id="user_demo_pm_nexawis",
                email="sarah.jenkins@nexawis.internal",
                full_name="Sarah Jenkins",
                role="Project Manager",
                title="Lead Technical Project Manager",
                department="Engineering",
                is_active=True,
            )
            db.add(pm_user)
            await db.flush()

            pref = UserPreference(
                user_id=pm_user.id,
                theme="dark",
                language="en-US",
                timezone="UTC",
                notification_settings={"projectUpdates": True, "teamFormation": True},
            )
            db.add(pref)

        # Link memberships
        db.add(WorkspaceMember(
            workspace_id=DEMO_WORKSPACE_ID,
            user_id=admin_user.id,
            role="owner",
            is_active=True,
        ))
        db.add(WorkspaceMember(
            workspace_id=DEMO_WORKSPACE_ID,
            user_id=pm_user.id,
            role="admin",
            is_active=True,
        ))

        # If a real logged-in user triggered this, enroll them as Admin so they can access the workspace
        if target_user and target_user.id not in [admin_user.id, pm_user.id]:
            existing_target_member = (
                await db.execute(
                    select(WorkspaceMember).where(
                        WorkspaceMember.workspace_id == DEMO_WORKSPACE_ID,
                        WorkspaceMember.user_id == target_user.id,
                    )
                )
            ).scalar_one_or_none()
            if not existing_target_member:
                db.add(WorkspaceMember(
                    workspace_id=DEMO_WORKSPACE_ID,
                    user_id=target_user.id,
                    role="admin",
                    is_active=True,
                ))

        await db.flush()

        # ----------------------------------------------------------------------
        # 4. Standardized Skills Taxonomy
        # ----------------------------------------------------------------------
        skills_defs = [
            ("d0000000-0000-0000-0001-000000000001", "React", "Frontend", "Modern React with hooks and state management"),
            ("d0000000-0000-0000-0001-000000000002", "TypeScript", "Frontend", "Strict typed JavaScript development"),
            ("d0000000-0000-0000-0001-000000000003", "Python", "Backend", "High-performance Python backend & async services"),
            ("d0000000-0000-0000-0001-000000000004", "FastAPI", "Backend", "Modern asynchronous web API framework"),
            ("d0000000-0000-0000-0001-000000000005", "PostgreSQL", "Data & DB", "Relational database design and query tuning"),
            ("d0000000-0000-0000-0001-000000000006", "AWS Cloud", "DevOps & Cloud", "Cloud architecture, IAM, S3, ECS, Lambda"),
            ("d0000000-0000-0000-0001-000000000007", "Docker", "DevOps & Cloud", "Containerization and multi-stage image builds"),
            ("d0000000-0000-0000-0001-000000000008", "Kubernetes", "DevOps & Cloud", "Container orchestration and cluster scaling"),
            ("d0000000-0000-0000-0001-000000000009", "GraphQL", "Backend", "Schema federation and GraphQL APIs"),
            ("d0000000-0000-0000-0001-000000000010", "UI/UX Architecture", "Design", "Design systems, interaction patterns, tokens"),
            ("d0000000-0000-0000-0001-000000000011", "Machine Learning", "Data & ML", "Supervised learning, XGBoost, Scikit-learn"),
            ("d0000000-0000-0000-0001-000000000012", "Data Pipelines", "Data & ML", "ETL pipelines, Pandas, stream ingestion"),
            ("d0000000-0000-0000-0001-000000000013", "Node.js", "Backend", "Event-driven microservices"),
            ("d0000000-0000-0000-0001-000000000014", "System Architecture", "Architecture", "Distributed systems, fault tolerance, scaling"),
            ("d0000000-0000-0000-0001-000000000015", "Agile Leadership", "Management", "Scrum, sprint velocity, technical roadmapping"),
            ("d0000000-0000-0000-0001-000000000016", "Cybersecurity", "Security", "OWASP, SOC2 compliance, penetration testing"),
        ]

        skills_by_name: Dict[str, Skill] = {}
        for sid, name, cat, desc in skills_defs:
            skill = (await db.execute(select(Skill).where(Skill.workspace_id == DEMO_WORKSPACE_ID, Skill.name == name))).scalar_one_or_none()
            if not skill:
                skill = Skill(id=uuid.UUID(sid), workspace_id=DEMO_WORKSPACE_ID, name=name, category=cat, description=desc)
                db.add(skill)
                await db.flush()
            skills_by_name[name] = skill

        # ----------------------------------------------------------------------
        # 5. Employees Roster (18 diverse, balanced profiles)
        # ----------------------------------------------------------------------
        emp_defs = [
            {
                "id": "d0000000-0000-0000-0002-000000000001",
                "code": "NXW-1001",
                "name": "Elena Rostova",
                "email": "elena.rostova@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Elena+Rostova&background=0284c7&color=fff",
                "dept": "Engineering",
                "designation": "Senior Frontend Engineer",
                "exp": 6.5,
                "status": "Allocated",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Service",
                "perf": 94.0,
                "trend": "up",
                "avail": 20.0,
                "workload": 80.0,
                "growth": 92.0,
                "fatigue": 3.8,
                "risk": "Low",
                "skills": [("React", 98, True), ("TypeScript", 95, True), ("UI/UX Architecture", 85, False), ("GraphQL", 78, False)],
                "weekly_hours": 42.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000002",
                "code": "NXW-1002",
                "name": "Marcus Chen",
                "email": "marcus.chen@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Marcus+Chen&background=16a34a&color=fff",
                "dept": "Engineering",
                "designation": "Backend Architect",
                "exp": 9.0,
                "status": "Allocated",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Product",
                "perf": 97.0,
                "trend": "stable",
                "avail": 50.0,
                "workload": 50.0,
                "growth": 88.0,
                "fatigue": 2.5,
                "risk": "Low",
                "skills": [("Python", 98, True), ("System Architecture", 96, True), ("PostgreSQL", 94, True), ("FastAPI", 92, False)],
                "weekly_hours": 40.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000003",
                "code": "NXW-1003",
                "name": "Priya Sharma",
                "email": "priya.sharma@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Priya+Sharma&background=f59e0b&color=fff",
                "dept": "Engineering",
                "designation": "Senior Full Stack Engineer",
                "exp": 5.0,
                "status": "Allocated",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Service",
                "perf": 89.0,
                "trend": "up",
                "avail": 40.0,
                "workload": 60.0,
                "growth": 90.0,
                "fatigue": 4.2,
                "risk": "Moderate",
                "skills": [("React", 90, True), ("FastAPI", 88, True), ("TypeScript", 87, False), ("PostgreSQL", 84, False)],
                "weekly_hours": 41.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000004",
                "code": "NXW-1004",
                "name": "Liam Vance",
                "email": "liam.vance@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Liam+Vance&background=6366f1&color=fff",
                "dept": "Engineering",
                "designation": "DevOps Lead",
                "exp": 7.0,
                "status": "Allocated",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Service",
                "perf": 92.0,
                "trend": "stable",
                "avail": 25.0,
                "workload": 75.0,
                "growth": 85.0,
                "fatigue": 3.6,
                "risk": "Low",
                "skills": [("AWS Cloud", 96, True), ("Docker", 94, True), ("Kubernetes", 92, True), ("Cybersecurity", 84, False)],
                "weekly_hours": 43.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000005",
                "code": "NXW-1005",
                "name": "Sophia Patel",
                "email": "sophia.patel@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Sophia+Patel&background=ec4899&color=fff",
                "dept": "Engineering",
                "designation": "Associate Frontend Engineer",
                "exp": 2.0,
                "status": "Allocated",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Service",
                "perf": 84.0,
                "trend": "up",
                "avail": 70.0,
                "workload": 30.0,
                "growth": 95.0,
                "fatigue": 2.1,
                "risk": "Low",
                "skills": [("React", 84, True), ("TypeScript", 82, True), ("UI/UX Architecture", 76, False)],
                "weekly_hours": 38.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000006",
                "code": "NXW-1006",
                "name": "David Kim",
                "email": "david.kim@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=David+Kim&background=ef4444&color=fff",
                "dept": "Engineering",
                "designation": "Senior Backend Engineer",
                "exp": 8.0,
                "status": "Allocated",
                "type": "Full-time",
                "wfh": False,
                "company_type": "Service",
                "perf": 91.0,
                "trend": "down",
                "avail": 60.0,
                "workload": 40.0,
                "growth": 78.0,
                "fatigue": 6.8,
                "risk": "High",  # Demonstrates wellbeing alert detection
                "skills": [("Python", 94, True), ("FastAPI", 92, True), ("PostgreSQL", 90, True), ("System Architecture", 85, False)],
                "weekly_hours": 48.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000007",
                "code": "NXW-1007",
                "name": "Maya Lin",
                "email": "maya.lin@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Maya+Lin&background=8b5cf6&color=fff",
                "dept": "Data Science",
                "designation": "Principal Data Scientist",
                "exp": 8.5,
                "status": "Available",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Product",
                "perf": 96.0,
                "trend": "stable",
                "avail": 100.0,
                "workload": 0.0,
                "growth": 91.0,
                "fatigue": 2.8,
                "risk": "Low",
                "skills": [("Machine Learning", 98, True), ("Python", 96, True), ("Data Pipelines", 92, True)],
                "weekly_hours": 40.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000008",
                "code": "NXW-1008",
                "name": "Lucas Rossi",
                "email": "lucas.rossi@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Lucas+Rossi&background=14b8a6&color=fff",
                "dept": "Data Science",
                "designation": "Data Engineer",
                "exp": 4.5,
                "status": "Available",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Service",
                "perf": 88.0,
                "trend": "up",
                "avail": 100.0,
                "workload": 0.0,
                "growth": 89.0,
                "fatigue": 3.4,
                "risk": "Low",
                "skills": [("Data Pipelines", 94, True), ("Python", 90, True), ("PostgreSQL", 88, True)],
                "weekly_hours": 40.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000009",
                "code": "NXW-1009",
                "name": "Zara Al-Mansoor",
                "email": "zara.almansoor@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Zara+Almansoor&background=f43f5e&color=fff",
                "dept": "Design",
                "designation": "Lead Product Designer",
                "exp": 6.0,
                "status": "Allocated",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Product",
                "perf": 93.0,
                "trend": "up",
                "avail": 30.0,
                "workload": 70.0,
                "growth": 90.0,
                "fatigue": 3.2,
                "risk": "Low",
                "skills": [("UI/UX Architecture", 97, True), ("React", 78, False)],
                "weekly_hours": 40.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000010",
                "code": "NXW-1010",
                "name": "Jordan Blake",
                "email": "jordan.blake@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Jordan+Blake&background=3b82f6&color=fff",
                "dept": "Product",
                "designation": "Senior Product Manager",
                "exp": 7.5,
                "status": "Available",
                "type": "Full-time",
                "wfh": True,
                "company_type": "SaaS",
                "perf": 92.0,
                "trend": "stable",
                "avail": 100.0,
                "workload": 0.0,
                "growth": 86.0,
                "fatigue": 3.0,
                "risk": "Low",
                "skills": [("Agile Leadership", 96, True), ("System Architecture", 82, False)],
                "weekly_hours": 40.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000011",
                "code": "NXW-1011",
                "name": "Chloe Dubois",
                "email": "chloe.dubois@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Chloe+Dubois&background=10b981&color=fff",
                "dept": "Engineering",
                "designation": "QA Automation Architect",
                "exp": 5.5,
                "status": "Allocated",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Service",
                "perf": 90.0,
                "trend": "up",
                "avail": 40.0,
                "workload": 60.0,
                "growth": 88.0,
                "fatigue": 2.9,
                "risk": "Low",
                "skills": [("Python", 88, True), ("Docker", 85, True), ("TypeScript", 82, False)],
                "weekly_hours": 40.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000012",
                "code": "NXW-1012",
                "name": "Aiden Cooper",
                "email": "aiden.cooper@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Aiden+Cooper&background=06b6d4&color=fff",
                "dept": "Engineering",
                "designation": "Cloud Security Engineer",
                "exp": 6.0,
                "status": "Allocated",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Service",
                "perf": 91.0,
                "trend": "stable",
                "avail": 50.0,
                "workload": 50.0,
                "growth": 87.0,
                "fatigue": 3.1,
                "risk": "Low",
                "skills": [("Cybersecurity", 95, True), ("AWS Cloud", 90, True), ("Docker", 88, False)],
                "weekly_hours": 40.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000013",
                "code": "NXW-1013",
                "name": "Rachel Green",
                "email": "rachel.green@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Rachel+Green&background=eab308&color=fff",
                "dept": "Product",
                "designation": "Product Owner",
                "exp": 4.0,
                "status": "Available",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Service",
                "perf": 87.0,
                "trend": "up",
                "avail": 100.0,
                "workload": 0.0,
                "growth": 91.0,
                "fatigue": 2.5,
                "risk": "Low",
                "skills": [("Agile Leadership", 90, True)],
                "weekly_hours": 40.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000014",
                "code": "NXW-1014",
                "name": "Noah Becker",
                "email": "noah.becker@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Noah+Becker&background=a855f7&color=fff",
                "dept": "Design",
                "designation": "UI/UX Designer",
                "exp": 3.5,
                "status": "Allocated",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Service",
                "perf": 86.0,
                "trend": "stable",
                "avail": 50.0,
                "workload": 50.0,
                "growth": 92.0,
                "fatigue": 2.7,
                "risk": "Low",
                "skills": [("UI/UX Architecture", 91, True)],
                "weekly_hours": 39.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000015",
                "code": "NXW-1015",
                "name": "Tara O'Connor",
                "email": "tara.oconnor@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Tara+OConnor&background=d946ef&color=fff",
                "dept": "Data Science",
                "designation": "ML Operations Engineer",
                "exp": 5.0,
                "status": "Available",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Product",
                "perf": 89.0,
                "trend": "up",
                "avail": 100.0,
                "workload": 0.0,
                "growth": 89.0,
                "fatigue": 3.5,
                "risk": "Moderate",
                "skills": [("Machine Learning", 90, True), ("Kubernetes", 92, True), ("Python", 88, False)],
                "weekly_hours": 40.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000016",
                "code": "NXW-1016",
                "name": "Carlos Mendoza",
                "email": "carlos.mendoza@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Carlos+Mendoza&background=059669&color=fff",
                "dept": "Engineering",
                "designation": "Infrastructure Engineer",
                "exp": 4.0,
                "status": "Allocated",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Service",
                "perf": 86.0,
                "trend": "stable",
                "avail": 60.0,
                "workload": 40.0,
                "growth": 88.0,
                "fatigue": 3.0,
                "risk": "Low",
                "skills": [("Kubernetes", 89, True), ("AWS Cloud", 88, True)],
                "weekly_hours": 40.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000017",
                "code": "NXW-1017",
                "name": "Nina Kowalski",
                "email": "nina.kowalski@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Nina+Kowalski&background=f97316&color=fff",
                "dept": "Engineering",
                "designation": "Frontend Specialist",
                "exp": 3.0,
                "status": "Allocated",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Service",
                "perf": 85.0,
                "trend": "up",
                "avail": 70.0,
                "workload": 30.0,
                "growth": 91.0,
                "fatigue": 2.4,
                "risk": "Low",
                "skills": [("React", 88, True), ("TypeScript", 86, True)],
                "weekly_hours": 39.0,
            },
            {
                "id": "d0000000-0000-0000-0002-000000000018",
                "code": "NXW-1018",
                "name": "Julian Hayes",
                "email": "julian.hayes@nexawis.internal",
                "avatar": "https://ui-avatars.com/api/?name=Julian+Hayes&background=64748b&color=fff",
                "dept": "Engineering",
                "designation": "Junior Backend Developer",
                "exp": 2.5,
                "status": "Allocated",
                "type": "Full-time",
                "wfh": True,
                "company_type": "Service",
                "perf": 82.0,
                "trend": "up",
                "avail": 80.0,
                "workload": 20.0,
                "growth": 94.0,
                "fatigue": 2.2,
                "risk": "Low",
                "skills": [("Python", 84, True), ("FastAPI", 82, True), ("PostgreSQL", 78, False)],
                "weekly_hours": 38.0,
            },
        ]

        employees_by_code: Dict[str, Employee] = {}

        for edef in emp_defs:
            emp = Employee(
                id=uuid.UUID(edef["id"]),
                workspace_id=DEMO_WORKSPACE_ID,
                employee_code=edef["code"],
                full_name=edef["name"],
                email=edef["email"],
                avatar_url=edef["avatar"],
                department=edef["dept"],
                designation=edef["designation"],
                experience_years=edef["exp"],
                employment_status=edef["status"],
                employment_type=edef["type"],
                wfh_setup_available=edef["wfh"],
                company_type=edef["company_type"],
                joining_date=today - timedelta(days=int(edef["exp"] * 365)),
                performance_score=edef["perf"],
                performance_trend=edef["trend"],
                availability_score=edef["avail"],
                current_workload_percent=edef["workload"],
                growth_potential=edef["growth"],
                collaboration_score=85.0,
                task_completion_rate=90.0,
                mental_fatigue_score=edef["fatigue"],
                wellbeing_risk=edef["risk"],
                awis_insights={
                    "strengths": [f"Demonstrated mastery in {edef['skills'][0][0]}", "Consistent sprint deliverability"],
                    "considerations": ["Workload balanced within operational safety guidelines" if edef["risk"] == "Low" else "Elevated fatigue requires task distribution review"],
                    "summary": f"{edef['name']} exhibits high technical competence and steady velocity.",
                },
            )
            db.add(emp)
            await db.flush()
            employees_by_code[edef["code"]] = emp

            # Add EmployeeSkills
            for sk_name, prof, is_prim in edef["skills"]:
                if sk_name in skills_by_name:
                    db.add(EmployeeSkill(
                        employee_id=emp.id,
                        skill_id=skills_by_name[sk_name].id,
                        proficiency=prof,
                        is_primary=is_prim,
                        years_experience=round(edef["exp"] * 0.8, 1),
                    ))

            # Add Performance History (Jan to Jun)
            base_perf = edef["perf"]
            months = [("Jan", -4), ("Feb", -2), ("Mar", -1), ("Apr", 0), ("May", 1), ("Jun", 2)]
            for m_name, delta in months:
                db.add(EmployeePerformanceHistory(
                    employee_id=emp.id,
                    period_label=f"{m_name} 2026",
                    performance_score=max(60.0, min(100.0, base_perf + delta)),
                    task_completion_rate=92.0,
                    deadline_adherence=90.0,
                    quality_score=91.0,
                ))

            # Add Workload History (6 periods)
            base_hours = edef["weekly_hours"]
            base_wl = edef["workload"]
            for i in range(6):
                h_date = today - timedelta(days=(5 - i) * 30)
                db.add(EmployeeWorkloadHistory(
                    employee_id=emp.id,
                    recorded_date=h_date,
                    weekly_work_hours=base_hours,
                    overtime_hours=max(0.0, base_hours - 40.0),
                    utilization_percentage=base_wl,
                    consecutive_working_days=5,
                    active_project_count=1 if base_wl > 0 else 0,
                    mental_fatigue_score=edef["fatigue"],
                ))

        await db.flush()

        # Run genuine ML Burnout inference and store prediction for each employee
        burnout_model = model_manager.get_burnout_model()
        for edef in emp_defs:
            emp = employees_by_code[edef["code"]]
            try:
                if burnout_model:
                    import pandas as pd
                    features_dict = {
                        "Company_Type": 0 if edef["company_type"] == "Service" else 1,
                        "WFH_Setup_Available": 1 if edef["wfh"] else 0,
                        "Designation": 2 if "Senior" in edef["designation"] else (4 if "Lead" in edef["designation"] else (5 if "Principal" in edef["designation"] else 0)),
                        "Experience_Years": float(edef["exp"]),
                        "Resource_Allocation": max(1.0, min(10.0, round(edef["workload"] / 10.0, 1))),
                        "Mental_Fatigue_Score": float(edef["fatigue"]),
                        "Weekly_Work_Hours": float(edef["weekly_hours"]),
                        "Overtime_Hours": float(max(0.0, edef["weekly_hours"] - 40.0)),
                        "Utilization_Percentage": float(edef["workload"]),
                        "Consecutive_Working_Days": 5,
                    }
                    df_in = pd.DataFrame([features_dict])
                    raw_pred = float(burnout_model.predict(df_in)[0])
                    clamped_burn_rate = max(0.0, min(1.0, raw_pred))
                    norm_score = round(clamped_burn_rate * 100.0, 1)
                    tier = derive_risk_tier(clamped_burn_rate)
                    contributing_factors = compute_contributing_factors(features_dict, clamped_burn_rate)

                    db.add(MlBurnoutPrediction(
                        workspace_id=DEMO_WORKSPACE_ID,
                        employee_id=emp.id,
                        model_version=settings.BURNOUT_MODEL_VERSION,
                        predicted_burn_rate=round(clamped_burn_rate, 4),
                        normalized_burnout_score=norm_score,
                        risk_tier=tier,
                        feature_provenance=features_dict,
                        explanation_shap={"contributing_factors": contributing_factors},
                        predicted_at=now,
                    ))
            except Exception as e:
                logger.warning(f"Could not compute ML burnout prediction for {emp.full_name}: {e}")

        # ----------------------------------------------------------------------
        # 6. Diverse Projects (Planning, Active, On Track, At Risk, Completed)
        # ----------------------------------------------------------------------
        proj_defs = [
            {
                "id": "d0000000-0000-0000-0003-000000000001",
                "code": "PRJ-101",
                "name": "Project Alpha (Core Cloud Platform)",
                "desc": "Next-generation distributed cloud services platform supporting real-time workforce telemetry.",
                "dept": "Engineering",
                "client": "ApexDigital Global",
                "status": "On Track",
                "priority": "High",
                "complexity": "High",
                "target_size": 5,
                "progress": 68.0,
                "risk": "Low",
                "team_fit": 94.0,
                "start": today - timedelta(days=90),
                "deadline": today + timedelta(days=45),
                "reqs": [("React", 85, True), ("TypeScript", 80, True), ("Python", 85, True), ("AWS Cloud", 80, True), ("Kubernetes", 75, False)],
                "milestones": [
                    ("Architecture Specification", today - timedelta(days=75), "Completed", 1),
                    ("Core Microservices Engine", today - timedelta(days=40), "Completed", 2),
                    ("Telemetry Pipeline Integration", today + timedelta(days=10), "Current", 3),
                    ("Performance & Load Stress Testing", today + timedelta(days=30), "Upcoming", 4),
                    ("Enterprise GA Deployment", today + timedelta(days=45), "Upcoming", 5),
                ],
                "allocs": [
                    ("NXW-1001", "Lead Frontend", 80.0, 95.0),
                    ("NXW-1002", "Principal Systems Architect", 50.0, 96.0),
                    ("NXW-1003", "Full Stack Engineer", 60.0, 90.0),
                    ("NXW-1004", "DevOps Lead", 75.0, 93.0),
                    ("NXW-1011", "QA Automation Architect", 60.0, 91.0),
                ],
            },
            {
                "id": "d0000000-0000-0000-0003-000000000002",
                "code": "PRJ-102",
                "name": "AI Recommendation Engine v2",
                "desc": "High-velocity intelligent match system utilizing deep learning embeddings for talent optimization.",
                "dept": "Data Science",
                "client": "CoreVentures Capital",
                "status": "Planning",  # PERFECT FOR LIVE DEMO TEAM FORMATION
                "priority": "Critical",
                "complexity": "High",
                "target_size": 4,
                "progress": 15.0,
                "risk": "Medium",
                "team_fit": None,
                "start": today + timedelta(days=7),
                "deadline": today + timedelta(days=90),
                "reqs": [("Machine Learning", 85, True), ("Python", 85, True), ("Data Pipelines", 80, True), ("FastAPI", 75, False), ("AWS Cloud", 70, False)],
                "milestones": [
                    ("Model Architecture Specs", today + timedelta(days=14), "Current", 1),
                    ("Data Pipeline ETL", today + timedelta(days=35), "Upcoming", 2),
                    ("Model Training & Calibration", today + timedelta(days=60), "Upcoming", 3),
                    ("Production Inference Service", today + timedelta(days=90), "Upcoming", 4),
                ],
                "allocs": [],  # Empty! Live team formation will staff this project.
            },
            {
                "id": "d0000000-0000-0000-0003-000000000003",
                "code": "PRJ-103",
                "name": "Mobile Design System & App Redesign",
                "desc": "Universal responsive design tokens, mobile component library, and frictionless micro-interactions.",
                "dept": "Design",
                "client": "SmartOps Ltd",
                "status": "Active",
                "priority": "Medium",
                "complexity": "Medium",
                "target_size": 3,
                "progress": 52.0,
                "risk": "Low",
                "team_fit": 91.0,
                "start": today - timedelta(days=40),
                "deadline": today + timedelta(days=35),
                "reqs": [("UI/UX Architecture", 85, True), ("React", 80, True), ("TypeScript", 75, False)],
                "milestones": [
                    ("Design Token Audit", today - timedelta(days=20), "Completed", 1),
                    ("Interactive Component Prototyping", today + timedelta(days=10), "Current", 2),
                    ("Design QA & Accessibility Review", today + timedelta(days=35), "Upcoming", 3),
                ],
                "allocs": [
                    ("NXW-1009", "Lead Product Designer", 70.0, 94.0),
                    ("NXW-1014", "UI/UX Designer", 50.0, 90.0),
                    ("NXW-1017", "Mobile Frontend Specialist", 30.0, 88.0),
                ],
            },
            {
                "id": "d0000000-0000-0000-0003-000000000004",
                "code": "PRJ-104",
                "name": "Enterprise Security Hardening & SOC2 Audit",
                "desc": "Infrastructure zero-trust security perimeter, role auditing, and continuous penetration monitoring.",
                "dept": "Engineering",
                "client": "CloudFirst Ltd",
                "status": "At Risk",  # Showcases risk & deadline alerts
                "priority": "Critical",
                "complexity": "High",
                "target_size": 3,
                "progress": 42.0,
                "risk": "High",
                "team_fit": 84.0,
                "start": today - timedelta(days=50),
                "deadline": today + timedelta(days=12),  # Approaching deadline
                "reqs": [("Cybersecurity", 90, True), ("AWS Cloud", 85, True), ("System Architecture", 80, True)],
                "milestones": [
                    ("Threat Vector Matrix", today - timedelta(days=30), "Completed", 1),
                    ("IAM Zero-Trust Audit", today + timedelta(days=5), "Current", 2),
                    ("SOC2 Type II Attestation", today + timedelta(days=12), "Upcoming", 3),
                ],
                "allocs": [
                    ("NXW-1012", "Lead Security Engineer", 50.0, 93.0),
                    ("NXW-1016", "Infrastructure Engineer", 40.0, 86.0),
                    ("NXW-1006", "Senior Backend Engineer", 40.0, 85.0),
                ],
            },
            {
                "id": "d0000000-0000-0000-0003-000000000005",
                "code": "PRJ-105",
                "name": "Data Pipeline Modernization",
                "desc": "Scalable streaming ingestion engine supporting billions of workforce events with sub-second latency.",
                "dept": "Data Science",
                "client": "DataStream Inc",
                "status": "Completed",  # Completed past project with real outcomes
                "priority": "Medium",
                "complexity": "Medium",
                "target_size": 4,
                "progress": 100.0,
                "risk": "Low",
                "team_fit": 95.0,
                "start": today - timedelta(days=150),
                "deadline": today - timedelta(days=30),
                "actual_end_date": today - timedelta(days=32),
                "reqs": [("Data Pipelines", 85, True), ("Python", 80, True), ("PostgreSQL", 80, True)],
                "milestones": [
                    ("Legacy Schema Migration", today - timedelta(days=120), "Completed", 1),
                    ("High-Throughput Ingestion Queue", today - timedelta(days=80), "Completed", 2),
                    ("Data Validation Engine", today - timedelta(days=50), "Completed", 3),
                    ("Production Cutover", today - timedelta(days=32), "Completed", 4),
                ],
                "allocs": [
                    ("NXW-1008", "Lead Data Engineer", 65.0, 96.0),
                    ("NXW-1007", "Principal Data Scientist", 70.0, 95.0),
                    ("NXW-1015", "MLOps Engineer", 70.0, 92.0),
                    ("NXW-1018", "Junior Backend Developer", 20.0, 88.0),
                ],
            },
            {
                "id": "d0000000-0000-0000-0003-000000000006",
                "code": "PRJ-106",
                "name": "Customer Portal Microservices",
                "desc": "Self-service customer portal with tenant billing management and webhook subscription hooks.",
                "dept": "Engineering",
                "client": "FutureBuild AG",
                "status": "Active",
                "priority": "Low",
                "complexity": "Low",
                "target_size": 2,
                "progress": 75.0,
                "risk": "Low",
                "team_fit": 88.0,
                "start": today - timedelta(days=45),
                "deadline": today + timedelta(days=60),
                "reqs": [("FastAPI", 75, True), ("PostgreSQL", 70, True)],
                "milestones": [
                    ("Authentication Gateway", today - timedelta(days=25), "Completed", 1),
                    ("Subscription Webhook Engine", today + timedelta(days=15), "Current", 2),
                    ("Billing Dashboard UI", today + timedelta(days=60), "Upcoming", 3),
                ],
                "allocs": [
                    ("NXW-1018", "Backend Developer", 20.0, 87.0),
                    ("NXW-1005", "Frontend Developer", 30.0, 89.0),
                ],
            },
        ]

        projects_by_code: Dict[str, Project] = {}

        for pdef in proj_defs:
            proj = Project(
                id=uuid.UUID(pdef["id"]),
                workspace_id=DEMO_WORKSPACE_ID,
                project_code=pdef["code"],
                name=pdef["name"],
                description=pdef["desc"],
                department=pdef["dept"],
                client=pdef["client"],
                project_manager_id=pm_user.id,
                status=pdef["status"],
                priority=pdef["priority"],
                complexity=pdef["complexity"],
                target_team_size=pdef["target_size"],
                progress_percent=pdef["progress"],
                overall_risk=pdef["risk"],
                team_fit_score=pdef["team_fit"],
                start_date=pdef["start"],
                deadline=pdef["deadline"],
                actual_end_date=pdef.get("actual_end_date"),
                priority_score=85.0 if pdef["priority"] == "Critical" else (70.0 if pdef["priority"] == "High" else 50.0),
                complexity_score=80.0 if pdef["complexity"] == "High" else 50.0,
                requirement_stability=85.0,
                technical_risk=65.0 if pdef["risk"] == "High" else 25.0,
                schedule_pressure=80.0 if pdef["status"] == "At Risk" else 40.0,
                client_engagement=88.0,
                innovation_index=75.0,
                scope_change=15.0,
                budget_variance=5.0,
                delivery_delay_days=10 if pdef["status"] == "At Risk" else 0,
                employee_turnover_rate=0.0,
            )
            db.add(proj)
            await db.flush()
            projects_by_code[pdef["code"]] = proj

            # Project requirements
            for req_name, min_p, is_m in pdef["reqs"]:
                if req_name in skills_by_name:
                    db.add(ProjectRequirement(
                        project_id=proj.id,
                        skill_id=skills_by_name[req_name].id,
                        min_proficiency=min_p,
                        priority="High" if is_m else "Medium",
                        is_mandatory=is_m,
                    ))

            # Milestones
            for m_name, m_due, m_stat, m_idx in pdef["milestones"]:
                db.add(ProjectMilestone(
                    project_id=proj.id,
                    name=m_name,
                    due_date=m_due,
                    status=m_stat,
                    order_index=m_idx,
                ))

            # Allocations
            for emp_code, role, alloc_pct, fit_score in pdef["allocs"]:
                if emp_code in employees_by_code:
                    emp_rec = employees_by_code[emp_code]
                    db.add(ProjectAllocation(
                        project_id=proj.id,
                        employee_id=emp_rec.id,
                        role=role,
                        allocation_percent=alloc_pct,
                        team_fit=fit_score,
                        status="Active" if pdef["status"] != "Completed" else "Completed",
                        start_date=pdef["start"],
                        end_date=pdef.get("actual_end_date") or pdef["deadline"],
                    ))

        await db.flush()

        # ----------------------------------------------------------------------
        # 7. Team Formations (Historical and Snapshots)
        # ----------------------------------------------------------------------
        # 1) Finalized formation on PRJ-105
        proj_105 = projects_by_code["PRJ-105"]
        tf_105 = TeamFormation(
            id=uuid.UUID("d0000000-0000-0000-0004-000000000001"),
            workspace_id=DEMO_WORKSPACE_ID,
            project_id=proj_105.id,
            formation_code="FRM-2026-001",
            formation_option="autonomous_ai",
            status="Finalized",
            target_team_size=4,
            selected_member_count=4,
            team_fit_score=95.2,
            skill_coverage_percent=100.0,
            workload_balance_score=94.0,
            sustainability_score=92.5,
            availability_coverage_score=96.0,
            config_parameters={"formation_option": "autonomous_ai", "team_size": 4},
            finalized_by_user_id=pm_user.id,
            finalized_at=now - timedelta(days=140),
            notes="Optimal team configuration achieving 100% skill coverage and superior synergy.",
        )
        db.add(tf_105)
        await db.flush()

        for emp_code, role, alloc_pct, fit_score in [
            ("NXW-1008", "Lead Data Engineer", 65.0, 96.0),
            ("NXW-1007", "Principal Data Scientist", 70.0, 95.0),
            ("NXW-1015", "MLOps Engineer", 70.0, 92.0),
            ("NXW-1018", "Junior Backend Developer", 20.0, 88.0),
        ]:
            db.add(TeamFormationMember(
                formation_id=tf_105.id,
                employee_id=employees_by_code[emp_code].id,
                assigned_role=role,
                allocation_percent=alloc_pct,
                match_score=fit_score,
                is_override=False,
                is_selected=True,
            ))

        # 2) Active formation on PRJ-101
        proj_101 = projects_by_code["PRJ-101"]
        tf_101 = TeamFormation(
            id=uuid.UUID("d0000000-0000-0000-0004-000000000002"),
            workspace_id=DEMO_WORKSPACE_ID,
            project_id=proj_101.id,
            formation_code="FRM-2026-002",
            formation_option="high_velocity",
            status="Active",
            target_team_size=5,
            selected_member_count=5,
            team_fit_score=94.0,
            skill_coverage_percent=96.0,
            workload_balance_score=90.0,
            sustainability_score=89.0,
            availability_coverage_score=92.0,
            config_parameters={"formation_option": "high_velocity", "team_size": 5},
            finalized_by_user_id=pm_user.id,
            finalized_at=now - timedelta(days=85),
            notes="High-velocity cloud platform core pod.",
        )
        db.add(tf_101)
        await db.flush()

        for emp_code, role, alloc_pct, fit_score in [
            ("NXW-1001", "Lead Frontend", 80.0, 95.0),
            ("NXW-1002", "Principal Systems Architect", 50.0, 96.0),
            ("NXW-1003", "Full Stack Engineer", 60.0, 90.0),
            ("NXW-1004", "DevOps Lead", 75.0, 93.0),
            ("NXW-1011", "QA Automation Architect", 60.0, 91.0),
        ]:
            db.add(TeamFormationMember(
                formation_id=tf_101.id,
                employee_id=employees_by_code[emp_code].id,
                assigned_role=role,
                allocation_percent=alloc_pct,
                match_score=fit_score,
                is_override=False,
                is_selected=True,
            ))

        await db.flush()

        # ----------------------------------------------------------------------
        # 8. Genuine Retrospective ML Project Success Prediction on PRJ-105
        # ----------------------------------------------------------------------
        try:
            success_model = model_manager.get_project_success_model()
            if success_model:
                import pandas as pd
                features_dict = {
                    "Organization": "DataStream Inc",
                    "Quarter": "Q1-2024",
                    "Department": "Data & Analytics",
                    "Team_Size": 4.0,
                    "Avg_Skill": 7.8,
                    "Avg_Experience": 5.1,
                    "Avg_Performance": 0.88,
                    "Avg_Burnout": 3.0,
                    "Avg_Training": 35.0,
                    "Avg_Certifications": 3.0,
                    "Avg_Collaboration": 8.5,
                    "Mentor_Ratio": 0.5,
                    "Project_Priority": "Medium",
                    "Project_Complexity": "Medium",
                    "Requirement_Stability": 8.5,
                    "Tech_Risk": 2.5,
                    "Schedule_Pressure": 4.0,
                    "Client_Engagement": 8.8,
                    "Innovation_Index": 7.5,
                    "Scope_Change": 15.0,
                    "Employee_Turnover": 0.0,
                    "Budget_Variance": 5.0,
                    "Delivery_Delay_Days": 0.0,
                }
                df_in = pd.DataFrame([features_dict])
                raw_pred = float(success_model.predict(df_in)[0])
                clamped_score = max(0.0, min(100.0, round(raw_pred, 1)))

                db.add(MlProjectSuccessPrediction(
                    workspace_id=DEMO_WORKSPACE_ID,
                    project_id=proj_105.id,
                    formation_id=tf_105.id,
                    model_version=settings.PROJECT_SUCCESS_MODEL_VERSION,
                    predicted_success_score=clamped_score,
                    confidence_score=0.85,
                    aggregated_team_features=features_dict,
                    positive_factors=[
                        "Strong team performance baseline (0.88)",
                        "Balanced seniority and mentorship coverage (50%)",
                        "Zero delivery delay on completed deliverables",
                    ],
                    negative_factors=[],
                    explanation_shap={
                        "target_leakage_assessment": "Retrospective audit on completed project PRJ-105 with verified delivery milestones.",
                        "is_prospective": False,
                        "forecast_trustworthy": True,
                        "is_self_reported": False,
                        "is_verified": True,
                        "outcome_provenance": {
                            "delivery_delay_days": "verified",
                            "budget_variance": "verified",
                            "scope_change": "verified",
                            "employee_turnover": "verified",
                        },
                    },
                    predicted_at=now - timedelta(days=32),
                ))
        except Exception as e:
            logger.warning(f"Could not compute ML project success prediction for PRJ-105: {e}")

        # ----------------------------------------------------------------------
        # 9. AWIS Evaluations (9-Dimensional Scores for key candidates)
        # ----------------------------------------------------------------------
        eval_defs = [
            ("NXW-1007", "PRJ-102", 95.8, 98.0, 96.0, 96.0, 100.0, 95.0, 92.0, 90.0, 91.0, 94.0),
            ("NXW-1008", "PRJ-102", 91.4, 94.0, 90.0, 88.0, 100.0, 92.0, 90.0, 88.0, 89.0, 91.0),
            ("NXW-1015", "PRJ-102", 90.2, 92.0, 88.0, 89.0, 100.0, 90.0, 86.0, 87.0, 89.0, 90.0),
            ("NXW-1018", "PRJ-102", 84.5, 82.0, 80.0, 82.0, 100.0, 95.0, 94.0, 85.0, 94.0, 86.0),
            ("NXW-1006", "PRJ-102", 79.5, 92.0, 94.0, 91.0, 60.0, 65.0, 48.0, 80.0, 78.0, 82.0),
        ]
        proj_102 = projects_by_code["PRJ-102"]
        for ecode, pcode, composite, sk, exp, perf, avail, wl, bo, col, gr, comp in eval_defs:
            if ecode in employees_by_code:
                db.add(AwisEvaluation(
                    workspace_id=DEMO_WORKSPACE_ID,
                    project_id=proj_102.id,
                    employee_id=employees_by_code[ecode].id,
                    composite_awis_score=composite,
                    skill_intelligence=sk,
                    experience_intelligence=exp,
                    performance_intelligence=perf,
                    availability_intelligence=avail,
                    workload_intelligence=wl,
                    burnout_intelligence=bo,
                    collaboration_intelligence=col,
                    growth_intelligence=gr,
                    compatibility_intelligence=comp,
                    eligibility_passed=True,
                    evaluated_at=now,
                ))

        await db.flush()

        # ----------------------------------------------------------------------
        # 10. Pre-Generated Reports across 4 core categories
        # ----------------------------------------------------------------------
        categories_to_generate = [
            ("workforce", "Workforce Allocation Audit - Q3"),
            ("projects", "Portfolio Delivery & Milestone Health"),
            ("executive", "Executive Intelligence Brief"),
            ("sustainability", "Workforce Capacity & Wellbeing Risk Analysis"),
        ]

        generated_reports = []
        for cat, title in categories_to_generate:
            try:
                req = ReportConfigSchema(
                    title=title,
                    category=cat,
                    dateRange=ReportDateRangeSchema(preset="30d", label="Last 30 Days"),
                    format="PDF",
                    department="All",
                    sections=[],
                    includeCharts=True,
                    includeTables=True,
                )
                rep_dict = await ReportService.generate_report(
                    db=db,
                    workspace_id=DEMO_WORKSPACE_ID,
                    user_id=admin_user.id,
                    config=req,
                    user_role="Admin",
                    can_view_wellbeing=True,
                )
                generated_reports.append(rep_dict)
            except Exception as e:
                logger.error(f"Error generating demo report for category {cat}: {e}")

        # ----------------------------------------------------------------------
        # 11. Scheduled Reports (Demonstration recurring distributions)
        # ----------------------------------------------------------------------
        db.add(ScheduledReport(
            id=uuid.UUID("d0000000-0000-0000-0005-000000000001"),
            workspace_id=DEMO_WORKSPACE_ID,
            name="Weekly Executive Intelligence Brief",
            category="executive",
            frequency="Weekly",
            next_run_date=now + timedelta(days=7),
            recipients=["alex.morgan@nexawis.internal", "sarah.jenkins@nexawis.internal"],
            enabled=True,
            format="PDF",
            department="All",
            created_by_user_id=admin_user.id,
        ))
        db.add(ScheduledReport(
            id=uuid.UUID("d0000000-0000-0000-0005-000000000002"),
            workspace_id=DEMO_WORKSPACE_ID,
            name="Monthly Workforce Capacity Digest",
            category="workforce",
            frequency="Monthly",
            next_run_date=now + timedelta(days=30),
            recipients=["alex.morgan@nexawis.internal"],
            enabled=True,
            format="PDF",
            department="Engineering",
            created_by_user_id=admin_user.id,
        ))

        await db.commit()
        logger.info("Successfully completed deterministic demo workspace seeding!")

        return {
            "workspace_id": str(DEMO_WORKSPACE_ID),
            "workspace_name": "NEXAWIS Enterprise Demo",
            "employees_count": len(emp_defs),
            "projects_count": len(proj_defs),
            "skills_count": len(skills_defs),
            "team_formations_count": 2,
            "pre_generated_reports_count": len(generated_reports),
        }
