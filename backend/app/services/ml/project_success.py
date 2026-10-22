"""
NEXAWIS Backend - Project Success Prediction Service.
Integrates Project_Success_XGBoost.pkl (ColumnTransformer + XGBoost Pipeline).
Aggregates candidate team features, enforces strict target leakage safeguards,
distinguishes prospective simulations from retrospective audits, and persists predictions.
"""

import math
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.exceptions import AppError, NotFoundError, ValidationError
from app.core.logging import logger
from app.models.employee import Employee
from app.models.project import Project
from app.models.team_formation import TeamFormation, TeamFormationMember
from app.models.ml_results import MlProjectSuccessPrediction, MlBurnoutPrediction
from app.schemas.ml import (
    ProjectSuccessProspectiveRequest,
    ProjectSuccessRetrospectiveRequest,
    ProjectSuccessPredictionResponse,
)
from app.services.ml.loader import model_manager


# Supported categorical domains learned during model training
KNOWN_ORGANIZATIONS = [
    "AgileWorks Co", "ApexDigital", "CloudFirst Ltd", "CoreVentures",
    "DataStream Inc", "DeepLogic Corp", "FutureBuild AG", "Innovate Solutions",
    "NexGen Systems", "NovaSoft Inc", "PrimeSys Corp", "SmartOps Ltd",
    "TechCorp Global", "VelocityTech", "ZenithTech"
]
KNOWN_DEPARTMENTS = [
    "Architecture", "Data & Analytics", "DevOps", "Engineering",
    "Product", "QA & Testing", "Security"
]
KNOWN_PRIORITIES = ["Critical", "Low", "Medium"]
KNOWN_COMPLEXITIES = ["High", "Low", "Medium"]


def sanitize_categorical(val: Optional[str], allowed: List[str], default: str) -> str:
    """Matches a categorical value to the model's known vocabulary."""
    if not val:
        return default
    cleaned = val.strip()
    for item in allowed:
        if item.lower() == cleaned.lower():
            return item
    return default


def derive_risk_level(success_score: float) -> str:
    """Derives project risk level based on continuous predicted success score."""
    if success_score >= 75.0:
        return "Low"
    elif success_score >= 55.0:
        return "Medium"
    return "High"


# ------------------------------------------------------------------------------
# Team Feature Aggregation (PRD §6.2)
# ------------------------------------------------------------------------------

def aggregate_team_features(
    members: List[Employee],
    burnout_map: Optional[Dict[uuid.UUID, float]] = None,
) -> Dict[str, float]:
    """
    Aggregates individual employee profile metrics into team-level statistical inputs:
    Team_Size, Avg_Skill, Avg_Experience, Avg_Performance, Avg_Burnout,
    Avg_Training, Avg_Certifications, Avg_Collaboration, Mentor_Ratio.
    """
    if not members:
        raise ValidationError("Cannot evaluate an empty team. At least one member is required.")

    team_size = float(len(members))
    total_exp = 0.0
    total_perf = 0.0
    total_collab = 0.0
    total_burnout = 0.0
    total_certs = 0.0
    total_training = 0.0
    total_skills_count = 0.0
    mentors_count = 0

    burnout_dict = burnout_map or {}

    for emp in members:
        # Experience
        exp = float(getattr(emp, "experience_years", 3.0))
        total_exp += exp

        # Performance (training median ~0.77, scale 0.0 - 1.0)
        perf = float(getattr(emp, "performance_score", 80.0))
        norm_perf = max(0.1, min(1.0, perf / 100.0))
        total_perf += norm_perf

        # Collaboration (training median ~7.14, scale 1.0 - 10.0)
        collab = float(getattr(emp, "collaboration_score", 80.0))
        norm_collab = max(1.0, min(10.0, collab / 10.0))
        total_collab += norm_collab

        # Burnout score (training median ~5.23, scale 1.0 - 10.0)
        if emp.id in burnout_dict:
            b_val = burnout_dict[emp.id] * 10.0  # from 0-1 to 0-10
        else:
            fatigue = float(getattr(emp, "mental_fatigue_score", 20.0))
            b_val = max(1.0, min(10.0, fatigue / 10.0 if fatigue > 10.0 else fatigue))
        total_burnout += b_val

        # Certifications count
        certs = getattr(emp, "certifications", []) or []
        total_certs += float(len(certs) if certs else 2.0)

        # Training (derived from growth potential or default 50.0)
        growth = float(getattr(emp, "growth_potential", 70.0))
        total_training += max(10.0, min(100.0, growth))

        # Skill proficiency (skills count / average proficiency)
        emp_skills = getattr(emp, "skills", []) or []
        total_skills_count += float(len(emp_skills) if emp_skills else 4.0)

        # Mentor qualification: senior experience (>= 5 yrs) or leadership role
        if exp >= 5.0 or "lead" in getattr(emp, "designation", "").lower() or "senior" in getattr(emp, "designation", "").lower():
            mentors_count += 1

    avg_skill = max(1.0, min(10.0, round(total_skills_count / team_size * 1.5, 2)))
    avg_exp = round(total_exp / team_size, 2)
    avg_perf = round(total_perf / team_size, 3)
    avg_burnout = round(total_burnout / team_size, 2)
    avg_training = round(total_training / team_size, 1)
    avg_certs = round(total_certs / team_size, 2)
    avg_collab = round(total_collab / team_size, 2)
    mentor_ratio = round(mentors_count / team_size, 2)

    return {
        "Team_Size": team_size,
        "Avg_Skill": avg_skill,
        "Avg_Experience": avg_exp,
        "Avg_Performance": avg_perf,
        "Avg_Burnout": avg_burnout,
        "Avg_Training": avg_training,
        "Avg_Certifications": avg_certs,
        "Avg_Collaboration": avg_collab,
        "Mentor_Ratio": mentor_ratio,
    }


def assemble_project_features(project: Project) -> Dict[str, Any]:
    """Extracts project-level complexity, priority, and environmental attributes."""
    priority_raw = getattr(project, "priority", "Medium")
    # Normalize priority
    if priority_raw.lower() in ("critical", "high"):
        priority_cat = "Critical"
    elif priority_raw.lower() == "low":
        priority_cat = "Low"
    else:
        priority_cat = "Medium"

    complexity_raw = getattr(project, "complexity", "Medium")
    complexity_cat = sanitize_categorical(complexity_raw, KNOWN_COMPLEXITIES, "Medium")

    dept_raw = getattr(project, "department", "Engineering")
    dept_cat = sanitize_categorical(dept_raw, KNOWN_DEPARTMENTS, "Engineering")

    # Scale complexity & risks (1.0 to 10.0)
    req_stability = 6.0 if complexity_cat == "Low" else (4.5 if complexity_cat == "Medium" else 3.5)
    tech_risk = 3.5 if complexity_cat == "Low" else (5.0 if complexity_cat == "Medium" else 7.5)
    schedule_pressure = 4.0 if priority_cat == "Low" else (5.5 if priority_cat == "Medium" else 8.0)
    client_engagement = 6.0
    innovation_index = 5.0

    return {
        "Organization": "AgileWorks Co",  # Canonical default for standard workspace
        "Department": dept_cat,
        "Project_Priority": priority_cat,
        "Project_Complexity": complexity_cat,
        "Requirement_Stability": float(req_stability),
        "Tech_Risk": float(tech_risk),
        "Schedule_Pressure": float(schedule_pressure),
        "Client_Engagement": float(client_engagement),
        "Innovation_Index": float(innovation_index),
    }


# ------------------------------------------------------------------------------
# Core Prediction Logic with Target Leakage Prevention
# ------------------------------------------------------------------------------

async def predict_project_success(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    project_id: uuid.UUID,
    formation_id: Optional[uuid.UUID] = None,
    candidate_employee_ids: Optional[List[uuid.UUID]] = None,
    quarter: str = "Q1-2024",
    is_prospective: bool = True,
    post_outcome_features: Optional[Dict[str, float]] = None,
    verified_sources: Optional[Dict[str, str]] = None,
    persist: bool = True,
) -> ProjectSuccessPredictionResponse:
    """
    Executes project success inference using Project_Success_XGBoost.pkl.
    
    CRITICAL REQUIREMENT (PRD §6.2, User Request):
    The model was trained with post-outcome features:
      - Delivery_Delay_Days (17.5% feature importance)
      - Budget_Variance (4.4% feature importance)
      - Scope_Change & Employee_Turnover
    For prospective evaluation (before delivery), these features do NOT exist.
    We explicitly prevent target leakage by:
    1. Flagging is_prospective = True and forecast_trustworthy = False.
    2. Providing an explicit target_leakage_assessment warning.
    3. Applying neutral operational baselines (0.0 delivery delay) rather than
       silently fabricating fake future delays.
    """
    # 1. Verify model availability
    model = model_manager.get_project_success_model()
    if model is None:
        raise AppError(
            message="Project success prediction engine is unavailable. Model artifact is not ready.",
            status_code=503,
            code="MODEL_UNAVAILABLE",
        )

    # 2. Retrieve Project in tenant workspace
    p_query = select(Project).where(
        Project.id == project_id,
        Project.workspace_id == workspace_id,
    )
    p_res = await db.execute(p_query)
    project = p_res.scalar_one_or_none()
    if not project:
        raise NotFoundError(f"Project '{project_id}' not found in the current workspace.")

    # SEC-04: Retrospective evaluation is strictly permitted ONLY for completed projects
    if not is_prospective:
        proj_status = getattr(project, "status", "")
        if (proj_status or "").strip().lower() != "completed":
            raise ValidationError(
                f"Retrospective project success evaluation is only permitted for completed projects. "
                f"Project '{project.id}' is currently in '{proj_status}' status."
            )

    # 3. Resolve team members
    member_ids: List[uuid.UUID] = []
    if candidate_employee_ids:
        member_ids = candidate_employee_ids
    elif formation_id:
        f_query = (
            select(TeamFormation)
            .options(selectinload(TeamFormation.members))
            .where(
                TeamFormation.id == formation_id,
                TeamFormation.project_id == project_id,
            )
        )
        f_res = await db.execute(f_query)
        formation = f_res.scalar_one_or_none()
        if not formation:
            raise NotFoundError(f"Team formation '{formation_id}' not found for project.")
        member_ids = [m.employee_id for m in formation.members]
    else:
        # Fallback: check if project has assigned members
        alloc_query = (
            select(Employee)
            .join(Employee.project_allocations)
            .where(Employee.workspace_id == workspace_id)
        )
        alloc_res = await db.execute(alloc_query)
        members_list = list(alloc_res.scalars().all())
        if not members_list:
            raise ValidationError(
                "No team members specified. Provide formation_id or candidate_employee_ids."
            )
        member_ids = [m.id for m in members_list]

    if not member_ids:
        raise ValidationError("Candidate team has no members to evaluate.")

    # 4. Fetch Employee profiles and latest burnout predictions
    emp_query = (
        select(Employee)
        .options(
            selectinload(Employee.skills),
            selectinload(Employee.certifications),
            selectinload(Employee.burnout_predictions),
        )
        .where(
            Employee.id.in_(member_ids),
            Employee.workspace_id == workspace_id,
        )
    )
    emp_res = await db.execute(emp_query)
    employees = list(emp_res.scalars().all())
    if len(employees) != len(member_ids):
        found_ids = {e.id for e in employees}
        missing = [str(mid) for mid in member_ids if mid not in found_ids]
        raise NotFoundError(f"Some employees were not found in this workspace: {', '.join(missing)}")

    # Build burnout map
    burnout_map: Dict[uuid.UUID, float] = {}
    for emp in employees:
        preds = emp.burnout_predictions or []
        if preds:
            latest = sorted(preds, key=lambda p: p.predicted_at, reverse=True)[0]
            burnout_map[emp.id] = float(latest.predicted_burn_rate)

    # 5. Aggregate team features and project features
    team_feats = aggregate_team_features(employees, burnout_map)
    proj_feats = assemble_project_features(project)

    # 6. Target leakage handling & retrospective outcome provenance verification (Phase 7.1)
    if is_prospective:
        # Prevent target leakage: prospective projects have 0 delay, 0 variance baseline
        delivery_delay = 0.0
        budget_var = 0.0
        turnover = 0.0
        scope_change = 0.0
        has_leakage_risk = True
        forecast_trustworthy = False
        is_self_reported = False
        is_verified = False
        outcome_provenance = None
        leakage_assessment = (
            "Prospective Advisory Simulation: Model Project_Success_XGBoost depends heavily on post-outcome "
            "metrics (Delivery_Delay_Days at 17.5% feature importance, Budget_Variance at 4.4% importance). "
            "Because this is an ex-ante evaluation prior to project delivery, neutral baseline assumptions "
            "(0 delay days, 0 budget variance) were used. This prediction is an advisory team-composition "
            "comparison, not a definitive prospective forecast."
        )
    else:
        # Retrospective evaluation with actual outcomes
        post_feats = post_outcome_features or {}
        outcome_provenance: Dict[str, str] = {}

        # Merge verified sources from project metadata (if any) and verified_sources argument
        known_verified_sources: Dict[str, str] = {}
        if project.risks_metadata and isinstance(project.risks_metadata, dict):
            metadata_sources = project.risks_metadata.get("verified_outcomes")
            if isinstance(metadata_sources, dict):
                known_verified_sources.update(metadata_sources)
        if verified_sources and isinstance(verified_sources, dict):
            known_verified_sources.update(verified_sources)

        # -------------------------------------------------------------
        # Feature 1: Delivery Delay Days
        # -------------------------------------------------------------
        raw_delay = post_feats.get("delivery_delay_days")
        has_system_dates = bool(project.deadline and project.actual_end_date)

        if has_system_dates:
            # Chronological consistency validation
            if project.start_date and project.actual_end_date < project.start_date:
                raise ValidationError(
                    f"Project actual_end_date ({project.actual_end_date}) precedes start_date ({project.start_date})."
                )
            system_delay = max(0.0, float((project.actual_end_date - project.deadline).days))

            if raw_delay is not None:
                try:
                    f_raw_delay = float(raw_delay)
                except (ValueError, TypeError):
                    raise ValidationError(f"Retrospective metric 'delivery_delay_days' must be a numeric value, got: {raw_delay}")
                if math.isnan(f_raw_delay) or math.isinf(f_raw_delay):
                    raise ValidationError("Retrospective metric 'delivery_delay_days' must be a finite number.")
                # Reject conflicting client-supplied delay
                if abs(f_raw_delay - system_delay) > 0.001:
                    raise ValidationError(
                        f"Caller-supplied delivery delay ({f_raw_delay}) conflicts with verified system delay "
                        f"({system_delay:.0f} days derived from deadline {project.deadline} and actual end date {project.actual_end_date})."
                    )
            delivery_delay = system_delay
            outcome_provenance["delivery_delay_days"] = "verified"
        else:
            if raw_delay is None:
                raise ValidationError(
                    "Missing required retrospective outcome feature: 'delivery_delay_days' is not provided and cannot be derived from project dates (missing deadline or actual_end_date)."
                )
            try:
                f_raw_delay = float(raw_delay)
            except (ValueError, TypeError):
                raise ValidationError(f"Retrospective metric 'delivery_delay_days' must be a numeric value, got: {raw_delay}")
            if math.isnan(f_raw_delay) or math.isinf(f_raw_delay):
                raise ValidationError("Retrospective metric 'delivery_delay_days' must be a finite number.")
            if f_raw_delay < 0.0 or f_raw_delay > 730.0:
                if f_raw_delay < 0.0:
                    raise ValidationError(
                        f"Retrospective metric 'delivery_delay_days' cannot be negative (got: {f_raw_delay}). Plausible domain bounds: [0.0, 730.0]."
                    )
                raise ValidationError(
                    f"Retrospective metric 'delivery_delay_days' ({f_raw_delay}) is outside plausible domain bounds [0.0, 730.0]."
                )
            delivery_delay = f_raw_delay
            outcome_provenance["delivery_delay_days"] = (
                "verified" if "delivery_delay_days" in known_verified_sources else "self_reported"
            )

        # -------------------------------------------------------------
        # Feature 2: Budget Variance
        # -------------------------------------------------------------
        raw_budget = post_feats.get("budget_variance")
        if raw_budget is None:
            raise ValidationError(
                "Missing required retrospective outcome feature: 'budget_variance' must be provided for retrospective evaluation."
            )
        try:
            f_budget = float(raw_budget)
        except (ValueError, TypeError):
            raise ValidationError(f"Retrospective metric 'budget_variance' must be a numeric value, got: {raw_budget}")
        if math.isnan(f_budget) or math.isinf(f_budget):
            raise ValidationError("Retrospective metric 'budget_variance' must be a finite number.")
        if f_budget < -100.0 or f_budget > 500.0:
            raise ValidationError(
                f"Retrospective metric 'budget_variance' ({f_budget}) is outside plausible domain bounds [-100.0, 500.0]."
            )
        budget_var = f_budget
        outcome_provenance["budget_variance"] = (
            "verified" if "budget_variance" in known_verified_sources else "self_reported"
        )

        # -------------------------------------------------------------
        # Feature 3: Employee Turnover
        # -------------------------------------------------------------
        raw_turnover = post_feats.get("employee_turnover")
        if raw_turnover is None:
            raise ValidationError(
                "Missing required retrospective outcome feature: 'employee_turnover' must be provided for retrospective evaluation."
            )
        try:
            f_turnover = float(raw_turnover)
        except (ValueError, TypeError):
            raise ValidationError(f"Retrospective metric 'employee_turnover' must be a numeric value, got: {raw_turnover}")
        if math.isnan(f_turnover) or math.isinf(f_turnover):
            raise ValidationError("Retrospective metric 'employee_turnover' must be a finite number.")
        if f_turnover < 0.0 or f_turnover > 100.0:
            if f_turnover < 0.0:
                raise ValidationError(
                    f"Retrospective metric 'employee_turnover' cannot be negative (got: {f_turnover}). Plausible domain bounds: [0.0, 100.0]."
                )
            raise ValidationError(
                f"Retrospective metric 'employee_turnover' ({f_turnover}) is outside plausible domain bounds [0.0, 100.0]."
            )
        turnover = f_turnover
        outcome_provenance["employee_turnover"] = (
            "verified" if "employee_turnover" in known_verified_sources else "self_reported"
        )

        # -------------------------------------------------------------
        # Feature 4: Scope Change
        # -------------------------------------------------------------
        raw_scope = post_feats.get("scope_change")
        if raw_scope is None:
            raise ValidationError(
                "Missing required retrospective outcome feature: 'scope_change' must be provided for retrospective evaluation."
            )
        try:
            f_scope = float(raw_scope)
        except (ValueError, TypeError):
            raise ValidationError(f"Retrospective metric 'scope_change' must be a numeric value, got: {raw_scope}")
        if math.isnan(f_scope) or math.isinf(f_scope):
            raise ValidationError("Retrospective metric 'scope_change' must be a finite number.")
        if f_scope < 0.0 or f_scope > 200.0:
            if f_scope < 0.0:
                raise ValidationError(
                    f"Retrospective metric 'scope_change' cannot be negative (got: {f_scope}). Plausible domain bounds: [0.0, 200.0]."
                )
            raise ValidationError(
                f"Retrospective metric 'scope_change' ({f_scope}) is outside plausible domain bounds [0.0, 200.0]."
            )
        scope_change = f_scope
        outcome_provenance["scope_change"] = (
            "verified" if "scope_change" in known_verified_sources else "self_reported"
        )

        # -------------------------------------------------------------
        # Evaluation-level verification status determination
        # -------------------------------------------------------------
        all_verified = all(v == "verified" for v in outcome_provenance.values())
        has_leakage_risk = False

        if all_verified:
            is_verified = True
            is_self_reported = False
            forecast_trustworthy = True
            leakage_assessment = (
                "Retrospective Verified Evaluation: All 4 required retrospective outcome features are reconciled against "
                f"verified system records (Delivery Delay: {delivery_delay:.0f} days derived from deadline {project.deadline} "
                f"and completion date {project.actual_end_date}; audited budget variance, turnover, and scope change verified "
                "from established records). Evaluated as an authenticated closed-out post-delivery diagnostic."
            )
        else:
            is_verified = False
            is_self_reported = True
            forecast_trustworthy = False  # If one or more required outcome features are self-reported, forecast_trustworthy = False
            unverified_fields = [k for k, v in outcome_provenance.items() if v != "verified"]
            leakage_assessment = (
                f"Retrospective Unverified Evaluation: Evaluated using caller-supplied retrospective metrics (self-reported and unverified). "
                f"The following outcome features lack independent system verification: {', '.join(unverified_fields)}. "
                "Because unverified self-reported metrics are present, this evaluation cannot be treated as an independently verified diagnostic."
            )

    # Assemble complete 23-column DataFrame matching Pipeline preprocessor schema
    input_row = {
        "Organization": proj_feats["Organization"],
        "Quarter": quarter,
        "Department": proj_feats["Department"],
        "Team_Size": team_feats["Team_Size"],
        "Avg_Skill": team_feats["Avg_Skill"],
        "Avg_Experience": team_feats["Avg_Experience"],
        "Avg_Performance": team_feats["Avg_Performance"],
        "Avg_Burnout": team_feats["Avg_Burnout"],
        "Avg_Training": team_feats["Avg_Training"],
        "Avg_Certifications": team_feats["Avg_Certifications"],
        "Avg_Collaboration": team_feats["Avg_Collaboration"],
        "Mentor_Ratio": team_feats["Mentor_Ratio"],
        "Project_Priority": proj_feats["Project_Priority"],
        "Project_Complexity": proj_feats["Project_Complexity"],
        "Requirement_Stability": proj_feats["Requirement_Stability"],
        "Tech_Risk": proj_feats["Tech_Risk"],
        "Schedule_Pressure": proj_feats["Schedule_Pressure"],
        "Client_Engagement": proj_feats["Client_Engagement"],
        "Innovation_Index": proj_feats["Innovation_Index"],
        "Scope_Change": float(scope_change),
        "Employee_Turnover": float(turnover),
        "Budget_Variance": float(budget_var),
        "Delivery_Delay_Days": float(delivery_delay),
    }

    df_input = pd.DataFrame([input_row])

    # 7. Execute inference
    try:
        raw_pred = model.predict(df_input)
        raw_score = float(raw_pred[0])
    except Exception as e:
        logger.error(f"Project success inference failure for project {project_id}: {e}")
        raise AppError(
            message="Project success inference computation failed during model execution.",
            status_code=500,
            code="INFERENCE_EXECUTION_ERROR",
        )

    clamped_score = max(0.0, min(100.0, round(raw_score, 1)))
    risk_level = derive_risk_level(clamped_score)

    # Factor breakdowns
    pos_factors = []
    neg_factors = []

    if team_feats["Avg_Performance"] >= 0.8:
        pos_factors.append(f"Strong team performance baseline ({team_feats['Avg_Performance']:.2f})")
    elif team_feats["Avg_Performance"] < 0.7:
        neg_factors.append(f"Suboptimal team performance baseline ({team_feats['Avg_Performance']:.2f})")

    if team_feats["Mentor_Ratio"] >= 0.3:
        pos_factors.append(f"Balanced seniority and mentorship coverage ({team_feats['Mentor_Ratio'] * 100:.0f}%)")
    else:
        neg_factors.append("Low mentor ratio among candidate members")

    if team_feats["Avg_Burnout"] > 6.0:
        neg_factors.append(f"Elevated aggregate team burnout risk ({team_feats['Avg_Burnout']:.1f}/10)")
    else:
        pos_factors.append("Sustainable team burnout safety margin")

    if proj_feats["Project_Priority"] == "Critical":
        neg_factors.append("Critical project priority escalates delivery stakes")

    now = datetime.now(timezone.utc)
    pred_record = None

    # 8. Persist inference snapshot
    if persist:
        pred_record = MlProjectSuccessPrediction(
            workspace_id=workspace_id,
            project_id=project_id,
            formation_id=formation_id,
            model_version=settings.PROJECT_SUCCESS_MODEL_VERSION,
            predicted_success_score=clamped_score,
            confidence_score=round(0.85 if (forecast_trustworthy and is_verified) else (0.65 if not is_prospective else 0.50), 2),
            aggregated_team_features=team_feats,
            positive_factors=pos_factors,
            negative_factors=neg_factors,
            explanation_shap={
                "target_leakage_assessment": leakage_assessment,
                "is_prospective": is_prospective,
                "forecast_trustworthy": forecast_trustworthy,
                "is_self_reported": is_self_reported,
                "is_verified": is_verified,
                "outcome_provenance": outcome_provenance,
            },
            predicted_at=now,
        )
        db.add(pred_record)
        await db.commit()
        await db.refresh(pred_record)

    pred_id = pred_record.id if pred_record else uuid.uuid4()

    return ProjectSuccessPredictionResponse(
        id=pred_id,
        project_id=project_id,
        formation_id=formation_id,
        model_version=settings.PROJECT_SUCCESS_MODEL_VERSION,
        predicted_success_score=clamped_score,
        risk_level=risk_level,
        confidence_score=round(0.85 if (forecast_trustworthy and is_verified) else (0.65 if not is_prospective else 0.50), 2),
        is_prospective=is_prospective,
        has_target_leakage_risk=has_leakage_risk,
        forecast_trustworthy=forecast_trustworthy,
        is_self_reported=is_self_reported,
        is_verified=is_verified,
        outcome_provenance=outcome_provenance,
        target_leakage_assessment=leakage_assessment,
        aggregated_team_features=team_feats,
        positive_factors=pos_factors,
        negative_factors=neg_factors,
        predicted_at=now,
    )
