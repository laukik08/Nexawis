"""
NEXAWIS Backend - Priority-Aware AWIS Composite Scoring Engine.
Calculates deterministic, explainable Adaptive Workforce Intelligence Scores
using priority-calibrated factor profiles, strict completeness thresholds,
and provisional unrenormalized scoring.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.services.awis.config import (
    AwisFactor,
    PriorityProfile,
    SCORING_PROFILES,
    CRITICAL_FACTORS,
    COMPLETENESS_THRESHOLD,
    FORMULA_VERSION,
    map_project_priority_to_profile,
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
    EligibilityOutcome,
    EligibilityStatus,
    evaluate_eligibility,
)


@dataclass
class AwisCandidateResult:
    """Complete AWIS evaluation result for an employee on a specific project."""
    employee_id: str
    employee_code: str
    employee_name: str
    department: str
    designation: str
    avatar_url: Optional[str]

    project_id: str
    project_code: str
    project_priority: str
    selected_profile: PriorityProfile

    # Composite Score & Status
    composite_score: Optional[float]
    eligibility: EligibilityOutcome
    is_actionable: bool
    is_complete: bool
    is_provisional: bool
    weighted_completeness_pct: float

    # Components breakdown
    component_scores: Dict[AwisFactor, ComponentScoreResult]
    component_weights: Dict[AwisFactor, float]
    missing_factors: List[str]
    stale_factors: List[str]

    # Explainability
    positive_factors: List[str]
    concern_factors: List[str]
    summary_explanation: str
    formula_version: str = FORMULA_VERSION

    # Ranking position and tier (set after candidate pool ordering)
    rank_position: Optional[int] = None
    ranking_tier: Optional[int] = None


def compute_ranking_tier(cand: AwisCandidateResult) -> int:
    """
    Computes the deterministic ranking tier (1 is highest priority tier):
    Tier 1: Actionable, fully complete, eligible candidates (all 7 factors valid, ELIGIBLE).
    Tier 2: Actionable, provisional eligible candidates (>= 80% coverage, critical inputs verified, ELIGIBLE).
    Tier 3: Actionable, needs-review candidates (burnout warning, critical workload overload, on leave).
    Tier 4: Non-actionable candidates (ineligible, missing critical inputs, < 80% coverage).
    """
    if not cand.is_actionable or cand.composite_score is None:
        return 4
    if cand.eligibility.status == EligibilityStatus.ELIGIBLE:
        if cand.is_complete:
            return 1
        elif cand.is_provisional:
            return 2
    elif cand.eligibility.status == EligibilityStatus.NEEDS_REVIEW:
        return 3
    return 4


class AwisScoringEngine:
    """
    Deterministic scoring engine implementing the 7-factor priority-aware AWIS model.
    """

    def __init__(self, now_dt: Optional[datetime] = None):
        self.now_dt = now_dt or datetime.now(timezone.utc)

    def evaluate_employee(self, employee: Any, project: Any) -> AwisCandidateResult:
        """
        Evaluates a single employee against a project:
        1. Selects priority profile from authoritative project record
        2. Evaluates mandatory eligibility hard constraints
        3. Scores the 7 normalized components
        4. Calculates weighted completeness and evaluates critical inputs
        5. Computes composite score (or unrenormalized provisional score)
        6. Generates human-readable explanations
        """
        # 1. Authoritative Priority Profile
        proj_priority = getattr(project, "priority", "Medium") or "Medium"
        profile = map_project_priority_to_profile(proj_priority)
        weights = SCORING_PROFILES[profile]

        # 2. Hard Eligibility Constraints
        eligibility = evaluate_eligibility(employee, project)

        # 3. Compute 7 Normalized Components
        c_skill = score_skill_match(employee, project)
        c_exp = score_relevant_experience(employee, project)
        c_perf = score_performance(employee, project, self.now_dt)
        c_avail = score_availability(employee, project)
        c_workload = score_workload_sustainability(employee, project)
        c_burnout = score_burnout_safety(employee, project, self.now_dt)
        c_growth = score_growth_potential(employee, project)

        components: Dict[AwisFactor, ComponentScoreResult] = {
            AwisFactor.SKILL_MATCH: c_skill,
            AwisFactor.RELEVANT_EXPERIENCE: c_exp,
            AwisFactor.PERFORMANCE: c_perf,
            AwisFactor.AVAILABILITY: c_avail,
            AwisFactor.WORKLOAD_SUSTAINABILITY: c_workload,
            AwisFactor.BURNOUT_SAFETY: c_burnout,
            AwisFactor.GROWTH_POTENTIAL: c_growth,
        }

        # 4. Completeness & Missing Factor Analysis
        available_factors: List[AwisFactor] = []
        missing_factors: List[str] = []
        stale_factors: List[str] = []
        weighted_coverage = 0.0

        for factor, res in components.items():
            if res.is_available and res.score is not None:
                available_factors.append(factor)
                weighted_coverage += weights[factor]
            else:
                missing_factors.append(factor.value)
            if res.is_stale:
                stale_factors.append(factor.value)

        weighted_completeness_pct = round(weighted_coverage * 100.0, 1)

        # Check for missing critical factors
        missing_critical = [
            f.value for f in CRITICAL_FACTORS if f.value in missing_factors
        ]

        is_complete = len(missing_factors) == 0
        is_provisional = False
        composite_score: Optional[float] = None

        # 5. Score Calculation Rules
        if not eligibility.is_actionable:
            # Candidate is ineligible; do NOT present as actionable recommendation
            composite_score = None
            is_actionable = False
        elif missing_critical:
            # Missing critical data: withhold definitive ranking
            eligibility.status = EligibilityStatus.NEEDS_REVIEW
            eligibility.reasons.append(f"MISSING_CRITICAL_DATA:{','.join(missing_critical)}")
            eligibility.explanations.append(
                f"Missing critical scoring input ({', '.join(missing_critical)}); score withheld pending data entry."
            )
            is_provisional = True
            is_actionable = False
            composite_score = None
        elif weighted_coverage < COMPLETENESS_THRESHOLD:
            # Coverage below 80% operational threshold
            eligibility.status = EligibilityStatus.NEEDS_REVIEW
            eligibility.reasons.append(f"INSUFFICIENT_COMPLETENESS:{weighted_completeness_pct}%")
            eligibility.explanations.append(
                f"Weighted data completeness ({weighted_completeness_pct}%) is below operational threshold (80%)."
            )
            is_provisional = True
            is_actionable = False
            # Calculate provisional score without renormalizing weights
            raw_contrib = sum(
                components[f].score * weights[f]
                for f in available_factors
                if components[f].score is not None
            )
            composite_score = round(raw_contrib, 1)
        else:
            # Valid complete or provisional score (>= 80% with all critical factors)
            raw_contrib = sum(
                components[f].score * weights[f]
                for f in available_factors
                if components[f].score is not None
            )
            composite_score = round(raw_contrib, 1)
            is_provisional = not is_complete
            is_actionable = eligibility.status in (EligibilityStatus.ELIGIBLE, EligibilityStatus.NEEDS_REVIEW)

        # 6. Generate Explainability Insights
        positive_factors, concern_factors, summary_text = self._generate_explanations(
            components, weights, profile, composite_score, eligibility, is_provisional, missing_factors
        )

        emp_code = getattr(employee, "employee_code", "")
        emp_name = getattr(employee, "full_name", "")
        emp_dept = getattr(employee, "department", "")
        emp_desig = getattr(employee, "designation", "")
        emp_avatar = getattr(employee, "avatar_url", None)

        proj_id_val = str(getattr(project, "id", ""))
        proj_code_val = getattr(project, "project_code", "")

        cand_result = AwisCandidateResult(
            employee_id=str(getattr(employee, "id", "")),
            employee_code=emp_code,
            employee_name=emp_name,
            department=emp_dept,
            designation=emp_desig,
            avatar_url=emp_avatar,
            project_id=proj_id_val,
            project_code=proj_code_val,
            project_priority=proj_priority,
            selected_profile=profile,
            composite_score=composite_score,
            eligibility=eligibility,
            is_actionable=is_actionable,
            is_complete=is_complete,
            is_provisional=is_provisional,
            weighted_completeness_pct=weighted_completeness_pct,
            component_scores=components,
            component_weights={k: round(v, 4) for k, v in weights.items()},
            missing_factors=missing_factors,
            stale_factors=stale_factors,
            positive_factors=positive_factors,
            concern_factors=concern_factors,
            summary_explanation=summary_text,
            formula_version=FORMULA_VERSION,
        )
        cand_result.ranking_tier = compute_ranking_tier(cand_result)
        return cand_result

    def rank_candidates(
        self, employees: List[Any], project: Any
    ) -> Tuple[List[AwisCandidateResult], List[AwisCandidateResult]]:
        """
        Evaluates a candidate pool and returns:
        1. Actionable ranked candidates sorted by deterministic tiebreakers and ranking tiers
        2. Non-actionable / ineligible candidates with explicit safe reason codes
        """
        actionable_list: List[AwisCandidateResult] = []
        non_actionable_list: List[AwisCandidateResult] = []

        for emp in employees:
            res = self.evaluate_employee(emp, project)
            if res.is_actionable and res.composite_score is not None:
                actionable_list.append(res)
            else:
                non_actionable_list.append(res)

        # Deterministic Ranking Policy for Actionable Candidates:
        # 1. Ranking tier ascending:
        #    Tier 1 (Complete Eligible) < Tier 2 (Provisional Eligible) < Tier 3 (Needs Review)
        # 2. Composite score descending
        # 3. Skill match score descending
        # 4. Workload sustainability score descending
        # 5. Availability score descending
        # 6. Relevant experience score descending
        # 7. Employee database ID ascending (lexicographical tie-breaking for strict reproducibility)
        actionable_list.sort(
            key=lambda c: (
                c.ranking_tier if c.ranking_tier is not None else compute_ranking_tier(c),
                -(c.composite_score or 0.0),
                -(c.component_scores[AwisFactor.SKILL_MATCH].score or 0.0),
                -(c.component_scores[AwisFactor.WORKLOAD_SUSTAINABILITY].score or 0.0),
                -(c.component_scores[AwisFactor.AVAILABILITY].score or 0.0),
                -(c.component_scores[AwisFactor.RELEVANT_EXPERIENCE].score or 0.0),
                str(c.employee_id),
            )
        )

        # Assign 1-indexed rank positions
        for idx, cand in enumerate(actionable_list, start=1):
            cand.rank_position = idx

        return actionable_list, non_actionable_list

    def _generate_explanations(
        self,
        components: Dict[AwisFactor, ComponentScoreResult],
        weights: Dict[AwisFactor, float],
        profile: PriorityProfile,
        score: Optional[float],
        eligibility: EligibilityOutcome,
        is_provisional: bool,
        missing_factors: List[str],
    ) -> Tuple[List[str], List[str], str]:
        """Produces transparent human-readable explanations of top factors and risks."""
        positives: List[str] = []
        concerns: List[str] = []

        # Find top positive contributions (score >= 80 or high weighted contribution)
        for factor, res in components.items():
            if res.score is not None and res.score >= 80.0:
                positives.append(f"{factor.value.replace('_', ' ').title()}: {res.evidence}")

        # Find top concerns (score < 65 or stale or missing)
        for factor, res in components.items():
            if res.score is not None and res.score < 65.0:
                concerns.append(f"{factor.value.replace('_', ' ').title()}: {res.evidence}")
            elif res.is_stale:
                concerns.append(f"{factor.value.replace('_', ' ').title()}: Stale data ({res.evidence})")

        if is_provisional and missing_factors:
            concerns.append(
                f"Provisional Score: Missing {', '.join(missing_factors)}; missing components contribute 0 points."
            )

        # Add eligibility notes if review required
        if eligibility.status == EligibilityStatus.NEEDS_REVIEW:
            for exp in eligibility.explanations:
                concerns.append(f"Eligibility Note: {exp}")

        # Summary
        if score is not None:
            summary = (
                f"Evaluated under {profile.value.upper()} priority profile. "
                f"Achieved composite AWIS suitability score of {score:.1f}/100. "
            )
            if eligibility.status == EligibilityStatus.NEEDS_REVIEW:
                summary += "Status is NEEDS REVIEW (managerial review required before assignment). "
            elif is_provisional:
                summary += "Score is provisional due to incomplete component inputs. "
            if positives:
                summary += f"Strengths include {positives[0].split(':')[0].lower()}. "
        else:
            summary = "Score withheld. " + " ".join(eligibility.explanations)

        return positives, concerns, summary
