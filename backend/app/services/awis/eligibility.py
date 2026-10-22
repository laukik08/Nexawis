"""
NEXAWIS Backend - AWIS Eligibility and Hard Constraints Checker.
Evaluates mandatory prerequisites before weighted ranking to ensure candidate suitability
and workforce sustainability safeguards.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, List, Set, Dict

from app.services.awis.config import WORKLOAD_POLICY


class EligibilityStatus(str, Enum):
    """Structured eligibility outcome."""
    ELIGIBLE = "eligible"
    NEEDS_REVIEW = "needs_review"
    INELIGIBLE = "ineligible"


@dataclass
class EligibilityOutcome:
    """Detailed result of hard constraint verification."""
    status: EligibilityStatus
    is_actionable: bool                 # True only if status is ELIGIBLE
    reasons: List[str] = field(default_factory=list)
    explanations: List[str] = field(default_factory=list)
    failed_mandatory_skills: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


def evaluate_eligibility(employee: Any, project: Any) -> EligibilityOutcome:
    """
    Evaluates mandatory hard constraints on an employee for a project:
    1. Workspace boundary validation
    2. Employment status check (Active vs Inactive / On Leave)
    3. Mandatory skill coverage & minimum proficiency verification
    4. Capacity and excessive workload limits
    5. Burnout risk sustainability safeguard (flags for review rather than blanket exclusion)
    """
    reasons: List[str] = []
    explanations: List[str] = []
    failed_skills: List[str] = []

    # 1. Workspace Boundary
    emp_ws = str(getattr(employee, "workspace_id", ""))
    proj_ws = str(getattr(project, "workspace_id", ""))
    if emp_ws != proj_ws:
        return EligibilityOutcome(
            status=EligibilityStatus.INELIGIBLE,
            is_actionable=False,
            reasons=["WORKSPACE_MISMATCH"],
            explanations=["Candidate belongs to a different workspace boundary."],
        )

    # 2. Employment Status Check
    status = (getattr(employee, "employment_status", "Available") or "Available").strip().lower()
    if status in ("archived", "terminated", "inactive"):
        return EligibilityOutcome(
            status=EligibilityStatus.INELIGIBLE,
            is_actionable=False,
            reasons=["INACTIVE_EMPLOYMENT_STATUS"],
            explanations=[f"Employee employment status is inactive ('{status}')."],
        )

    is_on_leave = status in ("on leave", "on_leave", "leave")

    # 3. Mandatory Skill Coverage
    requirements = getattr(project, "requirements", []) or []
    emp_skills_map: Dict[str, int] = {}
    for es in (getattr(employee, "skills", []) or []):
        if getattr(es, "skill", None) and getattr(es.skill, "name", None):
            emp_skills_map[es.skill.name.strip().lower()] = es.proficiency
        if getattr(es, "skill_id", None):
            emp_skills_map[str(es.skill_id)] = es.proficiency

    for req in requirements:
        if not getattr(req, "is_mandatory", False):
            continue

        req_name = req.skill.name if getattr(req, "skill", None) else str(req.skill_id)
        req_key = req_name.strip().lower()
        min_prof = getattr(req, "min_proficiency", 70)
        emp_prof = emp_skills_map.get(req_key, emp_skills_map.get(str(req.skill_id), None))

        if emp_prof is None or emp_prof < min_prof:
            failed_skills.append(f"{req_name} (req: {min_prof}%, has: {emp_prof if emp_prof is not None else 'None'}%)")

    if failed_skills:
        reasons.append("MANDATORY_SKILL_DEFICIT")
        explanations.append(f"Does not satisfy mandatory skill requirements: {', '.join(failed_skills)}.")
        return EligibilityOutcome(
            status=EligibilityStatus.INELIGIBLE,
            is_actionable=False,
            reasons=reasons,
            explanations=explanations,
            failed_mandatory_skills=failed_skills,
        )

    # 4. Capacity & Workload Limits
    allocations = getattr(employee, "project_allocations", []) or []
    current_committed = sum(
        float(getattr(a, "allocation_percent", 0.0))
        for a in allocations
        if (getattr(a, "status", "Active") or "Active").lower() == "active"
    )

    if current_committed >= WORKLOAD_POLICY.full_allocation_limit:
        reasons.append("FULLY_ALLOCATED_CAPACITY")
        explanations.append(f"Candidate is already 100% committed across active projects ({current_committed:.0f}%).")
        return EligibilityOutcome(
            status=EligibilityStatus.INELIGIBLE,
            is_actionable=False,
            reasons=reasons,
            explanations=explanations,
        )

    target_team_size = max(1, getattr(project, "target_team_size", 4))
    requested_allocation = min(100.0, max(20.0, round(100.0 / target_team_size, 1)))
    projected_workload = current_committed + requested_allocation

    if projected_workload > WORKLOAD_POLICY.hard_safety_limit:
        reasons.append("EXCESSIVE_WORKLOAD")
        explanations.append(f"Projected workload exceeds hard safety limit of {WORKLOAD_POLICY.hard_safety_limit:.0f}% ({projected_workload:.0f}%).")
        return EligibilityOutcome(
            status=EligibilityStatus.INELIGIBLE,
            is_actionable=False,
            reasons=reasons,
            explanations=explanations,
        )

    overload_flag = False
    if projected_workload > WORKLOAD_POLICY.review_threshold:
        overload_flag = True
        reasons.append("CRITICAL_WORKLOAD_OVERLOAD")
        explanations.append(
            f"Projected workload of {projected_workload:.0f}% exceeds sustainability review threshold ({WORKLOAD_POLICY.review_threshold:.0f}%); assignment requires managerial review."
        )

    # 5. Burnout & Sustainability Safeguards (Flags for Review, Not Blanket Exclusion)
    burnout_flag = False
    burnout_preds = getattr(employee, "burnout_predictions", []) or []
    if burnout_preds:
        latest = sorted(burnout_preds, key=lambda b: getattr(b, "predicted_at", None) or b.created_at, reverse=True)[0]
        if (getattr(latest, "risk_tier", "Low") or "Low").lower() == "high" or (getattr(latest, "predicted_burn_rate", 0.0) or 0.0) > 0.85:
            burnout_flag = True
    elif (getattr(employee, "wellbeing_risk", "Low") or "Low").lower() == "high" or (getattr(employee, "mental_fatigue_score", 0.0) or 0.0) > 85.0:
        burnout_flag = True

    if burnout_flag:
        reasons.append("BURNOUT_RISK_WARNING")
        explanations.append("Elevated fatigue/burnout indicator detected; assignment requires managerial sustainability review.")

    if is_on_leave:
        reasons.append("EMPLOYEE_ON_LEAVE")
        explanations.append("Employee is currently designated on leave; requires schedule reconciliation.")

    # Determine final status
    if burnout_flag or is_on_leave or overload_flag:
        return EligibilityOutcome(
            status=EligibilityStatus.NEEDS_REVIEW,
            is_actionable=True,  # Manager can review and approve with safeguards
            reasons=reasons,
            explanations=explanations,
            metadata={
                "burnout_flag": burnout_flag,
                "is_on_leave": is_on_leave,
                "overload_flag": overload_flag,
                "projected_workload": projected_workload,
            },
        )

    reasons.append("ALL_HARD_CONSTRAINTS_PASSED")
    explanations.append("Candidate satisfies all mandatory prerequisites and capacity limits.")

    return EligibilityOutcome(
        status=EligibilityStatus.ELIGIBLE,
        is_actionable=True,
        reasons=reasons,
        explanations=explanations,
        metadata={"current_committed": current_committed, "projected_workload": projected_workload},
    )
