import { mockEmployees } from '../data/mockEmployees';
import { mockProjects } from '../data/mockProjects';
import { initialFormationHistory } from '../data/mockTeamFormations';
import type { 
  ReportConfig, 
  ReportRecord, 
  ReportMetricItem, 
  ReportInsightItem, 
  ReportTableData,
  ReportChartDataPoint
} from '../types/reports';

/**
 * Build a structured, realistic demonstration report from configuration parameters
 */
export function buildReportFromConfig(config: ReportConfig): ReportRecord {
  const timestamp = new Date().toISOString();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const reportId = `RPT-2026-${randomSuffix}`;

  // Filter raw records based on configuration
  const filteredEmployees = mockEmployees.filter(e => 
    config.department === 'All' || e.department.toLowerCase() === config.department.toLowerCase()
  );

  const filteredProjects = mockProjects.filter(p => {
    const matchesDept = config.department === 'All' || p.department.toLowerCase() === config.department.toLowerCase();
    const matchesProject = config.projectId === 'All' || p.id === config.projectId || p.projectId === config.projectId;
    return matchesDept && matchesProject;
  });

  const filteredFormations = initialFormationHistory.filter(f => 
    config.department === 'All' || f.projectDepartment.toLowerCase() === config.department.toLowerCase()
  );

  let summaryMetrics: ReportMetricItem[] = [];
  let findings: string[] = [];
  let warnings: string[] = [];
  let insights: ReportInsightItem[] = [];
  let tableData: ReportTableData | undefined;
  let primaryChartTitle = '';
  let primaryChartType: 'bar' | 'area' | 'donut' = 'bar';
  let primaryChartData: ReportChartDataPoint[] = [];

  // Generate category-specific report contents
  switch (config.category) {
    case 'workforce': {
      const avgPerformance = Math.round(filteredEmployees.reduce((acc, e) => acc + e.performanceScore, 0) / (filteredEmployees.length || 1));
      const avgAvailability = Math.round(filteredEmployees.reduce((acc, e) => acc + e.availabilityScore, 0) / (filteredEmployees.length || 1));
      const avgWorkload = Math.round(filteredEmployees.reduce((acc, e) => acc + e.workloadScore, 0) / (filteredEmployees.length || 1));

      summaryMetrics = [
        { label: 'Workforce Sample', value: filteredEmployees.length, unit: 'Employees', change: '+2', trend: 'up', status: 'positive' },
        { label: 'Avg Performance', value: avgPerformance, unit: '/100', change: '+1.5%', trend: 'up', status: 'positive' },
        { label: 'Avg Availability', value: `${avgAvailability}%`, change: '-1.0%', trend: 'down', status: 'neutral' },
        { label: 'Workload Utilization', value: `${avgWorkload}%`, change: 'Optimal Band', trend: 'neutral', status: 'positive' }
      ];

      findings = [
        `Analyzed ${filteredEmployees.length} personnel across ${config.department === 'All' ? 'all enterprise departments' : config.department}.`,
        `Average performance score holds strong at ${avgPerformance}/100.`,
        `Availability headroom buffer averages ${avgAvailability}%, sufficient for Q4 sprint demand.`
      ];

      primaryChartTitle = 'Headcount by Technical Competency & Proficiency';
      primaryChartType = 'bar';
      primaryChartData = [
        { name: 'Python', value: 92, color: '#16a34a' },
        { name: 'Kubernetes', value: 85, color: '#0284c7' },
        { name: 'FastAPI', value: 78, color: '#f59e0b' },
        { name: 'Distributed Systems', value: 64, color: '#ef4444' }
      ];

      tableData = {
        title: 'Workforce Roster Telemetry',
        headers: ['Employee ID', 'Name', 'Department', 'Role', 'Performance', 'Availability', 'Workload'],
        rows: filteredEmployees.slice(0, 8).map(e => [
          e.employeeId, e.name, e.department, e.role, `${e.performanceScore}/100`, `${e.availabilityScore}%`, `${e.workloadScore}%`
        ])
      };

      insights = [
        {
          id: 'ins-gen-1',
          title: 'Skill Matrix Calibration Complete',
          observation: 'Technical depth matches enterprise architecture targets with minor cross-training opportunities in distributed systems.',
          metric: `${avgPerformance} Performance`,
          priority: 'high',
          actionUrl: '/app/employees',
          actionLabel: 'View Employees'
        }
      ];
      break;
    }

    case 'projects': {
      const avgProgress = Math.round(filteredProjects.reduce((acc, p) => acc + p.progress, 0) / (filteredProjects.length || 1));
      const criticalCount = filteredProjects.filter(p => p.priority === 'Critical').length;
      const avgFit = Math.round(filteredProjects.reduce((acc, p) => acc + p.teamFit, 0) / (filteredProjects.length || 1));

      summaryMetrics = [
        { label: 'Active Projects', value: filteredProjects.length, unit: 'Initiatives', change: 'On Track', trend: 'up', status: 'positive' },
        { label: 'Critical Initiatives', value: criticalCount, unit: 'Projects', change: 'Monitored', trend: 'neutral', status: 'warning' },
        { label: 'Average Progress', value: `${avgProgress}%`, change: '+5.2%', trend: 'up', status: 'positive' },
        { label: 'Average Team Fit', value: `${avgFit}%`, change: '+2.0%', trend: 'up', status: 'positive' }
      ];

      findings = [
        `Portfolio review of ${filteredProjects.length} initiatives demonstrates steady velocity.`,
        `Average milestone completion stands at ${avgProgress}%.`,
        `Team fit alignment across initiatives averages ${avgFit}%.`
      ];

      primaryChartTitle = 'Project Progress & Milestone Completion (%)';
      primaryChartType = 'bar';
      primaryChartData = filteredProjects.slice(0, 5).map(p => ({
        name: p.name.length > 18 ? p.name.slice(0, 15) + '...' : p.name,
        value: p.progress,
        color: p.overallRisk === 'High' ? '#ef4444' : p.overallRisk === 'Medium' ? '#f59e0b' : '#16a34a'
      }));

      tableData = {
        title: 'Project Schedule & Status Registry',
        headers: ['Project ID', 'Project Name', 'Priority', 'Status', 'Progress', 'Risk', 'Deadline'],
        rows: filteredProjects.slice(0, 6).map(p => [
          p.projectId, p.name, p.priority, p.status, `${p.progress}%`, p.overallRisk, p.deadline
        ])
      };

      insights = [
        {
          id: 'ins-gen-2',
          title: 'Critical Milestones On Schedule',
          observation: 'Project velocity and resource capacity are aligned to target deadline commitments.',
          metric: `${avgProgress}% Progress`,
          priority: 'medium',
          actionUrl: '/app/projects',
          actionLabel: 'Inspect Projects'
        }
      ];
      break;
    }

    case 'team_formation': {
      const avgFit = Math.round((filteredFormations.reduce((acc, f) => acc + f.teamFitScore, 0) / (filteredFormations.length || 1)) * 10) / 10;
      const avgSustainability = Math.round(filteredFormations.reduce((acc, f) => acc + (f.metrics?.sustainability || 92), 0) / (filteredFormations.length || 1));

      summaryMetrics = [
        { label: 'Formations Evaluated', value: filteredFormations.length, unit: 'Teams', change: '+3 this month', trend: 'up', status: 'positive' },
        { label: 'Average Team Fit', value: `${avgFit}%`, change: '+2.4%', trend: 'up', status: 'positive' },
        { label: 'Skill Coverage', value: '96.2%', change: '+1.5%', trend: 'up', status: 'positive' },
        { label: 'Sustainability Index', value: `${avgSustainability}/100`, change: 'Healthy', trend: 'up', status: 'positive' }
      ];

      findings = [
        `Assembled teams achieve high cohesion with an average synergy fit of ${avgFit}%.`,
        `Skill coverage across formed pods averages 96.2% with balanced role distributions.`
      ];

      primaryChartTitle = 'Synergy Score Breakdown Across Formations';
      primaryChartType = 'bar';
      primaryChartData = filteredFormations.slice(0, 5).map(f => ({
        name: f.projectName.length > 18 ? f.projectName.slice(0, 15) + '...' : f.projectName,
        value: f.teamFitScore,
        color: '#a855f7'
      }));

      tableData = {
        title: 'Formation Synergy Registry',
        headers: ['Formation ID', 'Target Project', 'Team Size', 'Team Fit', 'Skill Coverage', 'Status'],
        rows: filteredFormations.slice(0, 5).map(f => [
          f.id, f.projectName, f.teamSize, `${f.teamFitScore}%`, `${f.metrics?.skillCoverage || 95}%`, f.status
        ])
      };

      insights = [
        {
          id: 'ins-gen-3',
          title: 'High Team Synergy Maintained',
          observation: 'Formations maintain optimal technical skill coverage while keeping individual workloads balanced.',
          metric: `${avgFit}% Synergy`,
          priority: 'high',
          actionUrl: '/app/teams',
          actionLabel: 'Explore Teams'
        }
      ];
      break;
    }

    case 'sustainability': {
      const highStrainCount = filteredEmployees.filter(e => e.wellbeingRisk === 'High' || e.workloadScore > 85).length;
      summaryMetrics = [
        { label: 'Sustainability Index', value: '94.6', unit: '/100', change: '+1.5%', trend: 'up', status: 'positive' },
        { label: 'Overallocated Members', value: highStrainCount, unit: 'Personnel', change: 'Monitored', trend: 'down', status: 'warning' },
        { label: 'Avg Operational Buffer', value: '18.5%', change: 'Safe Headroom', trend: 'up', status: 'positive' },
        { label: 'Workload Variance', value: '±8.5%', change: 'Low Disparity', trend: 'down', status: 'positive' }
      ];

      findings = [
        `Overall workforce sustainability is rated at 94.6/100.`,
        `${highStrainCount} individual(s) operating near elevated workload boundaries.`,
        `Capacity headroom buffer is sufficient to absorb sprint disruptions without overtime cascades.`
      ];

      primaryChartTitle = 'Workforce Capacity Health Tiers';
      primaryChartType = 'donut';
      primaryChartData = [
        { name: 'Optimal (50-80%)', value: 72, color: '#16a34a' },
        { name: 'Buffer (<50%)', value: 16, color: '#06b6d4' },
        { name: 'High Load (81-90%)', value: 8, color: '#f59e0b' },
        { name: 'Overallocated (>90%)', value: 4, color: '#ef4444' }
      ];

      tableData = {
        title: 'Workload & Fatigue Telemetry',
        headers: ['Employee ID', 'Name', 'Department', 'Role', 'Workload %', 'Wellbeing Risk'],
        rows: filteredEmployees.slice(0, 6).map(e => [
          e.employeeId, e.name, e.department, e.role, `${e.workloadScore}%`, `${e.wellbeingRisk} Strain`
        ])
      };

      insights = [
        {
          id: 'ins-gen-4',
          title: 'Proactive Rebalance Strategy Recommended',
          observation: 'Rebalancing 2 concurrent sprint assignments will eliminate high fatigue flags in Engineering.',
          metric: '94.6 Index',
          priority: 'high',
          actionUrl: '/app/teams',
          actionLabel: 'Rebalance Teams'
        }
      ];
      break;
    }

    case 'awis_intelligence': {
      summaryMetrics = [
        { label: 'Composite AWIS Index', value: '88.9', unit: '/100', change: '+3.2%', trend: 'up', status: 'positive' },
        { label: 'Technical Depth', value: '91.4', unit: '/100', change: '+2.8%', trend: 'up', status: 'positive' },
        { label: 'Collaboration Affinity', value: '89.2', unit: '/100', change: '+1.9%', trend: 'up', status: 'positive' },
        { label: 'Workload Resilience', value: '92.0', unit: '/100', change: '+3.0%', trend: 'up', status: 'positive' }
      ];

      findings = [
        'Evaluated across 9 AWIS intelligence dimensions including Technical Depth, Collaboration Affinity, and Workload Resilience.',
        'High organizational maturity observed across Technical Depth (91.4) and Workload Resilience (92.0).'
      ];

      primaryChartTitle = 'AWIS Dimension Scores By Capability Dimension';
      primaryChartType = 'bar';
      primaryChartData = [
        { name: 'Tech Depth', value: 91, color: '#0284c7' },
        { name: 'Collab Affinity', value: 89, color: '#16a34a' },
        { name: 'Workload Resilience', value: 92, color: '#a855f7' },
        { name: 'Delivery Velocity', value: 88, color: '#06b6d4' },
        { name: 'Growth Potential', value: 86, color: '#f59e0b' }
      ];

      tableData = {
        title: 'AWIS Intelligence Dimensions Assessment',
        headers: ['Dimension Name', 'Target Benchmark', 'Current Score', 'Status', 'Trend'],
        rows: [
          ['Technical Depth', '85.0', '91.4', 'Exceeding', '+2.8%'],
          ['Collaboration Affinity', '85.0', '89.2', 'On Target', '+1.9%'],
          ['Workload Resilience', '85.0', '92.0', 'Exceeding', '+3.0%'],
          ['Delivery Velocity', '80.0', '88.0', 'On Target', '+2.1%']
        ]
      };

      insights = [
        {
          id: 'ins-gen-5',
          title: 'Stable Model Calibration Confirmed',
          observation: 'AWIS scoring dimensions show strong correlation with actual sprint velocity and team delivery accuracy.',
          metric: '88.9 Composite',
          priority: 'high',
          actionUrl: '/app/analytics',
          actionLabel: 'View Analytics'
        }
      ];
      break;
    }

    default: {
      // Executive Comprehensive
      summaryMetrics = [
        { label: 'AWIS Workforce Index', value: '88.9', unit: '/100', change: '+3.2%', trend: 'up', status: 'positive' },
        { label: 'Average Team Fit', value: '91.8', unit: '%', change: '+2.4%', trend: 'up', status: 'positive' },
        { label: 'Workforce Sustainability', value: '94.6', unit: '/100', change: '+1.5%', trend: 'up', status: 'positive' },
        { label: 'Portfolio Velocity', value: '93.4', unit: '%', change: '+4.1%', trend: 'up', status: 'positive' }
      ];

      findings = [
        'Comprehensive multi-objective executive review across workforce, active projects, formations, and sustainability.',
        'High organizational alignment maintained with an aggregate AWIS score of 88.9/100.',
        'Team formations demonstrate 91.8% average match accuracy across concurrent sprint units.'
      ];

      primaryChartTitle = 'Departmental Workforce Capability & Velocity';
      primaryChartType = 'bar';
      primaryChartData = [
        { name: 'Engineering', value: 89, color: '#0284c7' },
        { name: 'AI & Research', value: 94, color: '#16a34a' },
        { name: 'Product Design', value: 91, color: '#f59e0b' },
        { name: 'DevOps & Cloud', value: 87, color: '#a855f7' }
      ];

      tableData = {
        title: 'Executive Strategic Portfolio Status',
        headers: ['Project Name', 'Department', 'Priority', 'Status', 'Progress', 'Team Fit'],
        rows: filteredProjects.slice(0, 5).map(p => [
          p.name, p.department, p.priority, p.status, `${p.progress}%`, `${p.teamFit}%`
        ])
      };

      insights = [
        {
          id: 'ins-exec-1',
          title: 'Strong Executive Health Indicators',
          observation: 'Cross-functional teams show high synergy with sustainable workload distribution across all core business units.',
          metric: '91.8% Fit',
          priority: 'high',
          actionUrl: '/app/analytics',
          actionLabel: 'Open Analytics'
        }
      ];
      break;
    }
  }

  return {
    id: reportId,
    name: config.title || `${config.category.toUpperCase()} Executive Report`,
    category: config.category,
    reportingPeriod: config.dateRange.label || 'Last 30 Days',
    createdAt: timestamp,
    createdBy: 'NEXAWIS Intelligence Engine',
    status: 'Ready',
    format: config.format || 'PDF',
    fileSizeBytes: 1800000 + Math.floor(Math.random() * 500000),
    config,
    summaryMetrics,
    findings,
    warnings: warnings.length > 0 ? warnings : undefined,
    insights,
    charts: config.includeCharts ? {
      primaryChartTitle,
      primaryChartType,
      primaryChartData
    } : undefined,
    tableData: config.includeTables ? tableData : undefined
  };
}
