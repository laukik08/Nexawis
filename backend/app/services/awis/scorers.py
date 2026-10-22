"""
NEXAWIS Backend - AWIS Component Scorers.
Implements the 7 normalized, defensible intelligence scorers (0 to 100)
for skill match, relevant experience, performance, availability,
workload sustainability, burnout-risk safety, and growth potential.
"""

from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Optional, Dict, Any, List

from app.services.awis.config import (
    AwisFactor,
    FRESHNESS_POLICIES_DAYS,
    WORKLOAD_POLICY,
)


@dataclass
class ComponentScoreResult:
    """Evaluation result for an individual AWIS scoring factor."""
    factor: AwisFactor
    score: Optional[float]          # Normalized 0 to 100, or None if missing/unavailable
    is_available: bool
    is_stale: bool
    evidence: str                   # Human-readable rationale for explainability
    metadata: Dict[str, Any]        # Numeric and diagnostic features


def score_skill_match(employee: Any, project: Any) -> ComponentScoreResult:
    """
    Evaluates coverage of project-required skills using configured importance weights
    and employee skill proficiency evidence.
    Skill Match = 100 * (sum(importance_i * match_i) / sum(importance_i)).
    """
    requirements = getattr(project, "requirements", []) or []
    if not requirements:
        return ComponentScoreResult(
            factor=AwisFactor.SKILL_MATCH,
            score=None,
            is_available=False,
            is_stale=False,
            evidence="Project has no configured skill requirements.",
            metadata={"required_count": 0, "matched_count": 0},
        )

    # Build employee skill map: name/id -> proficiency
    emp_skills: Dict[str, int] = {}
    emp_skill_objs = getattr(employee, "skills", []) or []
    for es in emp_skill_objs:
        if getattr(es, "skill", None) and getattr(es.skill, "name", None):
            emp_skills[es.skill.name.strip().lower()] = es.proficiency
        if getattr(es, "skill_id", None):
            emp_skills[str(es.skill_id)] = es.proficiency

    importance_weights = {"critical": 3.0, "high": 3.0, "medium": 2.0, "low": 1.0}
    total_importance = 0.0
    weighted_matches = 0.0
    matched_count = 0
    missing_skills: List[str] = []

    for req in requirements:
        req_name = ""
        if getattr(req, "skill", None) and getattr(req.skill, "name", None):
            req_name = req.skill.name.strip().lower()
        req_id = str(getattr(req, "skill_id", ""))

        priority_str = (getattr(req, "priority", "Medium") or "Medium").lower()
        importance = importance_weights.get(priority_str, 2.0)
        total_importance += importance

        min_prof = max(1, getattr(req, "min_proficiency", 70))
        emp_prof = emp_skills.get(req_name, emp_skills.get(req_id, None))

        if emp_prof is not None:
            # Normalized match between 0.0 and 1.0
            match_ratio = min(1.0, emp_prof / float(min_prof))
            weighted_matches += importance * match_ratio
            if match_ratio >= 1.0:
                matched_count += 1
        else:
            missing_skills.append(req.skill.name if getattr(req, "skill", None) else req_id)

    if total_importance <= 0:
        return ComponentScoreResult(
            factor=AwisFactor.SKILL_MATCH,
            score=None,
            is_available=False,
            is_stale=False,
            evidence="Requirements define zero total importance.",
            metadata={"required_count": len(requirements), "matched_count": 0},
        )

    raw_score = 100.0 * (weighted_matches / total_importance)
    final_score = round(max(0.0, min(100.0, raw_score)), 1)

    matched_names = []
    for req in requirements:
        req_name = req.skill.name if getattr(req, "skill", None) else str(getattr(req, "skill_id", ""))
        req_key = req_name.strip().lower()
        if req_key in emp_skills or str(getattr(req, "skill_id", "")) in emp_skills:
            matched_names.append(req_name)

    evidence = f"Matches {matched_count}/{len(requirements)} required skills."
    if matched_names:
        evidence += f" Satisfies: {', '.join(matched_names[:3])}."
    if missing_skills:
        evidence += f" Missing or below target: {', '.join(missing_skills[:3])}."

    return ComponentScoreResult(
        factor=AwisFactor.SKILL_MATCH,
        score=final_score,
        is_available=True,
        is_stale=False,
        evidence=evidence,
        metadata={
            "required_count": len(requirements),
            "matched_count": matched_count,
            "missing_skills": missing_skills,
            "raw_ratio": round(weighted_matches / total_importance, 4),
        },
    )


def score_relevant_experience(employee: Any, project: Any) -> ComponentScoreResult:
    """
    Evaluates technology-specific and role-relevant experience against project complexity.
    Prefers skill-specific tenure over general employment duration.
    """
    complexity = (getattr(project, "complexity", "Medium") or "Medium").lower()
    benchmarks = {"high": 5.0, "medium": 3.0, "low": 1.5}
    benchmark_years = benchmarks.get(complexity, 3.0)

    requirements = getattr(project, "requirements", []) or []
    req_skill_ids = {str(getattr(r, "skill_id", "")) for r in requirements if getattr(r, "skill_id", None)}

    emp_skills = getattr(employee, "skills", []) or []
    relevant_years: List[float] = []

    for es in emp_skills:
        skill_id_str = str(getattr(es, "skill_id", ""))
        if skill_id_str in req_skill_ids or not req_skill_ids:
            if getattr(es, "years_experience", None) is not None:
                relevant_years.append(float(es.years_experience))

    if relevant_years:
        avg_years = sum(relevant_years) / len(relevant_years)
        norm_score = min(100.0, (avg_years / benchmark_years) * 100.0)
        final_score = round(max(0.0, norm_score), 1)
        return ComponentScoreResult(
            factor=AwisFactor.RELEVANT_EXPERIENCE,
            score=final_score,
            is_available=True,
            is_stale=False,
            evidence=f"Averages {avg_years:.1f} yrs across project-relevant technologies (benchmark: {benchmark_years} yrs).",
            metadata={"avg_relevant_years": avg_years, "benchmark_years": benchmark_years, "mode": "technology_specific"},
        )

    # Fallback to general professional tenure
    general_years = getattr(employee, "experience_years", None)
    if general_years is not None and general_years > 0:
        general_benchmark = benchmark_years * 1.5
        norm_score = min(100.0, (float(general_years) / general_benchmark) * 100.0)
        final_score = round(max(0.0, norm_score), 1)
        return ComponentScoreResult(
            factor=AwisFactor.RELEVANT_EXPERIENCE,
            score=final_score,
            is_available=True,
            is_stale=False,
            evidence=f"General professional experience: {general_years:.1f} yrs (technology-specific tenure unrecorded).",
            metadata={"general_years": general_years, "benchmark_years": general_benchmark, "mode": "general_tenure"},
        )

    return ComponentScoreResult(
        factor=AwisFactor.RELEVANT_EXPERIENCE,
        score=None,
        is_available=False,
        is_stale=False,
        evidence="No structured experience evidence recorded.",
        metadata={"mode": "missing"},
    )


def score_performance(employee: Any, project: Any, now_dt: Optional[datetime] = None) -> ComponentScoreResult:
    """
    Evaluates recent, role-relevant performance history bounded between 0 and 100.
    Applies freshness verification policy (180 days).
    """
    now = now_dt or datetime.now(timezone.utc)
    perf_history = getattr(employee, "performance_history", []) or []
    freshness_limit_days = FRESHNESS_POLICIES_DAYS[AwisFactor.PERFORMANCE]

    if perf_history:
        # Take latest record
        latest = sorted(perf_history, key=lambda p: getattr(p, "created_at", now), reverse=True)[0]
        score_val = float(getattr(latest, "performance_score", 80.0))
        final_score = round(max(0.0, min(100.0, score_val)), 1)

        created_at = getattr(latest, "created_at", None)
        is_stale = False
        if created_at:
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            is_stale = (now - created_at).days > freshness_limit_days

        evidence = f"Recent performance review: {final_score}/100 ({getattr(latest, 'period_label', 'latest')})."
        if is_stale:
            evidence += f" (Note: Review is older than {freshness_limit_days} days)."

        return ComponentScoreResult(
            factor=AwisFactor.PERFORMANCE,
            score=final_score,
            is_available=True,
            is_stale=is_stale,
            evidence=evidence,
            metadata={"period": getattr(latest, "period_label", None), "is_stale": is_stale},
        )

    # Fallback to current employee baseline performance rating
    baseline_score = getattr(employee, "performance_score", None)
    if baseline_score is not None:
        final_score = round(max(0.0, min(100.0, float(baseline_score))), 1)
        return ComponentScoreResult(
            factor=AwisFactor.PERFORMANCE,
            score=final_score,
            is_available=True,
            is_stale=False,
            evidence=f"Baseline operational performance rating: {final_score}/100.",
            metadata={"is_baseline": True},
        )

    return ComponentScoreResult(
        factor=AwisFactor.PERFORMANCE,
        score=None,
        is_available=False,
        is_stale=False,
        evidence="Performance history and rating are unrecorded.",
        metadata={"is_missing": True},
    )


def score_availability(employee: Any, project: Any) -> ComponentScoreResult:
    """
    Estimates usable capacity over the project's scheduled delivery period
    accounting for overlapping project allocations.
    """
    proj_start = getattr(project, "start_date", None)
    proj_end = getattr(project, "deadline", None)

    allocations = getattr(employee, "project_allocations", []) or []
    active_committed_percent = 0.0

    for alloc in allocations:
        status = (getattr(alloc, "status", "Active") or "Active").lower()
        if status != "active":
            continue

        alloc_start = getattr(alloc, "start_date", None)
        alloc_end = getattr(alloc, "end_date", None)

        overlaps = True
        if proj_start and proj_end and alloc_start and alloc_end:
            # Disjoint check
            if alloc_end < proj_start or alloc_start > proj_end:
                overlaps = False

        if overlaps:
            active_committed_percent += float(getattr(alloc, "allocation_percent", 0.0))

    usable_capacity = max(0.0, 100.0 - active_committed_percent)
    final_score = round(min(100.0, usable_capacity), 1)

    evidence = f"Usable capacity: {final_score:.0f}% (active commitments: {active_committed_percent:.0f}%)."
    if not proj_start or not proj_end:
        evidence += " (Dates not configured on project; evaluating current allocation commitments)."

    return ComponentScoreResult(
        factor=AwisFactor.AVAILABILITY,
        score=final_score,
        is_available=True,
        is_stale=False,
        evidence=evidence,
        metadata={
            "committed_percent": active_committed_percent,
            "usable_capacity": usable_capacity,
            "has_dates": bool(proj_start and proj_end),
        },
    )


def score_workload_sustainability(employee: Any, project: Any) -> ComponentScoreResult:
    """
    Evaluates whether the candidate can accept additional project allocation
    without exceeding sustainable workload limits (distinguished from capacity availability).
    """
    target_team_size = max(1, getattr(project, "target_team_size", 4))
    # Estimated allocation required from this member (default 50% or proportional)
    requested_allocation = min(100.0, max(20.0, round(100.0 / target_team_size, 1)))

    allocations = getattr(employee, "project_allocations", []) or []
    current_workload = sum(
        float(getattr(a, "allocation_percent", 0.0))
        for a in allocations
        if (getattr(a, "status", "Active") or "Active").lower() == "active"
    )
    if current_workload <= 0.0 and getattr(employee, "current_workload_percent", None):
        current_workload = float(employee.current_workload_percent)

    projected_workload = current_workload + requested_allocation

    # Sustainability curve using centralized WORKLOAD_POLICY
    bp_safe = WORKLOAD_POLICY.breakpoint_safe
    bp_std = WORKLOAD_POLICY.breakpoint_standard
    bp_elev = WORKLOAD_POLICY.breakpoint_elevated
    bp_max = WORKLOAD_POLICY.breakpoint_max_score

    s_safe = WORKLOAD_POLICY.score_at_safe
    s_std = WORKLOAD_POLICY.score_at_standard
    s_elev = WORKLOAD_POLICY.score_at_elevated
    s_max = WORKLOAD_POLICY.score_at_max

    if projected_workload <= bp_safe:
        base_score = s_safe
    elif projected_workload <= bp_std:
        base_score = s_safe - ((projected_workload - bp_safe) / (bp_std - bp_safe)) * (s_safe - s_std)
    elif projected_workload <= bp_elev:
        base_score = s_std - ((projected_workload - bp_std) / (bp_elev - bp_std)) * (s_std - s_elev)
    elif projected_workload <= bp_max:
        base_score = max(0.0, s_elev - ((projected_workload - bp_elev) / (bp_max - bp_elev)) * (s_elev - s_max))
    else:
        base_score = s_max

    # Overtime or consecutive days penalty from workload history if available
    workload_history = getattr(employee, "workload_history", []) or []
    penalty = 0.0
    if workload_history:
        latest_wl = sorted(workload_history, key=lambda w: getattr(w, "recorded_date", date.min), reverse=True)[0]
        if getattr(latest_wl, "overtime_hours", 0.0) > WORKLOAD_POLICY.overtime_threshold_hours:
            penalty += WORKLOAD_POLICY.overtime_penalty_points
        if getattr(latest_wl, "consecutive_working_days", 0) > WORKLOAD_POLICY.consecutive_days_threshold:
            penalty += WORKLOAD_POLICY.consecutive_days_penalty_points

    final_score = round(max(0.0, min(100.0, base_score - penalty)), 1)
    evidence = f"Projected workload: {projected_workload:.0f}% (current: {current_workload:.0f}%, requested: {requested_allocation:.0f}%)."
    if penalty > 0:
        evidence += f" Sustainability penalty of {penalty:.0f} pts applied for elevated overtime/streak."

    return ComponentScoreResult(
        factor=AwisFactor.WORKLOAD_SUSTAINABILITY,
        score=final_score,
        is_available=True,
        is_stale=False,
        evidence=evidence,
        metadata={
            "current_workload": current_workload,
            "requested_allocation": requested_allocation,
            "projected_workload": projected_workload,
            "penalty": penalty,
        },
    )


def score_burnout_safety(employee: Any, project: Any, now_dt: Optional[datetime] = None) -> ComponentScoreResult:
    """
    Consumes a valid, normalized burnout-risk value where 0 represents lowest risk
    and 1 represents highest risk: Burnout-risk safety = 100 * (1 - burnout_risk).
    Per Phase 6 rules, does NOT serve ML models or fabricate predictions.
    If no valid inference prediction is recorded, returns unavailable.
    """
    now = now_dt or datetime.now(timezone.utc)
    burnout_preds = getattr(employee, "burnout_predictions", []) or []
    freshness_limit_days = FRESHNESS_POLICIES_DAYS[AwisFactor.BURNOUT_SAFETY]

    if burnout_preds:
        latest = sorted(burnout_preds, key=lambda b: getattr(b, "predicted_at", now), reverse=True)[0]
        burn_rate = getattr(latest, "predicted_burn_rate", None)
        if burn_rate is not None and 0.0 <= burn_rate <= 1.0:
            safety_score = round(100.0 * (1.0 - burn_rate), 1)
            pred_at = getattr(latest, "predicted_at", None)
            is_stale = False
            if pred_at:
                if pred_at.tzinfo is None:
                    pred_at = pred_at.replace(tzinfo=timezone.utc)
                is_stale = (now - pred_at).days > freshness_limit_days

            tier = getattr(latest, "risk_tier", "Low")
            evidence = f"Burnout safety index: {safety_score:.1f}/100 (risk tier: {tier})."
            if is_stale:
                evidence += f" (Inference older than {freshness_limit_days} days)."

            meta: Dict[str, Any] = {
                "burn_rate": burn_rate,
                "risk_tier": tier,
                "is_stale": is_stale,
            }
            fatigue = getattr(employee, "mental_fatigue_score", None)
            if fatigue is not None:
                meta["fatigue_score"] = float(fatigue)

            return ComponentScoreResult(
                factor=AwisFactor.BURNOUT_SAFETY,
                score=safety_score,
                is_available=True,
                is_stale=is_stale,
                evidence=evidence,
                metadata=meta,
            )

    # Check if calibrated burnout_risk property is explicitly passed
    burnout_risk = getattr(employee, "burnout_risk", None)
    if burnout_risk is not None and 0.0 <= burnout_risk <= 1.0:
        safety_score = round(100.0 * (1.0 - burnout_risk), 1)
        return ComponentScoreResult(
            factor=AwisFactor.BURNOUT_SAFETY,
            score=safety_score,
            is_available=True,
            is_stale=False,
            evidence=f"Burnout safety index: {safety_score:.1f}/100.",
            metadata={"burn_rate": burnout_risk},
        )

    # ML Inference belongs to Phase 7; do NOT fabricate.
    return ComponentScoreResult(
        factor=AwisFactor.BURNOUT_SAFETY,
        score=None,
        is_available=False,
        is_stale=False,
        evidence="Burnout risk inference prediction unavailable or model offline.",
        metadata={"is_missing": True},
    )


def score_growth_potential(employee: Any, project: Any) -> ComponentScoreResult:
    """
    Measures development opportunity, learning readiness, and stretch potential
    from verified employee attributes without fabricating bonuses for freshers.
    """
    growth_val = getattr(employee, "growth_potential", None)
    if growth_val is not None and growth_val > 0.0:
        final_score = round(max(0.0, min(100.0, float(growth_val))), 1)
        return ComponentScoreResult(
            factor=AwisFactor.GROWTH_POTENTIAL,
            score=final_score,
            is_available=True,
            is_stale=False,
            evidence=f"Recorded developmental learning readiness: {final_score:.1f}/100.",
            metadata={"growth_potential": growth_val},
        )

    return ComponentScoreResult(
        factor=AwisFactor.GROWTH_POTENTIAL,
        score=None,
        is_available=False,
        is_stale=False,
        evidence="Growth and developmental potential unrecorded.",
        metadata={"is_missing": True},
    )
