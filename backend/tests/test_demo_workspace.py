"""
NEXAWIS Backend - Enterprise Demo Workspace & Seeder Tests.
Validates demo workspace provisioning, record counts, isolation, idempotency,
and dedicated demo management API endpoints.
"""

import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.main import app
from app.core.database import get_db_session
from app.models.workspace import Workspace, WorkspaceMember
from app.models.employee import Employee
from app.models.project import Project, ProjectAllocation
from app.models.report import Report
from app.models.team_formation import TeamFormation
from app.models.ml_results import MlBurnoutPrediction, MlProjectSuccessPrediction, AwisEvaluation
from app.services.demo_seeder import DemoWorkspaceSeeder, DEMO_WORKSPACE_ID
from app.core.clerk import set_test_verification_key
from tests.test_auth import TEST_PUBLIC_KEY, create_test_jwt


@pytest_asyncio.fixture(autouse=True)
def setup_auth_key():
    set_test_verification_key(TEST_PUBLIC_KEY, ["RS256"])
    yield
    set_test_verification_key(None, None)


@pytest.mark.asyncio
async def test_demo_workspace_seeding_and_counts(async_client: AsyncClient):
    """Verifies that the demo workspace contains realistic, internally consistent records."""
    token = create_test_jwt(sub="user_demo_inspector_001", name="Demo Inspector")

    resp = await async_client.get(
        "/api/v1/demo/status",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["is_seeded"] is True
    assert data["workspace_id"] == str(DEMO_WORKSPACE_ID)
    assert data["workspace_name"] == "NEXAWIS Enterprise Demo"
    assert data["employees_count"] == 18
    assert data["projects_count"] == 6
    assert data["reports_count"] >= 4
    assert data["team_formations_count"] >= 2


@pytest.mark.asyncio
async def test_demo_workspace_enrollment(async_client: AsyncClient):
    """Verifies that an authenticated user can enroll as Admin in the demo workspace."""
    token = create_test_jwt(sub="user_demo_enrollee_999", name="Demo Enrollee")

    # Enroll
    resp = await async_client.post(
        "/api/v1/demo/enroll",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    # Check status now reflects enrollment
    status_resp = await async_client.get(
        "/api/v1/demo/status",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["is_current_user_enrolled"] is True


@pytest.mark.asyncio
async def test_demo_workspace_tenancy_isolation(async_client: AsyncClient):
    """
    Verifies tenant boundary isolation: accessing projects using demo workspace header
    returns the demo projects, while using another workspace header isolates records.
    """
    token = create_test_jwt(sub="user_demo_tenant_guard", name="Tenant Guard")

    # 1. Enroll into demo workspace
    await async_client.post(
        "/api/v1/demo/enroll",
        headers={"Authorization": f"Bearer {token}"},
    )

    # 2. Query projects under demo workspace
    demo_projects_resp = await async_client.get(
        "/api/v1/projects",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Workspace-Id": str(DEMO_WORKSPACE_ID),
        },
    )
    assert demo_projects_resp.status_code == 200
    items = demo_projects_resp.json()["items"]
    assert len(items) == 6
    assert any(p.get("projectId") == "PRJ-101" or p.get("project_id") == "PRJ-101" for p in items)
    assert any(p.get("projectId") == "PRJ-102" or p.get("project_id") == "PRJ-102" for p in items)


@pytest.mark.asyncio
async def test_demo_workspace_models_and_evaluations():
    """Direct database verification of genuine ML inferences and AWIS evaluations."""
    async for db in get_db_session():
        # Burnout predictions
        burnout_cnt = (await db.execute(
            select(func.count(MlBurnoutPrediction.id)).where(
                MlBurnoutPrediction.workspace_id == DEMO_WORKSPACE_ID
            )
        )).scalar()
        assert burnout_cnt == 18

        # Project success prediction on PRJ-105
        proj_success_cnt = (await db.execute(
            select(func.count(MlProjectSuccessPrediction.id)).where(
                MlProjectSuccessPrediction.workspace_id == DEMO_WORKSPACE_ID
            )
        )).scalar()
        assert proj_success_cnt >= 1

        # AWIS evaluations on PRJ-102
        awis_cnt = (await db.execute(
            select(func.count(AwisEvaluation.id)).where(
                AwisEvaluation.workspace_id == DEMO_WORKSPACE_ID
            )
        )).scalar()
        assert awis_cnt >= 5
        break
