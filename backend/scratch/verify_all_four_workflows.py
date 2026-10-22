"""
NEXAWIS - End-to-End Core Functionality Verification Script
Validates all 4 reported workflows directly against the FastAPI app and Supabase PostgreSQL:
1. Demo workspace access & switching (both UUID and slug 'nexawis-demo')
2. Employee creation by Project Manager (HTTP 201 Created + DB persistence)
3. Project creation by Project Manager (HTTP 201 Created + DB persistence)
4. Team formation preset selection & recommendation generation across strategies
"""

import asyncio
import uuid
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from httpx import AsyncClient, ASGITransport
from app.main import app

from app.core.database import get_session_factory
from app.models import Employee, Project, Workspace, WorkspaceMember, User
from app.core.clerk import set_test_verification_key
from tests.test_auth import TEST_PUBLIC_KEY, create_test_jwt
from sqlalchemy import select, delete


DEMO_WS_ID = uuid.UUID("d0000000-0000-0000-0000-000000000001")


async def run_e2e_verification():
    set_test_verification_key(TEST_PUBLIC_KEY, ["RS256"])
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        print("=" * 70)
        print("NEXAWIS CORE FUNCTIONALITY E2E VERIFICATION")
        print("=" * 70)

        # ------------------------------------------------------------------
        # Workflow 1: User Profile & Demo Workspace Access
        # ------------------------------------------------------------------
        print("\n[Workflow 1] Testing Demo Workspace Access & Listing...")
        test_clerk_id = "user_e2e_pm_verified"
        token = create_test_jwt(sub=test_clerk_id, email="pm.verified@nexawis.internal", name="Verified PM")
        auth_headers = {"Authorization": f"Bearer {token}"}

        # Call GET /api/v1/auth/me (no X-Workspace-Id header)
        me_resp = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert me_resp.status_code == 200, f"auth/me failed: {me_resp.text}"
        me_data = me_resp.json()
        print(f"  User Authenticated: {me_data['user']['full_name']} (Role: {me_data['user']['role']})")
        
        # Verify workspaces list contains Demo Workspace
        ws_list = me_data["workspaces"]
        demo_ws = next((w for w in ws_list if w["id"] == str(DEMO_WS_ID)), None)
        assert demo_ws is not None, "Demo workspace was NOT returned in auth/me workspaces list!"
        print(f"  Demo Workspace Found: '{demo_ws['name']}' (Role: {demo_ws['role']}, ID: {demo_ws['id']})")
        print(f"  Default Active Workspace: {me_data['active_workspace_id']}")

        # Verify switching to Demo Workspace using SLUG 'nexawis-demo'
        slug_headers = {**auth_headers, "X-Workspace-Id": "nexawis-demo"}
        slug_resp = await client.get("/api/v1/projects", headers=slug_headers)
        assert slug_resp.status_code == 200, f"Accessing with slug 'nexawis-demo' failed: {slug_resp.text}"
        slug_projects = slug_resp.json()["items"]
        print(f"  Switching via slug 'nexawis-demo': Success ({len(slug_projects)} projects returned)")

        # Verify switching to Demo Workspace using UUID
        uuid_headers = {**auth_headers, "X-Workspace-Id": str(DEMO_WS_ID)}
        uuid_resp = await client.get("/api/v1/projects", headers=uuid_headers)
        assert uuid_resp.status_code == 200, f"Accessing with UUID failed: {uuid_resp.text}"
        uuid_projects = uuid_resp.json()["items"]
        print(f"  Switching via UUID '{DEMO_WS_ID}': Success ({len(uuid_projects)} projects returned)")
        print("  --> Workflow 1 VERIFIED: Demo workspace discovered, listed, and switchable via both UUID and slug.\n")

        # ------------------------------------------------------------------
        # Workflow 2: Employee Creation by Project Manager
        # ------------------------------------------------------------------
        print("[Workflow 2] Testing Employee Creation with PM role...")
        emp_code = f"E2E-{str(uuid.uuid4())[:6].upper()}"
        emp_payload = {
            "employee_code": emp_code,
            "full_name": "Dr. Sarah Connor",
            "email": f"{emp_code.lower()}@nexawis.internal",
            "department": "Engineering",
            "designation": "Staff AI Engineer",
            "experience_years": 8.5,
            "employment_status": "Available",
            "work_location": "Remote",
            "performance_score": 92.0,
            "availability_score": 85.0,
            "current_workload_percent": 15.0,
            "skills": [
                {"name": "Python", "proficiency": 95, "is_primary": True},
                {"name": "PyTorch", "proficiency": 90, "is_primary": True},
                {"name": "Distributed Systems", "proficiency": 85, "is_primary": False},
            ],
        }

        # Create employee in Demo workspace using demo headers
        emp_resp = await client.post("/api/v1/employees", json=emp_payload, headers=uuid_headers)
        assert emp_resp.status_code == 201, f"Employee creation failed ({emp_resp.status_code}): {emp_resp.text}"
        created_emp = emp_resp.json()
        emp_identifier = created_emp.get("employeeId") or created_emp.get("employee_id") or created_emp.get("id")
        print(f"  HTTP 201 Created: Employee '{created_emp['name']}' ({emp_identifier})")
        print(f"  Designation: {created_emp['role']} | Skills: {len(created_emp.get('skills', []))}")


        # Verify database persistence
        sf = get_session_factory()
        async with sf() as db:
            db_emp = (await db.execute(select(Employee).where(Employee.employee_code == emp_code))).scalar_one_or_none()
            assert db_emp is not None, "Created employee was not found in database!"
            print(f"  Supabase DB Persistence: Confirmed record ID {db_emp.id} in workspace {db_emp.workspace_id}")
            # Clean up test employee
            await db.delete(db_emp)
            await db.commit()
        print("  --> Workflow 2 VERIFIED: Employee creation succeeds with HTTP 201 and persists to DB.\n")

        # ------------------------------------------------------------------
        # Workflow 3: Project Creation by Project Manager
        # ------------------------------------------------------------------
        print("[Workflow 3] Testing Project Creation with PM role...")
        proj_code = f"PRJ-E2E-{str(uuid.uuid4())[:4].upper()}"
        proj_payload = {
            "project_code": proj_code,
            "name": "E2E Strategic Neural Platform",
            "description": "Integration test validation for end-to-end core functionality recovery.",
            "department": "Engineering",
            "priority": "High",
            "target_team_size": 4,
            "start_date": "2026-11-01",
            "deadline": "2027-04-30",
            "requirements": [
                {"skill": "Python", "min_proficiency": 80, "priority": "High", "is_mandatory": True},
                {"skill": "FastAPI", "min_proficiency": 75, "priority": "High", "is_mandatory": True},
            ],
        }

        proj_resp = await client.post("/api/v1/projects", json=proj_payload, headers=uuid_headers)
        assert proj_resp.status_code == 201, f"Project creation failed ({proj_resp.status_code}): {proj_resp.text}"
        created_proj = proj_resp.json()
        proj_code_val = created_proj.get("projectId") or created_proj.get("projectCode") or created_proj.get("project_code") or created_proj.get("id")

        team_size_val = created_proj.get("teamSize") or created_proj.get("target_team_size") or created_proj.get("team_size")
        print(f"  HTTP 201 Created: Project '{created_proj['name']}' ({proj_code_val})")
        print(f"  Team Size: {team_size_val} | Priority: {created_proj.get('priority')}")


        created_proj_id = uuid.UUID(created_proj["id"])
        async with sf() as db:
            db_proj = (await db.execute(select(Project).where(Project.id == created_proj_id))).scalar_one_or_none()
            assert db_proj is not None, "Created project was not found in database!"
            print(f"  Supabase DB Persistence: Confirmed record ID {db_proj.id}")
        print("  --> Workflow 3 VERIFIED: Project creation succeeds with HTTP 201 and persists to DB.\n")

        # ------------------------------------------------------------------
        # Workflow 4: Team Formation Preset Selection & Recommendation
        # ------------------------------------------------------------------
        print("[Workflow 4] Testing Team Formation Presets...")
        presets_to_test = [
            ("autonomous_ai", "Autonomous AI Optimization", 50, "ModerateAllowed"),
            ("fatigue_safe", "Fatigue-Safe & Wellness Protected", 60, "LowOnly"),
            ("high_velocity", "High-Velocity Sprint Strike Team", 40, "ModerateAllowed"),
            ("growth_mentorship", "Cross-Functional & Mentorship Pod", 50, "ModerateAllowed"),
        ]

        target_proj_id = uuid.UUID("d0000000-0000-0000-0003-000000000002")  # PRJ-102 AI Engine v2
        for preset_id, title, min_avail, risk_tol in presets_to_test:
            tf_payload = {
                "target_team_size": 4,
                "team_size": 4,
                "formation_option": preset_id,
                "min_availability_percent": min_avail,
                "wellbeing_risk_tolerance": risk_tol,
                "include_growth_opportunities": True,
            }
            tf_resp = await client.post(
                f"/api/v1/teams/projects/{target_proj_id}/team-recommendation",
                json=tf_payload,
                headers=uuid_headers,
            )
            assert tf_resp.status_code == 200, f"Preset '{preset_id}' recommendation failed: {tf_resp.text}"
            tf_data = tf_resp.json()
            assert tf_data["is_feasible"] is True, f"Preset '{preset_id}' was marked infeasible!"
            assert len(tf_data["candidates"]) == 4, f"Expected 4 candidates, got {len(tf_data['candidates'])}"
            metrics = tf_data.get("metrics") or {}
            print(
                f"  Strategy Preset '{preset_id}' ({title}): "
                f"Team Fit={metrics.get('overall_team_fit')}%, "
                f"Skill Coverage={metrics.get('skill_coverage_percent')}%, "
                f"Sustainability={metrics.get('sustainability_score')}%, "
                f"Candidates={len(tf_data['candidates'])}"
            )

        # Clean up the test project created in Workflow 3
        async with sf() as db:
            await db.execute(delete(Project).where(Project.id == created_proj_id))
            await db.commit()
            print("  Cleaned up temporary E2E project record.")

        print("  --> Workflow 4 VERIFIED: All team formation presets successfully optimize and return structured rosters.\n")

        print("=" * 70)
        print("ALL 4 CRITICAL CORE WORKFLOWS FULLY OPERATIONAL AND VERIFIED!")
        print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_e2e_verification())
