"""
NEXAWIS Backend - AWIS Scoring Engine Pydantic Schemas.
Serializes candidate recommendation scores, component breakdowns,
eligibility determinations, and audit trail snapshots.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class AwisComponentScoreItem(BaseModel):
    """Detailed score and diagnostic metadata for a single AWIS factor."""
    model_config = ConfigDict(populate_by_name=True)

    factor: str
    score: Optional[float] = None
    weight: float
    is_available: bool = Field(alias="isAvailable")
    is_stale: bool = Field(alias="isStale")
    evidence: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AwisEligibilityResponse(BaseModel):
    """Structured eligibility outcome."""
    model_config = ConfigDict(populate_by_name=True)

    status: str
    is_actionable: bool = Field(alias="isActionable")
    reasons: List[str] = Field(default_factory=list)
    explanations: List[str] = Field(default_factory=list)
    failed_mandatory_skills: List[str] = Field(default_factory=list, alias="failedMandatorySkills")


class AwisCandidateItem(BaseModel):
    """Candidate employee evaluation item with AWIS breakdown and explainability."""
    model_config = ConfigDict(populate_by_name=True)

    employee_id: str = Field(alias="employeeId")
    employee_code: str = Field(alias="employeeCode")
    name: str
    department: str
    designation: str
    avatar_url: Optional[str] = Field(default=None, alias="avatarUrl")

    composite_score: Optional[float] = Field(default=None, alias="compositeScore")
    rank_position: Optional[int] = Field(default=None, alias="rankPosition")
    ranking_tier: Optional[int] = Field(default=None, alias="rankingTier")
    eligibility: AwisEligibilityResponse
    is_actionable: bool = Field(alias="isActionable")
    is_complete: bool = Field(alias="isComplete")
    is_provisional: bool = Field(alias="isProvisional")
    weighted_completeness: float = Field(alias="weightedCompleteness")

    components: Dict[str, AwisComponentScoreItem]
    missing_factors: List[str] = Field(default_factory=list, alias="missingFactors")
    stale_factors: List[str] = Field(default_factory=list, alias="staleFactors")

    positive_factors: List[str] = Field(default_factory=list, alias="positiveFactors")
    concern_factors: List[str] = Field(default_factory=list, alias="concernFactors")
    summary_explanation: str = Field(alias="summaryExplanation")
    formula_version: str = Field(alias="formulaVersion")


class AwisCandidateListResponse(BaseModel):
    """Paginated list of ranked candidate recommendations for a project."""
    model_config = ConfigDict(populate_by_name=True)

    project_id: str = Field(alias="projectId")
    project_code: str = Field(alias="projectCode")
    project_priority: str = Field(alias="projectPriority")
    selected_profile: str = Field(alias="selectedProfile")
    formula_version: str = Field(alias="formulaVersion")
    completeness_threshold: float = Field(alias="completenessThreshold")

    actionable_count: int = Field(alias="actionableCount")
    non_actionable_count: int = Field(alias="nonActionableCount")
    items: List[AwisCandidateItem]
    non_actionable_items: Optional[List[AwisCandidateItem]] = Field(default=None, alias="nonActionableItems")

    total: int
    page: int
    page_size: int = Field(alias="pageSize")


class AwisConfigResponse(BaseModel):
    """Exposes versioned scoring profiles and operational thresholds."""
    model_config = ConfigDict(populate_by_name=True)

    profiles: Dict[str, Dict[str, float]]
    critical_factors: List[str] = Field(alias="criticalFactors")
    completeness_threshold: float = Field(alias="completenessThreshold")
    freshness_policies_days: Dict[str, int] = Field(alias="freshnessPoliciesDays")
    formula_version: str = Field(alias="formulaVersion")
    workload_policy: Optional[Dict[str, float]] = Field(default=None, alias="workloadPolicy")


class AwisSnapshotRequest(BaseModel):
    """Request payload to persist an evaluation run snapshot."""
    model_config = ConfigDict(populate_by_name=True)

    save_top_n: int = Field(default=10, ge=1, le=50, alias="saveTopN")
    include_ineligible: bool = Field(default=False, alias="includeIneligible")
    notes: Optional[str] = None


class AwisSnapshotResponse(BaseModel):
    """Confirmation of persisted AWIS evaluations."""
    model_config = ConfigDict(populate_by_name=True)

    saved_count: int = Field(alias="savedCount")
    scoring_version: str = Field(alias="scoringVersion")
    project_id: str = Field(alias="projectId")
    evaluated_at: str = Field(alias="evaluatedAt")
    message: str
