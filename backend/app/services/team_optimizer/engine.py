"""
NEXAWIS Backend - Constraint-Aware Team Optimization Engine.
Solves the team recommendation problem by balancing individual AWIS scores,
complementary skill coverage, workload sustainability, burnout-risk safety,
and project priority constraints with strict deterministic tie-breaking.
"""

import uuid
import math
import itertools
from datetime import datetime, timezone
from typing import List, Dict, Set, Optional, Tuple, Any

from app.services.awis import (
    AwisScoringEngine,
    AwisCandidateResult,
    EligibilityStatus,
    AwisFactor,
)
from app.schemas.team_formation import (
    CandidateWhySelected,
    TeamCandidateResponse,
    MetricWarning,
    TeamSummaryMetricsResponse,
    TeamAlternativeResponse,
    TeamRecommendationResponse,
    GenerateTeamRecommendationRequest,
)


class TeamOptimizationResult:
    """Internal container for evaluated team configurations."""
    def __init__(
        self,
        members: List[TeamCandidateResponse],
        metrics: TeamSummaryMetricsResponse,
        fitness_score: float,
        strategy_label: str = "Standard",
        trade_offs: Optional[List[str]] = None,
    ):
        self.members = members
        self.metrics = metrics
        self.fitness_score = fitness_score
        self.strategy_label = strategy_label
        self.trade_offs = trade_offs or []


class TeamOptimizer:
    """
    Deterministic constraint-aware team optimization engine.
    """

    def __init__(self, now_dt: Optional[datetime] = None):
        self.now_dt = now_dt or datetime.now(timezone.utc)
        self.awis_engine = AwisScoringEngine(now_dt=self.now_dt)

    def optimize_team(
        self,
        project: Any,
        employees: List[Any],
        config: GenerateTeamRecommendationRequest,
    ) -> TeamRecommendationResponse:
        """
        Executes end-to-end team optimization for the specified project and configuration.
        """
        target_team_size = config.target_team_size or config.team_size or getattr(project, "target_team_size", 4)
        target_team_size = max(1, min(20, target_team_size))

        proj_name = getattr(project, "name", "Project")
        proj_priority = getattr(project, "priority", "Medium") or "Medium"
        proj_id = getattr(project, "id")

        # --------------------------------------------------------------------------
        # 1. Evaluate Every Candidate via Phase 6 Authoritative AWIS Scoring Engine
        # --------------------------------------------------------------------------
        # Build candidate-level evaluation project view: clone requirements with is_mandatory=False
        # so candidates with complementary skills are evaluated on skills they have without requiring
        # a single individual to possess ALL team requirements. Team-level mandatory coverage is enforced in Step 2.
        class _CandidateEvalProject:
            def __init__(self, p: Any):
                self._p = p
                self.id = getattr(p, "id", None)
                self.workspace_id = getattr(p, "workspace_id", None)
                self.project_code = getattr(p, "project_code", "PRJ")
                self.name = getattr(p, "name", "Project")
                self.priority = getattr(p, "priority", "Medium")
                self.target_team_size = getattr(p, "target_team_size", 4)
                self.start_date = getattr(p, "start_date", None)
                self.deadline = getattr(p, "deadline", None)

                cloned = []
                for r in (getattr(p, "requirements", []) or []):
                    class _ClonedReq:
                        pass
                    cr = _ClonedReq()
                    cr.skill_id = getattr(r, "skill_id", None)
                    cr.min_proficiency = getattr(r, "min_proficiency", 70)
                    cr.priority = getattr(r, "priority", "Medium")
                    cr.is_mandatory = False
                    cr.skill = getattr(r, "skill", None)
                    cloned.append(cr)
                self.requirements = cloned

            def __getattr__(self, item: str) -> Any:
                return getattr(self._p, item)

        eval_project = _CandidateEvalProject(project)

        excluded_ids: Set[uuid.UUID] = set(config.excluded_employee_ids or [])
        pinned_ids: Set[uuid.UUID] = set(config.pinned_employee_ids or [])

        evaluated_candidates: List[Tuple[Any, AwisCandidateResult]] = []
        exclusion_counts: Dict[str, int] = {}
        excluded_candidates: Dict[uuid.UUID, Dict[str, Any]] = {}

        for emp in employees:
            emp_id = getattr(emp, "id")
            if emp_id in excluded_ids:
                exclusion_counts["EXPLICITLY_EXCLUDED"] = exclusion_counts.get("EXPLICITLY_EXCLUDED", 0) + 1
                excluded_candidates[emp_id] = {"reason": "Explicitly excluded by configuration"}
                continue

            # Capacity pre-check from active allocations: committed >= 100% must be excluded per AWIS policy
            allocations = getattr(emp, "project_allocations", []) or []
            committed_workload = sum(
                float(getattr(a, "allocation_percent", 0.0))
                for a in allocations
                if (getattr(a, "status", "Active") or "Active").lower() == "active"
            )
            if committed_workload >= 100.0 and emp_id not in pinned_ids:
                exclusion_counts["FULLY_COMMITTED"] = exclusion_counts.get("FULLY_COMMITTED", 0) + 1
                excluded_candidates[emp_id] = {"reason": f"Fully committed ({committed_workload:.1f}% currently allocated)"}
                continue

            # Inactive status check
            emp_status = (getattr(emp, "employment_status", "Available") or "Available").strip().lower()
            if emp_status in ("inactive", "terminated", "archived", "on leave") and emp_id not in pinned_ids:
                exclusion_counts["INACTIVE_STATUS"] = exclusion_counts.get("INACTIVE_STATUS", 0) + 1
                excluded_candidates[emp_id] = {"reason": f"Inactive employment status ('{emp_status}')"}
                continue

            awis_res = self.awis_engine.evaluate_employee(emp, eval_project)

            # Strict exclusion of ineligible or non-actionable candidates
            if not awis_res.is_actionable or awis_res.eligibility.status == EligibilityStatus.INELIGIBLE:
                reasons = awis_res.eligibility.reasons or ["INELIGIBLE"]
                for r in reasons:
                    exclusion_counts[r] = exclusion_counts.get(r, 0) + 1
                excluded_candidates[emp_id] = {
                    "reason": "; ".join(awis_res.eligibility.explanations or awis_res.eligibility.reasons or ["Ineligible"])
                }
                continue

            # Additional request-level tolerance filters
            if config.min_availability_percent and config.min_availability_percent > 0:
                avail = getattr(emp, "availability_score", 100.0) or 0.0
                if avail < config.min_availability_percent and emp_id not in pinned_ids:
                    exclusion_counts["BELOW_MIN_AVAILABILITY"] = exclusion_counts.get("BELOW_MIN_AVAILABILITY", 0) + 1
                    excluded_candidates[emp_id] = {"reason": f"Below minimum availability ({avail}%)"}
                    continue

            if config.wellbeing_risk_tolerance == "LowOnly":
                risk = (getattr(emp, "wellbeing_risk", "Low") or "Low").capitalize()
                if risk != "Low" and emp_id not in pinned_ids:
                    exclusion_counts["WELLBEING_RISK_TOLERANCE_EXCEEDED"] = exclusion_counts.get("WELLBEING_RISK_TOLERANCE_EXCEEDED", 0) + 1
                    excluded_candidates[emp_id] = {"reason": f"Wellbeing risk '{risk}' exceeds LowOnly tolerance"}
                    continue

            evaluated_candidates.append((emp, awis_res))

        # --------------------------------------------------------------------------
        # 2. Hard Constraint & Feasibility Verification
        # --------------------------------------------------------------------------
        requirements = getattr(project, "requirements", []) or []
        mandatory_reqs = [r for r in requirements if getattr(r, "is_mandatory", False)]
        unmet_requirements: List[str] = []

        # Check total candidate pool availability
        if len(evaluated_candidates) < target_team_size:
            unmet_requirements.append(
                f"Insufficient eligible candidates: Required {target_team_size}, but only {len(evaluated_candidates)} available."
            )

        # Check mandatory skill coverage capability across pool
        for req in mandatory_reqs:
            req_skill_name = req.skill.name if getattr(req, "skill", None) else str(req.skill_id)
            req_min_prof = getattr(req, "min_proficiency", 70)

            has_candidate = False
            for emp, _ in evaluated_candidates:
                emp_skills = {
                    (getattr(es.skill, "name", "") or "").strip().lower(): getattr(es, "proficiency", 0)
                    for es in (getattr(emp, "skills", []) or [])
                }
                if emp_skills.get(req_skill_name.strip().lower(), 0) >= req_min_prof:
                    has_candidate = True
                    break

            if not has_candidate:
                unmet_requirements.append(
                    f"Missing mandatory project skills: '{req_skill_name}' (min {req_min_prof}% proficiency required)."
                )

        if unmet_requirements:
            # Deterministic, transparent infeasibility explanation
            explanation = (
                f"Team recommendation for project '{proj_name}' is currently infeasible under configured constraints: "
                + "; ".join(unmet_requirements)
            )
            return TeamRecommendationResponse(
                project_id=proj_id,
                project_name=proj_name,
                project_priority=proj_priority,
                formation_option=config.formation_option,
                status="Infeasible",
                is_feasible=False,
                unmet_requirements=unmet_requirements,
                feasibility_explanation=explanation,
                infeasibility_reason=explanation,
                candidates=[],
                recommended_team=[],
                metrics=None,
                alternatives=[],
                excluded_candidates_summary=exclusion_counts,
                excluded_candidates=excluded_candidates,
                created_at=self.now_dt,
            )

        # --------------------------------------------------------------------------
        # 3. Transform Candidates into Structured Responses with Role Allocations
        # --------------------------------------------------------------------------
        structured_candidates: List[TeamCandidateResponse] = []
        for emp, awis_res in evaluated_candidates:
            cand_dto = self._create_candidate_response(emp, awis_res, requirements, target_team_size)
            structured_candidates.append(cand_dto)

        # Deterministic candidate tier sorting:
        # Tier 1 (Complete Eligible) < Tier 2 (Provisional Eligible) < Tier 3 (Needs Review)
        # Higher AWIS score, higher skill match, lower employee UUID
        structured_candidates.sort(
            key=lambda c: (
                c.ranking_tier or 4,
                -(c.match_score),
                -(c.skill_match_percent),
                -(c.availability_percent or 0.0),
                str(c.id),
            )
        )

        # --------------------------------------------------------------------------
        # 4. Deterministic Multi-Objective Combinatorial Team Optimization
        # --------------------------------------------------------------------------
        primary_result, alternative_results = self._search_optimal_teams(
            candidates=structured_candidates,
            target_size=target_team_size,
            requirements=requirements,
            strategy=config.formation_option,
            pinned_ids=pinned_ids,
        )

        # Map alternatives into API response
        api_alternatives: List[TeamAlternativeResponse] = []
        for idx, alt in enumerate(alternative_results, start=1):
            strategy_id = alt.strategy_label.lower().replace(" ", "_").replace("-", "_")
            api_alternatives.append(
                TeamAlternativeResponse(
                    alternative_id=f"alt-{idx}",
                    option_id=strategy_id,
                    strategy_label=alt.strategy_label,
                    description=f"Alternative team configuration emphasizing {alt.strategy_label.lower()}.",
                    members=alt.members,
                    candidates=alt.members,
                    metrics=alt.metrics,
                    team_fit_score=alt.metrics.overall_team_fit,
                    trade_offs=alt.trade_offs,
                    trade_off="; ".join(alt.trade_offs),
                )
            )

        return TeamRecommendationResponse(
            project_id=proj_id,
            project_name=proj_name,
            project_priority=proj_priority,
            formation_option=config.formation_option,
            status="Draft",
            is_feasible=True,
            unmet_requirements=[],
            feasibility_explanation="Feasible team recommendations generated successfully satisfying all mandatory constraints.",
            infeasibility_reason=None,
            candidates=primary_result.members,
            recommended_team=primary_result.members,
            metrics=primary_result.metrics,
            alternatives=api_alternatives,
            excluded_candidates_summary=exclusion_counts,
            excluded_candidates=excluded_candidates,
            created_at=self.now_dt,
        )

    def _create_candidate_response(
        self,
        emp: Any,
        awis: AwisCandidateResult,
        requirements: List[Any],
        target_team_size: int,
    ) -> TeamCandidateResponse:
        """Builds an explainable, hardened candidate DTO."""
        emp_id = getattr(emp, "id")
        emp_code = getattr(emp, "employee_code", f"EMP-{str(emp_id)[:6]}")
        emp_name = getattr(emp, "full_name", "Employee")
        avatar_url = getattr(emp, "avatar_url", None)
        role = getattr(emp, "designation", "Software Engineer") or "Software Engineer"
        department = getattr(emp, "department", "Engineering") or "Engineering"

        # Skills mapping
        emp_skills_map: Dict[str, int] = {}
        primary_skills: List[str] = []
        for es in (getattr(emp, "skills", []) or []):
            s_name = getattr(es.skill, "name", None) if getattr(es, "skill", None) else None
            if s_name:
                emp_skills_map[s_name.strip().lower()] = getattr(es, "proficiency", 0)
                if getattr(es, "is_primary", False) or getattr(es, "proficiency", 0) >= 80:
                    primary_skills.append(s_name)

        # Determine which project requirements this candidate fulfills
        fulfilled_skills: List[str] = []
        for req in requirements:
            r_name = req.skill.name if getattr(req, "skill", None) else str(req.skill_id)
            r_prof = getattr(req, "min_proficiency", 70)
            if emp_skills_map.get(r_name.strip().lower(), 0) >= r_prof:
                fulfilled_skills.append(r_name)

        # Workload & Capacity calculation
        allocations = getattr(emp, "project_allocations", []) or []
        current_committed = sum(
            float(getattr(a, "allocation_percent", 0.0))
            for a in allocations
            if (getattr(a, "status", "Active") or "Active").lower() == "active"
        )
        requested_allocation = round(100.0 / max(1, target_team_size), 2)
        projected_workload = current_committed + requested_allocation

        # Skill match percent
        skill_comp = awis.component_scores.get(AwisFactor.SKILL_MATCH)
        skill_match_pct = skill_comp.score if skill_comp and skill_comp.score is not None else 65.0

        # Assigned role derivation
        assigned_role = self._derive_assigned_role(emp_skills_map, role)

        # Wellbeing risk determination
        burnout_comp = awis.component_scores.get(AwisFactor.BURNOUT_SAFETY)
        wellbeing_risk = "Low"
        if burnout_comp and burnout_comp.score is not None:
            if burnout_comp.score < 50.0:
                wellbeing_risk = "High"
            elif burnout_comp.score < 75.0:
                wellbeing_risk = "Moderate"
        elif getattr(emp, "wellbeing_risk", None):
            wellbeing_risk = getattr(emp, "wellbeing_risk").capitalize()

        # Build explainability payload
        strengths: List[str] = []
        considerations: List[str] = []

        if fulfilled_skills:
            strengths.append(f"Direct coverage of {len(fulfilled_skills)} project requirements: {', '.join(fulfilled_skills[:3])}.")
        if awis.is_complete:
            strengths.append(f"Full verified data profile (Tier 1) with composite AWIS of {awis.composite_score:.1f}.")
        elif awis.is_provisional:
            considerations.append("Provisional evaluation: one or more non-critical factors pending fresh measurements.")

        if projected_workload > 120.0:
            considerations.append(f"High projected workload ({projected_workload:.0f}%); requires balance.")
        else:
            strengths.append(f"Sustainable capacity allocation with {100.0 - current_committed:.0f}% current bandwidth.")

        if wellbeing_risk == "High":
            considerations.append("Elevated fatigue indicators detected; pair with supportive peers.")
        elif wellbeing_risk == "Low":
            strengths.append("High wellbeing sustainability index with strong recovery metrics.")

        why_selected = CandidateWhySelected(
            summary=f"Selected for strong alignment with required deliverables and solid {awis.selected_profile.value} priority suitability.",
            strengths=strengths,
            considerations=considerations,
        )

        match_score = round(awis.composite_score or 70.0, 1)

        return TeamCandidateResponse(
            id=emp_id,
            employee_code=emp_code,
            name=emp_name,
            avatar_url=avatar_url,
            role=role,
            department=department,
            assigned_role=assigned_role,
            match_score=match_score,
            skill_match_percent=round(skill_match_pct, 1),
            performance_score=getattr(emp, "performance_score", 80.0),
            availability_percent=getattr(emp, "availability_score", 100.0),
            current_workload_percent=round(current_committed, 1),
            projected_workload_percent=round(projected_workload, 1),
            wellbeing_risk=wellbeing_risk,
            awis_score=round(awis.composite_score or 70.0, 1),
            ranking_tier=awis.ranking_tier,
            is_provisional=awis.is_provisional,
            needs_review=(awis.eligibility.status == EligibilityStatus.NEEDS_REVIEW),
            is_override=False,
            primary_skills=primary_skills,
            fulfilled_skills=fulfilled_skills,
            why_selected=why_selected,
        )

    def _derive_assigned_role(self, skills_map: Dict[str, int], default_role: str) -> str:
        """Derives clean contextual project role from top skills and title."""
        skills_lower = set(skills_map.keys())
        if any("ai" in s or "pytorch" in s or "machine learning" in s for s in skills_lower):
            return "Lead AI/ML Engineer"
        if any("distributed" in s or "cloud" in s or "kubernetes" in s or "aws" in s for s in skills_lower):
            return "Systems & Infrastructure Architect"
        if any("react" in s or "frontend" in s or "ui" in s or "ux" in s for s in skills_lower):
            return "Frontend UI/UX Specialist"
        if any("security" in s or "compliance" in s for s in skills_lower):
            return "Security & Reliability Lead"
        if any("data" in s or "sql" in s or "pipeline" in s for s in skills_lower):
            return "Data Engineer"
        return default_role

    def _search_optimal_teams(
        self,
        candidates: List[TeamCandidateResponse],
        target_size: int,
        requirements: List[Any],
        strategy: str,
        pinned_ids: Set[uuid.UUID],
    ) -> Tuple[TeamOptimizationResult, List[TeamOptimizationResult]]:
        """
        Explores candidate combinations deterministically to identify the primary
        optimal team and distinct feasible alternatives.
        """
        # Pool size reduction for combinatorial search if pool is huge
        # Keep all pinned members, top performers in each mandatory skill, and top AWIS overall
        pool = self._prune_search_pool(candidates, requirements, pinned_ids, max_pool_size=24)

        mandatory_skills = {
            (req.skill.name if getattr(req, "skill", None) else str(req.skill_id)).strip().lower(): getattr(req, "min_proficiency", 70)
            for req in requirements
            if getattr(req, "is_mandatory", False)
        }

        # Evaluate candidate combinations
        pinned_cands = [c for c in pool if c.id in pinned_ids]
        remaining_slots = target_size - len(pinned_cands)
        other_cands = [c for c in pool if c.id not in pinned_ids]

        evaluated_teams: List[TeamOptimizationResult] = []

        if remaining_slots == 0:
            team = pinned_cands
            metrics = self._calculate_team_metrics(team, requirements)
            evaluated_teams.append(TeamOptimizationResult(team, metrics, fitness_score=metrics.overall_team_fit))
        else:
            for combo in itertools.combinations(other_cands, remaining_slots):
                team = pinned_cands + list(combo)

                # 1. Hard constraint check: Team must satisfy 100% of mandatory skills
                if not self._team_covers_mandatory_skills(team, mandatory_skills):
                    continue

                metrics = self._calculate_team_metrics(team, requirements)
                fitness = self._compute_fitness(team, metrics, strategy)
                evaluated_teams.append(TeamOptimizationResult(team, metrics, fitness_score=fitness))

        # Fallback if no combinations met mandatory constraints in pruned pool (search full pool)
        if not evaluated_teams and len(candidates) > len(pool):
            other_cands_full = [c for c in candidates if c.id not in pinned_ids]
            for combo in itertools.combinations(other_cands_full[:16], remaining_slots):
                team = pinned_cands + list(combo)
                if not self._team_covers_mandatory_skills(team, mandatory_skills):
                    continue
                metrics = self._calculate_team_metrics(team, requirements)
                fitness = self._compute_fitness(team, metrics, strategy)
                evaluated_teams.append(TeamOptimizationResult(team, metrics, fitness_score=fitness))

        # Sort evaluated teams deterministically:
        # Prioritize 0 review-required members, higher fitness, higher team fit, higher skill coverage, lower sorted employee ID tuple
        evaluated_teams.sort(
            key=lambda t: (
                sum(1 for m in t.members if m.needs_review),
                -t.fitness_score,
                -t.metrics.overall_team_fit,
                -t.metrics.skill_coverage_percent,
                -t.metrics.sustainability_score,
                tuple(sorted(str(m.id) for m in t.members)),
            )
        )

        primary = evaluated_teams[0]
        primary.strategy_label = self._get_strategy_display_name(strategy)

        # ----------------------------------------------------------------------
        # Generate Distinct Feasible Alternatives
        # ----------------------------------------------------------------------
        alternatives: List[TeamOptimizationResult] = []
        primary_ids = {m.id for m in primary.members}

        # Strategy-specific alternative candidates
        alt_strategies = ["fatigue_safe", "high_velocity", "growth_mentorship"]
        if strategy in alt_strategies:
            alt_strategies.remove(strategy)
            alt_strategies.insert(0, "autonomous_ai")

        for alt_strat in alt_strategies:
            best_alt: Optional[TeamOptimizationResult] = None
            best_alt_fitness = -1e9
            best_alt_review_count = 999

            for cand_team in evaluated_teams[1:]:
                team_ids = {m.id for m in cand_team.members}

                # Ensure team is distinct: at least 1 or 2 members must be different
                overlap = len(team_ids.intersection(primary_ids))
                if overlap >= target_size:
                    continue

                # Ensure not duplicate of already selected alternatives
                if any(len(team_ids.intersection({m.id for m in a.members})) >= target_size for a in alternatives):
                    continue

                strat_fitness = self._compute_fitness(cand_team.members, cand_team.metrics, alt_strat)
                cand_review_count = sum(1 for m in cand_team.members if m.needs_review)

                # Prioritize teams with fewer review-required members, then highest fitness score
                if (cand_review_count < best_alt_review_count) or (
                    cand_review_count == best_alt_review_count and strat_fitness > best_alt_fitness
                ):
                    best_alt_fitness = strat_fitness
                    best_alt_review_count = cand_review_count
                    best_alt = TeamOptimizationResult(
                        members=cand_team.members,
                        metrics=cand_team.metrics,
                        fitness_score=strat_fitness,
                        strategy_label=self._get_strategy_display_name(alt_strat),
                    )

            if best_alt:
                best_alt.trade_offs = self._generate_trade_offs(primary, best_alt)
                alternatives.append(best_alt)
                if len(alternatives) >= 3:
                    break

        return primary, alternatives

    def _prune_search_pool(
        self,
        candidates: List[TeamCandidateResponse],
        requirements: List[Any],
        pinned_ids: Set[uuid.UUID],
        max_pool_size: int = 24,
    ) -> List[TeamCandidateResponse]:
        """Prunes search pool intelligently while preserving mandatory skill champions and diversity."""
        pool_dict: Dict[uuid.UUID, TeamCandidateResponse] = {}

        # 1. Pinned members always included
        for c in candidates:
            if c.id in pinned_ids:
                pool_dict[c.id] = c

        # 2. Top 2 specialists for every requirement
        for req in requirements:
            r_name = (req.skill.name if getattr(req, "skill", None) else str(req.skill_id)).strip().lower()
            matching = [c for c in candidates if any(s.strip().lower() == r_name for s in c.fulfilled_skills)]
            for match in matching[:2]:
                pool_dict[match.id] = match

        # 3. Fill remaining slots with highest overall AWIS candidates
        for c in candidates:
            if len(pool_dict) >= max_pool_size:
                break
            pool_dict[c.id] = c

        return list(pool_dict.values())

    def _team_covers_mandatory_skills(
        self,
        team: List[TeamCandidateResponse],
        mandatory_skills: Dict[str, int],
    ) -> bool:
        """Verifies whether a team satisfies all mandatory skill requirements."""
        if not mandatory_skills:
            return True

        covered_skills: Set[str] = set()
        for member in team:
            for s in member.fulfilled_skills:
                covered_skills.add(s.strip().lower())

        for skill_name in mandatory_skills:
            if skill_name not in covered_skills:
                return False

        return True

    def _calculate_team_metrics(
        self,
        team: List[TeamCandidateResponse],
        requirements: List[Any],
    ) -> TeamSummaryMetricsResponse:
        """Calculates team-level skill coverage, workload variance, sustainability, and warnings."""
        selected_count = len(team)
        target_count = len(team)

        # 1. Skill Coverage
        team_skills: Set[str] = set()
        for m in team:
            for s in m.fulfilled_skills:
                team_skills.add(s.strip().lower())

        covered_skills_list: List[str] = []
        missing_mandatory: List[str] = []
        missing_optional: List[str] = []

        for req in requirements:
            r_name = (req.skill.name if getattr(req, "skill", None) else str(req.skill_id)).strip()
            is_mandatory = getattr(req, "is_mandatory", False)
            if r_name.lower() in team_skills:
                covered_skills_list.append(r_name)
            elif is_mandatory:
                missing_mandatory.append(r_name)
            else:
                missing_optional.append(r_name)

        total_reqs = len(requirements)
        skill_coverage_pct = round((len(covered_skills_list) / max(1, total_reqs)) * 100.0, 1) if total_reqs > 0 else 100.0

        # 2. Overall Team Fit (Individual average + department diversity & redundancy synergy)
        avg_match = sum(m.match_score for m in team) / max(1, selected_count)
        depts_count = len(set(m.department for m in team))
        diversity_bonus = 2.0 if depts_count > 1 else 0.0
        redundancy_bonus = 1.5 if len(covered_skills_list) == total_reqs and total_reqs > 0 else 0.0
        overall_team_fit = min(99.0, round(avg_match + diversity_bonus + redundancy_bonus, 1))

        # 3. Workload Balance Score (Standard deviation penalty)
        workloads = [m.projected_workload_percent or 50.0 for m in team]
        mean_workload = sum(workloads) / max(1, selected_count)
        variance = sum((w - mean_workload) ** 2 for w in workloads) / max(1, selected_count)
        std_dev = math.sqrt(variance)
        workload_balance_score = max(0.0, min(100.0, round(100.0 - (std_dev * 2.2), 1)))

        # 4. Sustainability & Availability Scores
        avail_avg = sum(m.availability_percent or 100.0 for m in team) / max(1, selected_count)
        availability_score = round(avail_avg, 1)

        wellbeing_points = {
            "Low": 100.0,
            "Moderate": 75.0,
            "High": 40.0,
        }
        wb_sum = sum(wellbeing_points.get(m.wellbeing_risk, 80.0) for m in team)
        workload_sustain_factor = max(0.0, 100.0 - max(0.0, mean_workload - 80.0) * 1.5)
        sustainability_score = round(min(100.0, (wb_sum / max(1, selected_count)) * 0.7 + workload_sustain_factor * 0.3), 1)

        # 5. Operational Warnings
        warnings: List[MetricWarning] = []
        for m in team:
            if (m.availability_percent or 100.0) < 50.0:
                warnings.append(
                    MetricWarning(
                        id=f"warn-avail-{m.id}",
                        type="warning",
                        title=f"Low Bandwidth ({m.name})",
                        message=f"{m.name} has only {m.availability_percent:.0f}% availability for this project window.",
                    )
                )
            if (m.projected_workload_percent or 0.0) > 120.0:
                warnings.append(
                    MetricWarning(
                        id=f"warn-workload-{m.id}",
                        type="alert",
                        title=f"Elevated Workload ({m.name})",
                        message=f"Projected workload reaches {m.projected_workload_percent:.0f}%, exceeding sustainability threshold.",
                    )
                )
            if m.needs_review:
                warnings.append(
                    MetricWarning(
                        id=f"warn-review-{m.id}",
                        type="alert",
                        title=f"Managerial Review Required ({m.name})",
                        message=f"{m.name} requires formal assignment review due to elevated fatigue or leave status.",
                    )
                )
            elif m.is_provisional:
                warnings.append(
                    MetricWarning(
                        id=f"warn-prov-{m.id}",
                        type="info",
                        title=f"Provisional Data ({m.name})",
                        message=f"{m.name}'s score includes provisional factors; verify latest reviews.",
                    )
                )

        return TeamSummaryMetricsResponse(
            overall_team_fit=overall_team_fit,
            selected_count=selected_count,
            target_count=target_count,
            skill_coverage_percent=skill_coverage_pct,
            covered_skills_count=len(covered_skills_list),
            total_skills_required=total_reqs,
            workload_balance_score=workload_balance_score,
            sustainability_score=sustainability_score,
            availability_coverage_score=availability_score,
            covered_skills=covered_skills_list,
            missing_mandatory_skills=missing_mandatory,
            missing_optional_skills=missing_optional,
            warnings=warnings,
        )

    def _compute_fitness(
        self,
        team: List[TeamCandidateResponse],
        metrics: TeamSummaryMetricsResponse,
        strategy: str,
    ) -> float:
        """Computes fitness score according to the chosen optimization strategy profile."""
        fit = metrics.overall_team_fit
        skills = metrics.skill_coverage_percent
        sustain = metrics.sustainability_score
        balance = metrics.workload_balance_score
        avail = metrics.availability_coverage_score

        # Tier penalty: Tier 1 (0 penalty) < Tier 2 (-1.5 per member) < Tier 3 (-4.0 per member)
        tier_penalty = sum(
            0.0 if m.ranking_tier == 1 else (1.5 if m.ranking_tier == 2 else 4.0)
            for m in team
        )

        if strategy == "fatigue_safe":
            return round(0.20 * fit + 0.20 * skills + 0.35 * sustain + 0.25 * balance - tier_penalty, 3)
        elif strategy == "high_velocity":
            perf_avg = sum(m.performance_score or 80.0 for m in team) / max(1, len(team))
            return round(0.40 * fit + 0.30 * skills + 0.15 * perf_avg + 0.15 * sustain - tier_penalty, 3)
        elif strategy == "growth_mentorship":
            seniors = sum(1 for m in team if (m.performance_score or 0) >= 85 and m.match_score >= 80)
            juniors = sum(1 for m in team if (m.performance_score or 0) < 85)
            pairing_bonus = 5.0 if seniors >= 1 and juniors >= 1 else 0.0
            return round(0.30 * fit + 0.30 * skills + 0.20 * sustain + 0.20 * balance + pairing_bonus - tier_penalty, 3)
        elif strategy == "rebalance_existing":
            return round(0.20 * fit + 0.20 * skills + 0.30 * avail + 0.30 * balance - tier_penalty, 3)
        else:
            # autonomous_ai (default balanced)
            return round(0.35 * fit + 0.30 * skills + 0.20 * sustain + 0.15 * balance - tier_penalty, 3)

    def _generate_trade_offs(
        self,
        primary: TeamOptimizationResult,
        alternative: TeamOptimizationResult,
    ) -> List[str]:
        """Produces clear, transparent comparative trade-off explanations."""
        trade_offs: List[str] = []

        diff_fit = alternative.metrics.overall_team_fit - primary.metrics.overall_team_fit
        diff_skills = alternative.metrics.skill_coverage_percent - primary.metrics.skill_coverage_percent
        diff_sustain = alternative.metrics.sustainability_score - primary.metrics.sustainability_score
        diff_avail = alternative.metrics.availability_coverage_score - primary.metrics.availability_coverage_score

        if diff_sustain > 2.0:
            trade_offs.append(f"+{diff_sustain:.1f}% higher workforce sustainability score with lower fatigue risk.")
        elif diff_sustain < -2.0:
            trade_offs.append(f"{diff_sustain:.1f}% lower sustainability due to higher workload pressure.")

        if diff_skills > 2.0:
            trade_offs.append(f"+{diff_skills:.1f}% broader skill coverage across optional project requirements.")
        elif diff_skills < -2.0:
            trade_offs.append(f"{diff_skills:.1f}% lower optional skill coverage while preserving mandatory baselines.")

        if diff_avail > 3.0:
            trade_offs.append(f"+{diff_avail:.1f}% greater availability headroom for immediate sprint allocation.")
        elif diff_avail < -3.0:
            trade_offs.append(f"{diff_avail:.1f}% tighter availability bandwidth.")

        if diff_fit > 1.0:
            trade_offs.append(f"+{diff_fit:.1f}% higher overall team fit.")
        elif diff_fit < -1.0:
            trade_offs.append(f"{diff_fit:.1f}% overall team fit.")

        if not trade_offs:
            trade_offs.append("Alternative staffing configuration with equivalent composite suitability profile.")

        return trade_offs

    def _get_strategy_display_name(self, strategy: str) -> str:
        names = {
            "autonomous_ai": "Autonomous AI Balanced",
            "fatigue_safe": "Fatigue-Safe & Sustainable",
            "high_velocity": "High Velocity Delivery",
            "growth_mentorship": "Growth & Mentorship",
            "rebalance_existing": "Workload Rebalancing",
            "custom_constraints": "Custom Constraints",
        }
        return names.get(strategy, "Autonomous AI")
