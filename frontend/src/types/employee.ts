/**
 * NEXAWIS Frontend - Employee and Workforce Data Contracts.
 * Accurately models employee profile data, skills, allocations,
 * performance records, explainability insights, and API envelopes.
 */

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
  priority: 'High' | 'Medium' | 'Low' | string;
  teamFit: number;
  status: string;
}

export interface PerformanceRecord {
  month: string;
  score: number;
}

export interface AwisInsights {
  positive: string[];
  negative: string[];
  summary: string;
}

export type WellbeingRisk = 'Low' | 'Moderate' | 'High';
export type EmploymentStatus = 'Available' | 'Allocated' | 'On Leave' | 'Overloaded' | 'Archived';
export type PerformanceTrend = 'up' | 'down' | 'stable';

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email?: string;
  avatarUrl: string;
  role: string;
  department: string;
  experienceYears: number;
  status: EmploymentStatus;

  // Intelligence Metrics
  performanceScore: number;
  performanceTrend: PerformanceTrend;
  availabilityScore: number; // 0-100
  workloadScore: number; // 0-100
  wellbeingRisk: WellbeingRisk;
  growthPotential: number; // 0-100
  awisFitScore: number;

  skills: Skill[];
  currentProjects: ProjectAllocation[];
  performanceHistory: PerformanceRecord[];
  awisInsights: AwisInsights;

  workLocation?: string;
  employmentType?: string;
  mentalFatigueScore?: number | null;
}

export interface EmployeeListResponse {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EmployeeStatsResponse {
  total: number;
  active: number;
  available: number;
  atRisk: number;
}

export interface EmployeeFilterParams {
  search?: string;
  department?: string;
  role?: string;
  status?: string;
  risk?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | string;
  page?: number;
  pageSize?: number;
  includeArchived?: boolean;
}

export interface EmployeeCreatePayload {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  role: string;
  experienceYears?: number;
  status?: string;
  employmentType?: string;
  workLocation?: string;
  avatarUrl?: string;
  skills?: Skill[];
  performanceScore?: number;
  availabilityScore?: number;
  workloadScore?: number;
  growthPotential?: number;
  awisFitScore?: number;
  wellbeingRisk?: string;
}
