import { mockEmployees, type Employee } from '../data/mockEmployees';
import { mockProjects, type Project } from '../data/mockProjects';
import { 
  initialFormationHistory,
  mockFormationKpiData,
  mockFormationOptions
} from '../data/mockTeamFormations';
import type { 
  TeamFormationConfig, 
  TeamCandidate, 
  TeamSummaryMetrics, 
  FormationHistoryItem,
  FormationKpiData,
  FormationOptionDef,
  MetricWarning,
  TeamAlternativeItem,
  TeamRecommendationResult
} from '../types/teamFormation';
import { authenticatedFetch } from './apiClient';
import { projectService } from './projectService';
import { employeeService } from './employeeService';

const STORAGE_HISTORY_KEY = 'nexawis_formation_history_v1';

let demoModeOverride: boolean | null = null;

/**
 * Configure demo mode override dynamically (useful for tests or demo flags).
 */
export function setDemoModeOverride(enabled: boolean | null): void {
  demoModeOverride = enabled;
}

/**
 * Determines whether mock fallbacks and synthetic recommendations are permitted.
 * In production mode or when demo mode is not explicitly configured, mock data is strictly blocked.
 */
export function isMockFallbackAllowed(): boolean {
  if (demoModeOverride !== null) {
    return demoModeOverride;
  }
  const isEnvDemo = typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_DEMO_MODE === 'true';
  const isProd = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.PROD);
  
  if (isProd) {
    return isEnvDemo;
  }

  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('nexawis_demo_mode') === 'true') {
      return true;
    }
  } catch {}

  return isEnvDemo;
}

// In-memory or localStorage cache for formation history
function loadHistory(): FormationHistoryItem[] {
  if (!isMockFallbackAllowed()) {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback to initial
  }
  return initialFormationHistory;
}

function persistHistory(items: FormationHistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Could not persist formation history:', e);
  }
}

let historyCache: FormationHistoryItem[] = loadHistory();

/**
 * Service Layer: Team Formation
 * Connects directly to Phase 8 Constraint-Aware Team Optimization backend endpoints.
 * In production mode, strictly isolates real API failures and blocks fabricated synthetic fallbacks.
 */
export const teamFormationService = {
  /**
   * Retrieve list of projects available for team formation from backend or local cache
   */
  async getAvailableProjects(): Promise<Project[]> {
    try {
      const res = await projectService.getProjects({ pageSize: 100 });
      if (res && res.items) {
        return res.items;
      }
    } catch (e) {
      if (!isMockFallbackAllowed()) {
        console.error('Failed to load projects from backend in production mode:', e);
        throw e;
      }
      console.warn('Could not load projects from backend API, using local demo fallback:', e);
    }

    if (!isMockFallbackAllowed()) {
      return [];
    }

    try {
      const savedProjects = localStorage.getItem('nexawis_projects_v2');
      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return mockProjects;
  },

  /**
   * Retrieve full employee pool from backend or local cache
   */
  async getEmployees(): Promise<Employee[]> {
    try {
      const res = await employeeService.getEmployees({ pageSize: 100 });
      if (res && res.items) {
        return res.items as unknown as Employee[];
      }
    } catch (e) {
      if (!isMockFallbackAllowed()) {
        console.error('Failed to load employees from backend in production mode:', e);
        throw e;
      }
      console.warn('Could not load employees from backend API, using local demo fallback:', e);
    }

    if (!isMockFallbackAllowed()) {
      return [];
    }
    return mockEmployees;
  },

  /**
   * Retrieve single employee by ID
   */
  async getEmployeeById(id: string): Promise<Employee | undefined> {
    try {
      const emp = await employeeService.getEmployeeById(id);
      if (emp) return emp as unknown as Employee;
    } catch (e) {
      if (!isMockFallbackAllowed()) {
        throw e;
      }
    }
    if (!isMockFallbackAllowed()) {
      return undefined;
    }
    return mockEmployees.find(e => e.id === id || e.employeeId === id);
  },

  /**
   * Get formation overview KPI statistics from backend /teams/kpis
   */
  async getFormationKpis(): Promise<FormationKpiData> {
    try {
      const res = await authenticatedFetch<{
        total_formations: number;
        total_formations_trend: string;
        teams_created: number;
        teams_created_trend: string;
        average_team_fit: number;
        average_team_fit_trend: string;
        workforce_sustainability: number;
        workforce_sustainability_trend: string;
      }>('/teams/kpis');

      if (res) {
        return {
          totalFormations: res.total_formations,
          totalFormationsTrend: res.total_formations_trend,
          teamsCreated: res.teams_created,
          teamsCreatedTrend: res.teams_created_trend,
          averageTeamFit: res.average_team_fit,
          averageTeamFitTrend: res.average_team_fit_trend,
          workforceSustainability: res.workforce_sustainability,
          workforceSustainabilityTrend: res.workforce_sustainability_trend,
        };
      }
    } catch (e) {
      if (!isMockFallbackAllowed()) {
        console.error('Failed to load team formation KPIs from backend in production mode:', e);
        throw e;
      }
      console.warn('Could not load team formation KPIs from backend API:', e);
    }

    if (!isMockFallbackAllowed()) {
      throw new Error('Production mode: Team formation KPIs are unavailable.');
    }

    const history = historyCache;
    const total = history.length + 23;
    const activeOrFinal = history.filter(h => h.status !== 'Draft').length + 20;
    const avgFit = Math.round(
      history.reduce((acc, h) => acc + h.teamFitScore, 0) / (history.length || 1) * 10
    ) / 10;

    return {
      ...mockFormationKpiData,
      totalFormations: total,
      teamsCreated: activeOrFinal,
      averageTeamFit: avgFit || mockFormationKpiData.averageTeamFit,
    };
  },

  /**
   * Get team formation options / strategy modes
   */
  getFormationOptions(): FormationOptionDef[] {
    return mockFormationOptions;
  },

  /**
   * Get single formation option definition by ID
   */
  getFormationOptionById(id: string): FormationOptionDef | undefined {
    return mockFormationOptions.find(opt => opt.id === id);
  },

  /**
   * Generate constraint-aware team recommendations from backend or algorithmic fallback
   */
  async generateTeamRecommendations(
    project: Project,
    config: TeamFormationConfig
  ): Promise<TeamRecommendationResult> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(project.id);

    if (!isUuid && !isMockFallbackAllowed()) {
      throw new Error(`Project ID "${project.id}" is not a valid UUID. Real backend project required in production mode.`);
    }

    if (isUuid) {
      try {
        const payload = {
          target_team_size: config.teamSize,
          team_size: config.teamSize,
          formation_option: config.formationOption || 'autonomous_ai',
          min_availability_percent: config.minAvailability ?? 0,
          wellbeing_risk_tolerance: config.wellbeingRiskTolerance || 'ModerateAllowed',
          include_growth_opportunities: config.includeGrowthOpportunities ?? true,
        };

        const res = await authenticatedFetch<{
          formation_id?: string;
          formation_code?: string;
          project_id: string;
          project_name: string;
          formation_option: string;
          status: string;
          is_feasible: boolean;
          unmet_requirements?: string[];
          feasibility_explanation?: string;
          infeasibility_reason?: string;
          candidates?: Array<{
            id: string;
            employee_code: string;
            name: string;
            avatar_url: string | null;
            role: string;
            department: string;
            assigned_role: string;
            match_score: number;
            skill_match_percent: number;
            performance_score: number | null;
            availability_percent: number | null;
            current_workload_percent: number | null;
            wellbeing_risk: string;
            awis_score: number | null;
            is_override?: boolean;
            needs_review?: boolean;
            primary_skills?: string[];
            fulfilled_skills?: string[];
            why_selected?: {
              summary: string;
              strengths: string[];
              considerations: string[];
            };
          }>;
          recommended_team?: Array<any>;
          metrics?: {
            overall_team_fit: number;
            selected_count: number;
            target_count: number;
            skill_coverage_percent: number;
            covered_skills_count: number;
            total_skills_required: number;
            workload_balance_score: number;
            sustainability_score: number;
            availability_coverage_score: number;
            warnings?: Array<{
              id: string;
              type: 'warning' | 'alert' | 'info';
              title: string;
              message: string;
            }>;
          };
          alternatives?: Array<{
            alternative_id?: string;
            option_id?: string;
            strategy_label?: string;
            description?: string;
            members?: Array<any>;
            candidates?: Array<any>;
            metrics?: any;
            trade_offs?: string[];
            trade_off?: string;
            team_fit_score?: number;
          }>;
        }>(`/teams/projects/${project.id}/team-recommendation`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (res) {
          const rawCandidates = res.candidates || res.recommended_team || [];
          const mappedCandidates: TeamCandidate[] = rawCandidates.map((c) => ({
            id: String(c.id),
            employeeId: c.employee_code || String(c.id),
            name: c.name,
            avatarUrl: c.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
            role: c.role || 'Engineer',
            department: c.department || 'Engineering',
            assignedRole: c.assigned_role || c.role || 'Contributor',
            matchScore: Math.round(c.match_score ?? 85),
            skillMatchPercent: Math.round(c.skill_match_percent ?? 80),
            performanceScore: Math.round(c.performance_score ?? 85),
            availabilityPercent: Math.round(c.availability_percent ?? 80),
            currentWorkloadPercent: Math.round(c.current_workload_percent ?? 50),
            wellbeingRisk: (c.wellbeing_risk as 'Low' | 'Moderate' | 'High') || 'Low',
            awisScore: Math.round(c.awis_score ?? c.match_score ?? 85),
            isOverride: Boolean(c.is_override),
            primarySkills: c.primary_skills || [],
            allSkills: (c.fulfilled_skills || []).map((s: string) => ({
              id: s.toLowerCase().replace(/\s+/g, '-'),
              name: s,
              category: 'Core',
              proficiency: 90,
              isPrimary: true,
            })),
            whySelected: c.why_selected || {
              summary: `Selected as ${c.assigned_role || c.role} based on Phase 6 AWIS scoring.`,
              strengths: [`Direct match for project requirements`, `Available within workload safety threshold`],
              considerations: c.needs_review ? ['Workload requires management review (projected >140%)'] : [],
            },
          }));

          const bm = res.metrics;
          const mappedMetrics: TeamSummaryMetrics = bm ? {
            overallTeamFit: Math.round(bm.overall_team_fit ?? 85),
            selectedCount: bm.selected_count ?? mappedCandidates.length,
            targetCount: bm.target_count ?? config.teamSize,
            skillCoveragePercent: Math.round(bm.skill_coverage_percent ?? 100),
            coveredSkillsCount: bm.covered_skills_count ?? config.requiredSkills.length,
            totalSkillsRequired: bm.total_skills_required ?? config.requiredSkills.length,
            workloadBalanceScore: Math.round(bm.workload_balance_score ?? 85),
            sustainabilityScore: Math.round(bm.sustainability_score ?? 90),
            availabilityCoverageScore: Math.round(bm.availability_coverage_score ?? 80),
            warnings: (bm.warnings || []).map((w, idx) => ({
              id: w.id || `warn-${idx}`,
              type: w.type || 'info',
              title: w.title || 'Notice',
              message: w.message || '',
            })),
          } : teamFormationService.calculateTeamMetrics(mappedCandidates, config);

          // Map distinct alternatives
          const mappedAlternatives: TeamAlternativeItem[] = (res.alternatives || []).map((alt) => {
            const altMembers: TeamCandidate[] = (alt.members || alt.candidates || []).map((c: any) => ({
              id: String(c.id),
              employeeId: c.employee_code || String(c.id),
              name: c.name,
              avatarUrl: c.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
              role: c.role || 'Engineer',
              department: c.department || 'Engineering',
              assignedRole: c.assigned_role || c.role || 'Contributor',
              matchScore: Math.round(c.match_score ?? 85),
              skillMatchPercent: Math.round(c.skill_match_percent ?? 80),
              performanceScore: Math.round(c.performance_score ?? 85),
              availabilityPercent: Math.round(c.availability_percent ?? 80),
              currentWorkloadPercent: Math.round(c.current_workload_percent ?? 50),
              wellbeingRisk: (c.wellbeing_risk as 'Low' | 'Moderate' | 'High') || 'Low',
              awisScore: Math.round(c.awis_score ?? c.match_score ?? 85),
              isOverride: false,
              primarySkills: c.primary_skills || [],
              allSkills: [],
              whySelected: c.why_selected || {
                summary: `Recommended candidate under alternative strategy.`,
                strengths: [],
                considerations: [],
              },
            }));

            const altBm = alt.metrics;
            const altMetrics: TeamSummaryMetrics = altBm ? {
              overallTeamFit: Math.round(altBm.overall_team_fit ?? alt.team_fit_score ?? 85),
              selectedCount: altBm.selected_count ?? altMembers.length,
              targetCount: altBm.target_count ?? config.teamSize,
              skillCoveragePercent: Math.round(altBm.skill_coverage_percent ?? 100),
              coveredSkillsCount: altBm.covered_skills_count ?? 0,
              totalSkillsRequired: altBm.total_skills_required ?? 0,
              workloadBalanceScore: Math.round(altBm.workload_balance_score ?? 85),
              sustainabilityScore: Math.round(altBm.sustainability_score ?? 90),
              availabilityCoverageScore: Math.round(altBm.availability_coverage_score ?? 80),
              warnings: (altBm.warnings || []).map((w: any, idx: number) => ({
                id: w.id || `alt-warn-${idx}`,
                type: w.type || 'info',
                title: w.title || 'Notice',
                message: w.message || '',
              })),
            } : teamFormationService.calculateTeamMetrics(altMembers, config);

            return {
              alternativeId: alt.alternative_id || alt.option_id || 'alt',
              strategyLabel: alt.strategy_label || 'Alternative Strategy',
              description: alt.description || '',
              members: altMembers,
              metrics: altMetrics,
              tradeOffs: alt.trade_offs || (alt.trade_off ? [alt.trade_off] : []),
            };
          });

          return {
            candidates: mappedCandidates,
            metrics: mappedMetrics,
            formationId: res.formation_id,
            formationCode: res.formation_code,
            isFeasible: res.is_feasible,
            feasibilityExplanation: res.feasibility_explanation || res.infeasibility_reason,
            unmetRequirements: res.unmet_requirements,
            alternatives: mappedAlternatives,
          };
        }
      } catch (e) {
        if (!isMockFallbackAllowed()) {
          console.error('Backend recommendation generation failed in production mode:', e);
          throw e;
        }
        console.warn('Backend recommendation generation failed, falling back to client-side engine in demo mode:', e);
      }
    }

    if (!isMockFallbackAllowed()) {
      throw new Error('Production mode: Real backend API failed to generate team recommendations.');
    }

    // Client-side fallback algorithm (demo mode only)
    await new Promise(r => setTimeout(r, 450));

    const formationOption = config.formationOption || 'autonomous_ai';

    let skillWeight = 0.40;
    let availWeight = 0.20;
    let perfWeight = 0.20;
    let workloadWeight = 0.20;

    if (formationOption === 'fatigue_safe') {
      workloadWeight = 0.35;
      availWeight = 0.25;
      skillWeight = 0.25;
      perfWeight = 0.15;
    } else if (formationOption === 'high_velocity') {
      perfWeight = 0.35;
      skillWeight = 0.35;
      availWeight = 0.20;
      workloadWeight = 0.10;
    } else if (formationOption === 'growth_mentorship') {
      skillWeight = 0.30;
      perfWeight = 0.25;
      availWeight = 0.25;
      workloadWeight = 0.20;
    } else if (formationOption === 'rebalance_existing') {
      workloadWeight = 0.35;
      skillWeight = 0.30;
      availWeight = 0.20;
      perfWeight = 0.15;
    }

    const scoredCandidates: Array<{ candidate: TeamCandidate; rawScore: number }> = mockEmployees.map(emp => {
      let matchedCount = 0;
      let proficiencySum = 0;

      config.requiredSkills.forEach(req => {
        const found = emp.skills.find(s => s.name.toLowerCase() === req.skill.toLowerCase());
        if (found) {
          matchedCount++;
          const weight = req.priority === 'High' ? 1.2 : req.priority === 'Medium' ? 1.0 : 0.8;
          proficiencySum += found.proficiency * weight;
        }
      });

      const skillMatchPercent = config.requiredSkills.length > 0
        ? Math.min(Math.round((proficiencySum / (config.requiredSkills.length * 100)) * 100), 100)
        : Math.round(emp.awisFitScore);

      const availabilityScore = emp.availabilityScore;
      const workloadScore = Math.max(0, 100 - emp.workloadScore);

      let wellbeingMultiplier = emp.wellbeingRisk === 'Low' ? 1.0 : emp.wellbeingRisk === 'Moderate' ? 0.82 : 0.55;
      if (formationOption === 'fatigue_safe' && emp.wellbeingRisk === 'High') {
        wellbeingMultiplier = 0.2;
      }

      let growthBonus = 0;
      if (config.includeGrowthOpportunities && emp.growthPotential > 75) {
        growthBonus = formationOption === 'growth_mentorship' ? 12 : 6;
      }

      const rawScore = (
        skillMatchPercent * skillWeight +
        availabilityScore * availWeight +
        emp.performanceScore * perfWeight +
        workloadScore * workloadWeight
      ) * wellbeingMultiplier + growthBonus;

      const finalMatchScore = Math.min(Math.max(Math.round(rawScore), 50), 99);

      let assignedRole = emp.role;
      if (emp.skills.some(s => s.name.includes('AI') || s.name.includes('PyTorch'))) {
        assignedRole = 'Lead AI/ML Engineer';
      } else if (emp.skills.some(s => s.name.includes('Distributed') || s.name.includes('Rust'))) {
        assignedRole = 'Distributed Systems Architect';
      } else if (emp.skills.some(s => s.name.includes('Cloud') || s.name.includes('Kubernetes'))) {
        assignedRole = 'Cloud Infrastructure Engineer';
      } else if (emp.skills.some(s => s.name.includes('React') || s.name.includes('UX'))) {
        assignedRole = 'Frontend UX Specialist';
      } else if (emp.skills.some(s => s.name.includes('Data') || s.name.includes('MLOps'))) {
        assignedRole = 'Data Pipeline & MLOps';
      } else if (emp.skills.some(s => s.name.includes('Security'))) {
        assignedRole = 'Security & Compliance Lead';
      }

      const strengths: string[] = [];
      const considerations: string[] = [];

      if (matchedCount > 0) {
        strengths.push(`Direct alignment with ${matchedCount} required project skill(s) (${emp.skills[0]?.name || 'Core Stack'}).`);
      }
      if (emp.availabilityScore >= 70) {
        strengths.push(`High availability (${emp.availabilityScore}%) allows immediate sprint ramp-up without context switching.`);
      } else {
        considerations.push(`Current availability is at ${emp.availabilityScore}%; monitor multi-project concurrency.`);
      }

      if (emp.performanceScore >= 90) {
        strengths.push(`Consistent high performer (${emp.performanceScore}/100) with proven delivery track record.`);
      }

      if (emp.wellbeingRisk === 'Low') {
        strengths.push(`Sustainable workload profile with healthy wellbeing indicators.`);
      } else if (emp.wellbeingRisk === 'Moderate') {
        considerations.push(`Moderate workload strain detected; avoid assigning additional off-sprint tasks.`);
      } else {
        considerations.push(`Elevated burnout risk; pair with balanced contributors to absorb peak pressure.`);
      }

      const whySelected = {
        summary: `Strong candidate with ${finalMatchScore}% composite match for ${project.name}. Brings deep ${emp.department} capability.`,
        strengths: strengths.slice(0, 3),
        considerations: considerations.slice(0, 2)
      };

      const candidate: TeamCandidate = {
        id: emp.id,
        employeeId: emp.employeeId,
        name: emp.name,
        avatarUrl: emp.avatarUrl,
        role: emp.role,
        department: emp.department,
        assignedRole,
        matchScore: finalMatchScore,
        skillMatchPercent,
        performanceScore: emp.performanceScore,
        availabilityPercent: emp.availabilityScore,
        currentWorkloadPercent: emp.workloadScore,
        wellbeingRisk: emp.wellbeingRisk,
        awisScore: emp.awisFitScore,
        isOverride: false,
        primarySkills: emp.skills.filter(s => s.isPrimary).map(s => s.name),
        allSkills: emp.skills,
        whySelected
      };

      return { candidate, rawScore: finalMatchScore };
    });

    let filtered = scoredCandidates;
    if (config.wellbeingRiskTolerance === 'LowOnly') {
      const lowOnly = scoredCandidates.filter(c => c.candidate.wellbeingRisk === 'Low');
      if (lowOnly.length >= config.teamSize) {
        filtered = lowOnly;
      }
    }

    filtered.sort((a, b) => b.rawScore - a.rawScore);
    const selectedCandidates = filtered.slice(0, config.teamSize).map(item => item.candidate);
    const metrics = teamFormationService.calculateTeamMetrics(selectedCandidates, config);

    return {
      candidates: selectedCandidates,
      metrics,
      isFeasible: true,
      alternatives: []
    };
  },

  /**
   * Recalculate team-level metrics on the fly whenever candidate selections change
   */
  calculateTeamMetrics(
    candidates: TeamCandidate[],
    config: TeamFormationConfig
  ): TeamSummaryMetrics {
    const selectedCount = candidates.length;
    const targetCount = config.teamSize;

    if (selectedCount === 0) {
      return {
        overallTeamFit: 0,
        selectedCount: 0,
        targetCount,
        skillCoveragePercent: 0,
        coveredSkillsCount: 0,
        totalSkillsRequired: config.requiredSkills.length,
        workloadBalanceScore: 0,
        sustainabilityScore: 0,
        availabilityCoverageScore: 0,
        warnings: [
          {
            id: 'warn-empty',
            type: 'alert',
            title: 'No Team Members Assigned',
            message: 'Add candidates to the roster to calculate team synergy and coverage metrics.'
          }
        ]
      };
    }

    const avgMatch = candidates.reduce((acc, c) => acc + c.matchScore, 0) / selectedCount;
    const depts = new Set(candidates.map(c => c.department)).size;
    const diversityBonus = depts > 1 ? 2.5 : 0;
    const overallTeamFit = Math.min(Math.round(avgMatch + diversityBonus), 99);

    const allAssignedSkillNames = new Set(
      candidates.flatMap(c => (c.allSkills || []).map(s => s.name.toLowerCase()))
    );

    let coveredSkillsCount = 0;
    const missingSkills: string[] = [];

    config.requiredSkills.forEach(req => {
      if (allAssignedSkillNames.has(req.skill.toLowerCase())) {
        coveredSkillsCount++;
      } else {
        missingSkills.push(req.skill);
      }
    });

    const skillCoveragePercent = config.requiredSkills.length > 0
      ? Math.round((coveredSkillsCount / config.requiredSkills.length) * 100)
      : 100;

    const avgWorkload = candidates.reduce((acc, c) => acc + c.currentWorkloadPercent, 0) / selectedCount;
    const workloadBalanceScore = Math.max(Math.round(100 - avgWorkload * 0.65), 50);

    let sustainabilityDeduction = 0;
    candidates.forEach(c => {
      if (c.wellbeingRisk === 'High') sustainabilityDeduction += 20;
      else if (c.wellbeingRisk === 'Moderate') sustainabilityDeduction += 7;
    });
    const sustainabilityScore = Math.max(100 - sustainabilityDeduction, 45);

    const avgAvailability = candidates.reduce((acc, c) => acc + c.availabilityPercent, 0) / selectedCount;
    const availabilityCoverageScore = Math.round(avgAvailability);

    const warnings: MetricWarning[] = [];

    if (selectedCount < targetCount) {
      warnings.push({
        id: 'warn-size',
        type: 'warning',
        title: 'Team Under Target Size',
        message: `Currently ${selectedCount} of ${targetCount} member spots filled. Add ${targetCount - selectedCount} more member(s) to reach full staffing.`
      });
    } else if (selectedCount > targetCount) {
      warnings.push({
        id: 'warn-oversize',
        type: 'info',
        title: 'Overstaffed Configuration',
        message: `Current team has ${selectedCount} members (${selectedCount - targetCount} above target of ${targetCount}). Verify budget and communication overhead.`
      });
    }

    if (missingSkills.length > 0) {
      warnings.push({
        id: 'warn-skills',
        type: 'alert',
        title: 'Simulated Skill Gap Detected',
        message: `Missing required capability: ${missingSkills.join(', ')}. Consider swapping a candidate to cover these requirements.`
      });
    }

    const highRiskMembers = candidates.filter(c => c.wellbeingRisk === 'High');
    if (highRiskMembers.length > 0) {
      warnings.push({
        id: 'warn-risk',
        type: 'warning',
        title: 'Workforce Fatigue Alert',
        message: `${highRiskMembers.map(m => m.name).join(', ')} has high wellbeing risk. Adjust workload allocations to prevent burnout.`
      });
    }

    const lowAvailMembers = candidates.filter(c => c.availabilityPercent < 50);
    if (lowAvailMembers.length > 0) {
      warnings.push({
        id: 'warn-avail',
        type: 'info',
        title: 'Constrained Availability',
        message: `${lowAvailMembers.map(m => m.name).join(', ')} has under 50% available bandwidth for this sprint cycle.`
      });
    }

    return {
      overallTeamFit,
      selectedCount,
      targetCount,
      skillCoveragePercent,
      coveredSkillsCount,
      totalSkillsRequired: config.requiredSkills.length,
      workloadBalanceScore,
      sustainabilityScore,
      availabilityCoverageScore,
      warnings
    };
  },

  /**
   * Get alternative employees suitable for replacing or adding
   */
  async getAlternativeCandidates(
    currentTeamIds: string[],
    filterSkill?: string
  ): Promise<Employee[]> {
    try {
      const allEmps = await this.getEmployees();
      return allEmps.filter(emp => {
        if (currentTeamIds.includes(emp.id)) return false;
        if (filterSkill && emp.skills) {
          return emp.skills.some(s => s.name.toLowerCase().includes(filterSkill.toLowerCase()));
        }
        return true;
      });
    } catch (e) {
      if (!isMockFallbackAllowed()) {
        console.error('Failed to load alternative candidates in production mode:', e);
        return [];
      }
      return mockEmployees.filter(emp => {
        if (currentTeamIds.includes(emp.id)) return false;
        if (filterSkill) {
          return emp.skills.some(s => s.name.toLowerCase().includes(filterSkill.toLowerCase()));
        }
        return true;
      });
    }
  },

  /**
   * Save a formation as a draft
   */
  async saveFormationDraft(
    data: Omit<FormationHistoryItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<FormationHistoryItem> {
    await new Promise(r => setTimeout(r, 150));
    const now = new Date().toISOString();
    const id = `FRM-DRAFT-${Math.floor(1000 + Math.random() * 9000)}`;

    const newItem: FormationHistoryItem = {
      ...data,
      id,
      status: 'Draft',
      createdAt: now,
      updatedAt: now
    };

    historyCache = [newItem, ...historyCache];
    persistHistory(historyCache);
    return newItem;
  },

  /**
   * Finalize a team formation (commits persistent ProjectAllocation records in backend)
   */
  async finalizeFormation(
    data: Omit<FormationHistoryItem, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { formationId?: string }
  ): Promise<FormationHistoryItem> {
    const formationId = data.formationId;

    if (!formationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formationId)) {
      if (!isMockFallbackAllowed()) {
        throw new Error(`Production mode: Valid backend formationId is required to finalize formation. Received: "${formationId}".`);
      }
    }

    if (formationId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formationId)) {
      try {
        const payload = {
          notes: data.notes || `Finalized formation for ${data.projectName}.`,
          selected_candidate_ids: data.members
            .map(m => m.id)
            .filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)),
        };

        const res = await authenticatedFetch<{
          formation_id: string;
          project_id: string;
          status: string;
          assigned_member_count: number;
          allocated_members: Array<any>;
          message: string;
        }>(`/teams/recommendations/${formationId}/finalize`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (res) {
          const now = new Date().toISOString();
          const newItem: FormationHistoryItem = {
            id: `FRM-${formationId.slice(0, 8).toUpperCase()}`,
            formationId: formationId,
            projectId: data.projectId,
            projectName: data.projectName,
            projectDepartment: data.projectDepartment,
            createdAt: now,
            updatedAt: now,
            teamSize: res.assigned_member_count || data.teamSize,
            teamFitScore: data.teamFitScore,
            status: 'Finalized',
            members: data.members,
            metrics: data.metrics,
            notes: data.notes,
          };

          historyCache = [newItem, ...historyCache.filter(h => h.formationId !== formationId && h.id !== newItem.id)];
          persistHistory(historyCache);
          return newItem;
        }
      } catch (e) {
        console.error('Backend finalization error:', e);
        throw e;
      }
    }

    if (!isMockFallbackAllowed()) {
      throw new Error('Production mode: Finalization failed and local demo persistence is disabled.');
    }

    // Local fallback persistence (demo mode only)
    await new Promise(r => setTimeout(r, 200));
    const now = new Date().toISOString();
    const count = historyCache.length + 82;
    const id = `FRM-2026-${String(count).padStart(3, '0')}`;

    const newItem: FormationHistoryItem = {
      ...data,
      id,
      status: 'Finalized',
      createdAt: now,
      updatedAt: now
    };

    historyCache = [newItem, ...historyCache];
    persistHistory(historyCache);
    return newItem;
  },

  /**
   * Reject / archive a team recommendation snapshot
   */
  async rejectFormation(formationId: string): Promise<void> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formationId);
    if (isUuid) {
      try {
        await authenticatedFetch(`/teams/recommendations/${formationId}/reject`, {
          method: 'POST',
        });
      } catch (e) {
        console.warn('Backend rejection error:', e);
      }
    }
  },

  /**
   * Retrieve all formation history records
   */
  async getFormationHistory(): Promise<FormationHistoryItem[]> {
    try {
      const res = await authenticatedFetch<Array<{
        id: string;
        formation_code: string;
        project_id: string;
        project_name: string;
        project_department: string;
        formation_option: string;
        status: string;
        team_size: number;
        team_fit_score: number | null;
        skill_coverage_percent: number | null;
        sustainability_score: number | null;
        created_at: string;
        updated_at: string;
        notes: string | null;
        metrics: Record<string, any>;
        members: Array<Record<string, any>>;
      }>>('/teams/history');

      if (Array.isArray(res)) {
        const mapped: FormationHistoryItem[] = res.map(item => ({
          id: item.formation_code || item.id,
          formationId: item.id,
          projectId: item.project_id,
          projectName: item.project_name,
          projectDepartment: item.project_department,
          createdAt: typeof item.created_at === 'string' ? item.created_at : new Date(item.created_at).toISOString(),
          updatedAt: typeof item.updated_at === 'string' ? item.updated_at : new Date(item.updated_at).toISOString(),
          teamSize: item.team_size,
          teamFitScore: item.team_fit_score ?? 0,
          status: (item.status as any) || 'Draft',
          members: (item.members || []).map(m => ({
            id: String(m.id || m.employee_id || ''),
            name: m.name || 'Team Member',
            avatarUrl: m.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
            role: m.role || '',
            assignedRole: m.assigned_role || m.role || '',
            awisScore: m.awis_score ?? 0,
            wellbeingRisk: (m.wellbeing_risk as any) || 'Low',
            matchScore: m.match_score ?? 0,
          })),
          metrics: {
            skillCoverage: item.metrics?.skill_coverage ?? item.skill_coverage_percent ?? 0,
            workloadBalance: item.metrics?.workload_balance ?? 0,
            sustainability: item.metrics?.sustainability ?? item.sustainability_score ?? 0,
            availabilityCoverage: item.metrics?.availability_coverage ?? 0,
          },
          notes: item.notes || undefined,
        }));
        historyCache = mapped;
        persistHistory(historyCache);
        return mapped;
      }
    } catch (e) {
      if (!isMockFallbackAllowed()) {
        console.error('Backend formation history request failed in production mode:', e);
        throw e;
      }
      console.warn('Could not load team formation history from backend API:', e);
    }

    if (!isMockFallbackAllowed()) {
      return [];
    }
    return [...historyCache];
  },

  /**
   * Retrieve single formation record by ID
   */
  async getFormationById(id: string): Promise<FormationHistoryItem | undefined> {
    return historyCache.find(h => h.id === id || h.formationId === id);
  }
};
