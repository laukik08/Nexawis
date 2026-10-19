import type { 
  ReportCategoryDef, 
  ReportRecord, 
  ScheduledReportDef, 
  ReportKpiMetrics 
} from '../types/reports';

export const mockReportCategories: ReportCategoryDef[] = [
  {
    id: 'executive',
    title: 'Comprehensive Executive Report',
    badge: 'Executive Brief',
    description: 'Multi-objective synthesis combining workforce health, active project velocity, team formation synergy, and sustainability indicators.',
    iconName: 'layers',
    accentColor: '#0284c7', // Cyan
    defaultSections: [
      'Executive Summary & KPIs',
      'Workforce Capacity & Skills',
      'Project Milestones & Delivery Health',
      'Team Synergy & Alignment',
      'Sustainability & Burnout Prevention'
    ]
  },
  {
    id: 'workforce',
    title: 'Workforce Intelligence Report',
    badge: 'Workforce Audit',
    description: 'Detailed analysis of employee performance distributions, headcount by department, technical skill coverage, and available bandwidth.',
    iconName: 'users',
    accentColor: '#16a34a', // Lime
    defaultSections: [
      'Headcount by Department & Role',
      'Skill Coverage & Critical Gaps',
      'Performance vs Workload Matrix',
      'Capacity & Availability Buffers',
      'Workforce Roster Telemetry'
    ]
  },
  {
    id: 'projects',
    title: 'Project Performance Report',
    badge: 'Portfolio Health',
    description: 'Review of portfolio schedule adherence, priority tier alignment, risk factors, deadlines, and milestone completion progress.',
    iconName: 'folder-kanban',
    accentColor: '#f59e0b', // Amber
    defaultSections: [
      'Portfolio Progress & Velocity',
      'Schedule Health & Deadline Risks',
      'Critical Priority Initiatives',
      'Team Allocation & Headcount Fit',
      'Project Intelligence Registry'
    ]
  },
  {
    id: 'team_formation',
    title: 'Team Formation Report',
    badge: 'Team Synergy',
    description: 'Audit of assembled project teams, collective synergy scores, role assignments, skill complementarity, and multi-agent match rationale.',
    iconName: 'network',
    accentColor: '#a855f7', // Purple
    defaultSections: [
      'Formation Synergy & Match Scores',
      'Team Composition & Role Distribution',
      'Skill Coverage & Redundancy',
      'Workload Balance Within Pods',
      'Formation Comparison Registry'
    ]
  },
  {
    id: 'awis_intelligence',
    title: 'AWIS Intelligence Report',
    badge: '9-Dimension Index',
    description: 'Comprehensive evaluation of workforce capabilities across the 9 AWIS dimensions, historical trends, and department benchmark scores.',
    iconName: 'brain-circuit',
    accentColor: '#06b6d4', // Bright Cyan
    defaultSections: [
      'Overall AWIS Index Breakdown',
      '9-Dimension Competency Radar',
      'Historical Trajectory & Momentum',
      'Departmental Capability Comparison',
      'High-Potential Talent Identification'
    ]
  },
  {
    id: 'sustainability',
    title: 'Sustainability & Wellbeing Report',
    badge: 'Burnout Shield',
    description: 'Workforce longevity evaluation highlighting overallocated personnel, burnout risk categories, availability headroom, and rebalancing recommendations.',
    iconName: 'shield-check',
    accentColor: '#10b981', // Emerald
    defaultSections: [
      'Workforce Sustainability Index',
      'Capacity Utilization & Overload Alerts',
      'Department Strain & Fatigue Matrix',
      'Capacity Headroom Buffer Analysis',
      'Priority Rebalancing Registry'
    ]
  }
];

export const initialMockReports: ReportRecord[] = [
  {
    id: 'RPT-2026-001',
    name: 'Q3 Enterprise Executive Intelligence Brief',
    category: 'executive',
    reportingPeriod: 'Jul 01, 2026 – Sep 30, 2026',
    createdAt: '2026-10-15T09:30:00Z',
    createdBy: 'Chief Technology Officer',
    status: 'Ready',
    format: 'PDF',
    fileSizeBytes: 2450000,
    config: {
      title: 'Q3 Enterprise Executive Intelligence Brief',
      category: 'executive',
      dateRange: { preset: '90d', label: 'Last 90 Days' },
      department: 'All',
      projectId: 'All',
      sections: [
        'Executive Summary & KPIs',
        'Workforce Capacity & Skills',
        'Project Milestones & Delivery Health',
        'Team Synergy & Alignment',
        'Sustainability & Burnout Prevention'
      ],
      includeCharts: true,
      includeTables: true,
      includeComparison: true,
      format: 'PDF'
    },
    summaryMetrics: [
      { label: 'Workforce Intelligence (AWIS)', value: '88.9', unit: '/100', change: '+3.2%', trend: 'up', status: 'positive', benchmark: 'Target: >85' },
      { label: 'Average Team Fit', value: '91.8', unit: '%', change: '+2.4%', trend: 'up', status: 'positive', benchmark: 'Target: >88%' },
      { label: 'Workforce Sustainability', value: '94.6', unit: '/100', change: '+1.5%', trend: 'up', status: 'positive', benchmark: 'Safe: >85' },
      { label: 'Portfolio Velocity', value: '93.4', unit: '%', change: '+4.1%', trend: 'up', status: 'positive', benchmark: 'On Track' }
    ],
    findings: [
      'Enterprise workforce alignment remains strong with an aggregate AWIS score of 88.9/100, exceeding quarterly targets.',
      'Active team formations show high cross-functional synergy with an average match accuracy of 91.8%.',
      'Engineering workload utilization is operating at 76.5%, within the recommended sustainable operational band (70-80%).',
      'Distributed Systems expertise has a narrow supply margin with only 3 qualified senior specialists across concurrent critical projects.'
    ],
    warnings: [
      '2 mission-critical initiatives (Apollo Quantum Core and Hyperion Cloud Mesh) are approaching mid-sprint milestones with tight headcount capacity.'
    ],
    insights: [
      {
        id: 'ins-01',
        title: 'High Team Synergy Across Machine Learning Pods',
        observation: 'Teams formed using AWIS multi-agent intelligence demonstrated a 14% faster ramp-up velocity compared to manual assignment.',
        metric: '91.8% Fit',
        priority: 'high',
        actionUrl: '/app/teams',
        actionLabel: 'Inspect Formations'
      },
      {
        id: 'ins-02',
        title: 'Capacity Headroom Buffer Maintained at 18.5%',
        observation: 'Safe operational buffer prevented overtime crunch cascades during the recent Quantum Core production rollout.',
        metric: '18.5% Headroom',
        priority: 'medium',
        actionUrl: '/app/analytics',
        actionLabel: 'View Capacity'
      }
    ],
    charts: {
      primaryChartTitle: 'Department Capability & Utilization Index',
      primaryChartType: 'bar',
      primaryChartData: [
        { name: 'Engineering', value: 89, secondaryValue: 78, color: '#0284c7' },
        { name: 'AI & Research', value: 94, secondaryValue: 74, color: '#16a34a' },
        { name: 'Product Design', value: 91, secondaryValue: 70, color: '#f59e0b' },
        { name: 'DevOps & Cloud', value: 87, secondaryValue: 82, color: '#a855f7' },
        { name: 'Quality Assurance', value: 88, secondaryValue: 68, color: '#06b6d4' }
      ],
      secondaryChartTitle: 'Workforce Capacity Health Tiers',
      secondaryChartType: 'donut',
      secondaryChartData: [
        { name: 'Optimal (50-80%)', value: 68, color: '#16a34a' },
        { name: 'Buffer (<50%)', value: 16, color: '#06b6d4' },
        { name: 'High Load (81-90%)', value: 12, color: '#f59e0b' },
        { name: 'Overallocated (>90%)', value: 4, color: '#ef4444' }
      ]
    },
    tableData: {
      title: 'Strategic Portfolio Delivery Overview',
      description: 'Key enterprise projects and team allocation status.',
      headers: ['Project Name', 'Department', 'Priority', 'Status', 'Progress', 'Team Size', 'Team Fit'],
      rows: [
        ['Apollo Quantum Core', 'Engineering', 'Critical', 'Active', '45%', 12, '82%'],
        ['CyberShield AI Guard', 'Artificial Intelligence', 'Critical', 'Active', '60%', 8, '94%'],
        ['Hyperion Cloud Mesh', 'DevOps & Cloud', 'High', 'Active', '35%', 10, '88%'],
        ['Nexus Design System 2.0', 'Product Design', 'Medium', 'Completed', '100%', 6, '96%'],
        ['Aurora Analytics Engine', 'Data Science', 'High', 'Review', '85%', 8, '92%']
      ]
    }
  },
  {
    id: 'RPT-2026-002',
    name: 'Workforce Technical Skill Health & Capacity Audit',
    category: 'workforce',
    reportingPeriod: 'Sep 18, 2026 – Oct 18, 2026',
    createdAt: '2026-10-18T14:20:00Z',
    createdBy: 'VP of Engineering',
    status: 'Ready',
    format: 'PDF',
    fileSizeBytes: 1820000,
    config: {
      title: 'Workforce Technical Skill Health & Capacity Audit',
      category: 'workforce',
      dateRange: { preset: '30d', label: 'Last 30 Days' },
      department: 'Engineering',
      projectId: 'All',
      sections: [
        'Headcount by Department & Role',
        'Skill Coverage & Critical Gaps',
        'Performance vs Workload Matrix',
        'Workforce Roster Telemetry'
      ],
      includeCharts: true,
      includeTables: true,
      includeComparison: false,
      format: 'PDF'
    },
    summaryMetrics: [
      { label: 'Active Workforce', value: '48', unit: 'Employees', change: '+4 this quarter', trend: 'up', status: 'positive' },
      { label: 'Average Performance', value: '88.5', unit: '/100', change: '+1.8%', trend: 'up', status: 'positive' },
      { label: 'Availability Rate', value: '64.2', unit: '%', change: '-2.1%', trend: 'down', status: 'neutral' },
      { label: 'Critical Skill Coverage', value: '92.4', unit: '%', change: '+3.5%', trend: 'up', status: 'positive' }
    ],
    findings: [
      'Core technical competencies in Python, React, and Kubernetes maintain over 100% supply surplus.',
      'Distributed Systems and Rust architecture skills show a demand deficit across upcoming Q4 roadmap items.',
      'Average individual performance score is 88.5/100 with zero low-performing anomalies detected.'
    ],
    insights: [
      {
        id: 'ins-wf-1',
        title: 'Distributed Systems Mentorship Pod Recommended',
        observation: 'Pairing Marcus Vance with rising mid-level engineers will expand institutional knowledge and reduce single-point dependency.',
        metric: '3 Qualified Leads',
        priority: 'high',
        actionUrl: '/app/teams',
        actionLabel: 'Form Mentorship Pod'
      }
    ],
    charts: {
      primaryChartTitle: 'Top Technical Skill Coverage vs Project Demand',
      primaryChartType: 'bar',
      primaryChartData: [
        { name: 'Python', value: 125, color: '#16a34a' },
        { name: 'Kubernetes', value: 110, color: '#16a34a' },
        { name: 'Cloud Architecture', value: 100, color: '#16a34a' },
        { name: 'FastAPI', value: 95, color: '#f59e0b' },
        { name: 'Distributed Systems', value: 65, color: '#ef4444' }
      ]
    },
    tableData: {
      title: 'Key Workforce Contributors Sample',
      headers: ['Employee ID', 'Name', 'Department', 'Role', 'Performance', 'Availability', 'Workload'],
      rows: [
        ['NXW-1042', 'Dr. Sarah Chen', 'AI & Research', 'Lead AI Researcher', '94/100', '70%', '75%'],
        ['NXW-1088', 'Marcus Vance', 'Engineering', 'Principal Architect', '96/100', '50%', '88%'],
        ['NXW-1104', 'Elena Rostova', 'Product Design', 'Lead UX Specialist', '91/100', '80%', '65%'],
        ['NXW-1142', 'Devon Brooks', 'DevOps & Cloud', 'Cloud Infrastructure Lead', '90/100', '60%', '78%'],
        ['NXW-1190', 'Aisha Morales', 'Engineering', 'Senior Full Stack Engineer', '89/100', '65%', '72%']
      ]
    }
  },
  {
    id: 'RPT-2026-003',
    name: 'Active Project Portfolio Velocity & Delivery Risk',
    category: 'projects',
    reportingPeriod: 'Aug 01, 2026 – Oct 18, 2026',
    createdAt: '2026-10-17T16:45:00Z',
    createdBy: 'Project Management Office',
    status: 'Ready',
    format: 'CSV',
    fileSizeBytes: 980000,
    config: {
      title: 'Active Project Portfolio Velocity & Delivery Risk',
      category: 'projects',
      dateRange: { preset: '90d', label: 'Last 90 Days' },
      department: 'All',
      projectId: 'All',
      sections: [
        'Portfolio Progress & Velocity',
        'Schedule Health & Deadline Risks',
        'Project Intelligence Registry'
      ],
      includeCharts: false,
      includeTables: true,
      includeComparison: true,
      format: 'CSV'
    },
    summaryMetrics: [
      { label: 'Total Initiatives', value: '14', unit: 'Projects', change: '+2 new', trend: 'up', status: 'positive' },
      { label: 'Schedule Health', value: '85.7', unit: '% on track', change: '+4.2%', trend: 'up', status: 'positive' },
      { label: 'Average Team Fit', value: '89.4', unit: '%', change: '+1.9%', trend: 'up', status: 'positive' },
      { label: 'Critical Risk Items', value: '2', unit: 'Projects', change: '-1 vs prev', trend: 'down', status: 'warning' }
    ],
    findings: [
      '12 of 14 active projects are progressing according to planned sprint delivery schedules.',
      'Apollo Quantum Core shows high delivery pressure but maintains a strong core architecture pod.',
      'Team size to requirement alignment is at 94% across all departments.'
    ],
    insights: [
      {
        id: 'ins-prj-1',
        title: 'Review Apollo Quantum Core Team Rebalance',
        observation: 'Adding 2 backend specialists will de-risk the November 30 milestone without impacting other projects.',
        metric: 'Critical Priority',
        priority: 'high',
        actionUrl: '/app/projects/prj-1',
        actionLabel: 'Inspect Project'
      }
    ],
    tableData: {
      title: 'Portfolio Schedule Health Registry',
      headers: ['Project ID', 'Project Name', 'Priority', 'Status', 'Progress', 'Risk', 'Deadline'],
      rows: [
        ['PRJ-2024-081', 'Apollo Quantum Core', 'Critical', 'Active', '45%', 'High', '2026-11-30'],
        ['PRJ-2024-092', 'CyberShield AI Guard', 'Critical', 'Active', '60%', 'Low', '2026-12-15'],
        ['PRJ-2024-104', 'Hyperion Cloud Mesh', 'High', 'Active', '35%', 'Medium', '2027-01-20'],
        ['PRJ-2024-118', 'Nexus Design System', 'Medium', 'Completed', '100%', 'Low', '2026-10-01']
      ]
    }
  },
  {
    id: 'RPT-2026-004',
    name: 'Multi-Agent Team Formation Synergy & Match Audit',
    category: 'team_formation',
    reportingPeriod: 'Sep 01, 2026 – Oct 18, 2026',
    createdAt: '2026-10-16T11:15:00Z',
    createdBy: 'Workforce Intelligence Unit',
    status: 'Ready',
    format: 'PDF',
    fileSizeBytes: 2150000,
    config: {
      title: 'Multi-Agent Team Formation Synergy & Match Audit',
      category: 'team_formation',
      dateRange: { preset: '30d', label: 'Last 30 Days' },
      department: 'All',
      projectId: 'All',
      sections: [
        'Formation Synergy & Match Scores',
        'Team Composition & Role Distribution',
        'Formation Comparison Registry'
      ],
      includeCharts: true,
      includeTables: true,
      includeComparison: false,
      format: 'PDF'
    },
    summaryMetrics: [
      { label: 'Formations Evaluated', value: '28', unit: 'Teams', change: '+6 this month', trend: 'up', status: 'positive' },
      { label: 'Average Team Fit', value: '91.8', unit: '%', change: '+2.4%', trend: 'up', status: 'positive' },
      { label: 'Skill Coverage Score', value: '96.2', unit: '%', change: '+1.8%', trend: 'up', status: 'positive' },
      { label: 'Workforce Sustainability', value: '94.6', unit: '/100', change: '+1.5%', trend: 'up', status: 'positive' }
    ],
    findings: [
      'Formations generated with the Fatigue-Safe option showed 0 burnout incidents over 60 operating days.',
      'Autonomous AI Optimization achieved the highest composite fit (94.5%) for complex distributed systems projects.'
    ],
    insights: [
      {
        id: 'ins-tf-1',
        title: 'High Synergy in Cross-Department Pairings',
        observation: 'Pairing researchers with infrastructure engineers improved deployment velocity by 22%.',
        metric: '94.5% Fit',
        priority: 'high',
        actionUrl: '/app/teams',
        actionLabel: 'View Formations'
      }
    ],
    charts: {
      primaryChartTitle: 'Team Fit Distribution Across Recent Formations',
      primaryChartType: 'bar',
      primaryChartData: [
        { name: '95%+ Optimal', value: 12, color: '#16a34a' },
        { name: '90-94% Strong', value: 11, color: '#0284c7' },
        { name: '80-89% Adequate', value: 4, color: '#f59e0b' },
        { name: '<80% Rebalance', value: 1, color: '#ef4444' }
      ]
    },
    tableData: {
      title: 'Recent Team Formations Performance',
      headers: ['Formation ID', 'Target Project', 'Team Size', 'Team Fit', 'Skill Coverage', 'Status'],
      rows: [
        ['FRM-2026-081', 'Quantum Core API Engine', 4, '94.5%', '100%', 'Active'],
        ['FRM-2026-082', 'Neural Knowledge Graph', 5, '92.0%', '95%', 'Finalized'],
        ['FRM-2026-083', 'Cloud Zero Trust Sentinel', 4, '95.2%', '100%', 'Active'],
        ['FRM-2026-084', 'Design Tokens Modernization', 3, '89.5%', '92%', 'Draft']
      ]
    }
  },
  {
    id: 'RPT-2026-005',
    name: 'Workforce Sustainability & Burnout Protection Audit',
    category: 'sustainability',
    reportingPeriod: 'Sep 01, 2026 – Oct 18, 2026',
    createdAt: '2026-10-14T08:00:00Z',
    createdBy: 'People & Culture Analytics',
    status: 'Ready',
    format: 'PDF',
    fileSizeBytes: 1950000,
    config: {
      title: 'Workforce Sustainability & Burnout Protection Audit',
      category: 'sustainability',
      dateRange: { preset: '30d', label: 'Last 30 Days' },
      department: 'All',
      projectId: 'All',
      sections: [
        'Workforce Sustainability Index',
        'Capacity Utilization & Overload Alerts',
        'Priority Rebalancing Registry'
      ],
      includeCharts: true,
      includeTables: true,
      includeComparison: true,
      format: 'PDF'
    },
    summaryMetrics: [
      { label: 'Sustainability Index', value: '94.6', unit: '/100', change: '+1.5%', trend: 'up', status: 'positive' },
      { label: 'Overallocated Headcount', value: '4', unit: 'Members', change: '-2 vs prev', trend: 'down', status: 'warning' },
      { label: 'Workload Variance', value: '±8.5', unit: '%', change: '-1.2%', trend: 'down', status: 'positive' },
      { label: 'Headroom Buffer', value: '18.2', unit: '%', change: '+0.8%', trend: 'up', status: 'positive' }
    ],
    findings: [
      '84% of personnel are currently operating within the healthy workload band (<80%).',
      '4 employees currently exhibit elevated workload strain (>85%) due to overlapping sprint deadlines.',
      'Rebalancing recommendations have been generated to distribute backlog tickets across underutilized contributors.'
    ],
    insights: [
      {
        id: 'ins-sust-1',
        title: 'Engineering Capacity Balance Alert',
        observation: 'Engineering shows 2 senior architects operating near 88% capacity. Immediate candidate swaps are available.',
        metric: '2 At-Risk',
        priority: 'high',
        actionUrl: '/app/teams',
        actionLabel: 'Rebalance Roster'
      }
    ],
    tableData: {
      title: 'At-Risk Personnel Telemetry',
      headers: ['Employee ID', 'Name', 'Department', 'Role', 'Current Load', 'Wellbeing Risk', 'Active Projects'],
      rows: [
        ['NXW-1088', 'Marcus Vance', 'Engineering', 'Principal Architect', '88%', 'Moderate Strain', 2],
        ['NXW-1120', 'James Wilson', 'Engineering', 'Senior Systems Engineer', '92%', 'High Strain', 2],
        ['NXW-1155', 'Chloe Bennett', 'DevOps & Cloud', 'Cloud Security Lead', '86%', 'Moderate Strain', 1]
      ]
    }
  },
  {
    id: 'RPT-2026-006',
    name: '9-Dimension AWIS Intelligence Benchmark Review',
    category: 'awis_intelligence',
    reportingPeriod: 'Jul 01, 2026 – Sep 30, 2026',
    createdAt: '2026-10-10T13:30:00Z',
    createdBy: 'AI Research Group',
    status: 'Ready',
    format: 'PDF',
    fileSizeBytes: 2300000,
    config: {
      title: '9-Dimension AWIS Intelligence Benchmark Review',
      category: 'awis_intelligence',
      dateRange: { preset: '90d', label: 'Last 90 Days' },
      department: 'All',
      projectId: 'All',
      sections: [
        'Overall AWIS Index Breakdown',
        '9-Dimension Competency Radar',
        'Historical Trajectory & Momentum'
      ],
      includeCharts: true,
      includeTables: true,
      includeComparison: true,
      format: 'PDF'
    },
    summaryMetrics: [
      { label: 'Average AWIS Score', value: '88.9', unit: '/100', change: '+3.2%', trend: 'up', status: 'positive' },
      { label: 'Technical Depth Dimension', value: '91.4', unit: '/100', change: '+2.8%', trend: 'up', status: 'positive' },
      { label: 'Collaboration Affinity', value: '89.2', unit: '/100', change: '+1.9%', trend: 'up', status: 'positive' },
      { label: 'Workload Resilience', value: '92.0', unit: '/100', change: '+3.0%', trend: 'up', status: 'positive' }
    ],
    findings: [
      'AWIS 9-dimension intelligence models demonstrate stable calibration with high cross-functional synergy predictive accuracy.',
      'Research and Engineering departments scored highest in Technical Depth (94) and Innovation Velocity (92).'
    ],
    insights: [
      {
        id: 'ins-awis-1',
        title: 'Autonomous Alignment Verified',
        observation: 'The 9-dimension composite scoring algorithm accurately predicted team cohesion with 96% confidence across 24 projects.',
        metric: '88.9 Index',
        priority: 'high',
        actionUrl: '/app/analytics',
        actionLabel: 'View Analytics'
      }
    ],
    tableData: {
      title: 'AWIS Dimension Scores By Department',
      headers: ['Department', 'Technical Depth', 'Velocity', 'Collaboration', 'Resilience', 'Composite Score'],
      rows: [
        ['AI & Research', '95/100', '92/100', '90/100', '93/100', '93.5/100'],
        ['Engineering', '93/100', '88/100', '89/100', '88/100', '89.8/100'],
        ['Product Design', '89/100', '91/100', '94/100', '92/100', '91.2/100'],
        ['DevOps & Cloud', '91/100', '87/100', '86/100', '90/100', '88.6/100']
      ]
    }
  }
];

export const initialScheduledReports: ScheduledReportDef[] = [
  {
    id: 'SCHED-01',
    name: 'Weekly Executive Workforce Intelligence Brief',
    category: 'executive',
    frequency: 'Weekly',
    nextRunDate: '2026-10-26T08:00:00Z',
    recipients: ['cto@nexawis.internal', 'vp.engineering@nexawis.internal'],
    enabled: true,
    format: 'PDF',
    department: 'All',
    createdAt: '2026-09-01T10:00:00Z'
  },
  {
    id: 'SCHED-02',
    name: 'Monthly Engineering Capacity & Skill Audit',
    category: 'workforce',
    frequency: 'Monthly',
    nextRunDate: '2026-11-01T08:00:00Z',
    recipients: ['eng-leads@nexawis.internal'],
    enabled: true,
    format: 'PDF',
    department: 'Engineering',
    createdAt: '2026-09-15T12:00:00Z'
  },
  {
    id: 'SCHED-03',
    name: 'Bi-Weekly Portfolio Milestone Health Review',
    category: 'projects',
    frequency: 'Weekly',
    nextRunDate: '2026-10-24T09:00:00Z',
    recipients: ['pmo@nexawis.internal'],
    enabled: false,
    format: 'CSV',
    department: 'All',
    createdAt: '2026-10-01T14:30:00Z'
  }
];

export const mockReportKpis: ReportKpiMetrics = {
  totalReports: 6,
  reportsGenerated: 24,
  scheduledReports: 3,
  latestReportDate: '2026-10-18',
  latestReportName: 'Workforce Technical Skill Health & Capacity Audit'
};
