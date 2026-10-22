/**
 * NEXAWIS Frontend - Demo Workspace Management Service.
 * Provides client methods to inspect demo readiness, trigger deterministic reseeding,
 * or reset the presentation environment.
 */

import { authenticatedFetch } from './apiClient';

export interface DemoWorkspaceStatus {
  is_seeded: boolean;
  workspace_id: string;
  workspace_name: string;
  employees_count: number;
  projects_count: number;
  reports_count: number;
  team_formations_count: number;
  allocations_count: number;
  is_current_user_enrolled: boolean;
}

export interface DemoActionResponse {
  success: boolean;
  message: string;
  workspace_id: string;
  summary: Record<string, unknown>;
}

export const demoService = {
  /**
   * Retrieves the current demo workspace readiness status and record counts.
   */
  async getStatus(): Promise<DemoWorkspaceStatus> {
    return authenticatedFetch<DemoWorkspaceStatus>('/demo/status');
  },

  /**
   * Seeds or reseeds the dedicated enterprise demo workspace.
   */
  async seedWorkspace(): Promise<DemoActionResponse> {
    return authenticatedFetch<DemoActionResponse>('/demo/seed', {
      method: 'POST',
    });
  },

  /**
   * Resets the demo workspace to its pristine baseline state.
   */
  async resetWorkspace(): Promise<DemoActionResponse> {
    return authenticatedFetch<DemoActionResponse>('/demo/reset', {
      method: 'POST',
    });
  },

  /**
   * Explicitly enrolls the current authenticated user into the demo workspace.
   */
  async enrollCurrentUser(): Promise<DemoActionResponse> {
    return authenticatedFetch<DemoActionResponse>('/demo/enroll', {
      method: 'POST',
    });
  },
};
