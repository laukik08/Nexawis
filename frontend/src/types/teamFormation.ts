import type { Skill } from '../data/mockEmployees';

export type FormationOptionId = 
  | 'autonomous_ai'
  | 'fatigue_safe'
  | 'high_velocity'
  | 'growth_mentorship'
  | 'rebalance_existing'
  | 'custom_constraints';

export interface FormationOptionDef {
  id: FormationOptionId;
  title: string;
  badge: string;
  description: string;
  highlight: string;
  iconName: 'sparkles' | 'shield' | 'zap' | 'users' | 'rotate' | 'sliders';
  accentColor: string;
  configPreset: Partial<TeamFormationConfig>;
}

export interface RequiredSkillConfig {
  skill: string;
  minProficiency: number; // 0-100
  priority: 'High' | 'Medium' | 'Low';
}

export interface TeamFormationConfig {
  projectId: string;
  teamSize: number;
  formationOption: FormationOptionId;
  requiredSkills: RequiredSkillConfig[];
  preferredRoles: string[];
  skillCoverageMode: 'Essential' | 'Balanced' | 'Comprehensive';
  minAvailability: number; // 0-100 (e.g. 50%)
  workloadTolerance: 'Strict' | 'Balanced' | 'HighVelocity';
  wellbeingRiskTolerance: 'LowOnly' | 'ModerateAllowed' | 'Flexible';
  performancePreference: 'HighPerformer' | 'Balanced' | 'GrowthFocused';
  includeGrowthOpportunities: boolean;
}

export interface CandidateWhySelected {
  summary: string;
  strengths: string[];
  considerations: string[];
}

export interface TeamCandidate {
  id: string; // employee id
  employeeId: string;
  name: string;
  avatarUrl: string;
  role: string;
  department: string;
  assignedRole: string;
  matchScore: number; // 0-100
  skillMatchPercent: number; // 0-100
  performanceScore: number;
  availabilityPercent: number; // 0-100
  currentWorkloadPercent: number; // 0-100
  wellbeingRisk: 'Low' | 'Moderate' | 'High';
  awisScore: number;
  isOverride: boolean; // true if added/replaced manually by user
  primarySkills: string[];
  allSkills: Skill[];
  whySelected: CandidateWhySelected;
}

export interface MetricWarning {
  id: string;
  type: 'warning' | 'alert' | 'info';
  title: string;
  message: string;
}

export interface TeamSummaryMetrics {
  overallTeamFit: number; // 0-100
  selectedCount: number;
  targetCount: number;
  skillCoveragePercent: number; // 0-100
  coveredSkillsCount: number;
  totalSkillsRequired: number;
  workloadBalanceScore: number; // 0-100
  sustainabilityScore: number; // 0-100
  availabilityCoverageScore: number; // 0-100
  warnings: MetricWarning[];
}

export interface HistoryTeamMember {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
  assignedRole: string;
  awisScore: number;
  wellbeingRisk: 'Low' | 'Moderate' | 'High';
  matchScore: number;
}

export interface FormationHistoryItem {
  id: string; // e.g. 'FRM-2026-001'
  formationId?: string; // Backend UUID
  projectId: string;
  projectName: string;
  projectDepartment: string;
  createdAt: string;
  updatedAt: string;
  teamSize: number;
  teamFitScore: number;
  status: 'Finalized' | 'Draft' | 'Active';
  members: HistoryTeamMember[];
  metrics: {
    skillCoverage: number;
    workloadBalance: number;
    sustainability: number;
    availabilityCoverage: number;
  };
  notes?: string;
}

export interface TeamAlternativeItem {
  alternativeId: string;
  strategyLabel: string;
  description: string;
  members: TeamCandidate[];
  metrics: TeamSummaryMetrics;
  tradeOffs: string[];
}

export interface TeamRecommendationResult {
  candidates: TeamCandidate[];
  metrics: TeamSummaryMetrics;
  formationId?: string;
  formationCode?: string;
  isFeasible?: boolean;
  feasibilityExplanation?: string;
  unmetRequirements?: string[];
  alternatives?: TeamAlternativeItem[];
}

export interface FormationKpiData {
  totalFormations: number;
  totalFormationsTrend: string;
  teamsCreated: number;
  teamsCreatedTrend: string;
  averageTeamFit: number;
  averageTeamFitTrend: string;
  workforceSustainability: number;
  workforceSustainabilityTrend: string;
}
