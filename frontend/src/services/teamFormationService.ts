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
  MetricWarning
} from '../types/teamFormation';

const STORAGE_HISTORY_KEY = 'nexawis_formation_history_v1';

// In-memory or localStorage cache for formation history
function loadHistory(): FormationHistoryItem[] {
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
 * Decouples mock data from UI so endpoints can be wired up in the future seamlessly.
 */
export const teamFormationService = {
  /**
   * Retrieve list of projects available for team formation
   */
  async getAvailableProjects(): Promise<Project[]> {
    // Simulated network delay (80ms)
    await new Promise(r => setTimeout(r, 80));
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
   * Retrieve full employee pool
   */
  async getEmployees(): Promise<Employee[]> {
    await new Promise(r => setTimeout(r, 50));
    return mockEmployees;
  },

  /**
   * Retrieve single employee by ID
   */
  async getEmployeeById(id: string): Promise<Employee | undefined> {
    return mockEmployees.find(e => e.id === id || e.employeeId === id);
  },

  /**
   * Get formation overview KPI statistics
   */
  async getFormationKpis(): Promise<FormationKpiData> {
    const history = historyCache;
    const total = history.length + 23; // base mock offset
    const activeOrFinal = history.filter(h => h.status !== 'Draft').length + 20;
    const avgFit = Math.round(
      history.reduce((acc, h) => acc + h.teamFitScore, 0) / (history.length || 1) * 10
    ) / 10;

    return {
      ...mockFormationKpiData,
      totalFormations: total,
      teamsCreated: activeOrFinal,
      averageTeamFit: avgFit || mockFormationKpiData.averageTeamFit
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
   * Generate rule-based demonstration recommendations
   */
  async generateTeamRecommendations(
    project: Project,
    config: TeamFormationConfig
  ): Promise<{ candidates: TeamCandidate[]; metrics: TeamSummaryMetrics }> {
    // Simulate algorithmic computation latency (850ms)
    await new Promise(r => setTimeout(r, 850));

    const formationOption = config.formationOption || 'autonomous_ai';

    // Dynamic weighting based on selected formation option
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

    // Score all available employees against configuration
    const scoredCandidates: Array<{ candidate: TeamCandidate; rawScore: number }> = mockEmployees.map(emp => {
      // 1. Skill Match Score (0 - 100)
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

      // 2. Availability Score (0 - 100)
      const availabilityScore = emp.availabilityScore;

      // 3. Workload Balance Score (inverted workload, higher is better)
      const workloadScore = Math.max(0, 100 - emp.workloadScore);

      // 4. Wellbeing Factor
      let wellbeingMultiplier = emp.wellbeingRisk === 'Low' ? 1.0 : emp.wellbeingRisk === 'Moderate' ? 0.82 : 0.55;
      if (formationOption === 'fatigue_safe' && emp.wellbeingRisk === 'High') {
        wellbeingMultiplier = 0.2; // severely penalize high risk in fatigue safe mode
      }

      // 5. Growth Opportunity
      let growthBonus = 0;
      if (config.includeGrowthOpportunities && emp.growthPotential > 75) {
        growthBonus = formationOption === 'growth_mentorship' ? 12 : 6;
      }

      // Composite Match Score
      const rawScore = (
        skillMatchPercent * skillWeight +
        availabilityScore * availWeight +
        emp.performanceScore * perfWeight +
        workloadScore * workloadWeight
      ) * wellbeingMultiplier + growthBonus;

      const finalMatchScore = Math.min(Math.max(Math.round(rawScore), 50), 99);

      // Determine Assigned Role based on skills & preferences
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

      // Generate demonstration explanation rationale
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

    // Filter by wellbeing risk tolerance if strict
    let filtered = scoredCandidates;
    if (config.wellbeingRiskTolerance === 'LowOnly') {
      const lowOnly = scoredCandidates.filter(c => c.candidate.wellbeingRisk === 'Low');
      if (lowOnly.length >= config.teamSize) {
        filtered = lowOnly;
      }
    }

    // Sort descending by match score
    filtered.sort((a, b) => b.rawScore - a.rawScore);

    // Pick top candidates up to target team size
    const selectedCandidates = filtered.slice(0, config.teamSize).map(item => item.candidate);

    // Compute team metrics
    const metrics = teamFormationService.calculateTeamMetrics(selectedCandidates, config);

    return {
      candidates: selectedCandidates,
      metrics
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

    // 1. Overall Team Fit (average match score + synergy bonus)
    const avgMatch = candidates.reduce((acc, c) => acc + c.matchScore, 0) / selectedCount;
    // Synergy bonus if team size matches target and multi-department diversity exists
    const depts = new Set(candidates.map(c => c.department)).size;
    const diversityBonus = depts > 1 ? 2.5 : 0;
    const overallTeamFit = Math.min(Math.round(avgMatch + diversityBonus), 99);

    // 2. Skill Coverage
    const allAssignedSkillNames = new Set(
      candidates.flatMap(c => c.allSkills.map(s => s.name.toLowerCase()))
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

    // 3. Workload Balance
    const avgWorkload = candidates.reduce((acc, c) => acc + c.currentWorkloadPercent, 0) / selectedCount;
    const workloadBalanceScore = Math.max(Math.round(100 - avgWorkload * 0.65), 50);

    // 4. Sustainability Score
    let sustainabilityDeduction = 0;
    candidates.forEach(c => {
      if (c.wellbeingRisk === 'High') sustainabilityDeduction += 20;
      else if (c.wellbeingRisk === 'Moderate') sustainabilityDeduction += 7;
    });
    const sustainabilityScore = Math.max(100 - sustainabilityDeduction, 45);

    // 5. Availability Coverage
    const avgAvailability = candidates.reduce((acc, c) => acc + c.availabilityPercent, 0) / selectedCount;
    const availabilityCoverageScore = Math.round(avgAvailability);

    // 6. Real-time warnings & advice
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
    await new Promise(r => setTimeout(r, 60));
    return mockEmployees.filter(emp => {
      if (currentTeamIds.includes(emp.id)) return false;
      if (filterSkill) {
        return emp.skills.some(s => s.name.toLowerCase().includes(filterSkill.toLowerCase()));
      }
      return true;
    });
  },

  /**
   * Save a formation as a draft
   */
  async saveFormationDraft(
    data: Omit<FormationHistoryItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<FormationHistoryItem> {
    await new Promise(r => setTimeout(r, 200));
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
   * Finalize a team formation (adds to history with 'Finalized' status)
   */
  async finalizeFormation(
    data: Omit<FormationHistoryItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<FormationHistoryItem> {
    await new Promise(r => setTimeout(r, 350));
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
   * Retrieve all formation history records
   */
  async getFormationHistory(): Promise<FormationHistoryItem[]> {
    await new Promise(r => setTimeout(r, 50));
    return [...historyCache];
  },

  /**
   * Retrieve single formation record by ID
   */
  async getFormationById(id: string): Promise<FormationHistoryItem | undefined> {
    return historyCache.find(h => h.id === id);
  }
};
