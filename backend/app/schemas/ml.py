"""
NEXAWIS Backend - Machine Learning Inference Schemas.
Pydantic schemas for model health, burnout risk inference, and project success prediction.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


# ------------------------------------------------------------------------------
# Model Lifecycle & Health Schemas
# ------------------------------------------------------------------------------

class ModelArtifactStatus(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., description="Canonical model artifact name")
    version: str = Field(..., description="Semantic or tracked model version")
    is_loaded: bool = Field(..., description="True if loaded and self-tested successfully in memory")
    status: str = Field(..., description="'ready', 'failed', 'missing', or 'unloaded'")
    checksum_verified: bool = Field(..., description="True if SHA-256 matches verified build manifest")
    expected_features_count: int = Field(..., description="Number of expected input features")
    error: Optional[str] = Field(None, description="Sanitized load error message without internal file paths")


class MlModelsHealthResponse(BaseModel):
    status: str = Field(..., description="'healthy' (all ready), 'degraded' (partial), or 'unavailable'")
    models: Dict[str, ModelArtifactStatus] = Field(..., description="Artifact status keyed by model identifier")
    timestamp: datetime = Field(..., description="UTC timestamp of the status evaluation")


class MlPublicHealthResponse(BaseModel):
    status: str = Field(..., description="'healthy' (all ready), 'degraded' (partial), or 'unavailable'")
    service: str = Field("ml-inference", description="Subsystem identity")
    timestamp: datetime = Field(..., description="UTC timestamp of the status evaluation")


# ------------------------------------------------------------------------------
# Burnout Prediction Schemas
# ------------------------------------------------------------------------------

class BurnoutInferenceOverride(BaseModel):
    """Optional manual feature overrides for simulation or what-if analysis."""
    model_config = ConfigDict(populate_by_name=True)

    weekly_work_hours: Optional[float] = Field(None, ge=0.0, le=100.0, alias="weeklyWorkHours")
    overtime_hours: Optional[float] = Field(None, ge=0.0, le=60.0, alias="overtimeHours")
    consecutive_working_days: Optional[int] = Field(None, ge=0, le=60, alias="consecutiveWorkingDays")
    utilization_percentage: Optional[float] = Field(None, ge=0.0, le=200.0, alias="utilizationPercentage")
    mental_fatigue_score: Optional[float] = Field(None, ge=0.0, le=100.0, alias="mentalFatigueScore")



class BurnoutInferenceRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    overrides: Optional[BurnoutInferenceOverride] = Field(None, description="Optional overrides for workload features")


class BurnoutPredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    employee_id: uuid.UUID = Field(..., alias="employeeId")
    model_version: str = Field(..., alias="modelVersion")
    
    # Statistical regression output semantics (PRD §6.1)
    predicted_burn_rate: Optional[float] = Field(
        None,
        alias="predictedBurnRate",
        description="Continuous raw regression burn rate in [0.0, 1.0]. Redacted for unauthorized roles.",
    )
    normalized_burnout_score: float = Field(
        ...,
        alias="normalizedBurnoutScore",
        description="Internal scaled burnout score [0.0 - 100.0].",
    )
    risk_tier: str = Field(
        ...,
        alias="riskTier",
        description="Categorical risk tier: 'Low', 'Moderate', or 'High'.",
    )
    target_semantics: str = Field(
        default="Continuous statistical regression index [0.0 - 1.0]. Not a calibrated psychological probability.",
        alias="targetSemantics",
    )

    # Explainability & provenance (masked for users without EMPLOYEES_WELLBEING_VIEW)
    feature_provenance: Optional[Dict[str, Any]] = Field(
        None,
        alias="featureProvenance",
        description="Input features at inference time. Redacted for unauthorized roles.",
    )
    contributing_factors: Optional[List[Dict[str, Any]]] = Field(
        None,
        alias="contributingFactors",
        description="Top driving workload and fatigue factors. Redacted for unauthorized roles.",
    )
    predicted_at: datetime = Field(..., alias="predictedAt")


class BurnoutBatchPredictRequest(BaseModel):
    employee_ids: Optional[List[uuid.UUID]] = Field(
        None,
        alias="employeeIds",
        description="Optional list of employee IDs. If omitted, evaluates all active employees in workspace.",
    )


class BurnoutBatchPredictResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    total_evaluated: int = Field(..., alias="totalEvaluated")
    success_count: int = Field(..., alias="successCount")
    failure_count: int = Field(..., alias="failureCount")
    predictions: List[BurnoutPredictionResponse] = Field(..., alias="predictions")
    errors: Optional[List[Dict[str, Any]]] = Field(
        None,
        alias="errors",
        description="Per-employee failure details for unpredicted records (e.g. missing wellbeing data, stale workload).",
    )


# ------------------------------------------------------------------------------
# Project Success Prediction Schemas
# ------------------------------------------------------------------------------

class ProjectSuccessProspectiveRequest(BaseModel):
    """
    Request for prospective project success inference.
    Candidate team members are aggregated to team-level features.
    Post-outcome metrics (delay days, budget variance) are explicitly omitted to prevent target leakage.
    """
    model_config = ConfigDict(populate_by_name=True)

    formation_id: Optional[uuid.UUID] = Field(
        None,
        alias="formationId",
        description="ID of an existing candidate team formation to evaluate.",
    )
    candidate_employee_ids: Optional[List[uuid.UUID]] = Field(
        None,
        alias="candidateEmployeeIds",
        description="Direct candidate employee IDs if evaluating before formation record creation.",
    )
    # Optional prospective assumptions
    quarter: Optional[str] = Field("Q1-2024", description="Project execution quarter e.g. 'Q1-2024'")


class ProjectSuccessRetrospectiveRequest(BaseModel):
    """
    Request for retrospective or diagnostic project success evaluation with actual closed-out metrics.
    Only permitted for completed projects.
    """
    model_config = ConfigDict(populate_by_name=True)

    formation_id: Optional[uuid.UUID] = Field(None, alias="formationId")
    candidate_employee_ids: Optional[List[uuid.UUID]] = Field(None, alias="candidateEmployeeIds")
    quarter: Optional[str] = Field("Q1-2024", description="Execution quarter")
    delivery_delay_days: Optional[float] = Field(
        None,
        ge=0.0,
        le=730.0,
        alias="deliveryDelayDays",
        description="Actual delivery delay in days past schedule (must be non-negative and <= 730).",
    )
    budget_variance: Optional[float] = Field(
        None,
        ge=-100.0,
        le=500.0,
        alias="budgetVariance",
        description="Actual budget variance percentage (-100% to +500%).",
    )
    employee_turnover: Optional[float] = Field(
        None,
        ge=0.0,
        le=100.0,
        alias="employeeTurnover",
        description="Actual employee turnover percentage (0% to 100%).",
    )
    scope_change: Optional[float] = Field(
        None,
        ge=0.0,
        le=200.0,
        alias="scopeChange",
        description="Actual scope change percentage (0% to 200%).",
    )
    verified_sources: Optional[Dict[str, str]] = Field(
        None,
        alias="verifiedSources",
        description="Optional provenance annotations identifying verified system sources (e.g. {'budget_variance': 'audited_financials'}).",
    )


class ProjectSuccessPredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    project_id: uuid.UUID = Field(..., alias="projectId")
    formation_id: Optional[uuid.UUID] = Field(None, alias="formationId")
    model_version: str = Field(..., alias="modelVersion")
    
    # Model output
    predicted_success_score: float = Field(
        ...,
        alias="predictedSuccessScore",
        description="Continuous regression success score in [0.0, 100.0].",
    )
    risk_level: str = Field(
        ...,
        alias="riskLevel",
        description="Categorical risk tier: 'Low' (score >= 75), 'Medium' (55-75), 'High' (< 55).",
    )
    confidence_score: Optional[float] = Field(None, alias="confidenceScore")

    # Target leakage and prospective validity governance (PRD §6.2)
    is_prospective: bool = Field(
        ...,
        alias="isProspective",
        description="True if evaluated prospectively before project delivery.",
    )
    has_target_leakage_risk: bool = Field(
        ...,
        alias="hasTargetLeakageRisk",
        description="True if post-outcome features were unavailable and neutral assumptions were applied.",
    )
    forecast_trustworthy: bool = Field(
        ...,
        alias="forecastTrustworthy",
        description="False for prospective forecasts or unverified self-reported retrospective metrics.",
    )
    is_self_reported: bool = Field(
        default=False,
        alias="isSelfReported",
        description="True if retrospective metrics were supplied by caller rather than verified records.",
    )
    is_verified: bool = Field(
        default=False,
        alias="isVerified",
        description="True if outcomes are reconciled against verified system completion records.",
    )
    outcome_provenance: Optional[Dict[str, str]] = Field(
        None,
        alias="outcomeProvenance",
        description="Per-feature provenance tracking (e.g. {'delivery_delay_days': 'verified', 'budget_variance': 'self_reported'}).",
    )
    target_leakage_assessment: str = Field(
        ...,
        alias="targetLeakageAssessment",
        description="Explicit documentation of feature leakage limitations and forecasting caveats.",
    )

    # Aggregated team & factor breakdown
    aggregated_team_features: Optional[Dict[str, Any]] = Field(None, alias="aggregatedTeamFeatures")
    positive_factors: Optional[List[str]] = Field(None, alias="positiveFactors")
    negative_factors: Optional[List[str]] = Field(None, alias="negativeFactors")
    predicted_at: datetime = Field(..., alias="predictedAt")
