/**
 * NEXAWIS Frontend - Project Management Service.
 * Connects the Projects module to persistent, workspace-isolated FastAPI endpoints.
 */

import { authenticatedFetch } from './apiClient';
import type {
  Project,
  ProjectListResponse,
  ProjectStatsResponse,
  CreateProjectInput,
  ProjectFilterParams,
} from '../types/project';

export const projectService = {
  /**
   * Retrieves paginated, filtered, and sorted projects for the active workspace.
   */
  async getProjects(params: ProjectFilterParams = {}): Promise<ProjectListResponse> {
    const query = new URLSearchParams();

    if (params.search) query.set('search', params.search);
    if (params.department && params.department.toLowerCase() !== 'all departments') {
      query.set('department', params.department);
    }
    if (params.status && params.status.toLowerCase() !== 'all') {
      query.set('status', params.status);
    }
    if (params.priority && params.priority.toLowerCase() !== 'all') {
      query.set('priority', params.priority);
    }
    if (params.risk && params.risk.toLowerCase() !== 'all') {
      query.set('risk', params.risk);
    }
    if (params.sortBy) query.set('sort_by', params.sortBy);
    if (params.sortOrder) query.set('sort_order', params.sortOrder);
    if (params.page) query.set('page', params.page.toString());
    if (params.pageSize) query.set('page_size', params.pageSize.toString());
    if (params.includeArchived) query.set('include_archived', 'true');

    const queryString = query.toString();
    const endpoint = queryString ? `/projects?${queryString}` : '/projects';
    return authenticatedFetch<ProjectListResponse>(endpoint);
  },

  /**
   * Retrieves high-level project KPI counts (total, active, onTrack, atRisk).
   */
  async getProjectStats(): Promise<ProjectStatsResponse> {
    return authenticatedFetch<ProjectStatsResponse>('/projects/stats');
  },

  /**
   * Retrieves comprehensive project profile with requirements, team allocations, and milestones.
   */
  async getProjectById(id: string): Promise<Project> {
    return authenticatedFetch<Project>(`/projects/${encodeURIComponent(id)}`);
  },

  /**
   * Provisions a new project record with initial requirements and milestones.
   */
  async createProject(payload: CreateProjectInput): Promise<Project> {
    return authenticatedFetch<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Updates permitted attributes of an existing project.
   */
  async updateProject(id: string, payload: Partial<Project>): Promise<Project> {
    return authenticatedFetch<Project>(`/projects/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Soft-archives a project to preserve past allocations and delivery history.
   */
  async archiveProject(id: string): Promise<{ message: string; id: string; status: string }> {
    return authenticatedFetch<{ message: string; id: string; status: string }>(
      `/projects/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
  },

  /**
   * Allocates a workspace employee to a project team.
   */
  async addTeamMember(
    projectId: string,
    payload: { id: string; role?: string; allocationPercent?: number; teamFit?: number }
  ): Promise<Project> {
    return authenticatedFetch<Project>(`/projects/${encodeURIComponent(projectId)}/team`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Releases an employee from a project team assignment.
   */
  async removeTeamMember(projectId: string, employeeId: string): Promise<Project> {
    return authenticatedFetch<Project>(
      `/projects/${encodeURIComponent(projectId)}/team/${encodeURIComponent(employeeId)}`,
      { method: 'DELETE' }
    );
  },
};
