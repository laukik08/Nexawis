"""
NEXAWIS Backend - Priority-Aware AWIS Scoring Engine Configuration.
Defines versioned weighting profiles, factor taxonomy, completeness thresholds,
and freshness policies according to Phase 6 specifications.
"""

from enum import Enum
from typing import Dict, Set


class AwisFactor(str, Enum):
    """The seven normalized intelligence factors forming the composite AWIS score."""
    SKILL_MATCH = "skill_match"
    RELEVANT_EXPERIENCE = "relevant_experience"
    PERFORMANCE = "performance"
    AVAILABILITY = "availability"
    WORKLOAD_SUSTAINABILITY = "workload_sustainability"
    BURNOUT_SAFETY = "burnout_safety"
    GROWTH_POTENTIAL = "growth_potential"


class PriorityProfile(str, Enum):
    """Authoritative project priority profiles that calibrate factor importance."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# Phase 6 Approved Provisional Research Weighting Matrix (Total = 1.00 for each profile)
SCORING_PROFILES: Dict[PriorityProfile, Dict[AwisFactor, float]] = {
    PriorityProfile.HIGH: {
        AwisFactor.SKILL_MATCH: 0.25,
        AwisFactor.RELEVANT_EXPERIENCE: 0.20,
        AwisFactor.PERFORMANCE: 0.15,
        AwisFactor.AVAILABILITY: 0.15,
        AwisFactor.WORKLOAD_SUSTAINABILITY: 0.10,
        AwisFactor.BURNOUT_SAFETY: 0.10,
        AwisFactor.GROWTH_POTENTIAL: 0.05,
    },
    PriorityProfile.MEDIUM: {
        AwisFactor.SKILL_MATCH: 0.25,
        AwisFactor.RELEVANT_EXPERIENCE: 0.12,
        AwisFactor.PERFORMANCE: 0.12,
        AwisFactor.AVAILABILITY: 0.15,
        AwisFactor.WORKLOAD_SUSTAINABILITY: 0.15,
        AwisFactor.BURNOUT_SAFETY: 0.10,
        AwisFactor.GROWTH_POTENTIAL: 0.11,
    },
    PriorityProfile.LOW: {
        AwisFactor.SKILL_MATCH: 0.22,
        AwisFactor.RELEVANT_EXPERIENCE: 0.08,
        AwisFactor.PERFORMANCE: 0.10,
        AwisFactor.AVAILABILITY: 0.15,
        AwisFactor.WORKLOAD_SUSTAINABILITY: 0.15,
        AwisFactor.BURNOUT_SAFETY: 0.10,
        AwisFactor.GROWTH_POTENTIAL: 0.20,
    },
}

# Critical factors that MUST be present and valid to issue a definitive recommendation
CRITICAL_FACTORS: Set[AwisFactor] = {
    AwisFactor.SKILL_MATCH,
    AwisFactor.AVAILABILITY,
    AwisFactor.WORKLOAD_SUSTAINABILITY,
}

# Provisional operational completeness threshold (80% weighted component coverage)
COMPLETENESS_THRESHOLD: float = 0.80

# Freshness thresholds in days
FRESHNESS_POLICIES_DAYS = {
    AwisFactor.PERFORMANCE: 180,       # Performance reviews older than 6 months flagged as stale
    AwisFactor.BURNOUT_SAFETY: 90,     # Burnout inference older than 90 days flagged as stale
    AwisFactor.WORKLOAD_SUSTAINABILITY: 30,  # Workload observations older than 30 days flagged
}

# Active version tag for reproducible audit trails
FORMULA_VERSION: str = "awis-v1.0.0"


class WorkloadPolicyConfig:
    """
    Provisional operational policy configuration for workload sustainability scoring and safeguards.
    These values represent provisional research and operational assumptions, not empirically proven universal limits.
    """
    def __init__(
        self,
        breakpoint_safe: float = 80.0,
        breakpoint_standard: float = 100.0,
        breakpoint_elevated: float = 120.0,
        breakpoint_max_score: float = 150.0,
        score_at_safe: float = 100.0,
        score_at_standard: float = 70.0,
        score_at_elevated: float = 30.0,
        score_at_max: float = 0.0,
        review_threshold: float = 140.0,
        hard_safety_limit: float = 150.0,
        full_allocation_limit: float = 100.0,
        overtime_threshold_hours: float = 15.0,
        consecutive_days_threshold: int = 10,
        overtime_penalty_points: float = 10.0,
        consecutive_days_penalty_points: float = 10.0,
    ):
        self.breakpoint_safe = float(breakpoint_safe)
        self.breakpoint_standard = float(breakpoint_standard)
        self.breakpoint_elevated = float(breakpoint_elevated)
        self.breakpoint_max_score = float(breakpoint_max_score)

        self.score_at_safe = float(score_at_safe)
        self.score_at_standard = float(score_at_standard)
        self.score_at_elevated = float(score_at_elevated)
        self.score_at_max = float(score_at_max)

        self.review_threshold = float(review_threshold)
        self.hard_safety_limit = float(hard_safety_limit)
        self.full_allocation_limit = float(full_allocation_limit)

        self.overtime_threshold_hours = float(overtime_threshold_hours)
        self.consecutive_days_threshold = int(consecutive_days_threshold)
        self.overtime_penalty_points = float(overtime_penalty_points)
        self.consecutive_days_penalty_points = float(consecutive_days_penalty_points)

    def to_dict(self) -> Dict[str, float]:
        return {
            "breakpointSafe": self.breakpoint_safe,
            "breakpointStandard": self.breakpoint_standard,
            "breakpointElevated": self.breakpoint_elevated,
            "breakpointMaxScore": self.breakpoint_max_score,
            "scoreAtSafe": self.score_at_safe,
            "scoreAtStandard": self.score_at_standard,
            "scoreAtElevated": self.score_at_elevated,
            "scoreAtMax": self.score_at_max,
            "reviewThreshold": self.review_threshold,
            "hardSafetyLimit": self.hard_safety_limit,
            "fullAllocationLimit": self.full_allocation_limit,
            "overtimeThresholdHours": self.overtime_threshold_hours,
            "consecutiveDaysThreshold": float(self.consecutive_days_threshold),
            "overtimePenaltyPoints": self.overtime_penalty_points,
            "consecutiveDaysPenaltyPoints": self.consecutive_days_penalty_points,
        }


def validate_workload_policy(cfg: WorkloadPolicyConfig) -> None:
    """
    Validates workload sustainability thresholds and bounds to ensure operational integrity.
    """
    if not (0.0 < cfg.breakpoint_safe < cfg.breakpoint_standard < cfg.breakpoint_elevated < cfg.breakpoint_max_score):
        raise ValueError("Workload curve breakpoints must be strictly monotonically increasing.")
    if not (cfg.breakpoint_elevated <= cfg.review_threshold < cfg.hard_safety_limit <= cfg.breakpoint_max_score):
        raise ValueError("Workload review (140%) and safety (150%) limits must be consistent with curve breakpoints.")
    if cfg.overtime_threshold_hours < 0 or cfg.consecutive_days_threshold < 0:
        raise ValueError("Overtime and consecutive day thresholds must be non-negative.")
    if cfg.overtime_penalty_points < 0 or cfg.consecutive_days_penalty_points < 0:
        raise ValueError("Penalties must be non-negative.")
    if not (0.0 <= cfg.score_at_max <= cfg.score_at_elevated <= cfg.score_at_standard <= cfg.score_at_safe <= 100.0):
        raise ValueError("Workload scores at breakpoints must be between 0 and 100 in descending order.")


WORKLOAD_POLICY: WorkloadPolicyConfig = WorkloadPolicyConfig()
validate_workload_policy(WORKLOAD_POLICY)


def map_project_priority_to_profile(priority: str) -> PriorityProfile:
    """
    Explicitly and deterministically maps project priority to a scoring profile.
    'Critical' and 'High' select High Priority profile.
    'Medium' selects Medium Priority profile.
    'Low' selects Low Priority profile.
    """
    norm = (priority or "").strip().lower()
    if norm in ("critical", "high"):
        return PriorityProfile.HIGH
    elif norm == "medium":
        return PriorityProfile.MEDIUM
    elif norm == "low":
        return PriorityProfile.LOW
    else:
        # Safe default for unspecified or custom priorities
        return PriorityProfile.MEDIUM


def validate_scoring_profiles() -> None:
    """
    Validates that every profile contains all 7 factors, all weights are finite
    and non-negative, and each profile sums to 1.0 within tolerance.
    Raises ValueError if configuration is invalid.
    """
    for profile, weights in SCORING_PROFILES.items():
        if len(weights) != len(AwisFactor):
            raise ValueError(
                f"Profile {profile.value} has {len(weights)} factors, expected {len(AwisFactor)}"
            )
        total_weight = 0.0
        for factor in AwisFactor:
            if factor not in weights:
                raise ValueError(f"Profile {profile.value} is missing factor {factor.value}")
            w = weights[factor]
            if w < 0.0 or w > 1.0:
                raise ValueError(f"Profile {profile.value} factor {factor.value} weight {w} out of bounds")
            total_weight += w
        if abs(total_weight - 1.0) > 1e-6:
            raise ValueError(
                f"Profile {profile.value} weights sum to {total_weight}, must equal exactly 1.0"
            )


# Self-test on module load
validate_scoring_profiles()
