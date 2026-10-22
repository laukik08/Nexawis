"""
NEXAWIS Backend - Team Formation and Optimization Schemas.
Pydantic v2 schemas for team recommendation requests, candidate evaluations,
sustainability metrics, distinct alternatives, and assignment finalization.
"""

import uuid
from datetime import datetime, date
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, ConfigDict, Field


FormationOptionType = Literal[
    "autonomous_ai",
    "fatigue_safe",
    "high_velocity",
    "growth_mentorship",
    "rebalance_existing",
    "custom_constraints",
]


class CandidateWhySelected(BaseModel):
    """Transparent human-readable explainability rationale for candidate selection."""
    summary: str
    strengths: List[str] = Field(default_factory=list)
    considerations: List[str] = Field(default_factory=list)


class TeamCandidateResponse(BaseModel):
    """Candidate representation with individual AWIS scores, role assignment, and tier."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_code: str
    name: str
    avatar_url: Optional[str] = None
    role: str
    department: str
    assigned_role: str
    match_score: float = Field(..., ge=0.0, le=100.0)
    skill_match_percent: float = Field(..., ge=0.0, le=100.0)
    performance_score: Optional[float] = None
    availability_percent: Optional[float] = None
    current_workload_percent: Optional[float] = None
    projected_workload_percent: Optional[float] = None
    wellbeing_risk: str = "Low"
    awis_score: Optional[float] = None
    ranking_tier: Optional[int] = None
    is_provisional: bool = False
    needs_review: bool = False
    is_override: bool = False
    primary_skills: List[str] = Field(default_factory=list)
    fulfilled_skills: List[str] = Field(default_factory=list)
    why_selected: Optional[CandidateWhySelected] = None


class MetricWarning(BaseModel):
    """Operational warning or informational notice regarding team composition."""
    id: str
    type: Literal["warning", "alert", "info"]
    title: str
    message: str


class TeamSummaryMetricsResponse(BaseModel):
    """Team-level aggregate suitability, skill coverage, and sustainability indicators."""
    overall_team_fit: float = Field(..., ge=0.0, le=100.0)
    selected_count: int
    target_count: int
    skill_coverage_percent: float = Field(..., ge=0.0, le=100.0)
    covered_skills_count: int
    total_skills_required: int
    workload_balance_score: float = Field(..., ge=0.0, le=100.0)
    sustainability_score: float = Field(..., ge=0.0, le=100.0)
    availability_coverage_score: float = Field(..., ge=0.0, le=100.0)
    covered_skills: List[str] = Field(default_factory=list)
    missing_mandatory_skills: List[str] = Field(default_factory=list)
    missing_optional_skills: List[str] = Field(default_factory=list)
    warnings: List[MetricWarning] = Field(default_factory=list)


class TeamAlternativeResponse(BaseModel):
    """Distinct, feasible alternative team composition with explicit comparative trade-offs."""
    alternative_id: str
    strategy_label: str
    description: str
    members: List[TeamCandidateResponse]
    metrics: TeamSummaryMetricsResponse
    trade_offs: List[str] = Field(default_factory=list)
    option_id: Optional[str] = None
    candidates: List[TeamCandidateResponse] = Field(default_factory=list)
    team_fit_score: Optional[float] = None
    trade_off: Optional[str] = None


class GenerateTeamRecommendationRequest(BaseModel):
    """Input parameters for constraint-aware team recommendation generation."""
    target_team_size: Optional[int] = Field(None, ge=1, le=20, description="Override target team size")
    team_size: Optional[int] = Field(None, ge=1, le=20, description="Alias for target_team_size")
    formation_option: FormationOptionType = Field("autonomous_ai", description="Optimization strategy mode")
    min_availability_percent: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    wellbeing_risk_tolerance: Optional[str] = Field("ModerateAllowed", description="LowOnly, ModerateAllowed, Flexible")
    include_growth_opportunities: bool = Field(True, description="Consider growth potential pairing")
    excluded_employee_ids: List[uuid.UUID] = Field(default_factory=list, description="Explicitly excluded employees")
    pinned_employee_ids: List[uuid.UUID] = Field(default_factory=list, description="Must-include employee members")
    required_skills: Optional[List[Dict[str, Any]]] = None


class TeamRecommendationResponse(BaseModel):
    """Comprehensive team recommendation result with primary roster, metrics, and alternatives."""
    formation_id: Optional[uuid.UUID] = None
    formation_code: Optional[str] = None
    project_id: uuid.UUID
    project_name: str
    project_priority: str
    formation_option: str
    status: str
    is_feasible: bool
    unmet_requirements: List[str] = Field(default_factory=list)
    feasibility_explanation: Optional[str] = None
    infeasibility_reason: Optional[str] = None
    candidates: List[TeamCandidateResponse] = Field(default_factory=list)
    recommended_team: List[TeamCandidateResponse] = Field(default_factory=list)
    metrics: Optional[TeamSummaryMetricsResponse] = None
    alternatives: List[TeamAlternativeResponse] = Field(default_factory=list)
    excluded_candidates_summary: Dict[str, int] = Field(default_factory=dict)
    excluded_candidates: Dict[uuid.UUID, Dict[str, Any]] = Field(default_factory=dict)
    created_at: Optional[datetime] = None


class FinalizeFormationRequest(BaseModel):
    """Human-in-the-loop confirmation payload to finalize team assignments."""
    notes: Optional[str] = Field(None, max_length=1000)
    selected_candidate_ids: Optional[List[uuid.UUID]] = Field(
        None,
        description="Optional list of member IDs if manager selected an alternative or manually adjusted roster",
    )
    member_allocations: Optional[Dict[uuid.UUID, float]] = Field(
        None,
        description="Optional explicit allocation percentages per member (e.g. {emp_id: 33.34})",
    )


class FinalizeFormationResponse(BaseModel):
    """Result of confirmed team assignment and persistent allocation creation."""
    formation_id: uuid.UUID
    project_id: uuid.UUID
    status: str = "Finalized"
    assigned_member_count: int
    allocated_members: List[TeamCandidateResponse]
    message: str


class FormationHistoryItemResponse(BaseModel):
    """Historical team formation run snapshot summary."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    formation_code: str
    project_id: uuid.UUID
    project_name: str
    project_department: str
    formation_option: str
    status: str
    team_size: int
    team_fit_score: Optional[float] = None
    skill_coverage_percent: Optional[float] = None
    sustainability_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    notes: Optional[str] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)
    members: List[Dict[str, Any]] = Field(default_factory=list)


class TeamFormationKpisResponse(BaseModel):
    """Aggregated team formation module performance metrics."""
    total_formations: int
    total_formations_trend: str
    teams_created: int
    teams_created_trend: str
    average_team_fit: float
    average_team_fit_trend: str
    workforce_sustainability: float
    workforce_sustainability_trend: str
