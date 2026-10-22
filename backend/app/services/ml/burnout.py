"""
NEXAWIS Backend - Burnout Risk Inference Service.
Integrates the pre-trained XGBoost Burnout Regression model (burnout_model.pkl).
Validates inputs, maps operational features, executes inference, and persists
prediction records while enforcing role-based wellbeing data masking.
"""

import math
import uuid
from datetime import datetime, timezone, date, timedelta
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.exceptions import AppError, NotFoundError, ValidationError, AuthorizationError
from app.core.logging import logger
from app.models.employee import Employee, EmployeeWorkloadHistory
from app.models.ml_results import MlBurnoutPrediction
from app.schemas.ml import (
    BurnoutInferenceOverride,
    BurnoutPredictionResponse,
)
from app.services.ml.loader import model_manager

# Configurable freshness policy: workload records older than 30 days are considered stale
DEFAULT_WORKLOAD_FRESHNESS_DAYS: int = 30


# ------------------------------------------------------------------------------
# Feature Mapping Constants
# ------------------------------------------------------------------------------

DESIGNATION_HIERARCHY: Dict[str, int] = {
    # 0: Intern / Entry
    "intern": 0,
    "trainee": 0,
    "entry": 0,
    "junior": 0,
    "junior engineer": 0,
    "junior developer": 0,
    "qa engineer i": 0,
    # 1: Associate
    "associate": 1,
    "associate engineer": 1,
    "engineer i": 1,
    "developer i": 1,
    "specialist i": 1,
    # 2: Mid-Level
    "software engineer": 2,
    "engineer ii": 2,
    "developer ii": 2,
    "full stack engineer": 2,
    "frontend engineer": 2,
    "backend engineer": 2,
    "devops engineer": 2,
    "data engineer": 2,
    "qa engineer": 2,
    "consultant": 2,
    # 3: Senior
    "senior engineer": 3,
    "senior developer": 3,
    "senior software engineer": 3,
    "senior devops engineer": 3,
    "senior qa engineer": 3,
    "senior specialist": 3,
    # 4: Lead / Staff / Architect
    "lead": 4,
    "tech lead": 4,
    "team lead": 4,
    "staff engineer": 4,
    "architect": 4,
    "solutions architect": 4,
    # 5: Principal / Executive / Manager
    "principal": 5,
    "principal engineer": 5,
    "engineering manager": 5,
    "director": 5,
    "vp": 5,
}

COMPANY_TYPE_MAP: Dict[str, int] = {
    "service": 0,
    "consulting": 0,
    "agency": 0,
    "product": 1,
    "saas": 1,
    "enterprise": 1,
}


SENIORITY_KEYWORD_ORDER = [
    ("principal", 5),
    ("director", 5),
    ("vp", 5),
    ("manager", 5),
    ("lead", 4),
    ("staff", 4),
    ("architect", 4),
    ("senior", 3),
    ("sr.", 3),
    ("sr ", 3),
    ("associate", 1),
    ("junior", 0),
    ("intern", 0),
    ("trainee", 0),
    ("entry", 0),
]


def map_designation_to_int(designation_str: Optional[str]) -> int:
    """Deterministically maps a designation string to a numeric level [0 - 5]."""
    if not designation_str:
        return 2  # Default to Mid-Level

    cleaned = designation_str.strip().lower()
    if cleaned in DESIGNATION_HIERARCHY:
        return DESIGNATION_HIERARCHY[cleaned]

    # Keyword priority matching for compound titles (e.g. "Senior Full Stack Engineer")
    for keyword, level in SENIORITY_KEYWORD_ORDER:
        if keyword in cleaned:
            return level

    return 2  # Safe fallback to Mid-Level


def map_company_type_to_int(company_type_str: Optional[str]) -> int:
    """Maps company type string to 0 (Service) or 1 (Product)."""
    if not company_type_str:
        return 0
    return COMPANY_TYPE_MAP.get(company_type_str.strip().lower(), 0)


def normalize_mental_fatigue_score(raw_score: Optional[float]) -> float:
    """
    Normalizes mental fatigue score to the model's expected 0.0 - 10.0 scale.
    If input is on a 0 - 100 percentage scale (e.g. 20.0), scales down to 2.0.
    Rejects None, non-finite, and out-of-range values with ValidationError.
    Never silently defaults missing sensitive measurements.
    """
    if raw_score is None:
        raise ValidationError("Mental fatigue score is required and cannot be null.")

    try:
        val = float(raw_score)
    except (ValueError, TypeError):
        raise ValidationError(f"Invalid mental fatigue score: {raw_score}. Must be a real number.")

    if math.isnan(val) or math.isinf(val):
        raise ValidationError("Mental fatigue score must be a finite real number.")

    if val < 0.0 or val > 100.0:
        raise ValidationError(f"Mental fatigue score ({val}) is out of bounds [0.0, 100.0].")

    if val > 10.0:
        val = val / 10.0

    return max(0.0, min(10.0, round(val, 2)))


def derive_risk_tier(burn_rate: float) -> str:
    """Categorizes continuous burn rate into standard clinical/operational tiers."""
    if burn_rate < 0.35:
        return "Low"
    elif burn_rate < 0.70:
        return "Moderate"
    return "High"


# ------------------------------------------------------------------------------
# Feature Assembly & Validation
# ------------------------------------------------------------------------------

def extract_burnout_features(
    employee: Employee,
    workload: Optional[EmployeeWorkloadHistory] = None,
    overrides: Optional[BurnoutInferenceOverride] = None,
) -> Dict[str, Any]:
    """
    Assembles and validates the exact 10 input features expected by burnout_model.pkl:
    ['Company_Type', 'WFH_Setup_Available', 'Designation', 'Experience_Years',
     'Resource_Allocation', 'Mental_Fatigue_Score', 'Weekly_Work_Hours',
     'Overtime_Hours', 'Utilization_Percentage', 'Consecutive_Working_Days']
    
    Enforces strict input validation:
    - Never calls float(None) on nullable DB columns.
    - Rejects missing or non-finite experience_years and current_workload_percent.
    - Never silently fabricates mental fatigue or workload history.
    - Requires valid simulation overrides if database measurements are absent.
    """
    # 1. Company Type mapping & validation
    company_raw = getattr(employee, "company_type", None)
    if company_raw is None or not str(company_raw).strip():
        company_type = 0  # Service baseline
    else:
        cleaned_company = str(company_raw).strip().lower()
        if cleaned_company not in COMPANY_TYPE_MAP:
            raise ValidationError(
                f"Invalid company_type: '{company_raw}'. Expected Service, Consulting, Agency, Product, or SaaS."
            )
        company_type = COMPANY_TYPE_MAP[cleaned_company]

    # 2. WFH Setup
    wfh_raw = getattr(employee, "wfh_setup_available", None)
    wfh_setup = 1 if (wfh_raw is True or wfh_raw == 1 or wfh_raw is None) else 0

    # 3. Designation hierarchy mapping
    desig_raw = getattr(employee, "designation", "")
    designation = map_designation_to_int(desig_raw)

    # 4. Experience Years (Strict validation against nullable DB state)
    raw_exp = getattr(employee, "experience_years", None)
    if raw_exp is None:
        raise ValidationError("Employee 'experience_years' is required and cannot be null.")
    try:
        exp_val = float(raw_exp)
    except (ValueError, TypeError):
        raise ValidationError(f"Invalid experience_years value: {raw_exp}. Must be a real number.")
    if math.isnan(exp_val) or math.isinf(exp_val):
        raise ValidationError("Employee 'experience_years' must be a finite number.")
    if exp_val < 0.0 or exp_val > 60.0:
        raise ValidationError(f"Employee 'experience_years' ({exp_val}) is out of realistic range [0.0, 60.0].")
    experience_years = round(exp_val, 1)

    # 5. Resource Allocation from current_workload_percent (Strict validation)
    raw_workload_pct = getattr(employee, "current_workload_percent", None)
    if raw_workload_pct is None:
        raise ValidationError("Employee 'current_workload_percent' is required and cannot be null.")
    try:
        workload_pct_val = float(raw_workload_pct)
    except (ValueError, TypeError):
        raise ValidationError(f"Invalid current_workload_percent value: {raw_workload_pct}. Must be a real number.")
    if math.isnan(workload_pct_val) or math.isinf(workload_pct_val):
        raise ValidationError("Employee 'current_workload_percent' must be a finite number.")
    if workload_pct_val < 0.0 or workload_pct_val > 250.0:
        raise ValidationError(f"Employee 'current_workload_percent' ({workload_pct_val}) is out of bounds [0.0, 250.0].")
    resource_alloc = max(1.0, min(10.0, round(workload_pct_val / 10.0, 1)))

    # 6. Sensitive Mental Fatigue Score (Strict: never default missing measurement)
    fatigue_val = None
    if overrides and overrides.mental_fatigue_score is not None:
        fatigue_val = overrides.mental_fatigue_score
    elif getattr(employee, "mental_fatigue_score", None) is not None:
        fatigue_val = employee.mental_fatigue_score
    elif workload and getattr(workload, "mental_fatigue_score", None) is not None:
        fatigue_val = workload.mental_fatigue_score

    if fatigue_val is None:
        raise ValidationError(
            "Missing required sensitive wellbeing measurement: 'mental_fatigue_score' is absent for this employee. "
            "Burnout risk inference cannot proceed without a verified measurement or authorized simulation override."
        )
    fatigue_normalized = normalize_mental_fatigue_score(fatigue_val)

    # 7. Workload History Metrics (Strict: never default consecutive days or hours when missing)
    has_full_workload_overrides = (
        overrides is not None
        and overrides.weekly_work_hours is not None
        and overrides.consecutive_working_days is not None
        and overrides.utilization_percentage is not None
    )

    if workload is None and not has_full_workload_overrides:
        raise ValidationError(
            "Missing workload history: No valid workload history record exists for this employee, "
            "and complete simulation overrides were not provided."
        )

    if workload is not None:
        raw_days = getattr(workload, "consecutive_working_days", None)
        if raw_days is None:
            raise ValidationError("Workload history record is missing 'consecutive_working_days'.")
        try:
            days_val = int(raw_days)
        except (ValueError, TypeError):
            raise ValidationError(f"Invalid consecutive_working_days in history: {raw_days}.")
        if days_val < 0 or days_val > 60:
            raise ValidationError(f"Workload history consecutive_working_days ({days_val}) is out of bounds [0, 60].")
        consecutive_days = days_val

        raw_weekly = getattr(workload, "weekly_work_hours", None)
        if raw_weekly is None:
            raise ValidationError("Workload history record is missing 'weekly_work_hours'.")
        try:
            weekly_val = float(raw_weekly)
        except (ValueError, TypeError):
            raise ValidationError(f"Invalid weekly_work_hours in history: {raw_weekly}.")
        if math.isnan(weekly_val) or math.isinf(weekly_val) or weekly_val < 0.0 or weekly_val > 120.0:
            raise ValidationError(f"Workload history weekly_work_hours ({weekly_val}) is out of bounds [0.0, 120.0].")
        weekly_hours = weekly_val

        raw_ot = getattr(workload, "overtime_hours", 0.0)
        try:
            ot_val = float(raw_ot) if raw_ot is not None else 0.0
        except (ValueError, TypeError):
            raise ValidationError(f"Invalid overtime_hours in history: {raw_ot}.")
        if math.isnan(ot_val) or math.isinf(ot_val) or ot_val < 0.0 or ot_val > 80.0:
            raise ValidationError(f"Workload history overtime_hours ({ot_val}) is out of bounds [0.0, 80.0].")
        overtime_hours = ot_val

        raw_util = getattr(workload, "utilization_percentage", None)
        if raw_util is None:
            raise ValidationError("Workload history record is missing 'utilization_percentage'.")
        try:
            util_val = float(raw_util)
        except (ValueError, TypeError):
            raise ValidationError(f"Invalid utilization_percentage in history: {raw_util}.")
        if math.isnan(util_val) or math.isinf(util_val) or util_val < 0.0 or util_val > 250.0:
            raise ValidationError(f"Workload history utilization_percentage ({util_val}) is out of bounds [0.0, 250.0].")
        utilization_pct = util_val
    else:
        # Defaults provided via overrides
        consecutive_days = 0
        weekly_hours = 40.0
        overtime_hours = 0.0
        utilization_pct = 80.0

    # Apply explicit validated simulation overrides if provided
    if overrides:
        if overrides.weekly_work_hours is not None:
            w_val = float(overrides.weekly_work_hours)
            if math.isnan(w_val) or math.isinf(w_val) or w_val < 0.0 or w_val > 120.0:
                raise ValidationError(f"Simulation override weekly_work_hours ({w_val}) out of bounds [0.0, 120.0].")
            weekly_hours = w_val
        if overrides.overtime_hours is not None:
            ot_val = float(overrides.overtime_hours)
            if math.isnan(ot_val) or math.isinf(ot_val) or ot_val < 0.0 or ot_val > 80.0:
                raise ValidationError(f"Simulation override overtime_hours ({ot_val}) out of bounds [0.0, 80.0].")
            overtime_hours = ot_val
        if overrides.consecutive_working_days is not None:
            d_val = int(overrides.consecutive_working_days)
            if d_val < 0 or d_val > 60:
                raise ValidationError(f"Simulation override consecutive_working_days ({d_val}) out of bounds [0, 60].")
            consecutive_days = d_val
        if overrides.utilization_percentage is not None:
            u_val = float(overrides.utilization_percentage)
            if math.isnan(u_val) or math.isinf(u_val) or u_val < 0.0 or u_val > 250.0:
                raise ValidationError(f"Simulation override utilization_percentage ({u_val}) out of bounds [0.0, 250.0].")
            utilization_pct = u_val

    return {
        "Company_Type": int(company_type),
        "WFH_Setup_Available": int(wfh_setup),
        "Designation": int(designation),
        "Experience_Years": float(experience_years),
        "Resource_Allocation": float(resource_alloc),
        "Mental_Fatigue_Score": float(fatigue_normalized),
        "Weekly_Work_Hours": float(max(10.0, min(100.0, weekly_hours))),
        "Overtime_Hours": float(max(0.0, min(60.0, overtime_hours))),
        "Utilization_Percentage": float(max(0.0, min(200.0, utilization_pct))),
        "Consecutive_Working_Days": int(max(0, min(60, consecutive_days))),
    }


def compute_contributing_factors(features: Dict[str, Any], burn_rate: float) -> List[Dict[str, Any]]:
    """
    Computes explainable driving factors based on verified tree split importance:
    Consecutive_Working_Days (~60%), Mental_Fatigue_Score (~26%), Resource_Allocation (~8%).
    """
    factors = []
    
    consec_days = features.get("Consecutive_Working_Days", 5)
    if consec_days > 7:
        factors.append({
            "factor": "Consecutive Working Days",
            "value": f"{consec_days} days without scheduled recovery",
            "impact": "High Risk Driver" if consec_days > 10 else "Elevated Risk Driver",
            "direction": "increases_risk",
        })

    fatigue = features.get("Mental_Fatigue_Score", 2.0)
    if fatigue > 5.0:
        factors.append({
            "factor": "Mental Fatigue Score",
            "value": f"{fatigue:.1f}/10.0",
            "impact": "Primary Risk Driver" if fatigue > 7.0 else "Moderate Risk Driver",
            "direction": "increases_risk",
        })

    overtime = features.get("Overtime_Hours", 0.0)
    if overtime > 5.0:
        factors.append({
            "factor": "Weekly Overtime Hours",
            "value": f"{overtime:.1f} hours",
            "impact": "Contributing Risk Driver",
            "direction": "increases_risk",
        })

    resource_alloc = features.get("Resource_Allocation", 5.0)
    if resource_alloc > 8.0:
        factors.append({
            "factor": "High Resource Allocation",
            "value": f"{resource_alloc:.1f}/10.0",
            "impact": "Capacity Pressure",
            "direction": "increases_risk",
        })

    if not factors:
        factors.append({
            "factor": "Workload Baseline",
            "value": "Workload indicators within sustainable operational bounds",
            "impact": "Protective Factor",
            "direction": "decreases_risk",
        })

    return factors


# ------------------------------------------------------------------------------
# Core Prediction Execution
# ------------------------------------------------------------------------------

async def predict_employee_burnout(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID,
    overrides: Optional[BurnoutInferenceOverride] = None,
    persist: bool = True,
    can_view_wellbeing: bool = True,
) -> BurnoutPredictionResponse:
    """
    Performs verified ML burnout risk inference for a specific employee.
    Enforces workspace isolation, checks model readiness, runs inference,
    persists results to ml_burnout_predictions, and masks sensitive data if unauthorized.
    """
    # 1. Verify model availability
    model = model_manager.get_burnout_model()
    if model is None:
        raise AppError(
            message="Burnout risk inference engine is currently unavailable. Model artifact is not ready.",
            status_code=503,
            code="MODEL_UNAVAILABLE",
        )

    # 2. Retrieve Employee in tenant workspace
    query = select(Employee).where(
        Employee.id == employee_id,
        Employee.workspace_id == workspace_id,
    )
    result = await db.execute(query)
    employee = result.scalar_one_or_none()
    if not employee:
        raise NotFoundError(f"Employee '{employee_id}' not found in the current workspace.")

    # 3. Security: Check authorization for sensitive wellbeing overrides
    if overrides and overrides.mental_fatigue_score is not None:
        if not can_view_wellbeing:
            raise AuthorizationError(
                "Permission EMPLOYEES_WELLBEING_VIEW is required to supply sensitive mental fatigue simulation overrides."
            )

    # 4. Retrieve latest workload history and enforce freshness policy (SEC-03)
    wl_query = (
        select(EmployeeWorkloadHistory)
        .where(EmployeeWorkloadHistory.employee_id == employee_id)
        .order_by(EmployeeWorkloadHistory.recorded_date.desc())
        .limit(1)
    )
    wl_res = await db.execute(wl_query)
    latest_workload = wl_res.scalar_one_or_none()

    has_full_workload_overrides = (
        overrides is not None
        and overrides.weekly_work_hours is not None
        and overrides.consecutive_working_days is not None
        and overrides.utilization_percentage is not None
    )

    if not has_full_workload_overrides:
        if latest_workload is None:
            raise ValidationError(
                f"Employee '{employee_id}' has no workload history on record. "
                f"A measured record within {DEFAULT_WORKLOAD_FRESHNESS_DAYS} days is required for burnout inference."
            )
        today = date.today()
        cutoff_date = today - timedelta(days=DEFAULT_WORKLOAD_FRESHNESS_DAYS)
        rec_date = latest_workload.recorded_date
        if rec_date < cutoff_date:
            raise ValidationError(
                f"Workload history for employee '{employee_id}' is stale. "
                f"Latest record date is {rec_date}, which exceeds the {DEFAULT_WORKLOAD_FRESHNESS_DAYS}-day freshness policy (cutoff: {cutoff_date})."
            )
        if rec_date > today:
            raise ValidationError(
                f"Workload history record date {rec_date} is in the future, which violates temporal integrity."
            )

    # 5. Assemble and validate input feature vector
    features = extract_burnout_features(employee, latest_workload, overrides)
    df_input = pd.DataFrame([features])

    # 5. Execute model inference
    try:
        raw_pred = model.predict(df_input)
        raw_burn_rate = float(raw_pred[0])
    except Exception as e:
        logger.error(f"Inference failure for employee {employee_id}: {e}")
        raise AppError(
            message="Inference computation failed during model execution.",
            status_code=500,
            code="INFERENCE_EXECUTION_ERROR",
        )

    # Sanity bounds and scaling
    clamped_burn_rate = max(0.0, min(1.0, raw_burn_rate))
    normalized_score = round(clamped_burn_rate * 100.0, 1)
    risk_tier = derive_risk_tier(clamped_burn_rate)
    contributing_factors = compute_contributing_factors(features, clamped_burn_rate)

    now = datetime.now(timezone.utc)
    pred_record = None

    # 6. Persist inference snapshot if requested
    if persist:
        pred_record = MlBurnoutPrediction(
            workspace_id=workspace_id,
            employee_id=employee_id,
            model_version=settings.BURNOUT_MODEL_VERSION,
            predicted_burn_rate=round(clamped_burn_rate, 4),
            normalized_burnout_score=normalized_score,
            risk_tier=risk_tier,
            feature_provenance=features,
            explanation_shap={"contributing_factors": contributing_factors},
            predicted_at=now,
        )
        db.add(pred_record)
        await db.commit()
        await db.refresh(pred_record)

    # 7. Apply role-based wellbeing data masking (PRD §3, §10.2)
    # If caller lacks EMPLOYEES_WELLBEING_VIEW, mask raw burn rate, fatigue, and features
    pred_id = pred_record.id if pred_record else uuid.uuid4()
    
    if can_view_wellbeing:
        return BurnoutPredictionResponse(
            id=pred_id,
            employee_id=employee_id,
            model_version=settings.BURNOUT_MODEL_VERSION,
            predicted_burn_rate=round(clamped_burn_rate, 4),
            normalized_burnout_score=normalized_score,
            risk_tier=risk_tier,
            feature_provenance=features,
            contributing_factors=contributing_factors,
            predicted_at=now,
        )
    else:
        # Masked response for Project Managers, Employees, Leadership
        return BurnoutPredictionResponse(
            id=pred_id,
            employee_id=employee_id,
            model_version=settings.BURNOUT_MODEL_VERSION,
            predicted_burn_rate=None,  # Redacted
            normalized_burnout_score=normalized_score,
            risk_tier=risk_tier,
            feature_provenance=None,   # Redacted
            contributing_factors=None, # Redacted
            predicted_at=now,
        )
