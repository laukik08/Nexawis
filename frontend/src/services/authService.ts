/**
 * NEXAWIS Frontend - Authentication and Profile Service.
 * Interfaces with FastAPI /api/v1/auth routes to retrieve verified profile,
 * synchronize Clerk identity, and manage workspace tenant switches.
 */

import { authenticatedFetch, setActiveWorkspaceId } from './apiClient';

export interface BackendUserProfile {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string;
  role: string;
  title?: string;
  department?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface WorkspaceBrief {
  id: string;
  name: string;
  slug: string;
  role: string;
  is_active: boolean;
}

export interface AuthMeResponse {
  user: BackendUserProfile;
  workspaces: WorkspaceBrief[];
  active_workspace_id: string;
  active_workspace_role: string;
  permissions: string[];
}

export interface ProfileSyncPayload {
  email?: string;
  full_name?: string;
  avatar_url?: string;
  title?: string;
  department?: string;
}

export interface CreateWorkspacePayload {
  name: string;
  slug?: string;
  description?: string;
}

export const authService = {
  /**
   * Fetches the current authenticated user's profile and workspace memberships.
   */
  async getMyProfile(token?: string): Promise<AuthMeResponse> {
    const data = await authenticatedFetch<AuthMeResponse>('/auth/me', { token });
    if (data.active_workspace_id) {
      setActiveWorkspaceId(data.active_workspace_id);
    }
    return data;
  },

  /**
   * Synchronizes fresh user profile details from Clerk.
   */
  async syncProfile(payload: ProfileSyncPayload, token?: string): Promise<BackendUserProfile> {
    return authenticatedFetch<BackendUserProfile>('/auth/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    });
  },

  /**
   * Lists all workspaces where the authenticated user is an active member.
   */
  async listWorkspaces(token?: string): Promise<WorkspaceBrief[]> {
    return authenticatedFetch<WorkspaceBrief[]>('/auth/workspaces', { token });
  },

  /**
   * Provisions a new workspace tenant partition with the user as Owner.
   */
  async createWorkspace(payload: CreateWorkspacePayload, token?: string): Promise<WorkspaceBrief> {
    return authenticatedFetch<WorkspaceBrief>('/auth/workspaces', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    });
  },
};
