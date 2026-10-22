"""
NEXAWIS Backend - AWIS Services Package.
Exports core engine, scorers, configuration, and eligibility components.
"""

from app.services.awis.config import (
    AwisFactor,
    PriorityProfile,
    SCORING_PROFILES,
    CRITICAL_FACTORS,
    COMPLETENESS_THRESHOLD,
    FRESHNESS_POLICIES_DAYS,
    FORMULA_VERSION,
    WORKLOAD_POLICY,
    WorkloadPolicyConfig,
    validate_workload_policy,
    map_project_priority_to_profile,
    validate_scoring_profiles,
)
from app.services.awis.scorers import (
    ComponentScoreResult,
    score_skill_match,
    score_relevant_experience,
    score_performance,
    score_availability,
    score_workload_sustainability,
    score_burnout_safety,
    score_growth_potential,
)
from app.services.awis.eligibility import (
    EligibilityStatus,
    EligibilityOutcome,
    evaluate_eligibility,
)
from app.services.awis.engine import (
    AwisCandidateResult,
    AwisScoringEngine,
    compute_ranking_tier,
)

__all__ = [
    "AwisFactor",
    "PriorityProfile",
    "SCORING_PROFILES",
    "CRITICAL_FACTORS",
    "COMPLETENESS_THRESHOLD",
    "FRESHNESS_POLICIES_DAYS",
    "FORMULA_VERSION",
    "WORKLOAD_POLICY",
    "WorkloadPolicyConfig",
    "validate_workload_policy",
    "map_project_priority_to_profile",
    "validate_scoring_profiles",
    "ComponentScoreResult",
    "score_skill_match",
    "score_relevant_experience",
    "score_performance",
    "score_availability",
    "score_workload_sustainability",
    "score_burnout_safety",
    "score_growth_potential",
    "EligibilityStatus",
    "EligibilityOutcome",
    "evaluate_eligibility",
    "AwisCandidateResult",
    "AwisScoringEngine",
    "compute_ranking_tier",
]
