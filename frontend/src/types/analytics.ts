export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsDateRange {
  preset: DateRangePreset;
  startDate?: string;
  endDate?: string;
  label: string;
}

export interface AnalyticsFilters {
  dateRange: AnalyticsDateRange;
  department: string; // 'All' or specific department
  projectId: string; // 'All' or specific project ID
  searchQuery?: string;
}

export interface KpiMetric {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  changePercent?: number;
  changeDirection?: 'up' | 'down' | 'neutral';
  changeLabel?: string;
  benchmark?: string;
  status?: 'positive' | 'warning' | 'neutral' | 'critical';
  description: string;
  trendData?: number[];
}

export interface AnalyticsKpiSummary {
  averageAwisScore: KpiMetric;
  workforceUtilization: KpiMetric;
  averageTeamFit: KpiMetric;
  workforceSustainability: KpiMetric;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  value: number;
  benchmark?: number;
  secondaryValue?: number;
}

export interface DistributionSlice {
  name: string;
  value: number;
  percentage: number;
  color: string;
  secondaryInfo?: string;
}

export interface SkillCoverageItem {
  skill: string;
  requiredCount: number;
  availableCount: number;
  coveragePercent: number;
  gapCount: number;
  status: 'Surplus' | 'Balanced' | 'Deficit';
}

export interface WorkloadTierSummary {
  tier: 'Underutilized' | 'Balanced' | 'High' | 'Overallocated';
  label: string;
  rangeLabel: string;
  employeeCount: number;
  percentage: number;
  color: string;
  description: string;
}

export interface ProjectAnalyticsItem {
  id: string;
  projectId: string;
  name: string;
  department: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: string;
  progress: number;
  risk: string;
  teamSize: number;
  teamFit: number;
  deadline: string;
  scheduleHealth: 'On Track' | 'At Risk' | 'Delayed';
  demoSuccessScore: number;
}

export interface EmployeeAnalyticsRow {
  id: string;
  employeeId: string;
  name: string;
  avatarUrl: string;
  department: string;
  role: string;
  experienceYears: number;
  performanceScore: number;
  availabilityScore: number;
  workloadScore: number;
  wellbeingRisk: 'Low' | 'Moderate' | 'High';
  awisFitScore: number;
  primarySkill: string;
  activeProjectsCount: number;
}

export interface TeamFormationAnalyticsRow {
  id: string;
  projectId: string;
  projectName: string;
  projectDepartment: string;
  teamSize: number;
  teamFitScore: number;
  skillCoveragePercent: number;
  workloadBalanceScore: number;
  sustainabilityScore: number;
  status: string;
  createdAt: string;
}

export interface DemoInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'achievement' | 'recommendation';
  title: string;
  observation: string;
  metricLabel: string;
  metricValue: string;
  targetModule: 'employees' | 'projects' | 'teams';
  actionLabel: string;
  actionUrl: string;
}

export interface WorkforceAnalyticsData {
  totalEmployees: number;
  avgPerformance: number;
  avgAvailability: number;
  avgWorkload: number;
  headcountByDepartment: DistributionSlice[];
  headcountByRole: DistributionSlice[];
  skillCoverage: SkillCoverageItem[];
  workloadTiers: WorkloadTierSummary[];
  wellbeingDistribution: DistributionSlice[];
  experienceDistribution: DistributionSlice[];
  tableRows: EmployeeAnalyticsRow[];
}

export interface ProjectAnalyticsData {
  totalProjects: number;
  activeProjectsCount: number;
  criticalProjectsCount: number;
  avgProgress: number;
  avgTeamFit: number;
  statusDistribution: DistributionSlice[];
  priorityDistribution: DistributionSlice[];
  riskDistribution: DistributionSlice[];
  scheduleHealthDistribution: DistributionSlice[];
  tableRows: ProjectAnalyticsItem[];
}

export interface TeamAnalyticsData {
  totalFormations: number;
  avgTeamFit: number;
  avgSkillCoverage: number;
  avgSustainability: number;
  fitDistribution: DistributionSlice[];
  teamSizeDistribution: DistributionSlice[];
  statusDistribution: DistributionSlice[];
  tableRows: TeamFormationAnalyticsRow[];
}

export interface SustainabilityAnalyticsData {
  sustainabilityIndex: number;
  overallocatedCount: number;
  overallocatedPercent: number;
  highBurnoutRiskCount: number;
  workloadVariance: number;
  workloadTiers: WorkloadTierSummary[];
  departmentBurnoutRisks: Array<{
    department: string;
    low: number;
    moderate: number;
    high: number;
    avgWorkload: number;
  }>;
  atRiskEmployees: EmployeeAnalyticsRow[];
}

export interface FullAnalyticsPayload {
  kpis: AnalyticsKpiSummary;
  awisTrend: TimeSeriesPoint[];
  projectPerformanceTrend: TimeSeriesPoint[];
  workforceDistribution: {
    byDepartment: DistributionSlice[];
    byRole: DistributionSlice[];
    byAvailability: DistributionSlice[];
    byWorkload: DistributionSlice[];
  };
  teamEffectiveness: Array<{
    projectName: string;
    teamFit: number;
    status: string;
    teamSize: number;
  }>;
  workloadCapacity: WorkloadTierSummary[];
  workforce: WorkforceAnalyticsData;
  projects: ProjectAnalyticsData;
  teams: TeamAnalyticsData;
  sustainability: SustainabilityAnalyticsData;
  insights: DemoInsight[];
}
