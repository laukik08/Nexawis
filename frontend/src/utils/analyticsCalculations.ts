import type { Employee } from '../data/mockEmployees';
import type { Project } from '../data/mockProjects';
import type { FormationHistoryItem } from '../types/teamFormation';
import type { 
  AnalyticsFilters, 
  AnalyticsKpiSummary, 
  DistributionSlice, 
  SkillCoverageItem, 
  WorkloadTierSummary,
  WorkforceAnalyticsData,
  ProjectAnalyticsData,
  ProjectAnalyticsItem,
  EmployeeAnalyticsRow,
  TeamAnalyticsData,
  TeamFormationAnalyticsRow,
  SustainabilityAnalyticsData,
  DemoInsight
} from '../types/analytics';
import { analyticsColorPalette } from '../data/mockAnalytics';

/**
 * Filter employee records based on active department & query
 */
export function filterEmployees(
  employees: Employee[],
  filters: AnalyticsFilters
): Employee[] {
  return employees.filter(emp => {
    const matchesDept = 
      filters.department === 'All' || 
      emp.department.toLowerCase() === filters.department.toLowerCase();
    
    const matchesSearch = !filters.searchQuery || 
      emp.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(filters.searchQuery.toLowerCase());

    return matchesDept && matchesSearch;
  });
}

/**
 * Filter project records based on active department, project ID, and query
 */
export function filterProjects(
  projects: Project[],
  filters: AnalyticsFilters
): Project[] {
  return projects.filter(proj => {
    const matchesDept = 
      filters.department === 'All' || 
      proj.department.toLowerCase() === filters.department.toLowerCase();

    const matchesProject = 
      filters.projectId === 'All' || 
      proj.id === filters.projectId ||
      proj.projectId === filters.projectId;

    const matchesSearch = !filters.searchQuery || 
      proj.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      proj.projectId.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      proj.department.toLowerCase().includes(filters.searchQuery.toLowerCase());

    return matchesDept && matchesProject && matchesSearch;
  });
}

/**
 * Filter team formations based on active department and project filters
 */
export function filterFormations(
  formations: FormationHistoryItem[],
  filters: AnalyticsFilters
): FormationHistoryItem[] {
  return formations.filter(form => {
    const matchesDept = 
      filters.department === 'All' || 
      form.projectDepartment.toLowerCase() === filters.department.toLowerCase();

    const matchesProject = 
      filters.projectId === 'All' || 
      form.projectId === filters.projectId;

    const matchesSearch = !filters.searchQuery ||
      form.projectName.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      form.id.toLowerCase().includes(filters.searchQuery.toLowerCase());

    return matchesDept && matchesProject && matchesSearch;
  });
}

/**
 * Compute the 4 Overview KPI Cards based on filtered data
 */
export function calculateKpiSummary(
  employees: Employee[],
  projects: Project[],
  formations: FormationHistoryItem[],
  filters: AnalyticsFilters
): AnalyticsKpiSummary {
  // 1. Average AWIS Score
  const avgAwis = employees.length > 0
    ? Math.round((employees.reduce((acc, e) => acc + (e.awisFitScore || 85), 0) / employees.length) * 10) / 10
    : 88.4;

  // 2. Workforce Utilization (% of capacity in use)
  const avgWorkload = employees.length > 0
    ? Math.round(employees.reduce((acc, e) => acc + (e.workloadScore || 70), 0) / employees.length)
    : 76;

  // 3. Average Team Fit Score
  const avgTeamFit = formations.length > 0
    ? Math.round((formations.reduce((acc, f) => acc + f.teamFitScore, 0) / formations.length) * 10) / 10
    : (projects.length > 0
      ? Math.round((projects.reduce((acc, p) => acc + (p.teamFit || 85), 0) / projects.length) * 10) / 10
      : 91.8);

  // 4. Workforce Sustainability Score (100 - high risk ratio & workload variance)
  const highRiskCount = employees.filter(e => e.wellbeingRisk === 'High').length;
  const sustainabilityIndex = Math.max(65, Math.min(99, Math.round(100 - (highRiskCount / (employees.length || 1) * 35))));

  // Variations based on date range for realistic demonstration
  const deltaMultiplier = filters.dateRange.preset === '7d' ? 0.4 : filters.dateRange.preset === '90d' ? 1.5 : 1.0;

  return {
    averageAwisScore: {
      id: 'kpi-awis',
      title: 'Average AWIS Score',
      value: avgAwis,
      unit: '/100',
      changePercent: +(3.2 * deltaMultiplier).toFixed(1),
      changeDirection: 'up',
      changeLabel: 'vs prior period',
      benchmark: 'Target: >85.0',
      status: avgAwis >= 85 ? 'positive' : 'warning',
      description: 'Composite workforce alignment index based on 9 AWIS intelligence dimensions.'
    },
    workforceUtilization: {
      id: 'kpi-utilization',
      title: 'Workforce Utilization',
      value: avgWorkload,
      unit: '%',
      changePercent: -(1.4 * deltaMultiplier).toFixed(1),
      changeDirection: 'down',
      changeLabel: 'burnout buffer healthy',
      benchmark: 'Optimal band: 70-80%',
      status: avgWorkload > 85 ? 'warning' : avgWorkload < 50 ? 'neutral' : 'positive',
      description: 'Percentage of active billable and delivery capacity currently allocated.'
    },
    averageTeamFit: {
      id: 'kpi-teamfit',
      title: 'Average Team Fit',
      value: avgTeamFit,
      unit: '%',
      changePercent: +(2.1 * deltaMultiplier).toFixed(1),
      changeDirection: 'up',
      changeLabel: 'synergy index',
      benchmark: 'Benchmark: >88%',
      status: avgTeamFit >= 88 ? 'positive' : 'neutral',
      description: 'Historical and active team formation synergy matching accuracy.'
    },
    workforceSustainability: {
      id: 'kpi-sustainability',
      title: 'Workforce Sustainability',
      value: sustainabilityIndex,
      unit: '/100',
      changePercent: +(1.8 * deltaMultiplier).toFixed(1),
      changeDirection: 'up',
      changeLabel: 'low burnout risk index',
      benchmark: 'Min Safety: >85',
      status: sustainabilityIndex >= 85 ? 'positive' : 'warning',
      description: 'Workforce longevity metric balancing workload distribution and recovery buffers.'
    }
  };
}

/**
 * Compute Workforce Analytics data
 */
export function calculateWorkforceAnalytics(
  employees: Employee[],
  projects: Project[]
): WorkforceAnalyticsData {
  const totalEmployees = employees.length;
  
  const avgPerformance = totalEmployees > 0
    ? Math.round(employees.reduce((acc, e) => acc + (e.performanceScore || 80), 0) / totalEmployees)
    : 85;

  const avgAvailability = totalEmployees > 0
    ? Math.round(employees.reduce((acc, e) => acc + (e.availabilityScore || 60), 0) / totalEmployees)
    : 64;

  const avgWorkload = totalEmployees > 0
    ? Math.round(employees.reduce((acc, e) => acc + (e.workloadScore || 70), 0) / totalEmployees)
    : 76;

  // Headcount by Department
  const deptCounts: Record<string, number> = {};
  employees.forEach(e => {
    deptCounts[e.department] = (deptCounts[e.department] || 0) + 1;
  });
  const headcountByDepartment: DistributionSlice[] = Object.entries(deptCounts).map(([name, value], i) => ({
    name,
    value,
    percentage: Math.round((value / totalEmployees) * 100),
    color: analyticsColorPalette[i % analyticsColorPalette.length]
  }));

  // Headcount by Role
  const roleCounts: Record<string, number> = {};
  employees.forEach(e => {
    roleCounts[e.role] = (roleCounts[e.role] || 0) + 1;
  });
  const headcountByRole: DistributionSlice[] = Object.entries(roleCounts).map(([name, value], i) => ({
    name,
    value,
    percentage: Math.round((value / totalEmployees) * 100),
    color: analyticsColorPalette[(i + 2) % analyticsColorPalette.length]
  }));

  // Skill Coverage & Gaps
  const skillDemanded: Record<string, number> = {};
  projects.forEach(p => {
    (p.requirements || []).forEach(r => {
      skillDemanded[r.skill] = (skillDemanded[r.skill] || 0) + 1;
    });
  });

  const skillSupplied: Record<string, number> = {};
  employees.forEach(e => {
    (e.skills || []).forEach(s => {
      if (s.proficiency >= 70) {
        skillSupplied[s.name] = (skillSupplied[s.name] || 0) + 1;
      }
    });
  });

  const allSkills = Array.from(new Set([...Object.keys(skillDemanded), ...Object.keys(skillSupplied)])).slice(0, 10);
  const skillCoverage: SkillCoverageItem[] = allSkills.map(skill => {
    const required = skillDemanded[skill] || 2;
    const available = skillSupplied[skill] || 1;
    const coveragePercent = Math.min(100, Math.round((available / required) * 100));
    const gap = Math.max(0, required - available);
    const status: 'Surplus' | 'Balanced' | 'Deficit' = 
      coveragePercent >= 120 ? 'Surplus' : coveragePercent >= 90 ? 'Balanced' : 'Deficit';

    return {
      skill,
      requiredCount: required,
      availableCount: available,
      coveragePercent,
      gapCount: gap,
      status
    };
  });

  // Workload Tiers
  const underutilized = employees.filter(e => e.workloadScore < 50).length;
  const balanced = employees.filter(e => e.workloadScore >= 50 && e.workloadScore <= 80).length;
  const highCapacity = employees.filter(e => e.workloadScore > 80 && e.workloadScore <= 90).length;
  const overallocated = employees.filter(e => e.workloadScore > 90).length;

  const workloadTiers: WorkloadTierSummary[] = [
    {
      tier: 'Underutilized',
      label: 'Underutilized Capacity',
      rangeLabel: '< 50% load',
      employeeCount: underutilized,
      percentage: totalEmployees > 0 ? Math.round((underutilized / totalEmployees) * 100) : 0,
      color: '#06b6d4',
      description: 'Available for immediate sprint allocation or skill cross-training.'
    },
    {
      tier: 'Balanced',
      label: 'Optimal Workload',
      rangeLabel: '50% - 80% load',
      employeeCount: balanced,
      percentage: totalEmployees > 0 ? Math.round((balanced / totalEmployees) * 100) : 0,
      color: '#16a34a',
      description: 'Sustainable velocity band with balanced focus and low fatigue.'
    },
    {
      tier: 'High',
      label: 'High Capacity',
      rangeLabel: '81% - 90% load',
      employeeCount: highCapacity,
      percentage: totalEmployees > 0 ? Math.round((highCapacity / totalEmployees) * 100) : 0,
      color: '#f59e0b',
      description: 'Approaching maximum load; monitor context-switching overhead.'
    },
    {
      tier: 'Overallocated',
      label: 'Overallocated / At Risk',
      rangeLabel: '> 90% load',
      employeeCount: overallocated,
      percentage: totalEmployees > 0 ? Math.round((overallocated / totalEmployees) * 100) : 0,
      color: '#ef4444',
      description: 'Exceeds sustainable threshold; high probability of delivery bottlenecks.'
    }
  ];

  // Wellbeing Risk
  const lowRisk = employees.filter(e => e.wellbeingRisk === 'Low').length;
  const modRisk = employees.filter(e => e.wellbeingRisk === 'Moderate').length;
  const highRisk = employees.filter(e => e.wellbeingRisk === 'High').length;

  const wellbeingDistribution: DistributionSlice[] = [
    { name: 'Low Risk', value: lowRisk, percentage: totalEmployees > 0 ? Math.round((lowRisk / totalEmployees) * 100) : 0, color: '#16a34a' },
    { name: 'Moderate Risk', value: modRisk, percentage: totalEmployees > 0 ? Math.round((modRisk / totalEmployees) * 100) : 0, color: '#f59e0b' },
    { name: 'High Risk', value: highRisk, percentage: totalEmployees > 0 ? Math.round((highRisk / totalEmployees) * 100) : 0, color: '#ef4444' }
  ];

  // Experience Distribution
  const junior = employees.filter(e => e.experienceYears <= 2).length;
  const mid = employees.filter(e => e.experienceYears > 2 && e.experienceYears <= 5).length;
  const senior = employees.filter(e => e.experienceYears > 5 && e.experienceYears <= 8).length;
  const lead = employees.filter(e => e.experienceYears > 8).length;

  const experienceDistribution: DistributionSlice[] = [
    { name: 'Junior (0-2y)', value: junior, percentage: totalEmployees > 0 ? Math.round((junior / totalEmployees) * 100) : 0, color: '#64748b' },
    { name: 'Mid-Level (3-5y)', value: mid, percentage: totalEmployees > 0 ? Math.round((mid / totalEmployees) * 100) : 0, color: '#0284c7' },
    { name: 'Senior (6-8y)', value: senior, percentage: totalEmployees > 0 ? Math.round((senior / totalEmployees) * 100) : 0, color: '#16a34a' },
    { name: 'Lead / Principal (8y+)', value: lead, percentage: totalEmployees > 0 ? Math.round((lead / totalEmployees) * 100) : 0, color: '#a855f7' }
  ];

  // Table Rows
  const tableRows: EmployeeAnalyticsRow[] = employees.map(emp => ({
    id: emp.id,
    employeeId: emp.employeeId,
    name: emp.name,
    avatarUrl: emp.avatarUrl,
    department: emp.department,
    role: emp.role,
    experienceYears: emp.experienceYears,
    performanceScore: emp.performanceScore,
    availabilityScore: emp.availabilityScore,
    workloadScore: emp.workloadScore,
    wellbeingRisk: emp.wellbeingRisk,
    awisFitScore: emp.awisFitScore,
    primarySkill: emp.skills.find(s => s.isPrimary)?.name || emp.skills[0]?.name || 'Engineering',
    activeProjectsCount: emp.currentProjects?.length || 0
  }));

  return {
    totalEmployees,
    avgPerformance,
    avgAvailability,
    avgWorkload,
    headcountByDepartment,
    headcountByRole,
    skillCoverage,
    workloadTiers,
    wellbeingDistribution,
    experienceDistribution,
    tableRows
  };
}

/**
 * Compute Project Analytics data
 */
export function calculateProjectAnalytics(projects: Project[]): ProjectAnalyticsData {
  const totalProjects = projects.length;
  const activeProjectsCount = projects.filter(p => p.status === 'Active' || p.status === 'On Track').length;
  const criticalProjectsCount = projects.filter(p => p.priority === 'Critical').length;
  
  const avgProgress = totalProjects > 0
    ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / totalProjects)
    : 0;

  const avgTeamFit = totalProjects > 0
    ? Math.round((projects.reduce((acc, p) => acc + (p.teamFit || 85), 0) / totalProjects) * 10) / 10
    : 86.4;

  // Status Distribution
  const statusCounts: Record<string, number> = {};
  projects.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });
  const statusDistribution: DistributionSlice[] = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
    percentage: Math.round((value / totalProjects) * 100),
    color: name === 'Active' || name === 'On Track' ? '#0284c7' : name === 'Completed' ? '#16a34a' : name === 'At Risk' ? '#ef4444' : '#64748b'
  }));

  // Priority Distribution
  const priorityCounts: Record<string, number> = {};
  projects.forEach(p => {
    priorityCounts[p.priority] = (priorityCounts[p.priority] || 0) + 1;
  });
  const priorityDistribution: DistributionSlice[] = Object.entries(priorityCounts).map(([name, value]) => ({
    name,
    value,
    percentage: Math.round((value / totalProjects) * 100),
    color: name === 'Critical' ? '#ef4444' : name === 'High' ? '#f59e0b' : name === 'Medium' ? '#0284c7' : '#64748b'
  }));

  // Risk Distribution
  const riskCounts: Record<string, number> = {};
  projects.forEach(p => {
    const r = p.overallRisk || 'Medium';
    riskCounts[r] = (riskCounts[r] || 0) + 1;
  });
  const riskDistribution: DistributionSlice[] = Object.entries(riskCounts).map(([name, value]) => ({
    name: `${name} Risk`,
    value,
    percentage: Math.round((value / totalProjects) * 100),
    color: name === 'High' ? '#ef4444' : name === 'Medium' ? '#f59e0b' : '#16a34a'
  }));

  // Schedule Health
  const onTrack = projects.filter(p => p.overallRisk === 'Low').length;
  const atRisk = projects.filter(p => p.overallRisk === 'Medium').length;
  const delayed = projects.filter(p => p.overallRisk === 'High').length;

  const scheduleHealthDistribution: DistributionSlice[] = [
    { name: 'On Track', value: onTrack, percentage: totalProjects > 0 ? Math.round((onTrack / totalProjects) * 100) : 0, color: '#16a34a' },
    { name: 'At Risk', value: atRisk, percentage: totalProjects > 0 ? Math.round((atRisk / totalProjects) * 100) : 0, color: '#f59e0b' },
    { name: 'Delayed', value: delayed, percentage: totalProjects > 0 ? Math.round((delayed / totalProjects) * 100) : 0, color: '#ef4444' }
  ];

  // Table rows
  const tableRows: ProjectAnalyticsItem[] = projects.map(proj => {
    const scheduleHealth: 'On Track' | 'At Risk' | 'Delayed' = 
      proj.overallRisk === 'High' ? 'Delayed' : proj.overallRisk === 'Medium' ? 'At Risk' : 'On Track';
    
    // Explicit demonstration score
    const demoSuccessScore = proj.intelligence?.successPrediction?.score || Math.min(99, Math.round((proj.teamFit * 0.5) + (proj.progress * 0.4) + 10));

    return {
      id: proj.id,
      projectId: proj.projectId,
      name: proj.name,
      department: proj.department,
      priority: proj.priority,
      status: proj.status,
      progress: proj.progress,
      risk: proj.overallRisk || 'Low',
      teamSize: proj.teamSize || 4,
      teamFit: proj.teamFit || 85,
      deadline: proj.deadline,
      scheduleHealth,
      demoSuccessScore
    };
  });

  return {
    totalProjects,
    activeProjectsCount,
    criticalProjectsCount,
    avgProgress,
    avgTeamFit,
    statusDistribution,
    priorityDistribution,
    riskDistribution,
    scheduleHealthDistribution,
    tableRows
  };
}

/**
 * Compute Team Formation Performance Analytics
 */
export function calculateTeamAnalytics(formations: FormationHistoryItem[]): TeamAnalyticsData {
  const totalFormations = formations.length;
  
  const avgTeamFit = totalFormations > 0
    ? Math.round((formations.reduce((acc, f) => acc + f.teamFitScore, 0) / totalFormations) * 10) / 10
    : 91.8;

  const avgSkillCoverage = totalFormations > 0
    ? Math.round(formations.reduce((acc, f) => acc + (f.metrics?.skillCoverage || 90), 0) / totalFormations)
    : 94;

  const avgSustainability = totalFormations > 0
    ? Math.round(formations.reduce((acc, f) => acc + (f.metrics?.sustainability || 92), 0) / totalFormations)
    : 93;

  // Fit Score Distribution
  const below80 = formations.filter(f => f.teamFitScore < 80).length;
  const b80to89 = formations.filter(f => f.teamFitScore >= 80 && f.teamFitScore < 90).length;
  const b90to95 = formations.filter(f => f.teamFitScore >= 90 && f.teamFitScore < 95).length;
  const above95 = formations.filter(f => f.teamFitScore >= 95).length;

  const fitDistribution: DistributionSlice[] = [
    { name: '< 80% Fit (Rebalance)', value: below80, percentage: totalFormations > 0 ? Math.round((below80 / totalFormations) * 100) : 0, color: '#ef4444' },
    { name: '80% - 89% Fit (Adequate)', value: b80to89, percentage: totalFormations > 0 ? Math.round((b80to89 / totalFormations) * 100) : 0, color: '#f59e0b' },
    { name: '90% - 94% Fit (Strong)', value: b90to95, percentage: totalFormations > 0 ? Math.round((b90to95 / totalFormations) * 100) : 0, color: '#0284c7' },
    { name: '95%+ Fit (Optimal)', value: above95, percentage: totalFormations > 0 ? Math.round((above95 / totalFormations) * 100) : 0, color: '#16a34a' }
  ];

  // Team Size Distribution
  const size2to4 = formations.filter(f => f.teamSize <= 4).length;
  const size5to6 = formations.filter(f => f.teamSize >= 5 && f.teamSize <= 6).length;
  const size7plus = formations.filter(f => f.teamSize >= 7).length;

  const teamSizeDistribution: DistributionSlice[] = [
    { name: 'Core Pod (2-4)', value: size2to4, percentage: totalFormations > 0 ? Math.round((size2to4 / totalFormations) * 100) : 0, color: '#0284c7' },
    { name: 'Squad (5-6)', value: size5to6, percentage: totalFormations > 0 ? Math.round((size5to6 / totalFormations) * 100) : 0, color: '#16a34a' },
    { name: 'Scale Unit (7+)', value: size7plus, percentage: totalFormations > 0 ? Math.round((size7plus / totalFormations) * 100) : 0, color: '#a855f7' }
  ];

  // Status Distribution
  const activeCount = formations.filter(f => f.status === 'Active').length;
  const finalizedCount = formations.filter(f => f.status === 'Finalized').length;
  const draftCount = formations.filter(f => f.status === 'Draft').length;

  const statusDistribution: DistributionSlice[] = [
    { name: 'Active Teams', value: activeCount, percentage: totalFormations > 0 ? Math.round((activeCount / totalFormations) * 100) : 0, color: '#0284c7' },
    { name: 'Finalized Formations', value: finalizedCount, percentage: totalFormations > 0 ? Math.round((finalizedCount / totalFormations) * 100) : 0, color: '#16a34a' },
    { name: 'Draft Proposals', value: draftCount, percentage: totalFormations > 0 ? Math.round((draftCount / totalFormations) * 100) : 0, color: '#f59e0b' }
  ];

  // Table rows
  const tableRows: TeamFormationAnalyticsRow[] = formations.map(f => ({
    id: f.id,
    projectId: f.projectId,
    projectName: f.projectName,
    projectDepartment: f.projectDepartment,
    teamSize: f.teamSize,
    teamFitScore: f.teamFitScore,
    skillCoveragePercent: f.metrics?.skillCoverage || 95,
    workloadBalanceScore: f.metrics?.workloadBalance || 90,
    sustainabilityScore: f.metrics?.sustainability || 92,
    status: f.status,
    createdAt: f.createdAt
  }));

  return {
    totalFormations,
    avgTeamFit,
    avgSkillCoverage,
    avgSustainability,
    fitDistribution,
    teamSizeDistribution,
    statusDistribution,
    tableRows
  };
}

/**
 * Compute Workforce Sustainability Analytics
 */
export function calculateSustainabilityAnalytics(
  employees: Employee[],
  _projects: Project[]
): SustainabilityAnalyticsData {
  const totalEmployees = employees.length;
  const overallocatedCount = employees.filter(e => e.workloadScore > 85).length;
  const overallocatedPercent = totalEmployees > 0 ? Math.round((overallocatedCount / totalEmployees) * 100) : 0;
  const highBurnoutRiskCount = employees.filter(e => e.wellbeingRisk === 'High').length;

  // Workload variance calculation (standard deviation proxy)
  const avgWorkload = totalEmployees > 0
    ? employees.reduce((acc, e) => acc + e.workloadScore, 0) / totalEmployees
    : 70;
  const variance = totalEmployees > 0
    ? Math.round(Math.sqrt(employees.reduce((acc, e) => acc + Math.pow(e.workloadScore - avgWorkload, 2), 0) / totalEmployees) * 10) / 10
    : 8.5;

  const sustainabilityIndex = Math.max(70, Math.min(99, Math.round(100 - (highBurnoutRiskCount / (totalEmployees || 1) * 30) - (variance * 0.5))));

  // Department Breakdown
  const deptMap: Record<string, { low: number; moderate: number; high: number; sumWorkload: number; count: number }> = {};
  employees.forEach(e => {
    if (!deptMap[e.department]) {
      deptMap[e.department] = { low: 0, moderate: 0, high: 0, sumWorkload: 0, count: 0 };
    }
    const bucket = deptMap[e.department];
    bucket.count++;
    bucket.sumWorkload += e.workloadScore;
    if (e.wellbeingRisk === 'Low') bucket.low++;
    else if (e.wellbeingRisk === 'Moderate') bucket.moderate++;
    else bucket.high++;
  });

  const departmentBurnoutRisks = Object.entries(deptMap).map(([department, data]) => ({
    department,
    low: data.low,
    moderate: data.moderate,
    high: data.high,
    avgWorkload: Math.round(data.sumWorkload / data.count)
  }));

  // Workload tiers
  const underutilized = employees.filter(e => e.workloadScore < 50).length;
  const balanced = employees.filter(e => e.workloadScore >= 50 && e.workloadScore <= 80).length;
  const high = employees.filter(e => e.workloadScore > 80 && e.workloadScore <= 90).length;
  const extreme = employees.filter(e => e.workloadScore > 90).length;

  const workloadTiers: WorkloadTierSummary[] = [
    {
      tier: 'Underutilized',
      label: 'Buffer Capacity',
      rangeLabel: '< 50%',
      employeeCount: underutilized,
      percentage: totalEmployees > 0 ? Math.round((underutilized / totalEmployees) * 100) : 0,
      color: '#06b6d4',
      description: 'Healthy surge buffer available without risk.'
    },
    {
      tier: 'Balanced',
      label: 'Sustainable Range',
      rangeLabel: '50% - 80%',
      employeeCount: balanced,
      percentage: totalEmployees > 0 ? Math.round((balanced / totalEmployees) * 100) : 0,
      color: '#16a34a',
      description: 'Ideal operational balance between throughput and rest.'
    },
    {
      tier: 'High',
      label: 'Elevated Strain',
      rangeLabel: '81% - 90%',
      employeeCount: high,
      percentage: totalEmployees > 0 ? Math.round((high / totalEmployees) * 100) : 0,
      color: '#f59e0b',
      description: 'Capacity warning band; recommend limiting overtime.'
    },
    {
      tier: 'Overallocated',
      label: 'Burnout Threshold',
      rangeLabel: '> 90%',
      employeeCount: extreme,
      percentage: totalEmployees > 0 ? Math.round((extreme / totalEmployees) * 100) : 0,
      color: '#ef4444',
      description: 'Exceeds sustainable threshold; high risk of attrition and defects.'
    }
  ];

  // At-risk employees
  const atRiskEmployees: EmployeeAnalyticsRow[] = employees
    .filter(e => e.wellbeingRisk === 'High' || e.workloadScore > 85)
    .map(emp => ({
      id: emp.id,
      employeeId: emp.employeeId,
      name: emp.name,
      avatarUrl: emp.avatarUrl,
      department: emp.department,
      role: emp.role,
      experienceYears: emp.experienceYears,
      performanceScore: emp.performanceScore,
      availabilityScore: emp.availabilityScore,
      workloadScore: emp.workloadScore,
      wellbeingRisk: emp.wellbeingRisk,
      awisFitScore: emp.awisFitScore,
      primarySkill: emp.skills.find(s => s.isPrimary)?.name || emp.skills[0]?.name || 'Core',
      activeProjectsCount: emp.currentProjects?.length || 0
    }));

  return {
    sustainabilityIndex,
    overallocatedCount,
    overallocatedPercent,
    highBurnoutRiskCount,
    workloadVariance: variance,
    workloadTiers,
    departmentBurnoutRisks,
    atRiskEmployees
  };
}

/**
 * Generate transparent, rule-based demonstration insights reflecting the active filter state
 */
export function generateDemoInsights(
  employees: Employee[],
  projects: Project[],
  formations: FormationHistoryItem[],
  _filters: AnalyticsFilters
): DemoInsight[] {
  const insights: DemoInsight[] = [];

  // Insight 1: Department Workload Strain
  const deptMap: Record<string, { sum: number; count: number; highRisk: number }> = {};
  employees.forEach(e => {
    if (!deptMap[e.department]) deptMap[e.department] = { sum: 0, count: 0, highRisk: 0 };
    deptMap[e.department].sum += e.workloadScore;
    deptMap[e.department].count++;
    if (e.wellbeingRisk === 'High') deptMap[e.department].highRisk++;
  });

  const strainedDepts = Object.entries(deptMap)
    .map(([dept, data]) => ({ dept, avg: Math.round(data.sum / data.count), highRisk: data.highRisk }))
    .sort((a, b) => b.avg - a.avg);

  if (strainedDepts.length > 0 && strainedDepts[0].avg >= 78) {
    insights.push({
      id: 'insight-workload',
      type: 'warning',
      title: `${strainedDepts[0].dept} Department Operates Near Peak Capacity`,
      observation: `${strainedDepts[0].dept} averages ${strainedDepts[0].avg}% workload utilization with ${strainedDepts[0].highRisk} contributor(s) flagged with elevated fatigue indicators.`,
      metricLabel: 'Dept Avg Workload',
      metricValue: `${strainedDepts[0].avg}%`,
      targetModule: 'employees',
      actionLabel: 'Inspect Employees',
      actionUrl: '/app/employees'
    });
  }

  // Insight 2: Critical Projects Health
  const criticalProjects = projects.filter(p => p.priority === 'Critical');
  const atRiskCritical = criticalProjects.filter(p => p.overallRisk === 'High');

  if (atRiskCritical.length > 0) {
    insights.push({
      id: 'insight-critical-proj',
      type: 'opportunity',
      title: `${atRiskCritical.length} Mission-Critical Project(s) Require Rebalancing`,
      observation: `Critical initiatives like "${atRiskCritical[0].name}" are facing schedule pressure. Reallocating available talent can raise team fit from ${atRiskCritical[0].teamFit}%.`,
      metricLabel: 'At-Risk Projects',
      metricValue: `${atRiskCritical.length} Project(s)`,
      targetModule: 'projects',
      actionLabel: 'Review Projects',
      actionUrl: `/app/projects/${atRiskCritical[0].id}`
    });
  } else {
    insights.push({
      id: 'insight-proj-healthy',
      type: 'achievement',
      title: 'Healthy Project Schedule Delivery Across Active Portfolio',
      observation: `${projects.length} active initiatives maintain sustainable velocity with an average team-fit score of ${projects[0]?.teamFit || 92}%.`,
      metricLabel: 'Avg Team Fit',
      metricValue: `${projects[0]?.teamFit || 92}%`,
      targetModule: 'projects',
      actionLabel: 'View Portfolio',
      actionUrl: '/app/projects'
    });
  }

  // Insight 3: Team Formation Synergy
  const highFitFormations = formations.filter(f => f.teamFitScore >= 92);
  if (highFitFormations.length > 0) {
    insights.push({
      id: 'insight-team-synergy',
      type: 'achievement',
      title: 'High Team Synergy Maintained in Recent Formations',
      observation: `${highFitFormations.length} team formations achieved ≥92% composite fit, maintaining optimal skill coverage while protecting employee wellbeing.`,
      metricLabel: 'Top Formations',
      metricValue: `${Math.round((highFitFormations.length / (formations.length || 1)) * 100)}% Conversion`,
      targetModule: 'teams',
      actionLabel: 'Explore Formations',
      actionUrl: '/app/teams'
    });
  }

  // Insight 4: Skill Gaps
  const availableRustOrDistributed = employees.filter(e => 
    e.skills.some(s => s.name.toLowerCase().includes('distributed') || s.name.toLowerCase().includes('rust'))
  );
  if (availableRustOrDistributed.length < 3) {
    insights.push({
      id: 'insight-skills-gap',
      type: 'recommendation',
      title: 'Distributed Systems & Architecture Skill Bottleneck',
      observation: `Only ${availableRustOrDistributed.length} senior architects hold high proficiency in Distributed Systems, creating a single-point dependency for concurrent backend sprints.`,
      metricLabel: 'Skill Supply',
      metricValue: `${availableRustOrDistributed.length} Qualified`,
      targetModule: 'teams',
      actionLabel: 'Assemble Mentorship Pod',
      actionUrl: '/app/teams'
    });
  }

  return insights;
}

/**
 * Client-Side CSV Export Utility
 * Generates and triggers download of real formatted CSV files
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | undefined | null>>
) {
  const sanitize = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(sanitize).join(','),
    ...rows.map(row => row.map(sanitize).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
