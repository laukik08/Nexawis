/**
 * NEXAWIS Frontend - Project and Workforce Allocation Contracts.
 * Accurately models project metadata, required skills, team members,
 * milestones, intelligence scores, and capacity planning.
 */

export interface ProjectRequirement {
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  level: string;
}

export interface ProjectTeamMember {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
  primarySkill: string;
  allocationPercent: number;
  performanceScore: number;
  teamFit: number;
  wellbeingRisk: 'Low' | 'Moderate' | 'High';
}

export interface ProjectMilestone {
  id: string;
  name: string;
  status: 'Completed' | 'Current' | 'Upcoming';
  date: string;
}

export interface ProjectRisk {
  category: string;
  level: 'Low' | 'Medium' | 'High';
  description: string;
  trend: 'up' | 'down' | 'stable';
}

export interface ProjectIntelligence {
  priorityScore: number;
  complexityScore: number;
  requirementStability: number;
  technicalRisk: number;
  schedulePressure: number;
  clientEngagement: number;
  innovationIndex: number;
  scopeChange: number;
  budgetVariance: number;
  deliveryDelayRisk: number;
  successPrediction: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    positiveFactors: string[];
    negativeFactors: string[];
  };
}

export interface ProjectAwisFit {
  overallScore: number;
  skillsMatch: number;
  availabilityMatch: number;
  experienceMatch: number;
  workloadBalance: number;
  wellbeingImpact: number;
  insights: string[];
  explanation: {
    positives: string[];
    concerns: string[];
  };
}

export interface ProjectCapacity {
  totalRequired: number;
  allocated: number;
  available: number;
  overloadedMembers: number;
  balancedMembers: number;
}

export interface Project {
  id: string;
  projectId: string;
  name: string;
  description: string;
  department: string;
  client?: string;
  projectManager?: string;
  status: 'Planning' | 'Active' | 'On Track' | 'At Risk' | 'Completed' | 'Archived';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  complexity: 'High' | 'Medium' | 'Low';
  teamSize: number;
  progress: number;
  overallRisk: 'Low' | 'Medium' | 'High';
  teamFit: number;
  startDate: string;
  deadline: string;

  intelligence: ProjectIntelligence;
  requirements: ProjectRequirement[];
  currentTeam: ProjectTeamMember[];
  milestones: ProjectMilestone[];
  risks: ProjectRisk[];
  awisFit: ProjectAwisFit;
  capacity: ProjectCapacity;
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProjectStatsResponse {
  total: number;
  active: number;
  onTrack: number;
  atRisk: number;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  department: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  status: 'Planning' | 'Active' | 'On Track' | 'At Risk' | 'Completed' | string;
  startDate: string;
  deadline: string;
  requirements: ProjectRequirement[];
  teamSize: number;
  complexity: 'High' | 'Medium' | 'Low' | string;
  client?: string;
  projectManager?: string;
  projectId?: string;
}

export interface ProjectFilterParams {
  search?: string;
  department?: string;
  status?: string;
  priority?: string;
  risk?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | string;
  page?: number;
  pageSize?: number;
  includeArchived?: boolean;
}
