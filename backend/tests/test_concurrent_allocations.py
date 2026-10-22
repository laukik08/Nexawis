"""
NEXAWIS Backend - PostgreSQL Concurrent Allocation Safety & Transaction Integrity Tests.
Exercises genuine simultaneous transactions and row-level locks across 8 concurrency scenarios:
1. Two concurrent finalizations competing for the same employee's remaining capacity.
2. Concurrent finalizations affecting overlapping employee sets.
3. Two requests attempting to finalize the same formation simultaneously.
4. A concurrent change to an employee's status/availability before finalization.
5. Failure partway through finalization, confirming that no partial allocation persists (atomic rollback).
6. Deadlock-free deterministic lock ordering on multi-employee allocations.
7. Rejection of requests pushing projected workload past the 150% hard safety limit.
8. Concurrent manual project assignment vs team finalization competing for employee capacity.
"""

import asyncio
import uuid
import pytest
import pytest_asyncio
import jwt
from datetime import datetime, timezone, timedelta, date
from typing import AsyncGenerator, Dict, Any, List

from httpx import AsyncClient, ASGITransport
from sqlalchemy import text, select, func
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

from app.main import app
from app.core.database import get_db_session, get_engine
from app.core.config import settings
from app.core.roles import SystemRole, WorkspaceRole
from app.core.clerk import set_test_verification_key
from app.models.base import Base
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.employee import Employee
from app.models.project import Project, ProjectAllocation
from app.models.team_formation import TeamFormation, TeamFormationMember


# Ephemeral RSA keypair for testing
_private_key_obj = rsa.generate_private_key(public_exponent=65537, key_size=2048)
TEST_PRIVATE_KEY = _private_key_obj.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
).decode("utf-8")
TEST_PUBLIC_KEY = _private_key_obj.public_key().public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo,
).decode("utf-8")


def create_token(sub: str, role: str = SystemRole.PROJECT_MANAGER.value, email: str = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "email": email or f"{sub}@nexawis.com",
        "name": f"User {sub}",
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=3600)).timestamp()),
    }
    return jwt.encode(payload, TEST_PRIVATE_KEY, algorithm="RS256")


@pytest_asyncio.fixture(scope="function")
async def conc_db_env():
    """
    Sets up an isolated database environment.
    If PostgreSQL/Supabase is reachable, provisions a dedicated ephemeral schema in PostgreSQL
    to test genuine row-level locking behavior. Otherwise, falls back to SQLite in-memory.
    """
    raw_engine = get_engine()
    use_postgres = False
    test_schema = None

    if raw_engine is not None and "postgresql" in settings.get_async_database_url().lower():
        try:
            test_schema = f"test_conc_{uuid.uuid4().hex[:8]}"
            async with raw_engine.begin() as conn:
                await conn.execute(text(f"CREATE SCHEMA {test_schema};"))
            use_postgres = True
        except Exception:
            use_postgres = False

    if use_postgres:
        engine = create_async_engine(
            settings.get_async_database_url(),
            connect_args={"statement_cache_size": 0, "ssl": "require"},
            execution_options={"schema_translate_map": {None: test_schema}},
            pool_size=10,
            max_overflow=5,
        )
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    else:
        engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )

    # Dependency override ensuring each request gets a fresh session from the pool
    async def _override_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db_session] = _override_db
    set_test_verification_key(TEST_PUBLIC_KEY, ["RS256"])

    yield {
        "engine": engine,
        "session_factory": session_factory,
        "is_postgres": use_postgres,
        "schema": test_schema,
    }

    app.dependency_overrides.clear()
    set_test_verification_key(None, None)
    await engine.dispose()

    if use_postgres and raw_engine is not None:
        async with raw_engine.begin() as conn:
            await conn.execute(text(f"DROP SCHEMA IF EXISTS {test_schema} CASCADE;"))


@pytest_asyncio.fixture
async def conc_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


async def seed_concurrency_fixture(session_factory):
    """Seeds baseline workspace, PM user, and three test employees."""
    async with session_factory() as s:
        pm_user = User(
            clerk_user_id="clerk_pm_conc",
            email="pm_conc@nexawis.com",
            full_name="Concurrency PM",
            role=SystemRole.PROJECT_MANAGER.value,
            is_active=True,
        )
        ws = Workspace(name="Concurrency WS", slug=f"ws-conc-{uuid.uuid4().hex[:6]}")
        s.add_all([pm_user, ws])
        await s.flush()

        s.add(WorkspaceMember(workspace_id=ws.id, user_id=pm_user.id, role=WorkspaceRole.ADMIN.value))

        e1 = Employee(
            workspace_id=ws.id,
            employee_code="NXW-C1",
            full_name="Elena Rostova",
            email="elena_c@nexawis.com",
            designation="Backend Lead",
            department="Engineering",
            employment_status="Available",
        )
        e2 = Employee(
            workspace_id=ws.id,
            employee_code="NXW-C2",
            full_name="Marcus Vance",
            email="marcus_c@nexawis.com",
            designation="Frontend Specialist",
            department="Engineering",
            employment_status="Available",
        )
        e3 = Employee(
            workspace_id=ws.id,
            employee_code="NXW-C3",
            full_name="Chloe Kim",
            email="chloe_c@nexawis.com",
            designation="Fullstack Engineer",
            department="Engineering",
            employment_status="Available",
        )
        s.add_all([e1, e2, e3])
        await s.commit()

        return {
            "pm_user": pm_user,
            "ws": ws,
            "e1": e1,
            "e2": e2,
            "e3": e3,
            "token": create_token("clerk_pm_conc"),
        }


# ==============================================================================
# 1. Two Concurrent Finalizations Competing for Same Remaining Capacity
# ==============================================================================

@pytest.mark.asyncio
async def test_concurrent_finalizations_competing_capacity(conc_db_env, conc_client: AsyncClient):
    """
    Elena has 60% committed workload.
    Two distinct projects (P1 and P2) each recommend Elena for 50% allocation.
    Adding 50% brings her to 110% (valid, <= 150%).
    Adding both (50% + 50% = 100%) would bring her to 160% (> 150% hard limit).
    Both requests execute concurrently: exactly ONE succeeds (200), and ONE fails (409).
    """
    factory = conc_db_env["session_factory"]
    env = await seed_concurrency_fixture(factory)
    ws = env["ws"]
    e1 = env["e1"]
    e2 = env["e2"]
    token = env["token"]
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    async with factory() as s:
        prior_proj = Project(
            workspace_id=ws.id,
            project_code="PRJ-PRIOR-01",
            name="Prior Project",
            department="Engineering",
            status="In Progress",
            deadline=date.today() + timedelta(days=90),
        )
        s.add(prior_proj)
        await s.flush()
        s.add(ProjectAllocation(
            project_id=prior_proj.id,
            employee_id=e1.id,
            allocation_percent=60.0,
            status="Active",
            role="Lead",
        ))

        p1 = Project(workspace_id=ws.id, project_code="PRJ-C-A", name="Sprint A", department="Engineering", status="Planning", deadline=date.today() + timedelta(days=60))
        p2 = Project(workspace_id=ws.id, project_code="PRJ-C-B", name="Sprint B", department="Engineering", status="Planning", deadline=date.today() + timedelta(days=60))
        s.add_all([p1, p2])
        await s.flush()

        f1 = TeamFormation(workspace_id=ws.id, project_id=p1.id, formation_code="FRM-C-1", status="Draft", target_team_size=2)
        f2 = TeamFormation(workspace_id=ws.id, project_id=p2.id, formation_code="FRM-C-2", status="Draft", target_team_size=2)
        s.add_all([f1, f2])
        await s.flush()

        # Both recommend e1 + e2 (50% each)
        s.add_all([
            TeamFormationMember(formation_id=f1.id, employee_id=e1.id, assigned_role="Lead", allocation_percent=50.0, match_score=90.0, skill_match_percent=95.0, is_selected=True),
            TeamFormationMember(formation_id=f1.id, employee_id=e2.id, assigned_role="Dev", allocation_percent=50.0, match_score=85.0, skill_match_percent=88.0, is_selected=True),
            TeamFormationMember(formation_id=f2.id, employee_id=e1.id, assigned_role="Lead", allocation_percent=50.0, match_score=90.0, skill_match_percent=95.0, is_selected=True),
            TeamFormationMember(formation_id=f2.id, employee_id=e2.id, assigned_role="Dev", allocation_percent=50.0, match_score=85.0, skill_match_percent=88.0, is_selected=True),
        ])
        await s.commit()

        f1_id = f1.id
        f2_id = f2.id
        p1_id = p1.id
        p2_id = p2.id
        e1_id = e1.id

    # Execute both requests simultaneously in real parallel tasks
    res1, res2 = await asyncio.gather(
        conc_client.post(f"/api/v1/teams/recommendations/{f1_id}/finalize", headers=headers, json={"notes": "Finalize 1"}),
        conc_client.post(f"/api/v1/teams/recommendations/{f2_id}/finalize", headers=headers, json={"notes": "Finalize 2"}),
    )

    statuses = sorted([res1.status_code, res2.status_code])
    assert statuses == [200, 409], f"Expected one 200 and one 409, got {statuses}"

    # Database State Assertion: Total committed workload for Elena must be exactly 110.0% (<= 150%)
    async with factory() as s:
        allocs = (await s.execute(select(ProjectAllocation).where(ProjectAllocation.employee_id == e1_id))).scalars().all()
        total_committed = sum(a.allocation_percent for a in allocs)
        assert total_committed == 110.0
        assert len(allocs) == 2  # prior (60%) + exactly one winner (50%)

        # The losing project must have 0 committed allocations (atomic rollback)
        losing_proj_id = p2_id if res1.status_code == 200 else p1_id
        losing_allocs = (await s.execute(select(ProjectAllocation).where(ProjectAllocation.project_id == losing_proj_id))).scalars().all()
        assert len(losing_allocs) == 0


# ==============================================================================
# 2. Concurrent Finalizations Affecting Overlapping Employee Sets
# ==============================================================================

@pytest.mark.asyncio
async def test_concurrent_finalizations_overlapping_teams(conc_db_env, conc_client: AsyncClient):
    """
    Team 1: {E1, E2}. Team 2: {E2, E3}.
    Marcus (E2) has 70% prior workload. Both teams request 50% from E2.
    E1 and E3 have ample capacity.
    Result: Only one team commits. Marcus workload never exceeds 120% (<= 150%).
    """
    factory = conc_db_env["session_factory"]
    env = await seed_concurrency_fixture(factory)
    ws = env["ws"]
    e1, e2, e3 = env["e1"], env["e2"], env["e3"]
    token = env["token"]
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    async with factory() as s:
        prior = Project(workspace_id=ws.id, project_code="PRJ-PRIOR-02", name="Prior 2", department="Engineering", status="In Progress", deadline=date.today() + timedelta(days=90))
        s.add(prior)
        await s.flush()
        s.add(ProjectAllocation(project_id=prior.id, employee_id=e2.id, allocation_percent=70.0, status="Active", role="Dev"))

        p1 = Project(workspace_id=ws.id, project_code="PRJ-OV-1", name="Alpha", department="Engineering", status="Planning", deadline=date.today() + timedelta(days=60))
        p2 = Project(workspace_id=ws.id, project_code="PRJ-OV-2", name="Beta", department="Engineering", status="Planning", deadline=date.today() + timedelta(days=60))
        s.add_all([p1, p2])
        await s.flush()

        f1 = TeamFormation(workspace_id=ws.id, project_id=p1.id, formation_code="FRM-OV-1", status="Draft", target_team_size=2)
        f2 = TeamFormation(workspace_id=ws.id, project_id=p2.id, formation_code="FRM-OV-2", status="Draft", target_team_size=2)
        s.add_all([f1, f2])
        await s.flush()

        # Team 1: e1 + e2 (50% each); Team 2: e2 + e3 (50% each)
        s.add_all([
            TeamFormationMember(formation_id=f1.id, employee_id=e1.id, assigned_role="Dev", allocation_percent=50.0, match_score=90.0, skill_match_percent=90.0, is_selected=True),
            TeamFormationMember(formation_id=f1.id, employee_id=e2.id, assigned_role="Dev", allocation_percent=50.0, match_score=90.0, skill_match_percent=90.0, is_selected=True),
            TeamFormationMember(formation_id=f2.id, employee_id=e2.id, assigned_role="Dev", allocation_percent=50.0, match_score=90.0, skill_match_percent=90.0, is_selected=True),
            TeamFormationMember(formation_id=f2.id, employee_id=e3.id, assigned_role="Dev", allocation_percent=50.0, match_score=90.0, skill_match_percent=90.0, is_selected=True),
        ])
        await s.commit()

        f1_id, f2_id = f1.id, f2.id
        e2_id = e2.id

    res1, res2 = await asyncio.gather(
        conc_client.post(f"/api/v1/teams/recommendations/{f1_id}/finalize", headers=headers, json={"notes": "Team 1"}),
        conc_client.post(f"/api/v1/teams/recommendations/{f2_id}/finalize", headers=headers, json={"notes": "Team 2"}),
    )

    statuses = sorted([res1.status_code, res2.status_code])
    assert statuses == [200, 409]

    # Database State Assertion: E2 is at 120% (70 + 50), not 170%
    async with factory() as s:
        e2_allocs = (await s.execute(select(ProjectAllocation).where(ProjectAllocation.employee_id == e2_id))).scalars().all()
        total_e2 = sum(a.allocation_percent for a in e2_allocs)
        assert total_e2 == 120.0


# ==============================================================================
# 3. Two Requests Finalizing the Same Formation Simultaneously
# ==============================================================================

@pytest.mark.asyncio
async def test_concurrent_duplicate_formation_finalization(conc_db_env, conc_client: AsyncClient):
    """
    Two simultaneous requests attempt to finalize the exact same TeamFormation.
    Row-level lock on TeamFormation ensures exactly one commits and marks status 'Finalized';
    the second sees status 'Finalized' and receives HTTP 409 Conflict.
    """
    factory = conc_db_env["session_factory"]
    env = await seed_concurrency_fixture(factory)
    ws = env["ws"]
    e1, e2 = env["e1"], env["e2"]
    token = env["token"]
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    async with factory() as s:
        p = Project(workspace_id=ws.id, project_code="PRJ-DUP-01", name="Duplicate Finalization Proj", department="Engineering", status="Planning", deadline=date.today() + timedelta(days=60))
        s.add(p)
        await s.flush()

        form = TeamFormation(workspace_id=ws.id, project_id=p.id, formation_code="FRM-DUP-01", status="Draft", target_team_size=2)
        s.add(form)
        await s.flush()

        s.add_all([
            TeamFormationMember(formation_id=form.id, employee_id=e1.id, assigned_role="Dev", allocation_percent=50.0, match_score=90.0, skill_match_percent=90.0, is_selected=True),
            TeamFormationMember(formation_id=form.id, employee_id=e2.id, assigned_role="Dev", allocation_percent=50.0, match_score=90.0, skill_match_percent=90.0, is_selected=True),
        ])
        await s.commit()

        form_id = form.id
        p_id = p.id

    # Simultaneous finalization calls for the exact same formation
    res1, res2 = await asyncio.gather(
        conc_client.post(f"/api/v1/teams/recommendations/{form_id}/finalize", headers=headers, json={"notes": "Call A"}),
        conc_client.post(f"/api/v1/teams/recommendations/{form_id}/finalize", headers=headers, json={"notes": "Call B"}),
    )

    statuses = sorted([res1.status_code, res2.status_code])
    assert statuses == [200, 409]

    # Database state: exactly 2 allocations for the project (no duplicate rows)
    async with factory() as s:
        proj_allocs = (await s.execute(select(ProjectAllocation).where(ProjectAllocation.project_id == p_id))).scalars().all()
        assert len(proj_allocs) == 2

        saved_form = (await s.execute(select(TeamFormation).where(TeamFormation.id == form_id))).scalar_one()
        assert saved_form.status == "Finalized"


# ==============================================================================
# 4. Concurrent Employee Status Change Before Finalization
# ==============================================================================

@pytest.mark.asyncio
async def test_concurrent_employee_status_change_during_finalization(conc_db_env, conc_client: AsyncClient):
    """
    A candidate in a draft recommendation becomes 'On Leave' before finalization.
    Finalization must detect this under the row lock and return 409 Conflict.
    """
    factory = conc_db_env["session_factory"]
    env = await seed_concurrency_fixture(factory)
    ws = env["ws"]
    e1, e2 = env["e1"], env["e2"]
    token = env["token"]
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    async with factory() as s:
        p = Project(workspace_id=ws.id, project_code="PRJ-LEAVE-01", name="Leave Project", department="Engineering", status="Planning", deadline=date.today() + timedelta(days=60))
        s.add(p)
        await s.flush()

        form = TeamFormation(workspace_id=ws.id, project_id=p.id, formation_code="FRM-LEAVE-01", status="Draft", target_team_size=2)
        s.add(form)
        await s.flush()

        s.add_all([
            TeamFormationMember(formation_id=form.id, employee_id=e1.id, assigned_role="Dev", allocation_percent=50.0, match_score=90.0, skill_match_percent=90.0, is_selected=True),
            TeamFormationMember(formation_id=form.id, employee_id=e2.id, assigned_role="Dev", allocation_percent=50.0, match_score=90.0, skill_match_percent=90.0, is_selected=True),
        ])
        await s.commit()

        form_id = form.id
        p_id = p.id
        e1_id = e1.id

    # Another transaction marks Elena as 'On Leave'
    async with factory() as s:
        emp = (await s.execute(select(Employee).where(Employee.id == e1_id))).scalar_one()
        emp.employment_status = "On Leave"
        await s.commit()

    resp = await conc_client.post(
        f"/api/v1/teams/recommendations/{form_id}/finalize",
        headers=headers,
        json={"notes": "Finalize after status change"},
    )
    assert resp.status_code == 409
    assert "no longer available or active" in resp.json()["error"]["message"]

    # Database: 0 allocations committed
    async with factory() as s:
        allocs = (await s.execute(select(ProjectAllocation).where(ProjectAllocation.project_id == p_id))).scalars().all()
        assert len(allocs) == 0


# ==============================================================================
# 5. Failure Partway Through Finalization (Atomic Rollback)
# ==============================================================================

@pytest.mark.asyncio
async def test_atomic_rollback_on_partial_failure(conc_db_env, conc_client: AsyncClient):
    """
    Team has Candidate 1 (valid) and Candidate 2 (invalid - over-allocated past 150%).
    Finalization fails on Candidate 2.
    Assert that Candidate 1 has ZERO allocations committed (atomic rollback succeeded).
    """
    factory = conc_db_env["session_factory"]
    env = await seed_concurrency_fixture(factory)
    ws = env["ws"]
    e1, e2 = env["e1"], env["e2"]
    token = env["token"]
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    async with factory() as s:
        # Give e2 120% committed workload
        prior = Project(workspace_id=ws.id, project_code="PRJ-OVER-01", name="Prior Over", department="Engineering", status="In Progress", deadline=date.today() + timedelta(days=90))
        s.add(prior)
        await s.flush()
        s.add(ProjectAllocation(project_id=prior.id, employee_id=e2.id, allocation_percent=120.0, status="Active", role="Dev"))

        p = Project(workspace_id=ws.id, project_code="PRJ-ATOMIC-01", name="Atomic Rollback Proj", department="Engineering", status="Planning", deadline=date.today() + timedelta(days=60))
        s.add(p)
        await s.flush()

        form = TeamFormation(workspace_id=ws.id, project_id=p.id, formation_code="FRM-ATOMIC-01", status="Draft", target_team_size=2)
        s.add(form)
        await s.flush()

        s.add_all([
            TeamFormationMember(formation_id=form.id, employee_id=e1.id, assigned_role="Dev", allocation_percent=50.0, match_score=90.0, skill_match_percent=90.0, is_selected=True),
            TeamFormationMember(formation_id=form.id, employee_id=e2.id, assigned_role="Dev", allocation_percent=50.0, match_score=90.0, skill_match_percent=90.0, is_selected=True),
        ])
        await s.commit()

        form_id = form.id
        p_id = p.id
        e1_id = e1.id

    resp = await conc_client.post(
        f"/api/v1/teams/recommendations/{form_id}/finalize",
        headers=headers,
        json={"notes": "Should fail on e2"},
    )
    assert resp.status_code == 409
    assert "exceeds absolute safety threshold" in resp.json()["error"]["message"]

    # Verify zero allocations for this project
    async with factory() as s:
        p_allocs = (await s.execute(select(ProjectAllocation).where(ProjectAllocation.project_id == p_id))).scalars().all()
        assert len(p_allocs) == 0

        # Formation remains in Draft status
        saved_f = (await s.execute(select(TeamFormation).where(TeamFormation.id == form_id))).scalar_one()
        assert saved_f.status == "Draft"


# ==============================================================================
# 6. Deadlock-Free Deterministic Lock Ordering
# ==============================================================================

@pytest.mark.asyncio
async def test_deadlock_free_deterministic_lock_ordering(conc_db_env, conc_client: AsyncClient):
    """
    Two concurrent operations lock multiple employees in reverse parameter order:
    Op 1 requests [E1, E2], Op 2 requests [E2, E1].
    Because AllocationService deterministically orders locks by UUID, no deadlock occurs.
    Both complete without raising database deadlock errors (PostgreSQL 40P01).
    """
    factory = conc_db_env["session_factory"]
    env = await seed_concurrency_fixture(factory)
    ws = env["ws"]
    e1, e2 = env["e1"], env["e2"]
    token = env["token"]
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    async with factory() as s:
        p1 = Project(workspace_id=ws.id, project_code="PRJ-DL-1", name="Deadlock Safe 1", department="Engineering", status="Planning", deadline=date.today() + timedelta(days=60))
        p2 = Project(workspace_id=ws.id, project_code="PRJ-DL-2", name="Deadlock Safe 2", department="Engineering", status="Planning", deadline=date.today() + timedelta(days=60))
        s.add_all([p1, p2])
        await s.flush()

        f1 = TeamFormation(workspace_id=ws.id, project_id=p1.id, formation_code="FRM-DL-1", status="Draft", target_team_size=2)
        f2 = TeamFormation(workspace_id=ws.id, project_id=p2.id, formation_code="FRM-DL-2", status="Draft", target_team_size=2)
        s.add_all([f1, f2])
        await s.flush()

        # Both recommend E1 + E2 with 20% each (leaving plenty of headroom)
        s.add_all([
            TeamFormationMember(formation_id=f1.id, employee_id=e1.id, assigned_role="Dev", allocation_percent=20.0, match_score=90.0, skill_match_percent=90.0, is_selected=True),
            TeamFormationMember(formation_id=f1.id, employee_id=e2.id, assigned_role="Dev", allocation_percent=20.0, match_score=90.0, skill_match_percent=90.0, is_selected=True),
            TeamFormationMember(formation_id=f2.id, employee_id=e2.id, assigned_role="Dev", allocation_percent=20.0, match_score=90.0, skill_match_percent=90.0, is_selected=True),
            TeamFormationMember(formation_id=f2.id, employee_id=e1.id, assigned_role="Dev", allocation_percent=20.0, match_score=90.0, skill_match_percent=90.0, is_selected=True),
        ])
        await s.commit()

        f1_id, f2_id = f1.id, f2.id
        e1_id, e2_id = e1.id, e2.id

    # Op 1 requests selected_candidate_ids=[E1, E2], Op 2 requests selected_candidate_ids=[E2, E1]
    res1, res2 = await asyncio.gather(
        conc_client.post(
            f"/api/v1/teams/recommendations/{f1_id}/finalize",
            headers=headers,
            json={"selected_candidate_ids": [str(e1_id), str(e2_id)]},
        ),
        conc_client.post(
            f"/api/v1/teams/recommendations/{f2_id}/finalize",
            headers=headers,
            json={"selected_candidate_ids": [str(e2_id), str(e1_id)]},
        ),
    )

    # Both must succeed without deadlock!
    assert res1.status_code == 200
    assert res2.status_code == 200


# ==============================================================================
# 7. Requests Exceeding 150% Hard Safety Limit
# ==============================================================================

@pytest.mark.asyncio
async def test_hard_safety_threshold_150_rejection(conc_db_env, conc_client: AsyncClient):
    """
    Candidate already has 110% committed. Requesting 50% pushes workload to 160% > 150%.
    Must return 409 Conflict.
    """
    factory = conc_db_env["session_factory"]
    env = await seed_concurrency_fixture(factory)
    ws = env["ws"]
    e1 = env["e1"]
    token = env["token"]
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    async with factory() as s:
        prior = Project(workspace_id=ws.id, project_code="PRJ-HARD-01", name="Hard Prior", department="Engineering", status="In Progress", deadline=date.today() + timedelta(days=90))
        s.add(prior)
        await s.flush()
        s.add(ProjectAllocation(project_id=prior.id, employee_id=e1.id, allocation_percent=110.0, status="Active", role="Lead"))

        p = Project(workspace_id=ws.id, project_code="PRJ-HARD-02", name="Hard Target", department="Engineering", status="Planning", deadline=date.today() + timedelta(days=60))
        s.add(p)
        await s.flush()

        form = TeamFormation(workspace_id=ws.id, project_id=p.id, formation_code="FRM-HARD-02", status="Draft", target_team_size=1)
        s.add(form)
        await s.flush()

        s.add(TeamFormationMember(formation_id=form.id, employee_id=e1.id, assigned_role="Lead", allocation_percent=50.0, match_score=90.0, skill_match_percent=90.0, is_selected=True))
        await s.commit()

        form_id = form.id
        p_id = p.id

    resp = await conc_client.post(
        f"/api/v1/teams/recommendations/{form_id}/finalize",
        headers=headers,
        json={"notes": "Should exceed 150%"},
    )
    assert resp.status_code == 409
    assert "exceeds absolute safety threshold (150%)" in resp.json()["error"]["message"]

    async with factory() as s:
        p_allocs = (await s.execute(select(ProjectAllocation).where(ProjectAllocation.project_id == p_id))).scalars().all()
        assert len(p_allocs) == 0


# ==============================================================================
# 8. Concurrent Manual Project Assignment vs Team Finalization
# ==============================================================================

@pytest.mark.asyncio
async def test_concurrent_manual_assignment_vs_team_finalization(conc_db_env, conc_client: AsyncClient):
    """
    Candidate Chloe (E3) has 70% committed workload.
    Writer 1: Manual allocation endpoint (POST /projects/{p1}/team) requests 40% (total = 110% <= 150%).
    Writer 2: Team finalization (POST /teams/.../finalize) requests 50% (total = 120% <= 150%).
    Combined: 70 + 40 + 50 = 160% > 150%!
    Executed simultaneously: exactly one succeeds (200), the other fails with 409 Conflict.
    Chloe's committed workload in the database remains within policy (<= 150%).
    """
    factory = conc_db_env["session_factory"]
    env = await seed_concurrency_fixture(factory)
    ws = env["ws"]
    e3 = env["e3"]
    token = env["token"]
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-Id": str(ws.id)}

    async with factory() as s:
        prior = Project(workspace_id=ws.id, project_code="PRJ-MAN-PRIOR", name="Prior Active", department="Engineering", status="In Progress", deadline=date.today() + timedelta(days=90))
        s.add(prior)
        await s.flush()
        s.add(ProjectAllocation(project_id=prior.id, employee_id=e3.id, allocation_percent=70.0, status="Active", role="Fullstack"))

        # P1 for manual allocation
        p1 = Project(workspace_id=ws.id, project_code="PRJ-MANUAL-1", name="Manual Target", department="Engineering", status="In Progress", deadline=date.today() + timedelta(days=60))
        # P2 for team finalization
        p2 = Project(workspace_id=ws.id, project_code="PRJ-FORM-2", name="Team Target", department="Engineering", status="Planning", deadline=date.today() + timedelta(days=60))
        s.add_all([p1, p2])
        await s.flush()

        form2 = TeamFormation(workspace_id=ws.id, project_id=p2.id, formation_code="FRM-CONC-P2", status="Draft", target_team_size=1)
        s.add(form2)
        await s.flush()

        s.add(TeamFormationMember(
            formation_id=form2.id,
            employee_id=e3.id,
            assigned_role="Engineer",
            allocation_percent=50.0,
            match_score=88.0,
            skill_match_percent=85.0,
            is_selected=True,
        ))
        await s.commit()

        p1_id = p1.id
        form2_id = form2.id
        e3_id = e3.id

    # Fire manual allocation (40%) and team finalization (50%) concurrently!
    res_manual, res_final = await asyncio.gather(
        conc_client.post(
            f"/api/v1/projects/{p1_id}/team",
            headers=headers,
            json={
                "id": str(e3_id),
                "role": "Senior Engineer",
                "allocationPercent": 40.0,
                "teamFit": 90.0,
            },
        ),
        conc_client.post(
            f"/api/v1/teams/recommendations/{form2_id}/finalize",
            headers=headers,
            json={"notes": "Finalizing P2"},
        ),
    )

    statuses = sorted([res_manual.status_code, res_final.status_code])
    assert statuses == [200, 409], f"Expected one 200 and one 409, got {statuses} ({res_manual.text}, {res_final.text})"

    # Verify Chloe's committed workload in the database is <= 150%
    async with factory() as s:
        chloe_allocs = (await s.execute(select(ProjectAllocation).where(ProjectAllocation.employee_id == e3_id))).scalars().all()
        total_chloe = sum(a.allocation_percent for a in chloe_allocs)
        assert total_chloe in (110.0, 120.0), f"Unexpected total workload: {total_chloe}%"
        assert total_chloe <= 150.0
