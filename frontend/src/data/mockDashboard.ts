// MOCK DATA LAYER FOR DASHBOARD
// Secure by default: No real user data or PII should be placed here.
// Used until the backend APIs are wired up.

export const dashboardData = {
  kpis: [
    {
      id: "total_employees",
      label: "TOTAL EMPLOYEES",
      value: "243",
      trend: "+12%",
      trendUp: true,
      subtext: "vs previous period"
    },
    {
      id: "active_projects",
      label: "ACTIVE PROJECTS",
      value: "28",
      trend: "+8%",
      trendUp: true,
      subtext: "vs previous period"
    },
    {
      id: "awis_score",
      label: "AVERAGE AWIS SCORE",
      value: "92.4",
      trend: "+5.2%",
      trendUp: true,
      subtext: "organization wide"
    },
    {
      id: "workforce_health",
      label: "WORKFORCE HEALTH",
      value: "Low Risk",
      trend: "-10%",
      trendUp: true, // true meaning 'good', burnout risk dropping is good
      subtext: "burnout probability"
    }
  ],
  
  projectSuccessTrend: [
    { month: 'Jan', success: 82, target: 85 },
    { month: 'Feb', success: 85, target: 85 },
    { month: 'Mar', success: 84, target: 85 },
    { month: 'Apr', success: 89, target: 85 },
    { month: 'May', success: 91, target: 85 },
    { month: 'Jun', success: 94, target: 85 },
  ],

  teamHealthDistribution: [
    { name: 'Healthy', value: 72, color: 'var(--color-accent-lime)' },
    { name: 'Moderate', value: 20, color: 'var(--color-accent-cyan)' },
    { name: 'At Risk', value: 8, color: '#f87171' }, // Red-400
  ],

  workforceIntelligence: {
    skills: [
      { name: "React / Frontend", coverage: 94 },
      { name: "Python / Backend", coverage: 89 },
      { name: "Cloud / DevOps", coverage: 86 },
      { name: "Cybersecurity", coverage: 91 }
    ],
    capacity: {
      available: 18,
      utilized: 82
    }
  },

  activeProjects: [
    {
      id: 'prj_1',
      name: 'Project Alpha (Core)',
      priority: 'High',
      teamSize: 8,
      progress: 65,
      teamFit: 94,
      status: 'On Track'
    },
    {
      id: 'prj_2',
      name: 'Data Pipeline V2',
      priority: 'Medium',
      teamSize: 4,
      progress: 30,
      teamFit: 88,
      status: 'In Progress'
    },
    {
      id: 'prj_3',
      name: 'Legacy Migration',
      priority: 'High',
      teamSize: 12,
      progress: 85,
      teamFit: 72,
      status: 'At Risk'
    },
    {
      id: 'prj_4',
      name: 'Mobile App Beta',
      priority: 'Low',
      teamSize: 5,
      progress: 10,
      teamFit: 91,
      status: 'Planning'
    }
  ],

  quickInsights: [
    "3 employees are approaching high workload limits this week.",
    "Project Alpha has strong skill coverage but elevated schedule pressure.",
    "Workforce wellbeing improved by 10% this month across engineering.",
  ]
};
