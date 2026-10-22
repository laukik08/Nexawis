/**
 * NEXAWIS Frontend - Analytics and Business Intelligence Service.
 * Connects the Analytics dashboard directly to workspace-scoped FastAPI endpoints,
 * removing reliance on hardcoded mock data in production while preserving opt-in demo mode.
 */

import { authenticatedFetch } from './apiClient';
import type { 
  AnalyticsFilters, 
  FullAnalyticsPayload,
  DistributionSlice
} from '../types/analytics';
import { 
  filterEmployees, 
  filterProjects, 
  filterFormations,
  calculateKpiSummary,
  calculateWorkforceAnalytics,
  calculateProjectAnalytics,
  calculateTeamAnalytics,
  calculateSustainabilityAnalytics,
  generateDemoInsights,
  exportToCsv
} from '../utils/analyticsCalculations';
import { mockEmployees } from '../data/mockEmployees';
import { mockProjects } from '../data/mockProjects';
import { initialFormationHistory } from '../data/mockTeamFormations';
import { mockAwisTrends, mockProjectPerformanceTrends } from '../data/mockAnalytics';

let demoModeOverride: boolean | null = null;

export function setDemoModeOverride(enabled: boolean | null): void {
  demoModeOverride = enabled;
}

export function isDemoModeActive(): boolean {
  if (demoModeOverride !== null) {
    return demoModeOverride;
  }
  const isEnvDemo = typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_DEMO_MODE === 'true';
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    if (localStorage.getItem('nexawis_demo_mode') === 'true') {
      return true;
    }
  }
  return isEnvDemo;
}

export const analyticsService = {
  /**
   * Retrieve unique departments and projects for filter dropdowns from the backend API.
   */
  async getFilterOptions(): Promise<{
    departments: string[];
    projects: Array<{ id: string; name: string }>;
  }> {
    try {
      const res = await authenticatedFetch<{
        departments: string[];
        projects: Array<{ id: string; name: string }>;
      }>('/analytics/filter-options');
      return res;
    } catch (err) {
      if (isDemoModeActive()) {
        console.warn('Backend filter options failed; using demo options because demo mode is active:', err);
        const depts = new Set<string>();
        mockEmployees.forEach(e => depts.add(e.department));
        mockProjects.forEach(p => depts.add(p.department));
        const projectsList = mockProjects.map(p => ({ id: p.id, name: p.name }));
        return {
          departments: ['All', ...Array.from(depts)],
          projects: [{ id: 'All', name: 'All Projects' }, ...projectsList],
        };
      }
      throw err;
    }
  },

  /**
   * Retrieve full analytics data package for given filters from real backend endpoints.
   */
  async getAnalyticsData(filters: AnalyticsFilters): Promise<FullAnalyticsPayload> {
    const params = new URLSearchParams();
    params.set('preset', filters.dateRange.preset);

    if (filters.department && filters.department !== 'All') {
      params.set('department', filters.department);
    }
    if (filters.projectId && filters.projectId !== 'All') {
      params.set('project_id', filters.projectId);
    }
    if (filters.searchQuery) {
      params.set('search_query', filters.searchQuery);
    }
    if (filters.dateRange.startDate) {
      params.set('start_date', filters.dateRange.startDate);
    }
    if (filters.dateRange.endDate) {
      params.set('end_date', filters.dateRange.endDate);
    }

    try {
      const payload = await authenticatedFetch<FullAnalyticsPayload>(
        `/analytics/dashboard?${params.toString()}`
      );
      return payload;
    } catch (err) {
      if (isDemoModeActive()) {
        console.warn('Backend analytics dashboard call failed; falling back to demo calculation because demo mode is active:', err);
        // Client-side demo fallback only when demo mode is explicitly enabled
        const employees = filterEmployees(mockEmployees, filters);
        const projects = filterProjects(mockProjects, filters);
        const formations = filterFormations(initialFormationHistory, filters);

        const kpis = calculateKpiSummary(employees, projects, formations, filters);
        const preset = filters.dateRange.preset;
        const awisTrend = mockAwisTrends[preset] || mockAwisTrends['30d'];
        const projectPerformanceTrend = mockProjectPerformanceTrends[preset] || mockProjectPerformanceTrends['30d'];

        const workforce = calculateWorkforceAnalytics(employees, projects);
        const projectsData = calculateProjectAnalytics(projects);
        const teams = calculateTeamAnalytics(formations);
        const sustainability = calculateSustainabilityAnalytics(employees, projects);
        const insights = generateDemoInsights(employees, projects, formations, filters);

        const byAvailability: DistributionSlice[] = [
          { name: 'Available (≥70%)', value: employees.filter(e => e.availabilityScore >= 70).length, percentage: 0, color: '#16a34a' },
          { name: 'Partially Allocated (40-69%)', value: employees.filter(e => e.availabilityScore >= 40 && e.availabilityScore < 70).length, percentage: 0, color: '#0284c7' },
          { name: 'Fully Allocated (<40%)', value: employees.filter(e => e.availabilityScore < 40).length, percentage: 0, color: '#f59e0b' },
        ].map(slice => ({
          ...slice,
          percentage: employees.length > 0 ? Math.round((slice.value / employees.length) * 100) : 0,
        }));

        const byWorkload: DistributionSlice[] = workforce.workloadTiers.map(t => ({
          name: t.label,
          value: t.employeeCount,
          percentage: t.percentage,
          color: t.color,
        }));

        const workforceDistribution = {
          byDepartment: workforce.headcountByDepartment,
          byRole: workforce.headcountByRole,
          byAvailability,
          byWorkload,
        };

        const teamEffectiveness = formations.slice(0, 8).map(f => ({
          projectName: f.projectName,
          teamFit: f.teamFitScore,
          status: f.status,
          teamSize: f.teamSize,
        }));

        return {
          kpis,
          awisTrend,
          projectPerformanceTrend,
          workforceDistribution,
          teamEffectiveness,
          workloadCapacity: workforce.workloadTiers,
          workforce,
          projects: projectsData,
          teams,
          sustainability,
          insights,
        };
      }
      throw err;
    }
  },

  /**
   * Client-side CSV exporter corresponding to the active view
   */
  async exportCurrentView(
    activeTab: 'overview' | 'workforce' | 'projects' | 'teams' | 'sustainability',
    data: FullAnalyticsPayload,
    filters: AnalyticsFilters
  ): Promise<void> {
    const timestamp = new Date().toISOString().slice(0, 10);
    const deptTag = filters.department === 'All' ? 'all-depts' : filters.department.toLowerCase().replace(/\s+/g, '-');

    if (activeTab === 'workforce') {
      const headers = [
        'Employee ID', 'Name', 'Department', 'Role', 'Experience (Years)',
        'Performance Score', 'Availability %', 'Workload %', 'Wellbeing Risk', 'AWIS Fit Score', 'Primary Skill'
      ];
      const rows = data.workforce.tableRows.map(e => [
        e.employeeId, e.name, e.department, e.role, e.experienceYears,
        e.performanceScore, `${e.availabilityScore}%`, `${e.workloadScore}%`, e.wellbeingRisk, e.awisFitScore, e.primarySkill
      ]);
      exportToCsv(`nexawis_workforce_analytics_${deptTag}_${timestamp}`, headers, rows);
    } else if (activeTab === 'projects') {
      const headers = [
        'Project ID', 'Project Name', 'Department', 'Priority', 'Status',
        'Progress %', 'Risk Level', 'Team Size', 'Team Fit %', 'Schedule Health', 'Deadline'
      ];
      const rows = data.projects.tableRows.map(p => [
        p.projectId, p.name, p.department, p.priority, p.status,
        `${p.progress}%`, p.risk, p.teamSize, p.teamFit, p.scheduleHealth, p.deadline
      ]);
      exportToCsv(`nexawis_project_analytics_${deptTag}_${timestamp}`, headers, rows);
    } else if (activeTab === 'teams') {
      const headers = [
        'Formation ID', 'Target Project', 'Department', 'Team Size', 'Team Fit %',
        'Skill Coverage %', 'Workload Balance %', 'Sustainability %', 'Status', 'Date Created'
      ];
      const rows = data.teams.tableRows.map(t => [
        t.id, t.projectName, t.projectDepartment, t.teamSize, `${t.teamFitScore}%`,
        `${t.skillCoveragePercent}%`, `${t.workloadBalanceScore}%`, `${t.sustainabilityScore}%`, t.status, t.createdAt
      ]);
      exportToCsv(`nexawis_team_performance_analytics_${deptTag}_${timestamp}`, headers, rows);
    } else if (activeTab === 'sustainability') {
      const headers = [
        'Employee ID', 'Name', 'Department', 'Role', 'Workload %', 'Wellbeing Risk', 'Availability %', 'Active Projects'
      ];
      const rows = data.sustainability.atRiskEmployees.map(e => [
        e.employeeId, e.name, e.department, e.role, `${e.workloadScore}%`, e.wellbeingRisk, `${e.availabilityScore}%`, e.activeProjectsCount
      ]);
      exportToCsv(`nexawis_sustainability_workforce_${deptTag}_${timestamp}`, headers, rows);
    } else {
      // Overview export: KPIs and summary
      const headers = ['Metric', 'Value', 'Unit', 'Trend', 'Benchmark', 'Description'];
      const rows = [
        [data.kpis.averageAwisScore.title, data.kpis.averageAwisScore.value, data.kpis.averageAwisScore.unit, `${data.kpis.averageAwisScore.changePercent}% ${data.kpis.averageAwisScore.changeLabel}`, data.kpis.averageAwisScore.benchmark, data.kpis.averageAwisScore.description],
        [data.kpis.workforceUtilization.title, data.kpis.workforceUtilization.value, data.kpis.workforceUtilization.unit, `${data.kpis.workforceUtilization.changePercent}% ${data.kpis.workforceUtilization.changeLabel}`, data.kpis.workforceUtilization.benchmark, data.kpis.workforceUtilization.description],
        [data.kpis.averageTeamFit.title, data.kpis.averageTeamFit.value, data.kpis.averageTeamFit.unit, `${data.kpis.averageTeamFit.changePercent}% ${data.kpis.averageTeamFit.changeLabel}`, data.kpis.averageTeamFit.benchmark, data.kpis.averageTeamFit.description],
        [data.kpis.workforceSustainability.title, data.kpis.workforceSustainability.value, data.kpis.workforceSustainability.unit, `${data.kpis.workforceSustainability.changePercent}% ${data.kpis.workforceSustainability.changeLabel}`, data.kpis.workforceSustainability.benchmark, data.kpis.workforceSustainability.description]
      ];
      exportToCsv(`nexawis_analytics_overview_${deptTag}_${timestamp}`, headers, rows);
    }
  }
};
