// SECURE MOCK DATA LAYER: EMPLOYEES
// Used solely for frontend structural simulation until API integration is complete.
// Does NOT contain real employee data.

export interface Skill {
  name: string;
  proficiency: number; // 0-100
  isPrimary: boolean;
}

export interface ProjectAllocation {
  id: string;
  name: string;
  role: string;
  allocationPercent: number;
  priority: 'High' | 'Medium' | 'Low';
  teamFit: number;
  status: string;
}

export interface PerformanceRecord {
  month: string;
  score: number;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  avatarUrl: string;
  role: string;
  department: string;
  experienceYears: number;
  status: 'Available' | 'Allocated' | 'On Leave' | 'Overloaded';
  
  // Intelligence Metrics
  performanceScore: number;
  performanceTrend: 'up' | 'down' | 'stable';
  availabilityScore: number; // 0-100, 100 means fully available
  workloadScore: number; // 0-100, higher means more loaded
  wellbeingRisk: 'Low' | 'Moderate' | 'High';
  growthPotential: number; // 0-100
  awisFitScore: number;
  
  skills: Skill[];
  currentProjects: ProjectAllocation[];
  performanceHistory: PerformanceRecord[];
  
  // Explainability insight
  awisInsights: {
    positive: string[];
    negative: string[];
    summary: string;
  };
}

export const mockEmployees: Employee[] = [
  {
    id: "emp_001",
    employeeId: "NXW-1042",
    name: "Elena Rostova",
    avatarUrl: "https://ui-avatars.com/api/?name=Elena+Rostova&background=0284c7&color=fff",
    role: "Senior Frontend Engineer",
    department: "Engineering",
    experienceYears: 6,
    status: "Allocated",
    performanceScore: 94,
    performanceTrend: "up",
    availabilityScore: 20,
    workloadScore: 85,
    wellbeingRisk: "Moderate",
    growthPotential: 92,
    awisFitScore: 94.5,
    skills: [
      { name: "React", proficiency: 98, isPrimary: true },
      { name: "TypeScript", proficiency: 95, isPrimary: true },
      { name: "UI/UX Design", proficiency: 85, isPrimary: false },
      { name: "GraphQL", proficiency: 75, isPrimary: false }
    ],
    currentProjects: [
      {
        id: "prj_1",
        name: "Project Alpha (Core)",
        role: "Lead Frontend",
        allocationPercent: 80,
        priority: "High",
        teamFit: 94,
        status: "On Track"
      }
    ],
    performanceHistory: [
      { month: 'Jan', score: 88 },
      { month: 'Feb', score: 90 },
      { month: 'Mar', score: 90 },
      { month: 'Apr', score: 92 },
      { month: 'May', score: 93 },
      { month: 'Jun', score: 94 },
    ],
    awisInsights: {
      positive: ["Exceptional React proficiency", "Strong historical performance trend", "High team synergy scores in current project"],
      negative: ["Approaching high workload threshold (85%)"],
      summary: "Elena is highly effective in her current role but requires careful workload management to avoid burnout."
    }
  },
  {
    id: "emp_002",
    employeeId: "NXW-1055",
    name: "Marcus Chen",
    avatarUrl: "https://ui-avatars.com/api/?name=Marcus+Chen&background=16a34a&color=fff",
    role: "Backend Architect",
    department: "Engineering",
    experienceYears: 9,
    status: "Available",
    performanceScore: 97,
    performanceTrend: "stable",
    availabilityScore: 90,
    workloadScore: 20,
    wellbeingRisk: "Low",
    growthPotential: 88,
    awisFitScore: 91.2,
    skills: [
      { name: "Python", proficiency: 96, isPrimary: true },
      { name: "Go", proficiency: 92, isPrimary: true },
      { name: "PostgreSQL", proficiency: 95, isPrimary: true },
      { name: "AWS Services", proficiency: 88, isPrimary: false }
    ],
    currentProjects: [
      {
        id: "prj_2",
        name: "Data Pipeline V2",
        role: "Advisory",
        allocationPercent: 10,
        priority: "Medium",
        teamFit: 88,
        status: "In Progress"
      }
    ],
    performanceHistory: [
      { month: 'Jan', score: 96 },
      { month: 'Feb', score: 97 },
      { month: 'Mar', score: 97 },
      { month: 'Apr', score: 97 },
      { month: 'May', score: 97 },
      { month: 'Jun', score: 97 },
    ],
    awisInsights: {
      positive: ["Extensive architectural experience", "Currently highly available (90%)", "Stable high performance"],
      negative: [],
      summary: "Marcus is an optimal candidate for upcoming high-priority backend infrastructure projects."
    }
  },
  {
    id: "emp_003",
    employeeId: "NXW-1089",
    name: "Sarah Jenkins",
    avatarUrl: "https://ui-avatars.com/api/?name=Sarah+Jenkins&background=e8f39a&color=0d1a20",
    role: "Product Manager",
    department: "Product",
    experienceYears: 5,
    status: "Overloaded",
    performanceScore: 88,
    performanceTrend: "down",
    availabilityScore: 0,
    workloadScore: 110,
    wellbeingRisk: "High",
    growthPotential: 95,
    awisFitScore: 78.5,
    skills: [
      { name: "Agile Leadership", proficiency: 90, isPrimary: true },
      { name: "User Research", proficiency: 85, isPrimary: true },
      { name: "Data Analytics", proficiency: 80, isPrimary: false },
      { name: "Stakeholder Mgmt", proficiency: 95, isPrimary: true }
    ],
    currentProjects: [
      {
        id: "prj_1",
        name: "Project Alpha (Core)",
        role: "Product Lead",
        allocationPercent: 60,
        priority: "High",
        teamFit: 94,
        status: "On Track"
      },
      {
        id: "prj_4",
        name: "Mobile App Beta",
        role: "Product Owner",
        allocationPercent: 50,
        priority: "Low",
        teamFit: 91,
        status: "Planning"
      }
    ],
    performanceHistory: [
      { month: 'Jan', score: 92 },
      { month: 'Feb', score: 93 },
      { month: 'Mar', score: 92 },
      { month: 'Apr', score: 89 },
      { month: 'May', score: 88 },
      { month: 'Jun', score: 88 },
    ],
    awisInsights: {
      positive: ["Strong stakeholder management", "High growth potential"],
      negative: ["Critically overloaded (110% allocation)", "Declining performance trend", "High burnout risk detected"],
      summary: "Sarah requires immediate workload rebalancing. Recommend transferring 'Mobile App Beta' responsibilities."
    }
  },
  {
    id: "emp_004",
    employeeId: "NXW-1102",
    name: "David Park",
    avatarUrl: "https://ui-avatars.com/api/?name=David+Park&background=f1f5f9&color=475569",
    role: "Data Scientist",
    department: "Data",
    experienceYears: 3,
    status: "Allocated",
    performanceScore: 85,
    performanceTrend: "up",
    availabilityScore: 40,
    workloadScore: 60,
    wellbeingRisk: "Low",
    growthPotential: 98,
    awisFitScore: 89.0,
    skills: [
      { name: "Machine Learning", proficiency: 88, isPrimary: true },
      { name: "Python", proficiency: 90, isPrimary: true },
      { name: "SQL", proficiency: 85, isPrimary: false },
      { name: "PyTorch", proficiency: 82, isPrimary: false }
    ],
    currentProjects: [
      {
        id: "prj_2",
        name: "Data Pipeline V2",
        role: "Data Engineer",
        allocationPercent: 60,
        priority: "Medium",
        teamFit: 88,
        status: "In Progress"
      }
    ],
    performanceHistory: [
      { month: 'Jan', score: 78 },
      { month: 'Feb', score: 80 },
      { month: 'Mar', score: 82 },
      { month: 'Apr', score: 84 },
      { month: 'May', score: 85 },
      { month: 'Jun', score: 85 },
    ],
    awisInsights: {
      positive: ["Rapidly improving performance score", "Exceptional growth potential", "Healthy workload balance"],
      negative: ["Lower experience in production deployments"],
      summary: "David is showing excellent trajectory. Ready for increased responsibilities in ML-focused projects."
    }
  },
  {
    id: "emp_005",
    employeeId: "NXW-1120",
    name: "Aisha Patel",
    avatarUrl: "https://ui-avatars.com/api/?name=Aisha+Patel&background=0284c7&color=fff",
    role: "DevOps Engineer",
    department: "Engineering",
    experienceYears: 7,
    status: "On Leave",
    performanceScore: 91,
    performanceTrend: "stable",
    availabilityScore: 0,
    workloadScore: 0,
    wellbeingRisk: "Low",
    growthPotential: 85,
    awisFitScore: 85.0,
    skills: [
      { name: "Kubernetes", proficiency: 95, isPrimary: true },
      { name: "Docker", proficiency: 92, isPrimary: true },
      { name: "AWS", proficiency: 94, isPrimary: true },
      { name: "Terraform", proficiency: 89, isPrimary: false }
    ],
    currentProjects: [],
    performanceHistory: [
      { month: 'Jan', score: 90 },
      { month: 'Feb', score: 91 },
      { month: 'Mar', score: 92 },
      { month: 'Apr', score: 91 },
      { month: 'May', score: 91 },
      { month: 'Jun', score: 91 },
    ],
    awisInsights: {
      positive: ["Crucial infrastructure skills", "Consistent reliable performance"],
      negative: ["Currently unavailable (On Leave)"],
      summary: "Aisha is currently on leave. Ensure no critical infrastructure dependencies rely solely on her during this period."
    }
  }
];
