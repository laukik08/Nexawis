/**
 * NEXAWIS Frontend - Authentication Context & Session Synchronization.
 * Seamlessly integrates Clerk React authentication with the FastAPI backend,
 * managing session tokens, user provisioning, active workspace tenancy, and RBAC permissions.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser, useClerk } from '@clerk/clerk-react';
import { setTokenGetter, setActiveWorkspaceId, getActiveWorkspaceId } from '../services/apiClient';
import { authService } from '../services/authService';
import type {
  BackendUserProfile,
  WorkspaceBrief,
  AuthMeResponse,
} from '../services/authService';


export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  title?: string;
  department?: string;
  avatarUrl?: string;
  avatarInitials?: string;
}

interface AuthContextType {
  user: User | null;
  backendProfile: BackendUserProfile | null;
  workspaces: WorkspaceBrief[];
  activeWorkspaceId: string | null;
  activeWorkspaceRole: string | null;
  permissions: string[];
  loading: boolean;
  isSignedIn: boolean;
  error: string | null;
  login: (email?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: clerkLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const clerk = useClerk();

  const [user, setUser] = useState<User | null>(null);
  const [backendProfile, setBackendProfile] = useState<BackendUserProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceBrief[]>([]);
  const [activeWorkspaceId, setActiveWsId] = useState<string | null>(getActiveWorkspaceId());
  const [activeWorkspaceRole, setActiveWorkspaceRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Wire Clerk token retriever into apiClient for all authenticated requests
  useEffect(() => {
    if (isSignedIn && getToken) {
      setTokenGetter(async () => {
        try {
          return await getToken();
        } catch {
          return null;
        }
      });
    } else {
      setTokenGetter(null);
    }
  }, [isSignedIn, getToken]);

  // 2. Fetch or synchronize backend user profile and workspace context
  const loadUserProfile = useCallback(async () => {
    if (!isSignedIn) {
      setUser(null);
      setBackendProfile(null);
      setWorkspaces([]);
      setActiveWsId(null);
      setActiveWorkspaceId(null);
      setActiveWorkspaceRole(null);
      setPermissions([]);
      setSyncLoading(false);
      return;
    }

    try {
      setSyncLoading(true);
      setError(null);

      const meResponse: AuthMeResponse = await authService.getMyProfile();

      setBackendProfile(meResponse.user);
      setWorkspaces(meResponse.workspaces);
      setActiveWsId(meResponse.active_workspace_id);
      setActiveWorkspaceId(meResponse.active_workspace_id);
      setActiveWorkspaceRole(meResponse.active_workspace_role);
      setPermissions(meResponse.permissions);

      const resolvedName =
        meResponse.user.full_name ||
        clerkUser?.fullName ||
        clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
        'NEXAWIS User';

      const initials =
        resolvedName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'NW';

      setUser({
        id: meResponse.user.id,
        name: resolvedName,
        email: meResponse.user.email || clerkUser?.primaryEmailAddress?.emailAddress || '',
        role: meResponse.user.role,
        title: meResponse.user.title || '',
        department: meResponse.user.department || '',
        avatarUrl: meResponse.user.avatar_url || clerkUser?.imageUrl,
        avatarInitials: initials,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to synchronize user session';
      setError(message);

      // Graceful fallback to Clerk claims if backend is temporarily offline
      if (clerkUser) {
        const fullName =
          clerkUser.fullName ||
          clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] ||
          'NEXAWIS User';
        setUser({
          id: clerkUser.id,
          name: fullName,
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          role: 'project_manager',
          avatarUrl: clerkUser.imageUrl,
          avatarInitials: fullName.slice(0, 2).toUpperCase(),
        });
      }
    } finally {
      setSyncLoading(false);
    }
  }, [isSignedIn, clerkUser]);

  useEffect(() => {
    if (clerkLoaded) {
      loadUserProfile();
    }
  }, [clerkLoaded, isSignedIn, clerkUser?.id, loadUserProfile]);

  // 3. Listen for unauthorized events to prevent redirect loops and gracefully refresh
  useEffect(() => {
    const handleUnauthorized = () => {
      // Clear workspace header on permission failure
      console.warn('Authentication token expired or rejected by backend.');
    };
    window.addEventListener('nexawis:auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('nexawis:auth_unauthorized', handleUnauthorized);
  }, []);

  // 4. Listen to profile updates emitted by settingsService
  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        setUser((prev) => (prev ? { ...prev, ...customEvent.detail } : null));
      }
    };

    window.addEventListener('nexawis:profile_updated', handleProfileUpdated);
    return () => window.removeEventListener('nexawis:profile_updated', handleProfileUpdated);
  }, []);

  const switchWorkspace = async (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    setActiveWsId(workspaceId);
    await loadUserProfile();
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  const login = async () => {
    clerk.openSignIn();
  };

  const logout = async () => {
    await clerk.signOut();
    setUser(null);
    setBackendProfile(null);
    setWorkspaces([]);
    setActiveWsId(null);
    setActiveWorkspaceId(null);
    setActiveWorkspaceRole(null);
    setPermissions([]);
  };

  const loading = !clerkLoaded || (isSignedIn && syncLoading && !user);

  return (
    <AuthContext.Provider
      value={{
        user,
        backendProfile,
        workspaces,
        activeWorkspaceId,
        activeWorkspaceRole,
        permissions,
        loading,
        isSignedIn: !!isSignedIn,
        error,
        login,
        logout,
        updateUser,
        switchWorkspace,
        refetchProfile: loadUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
