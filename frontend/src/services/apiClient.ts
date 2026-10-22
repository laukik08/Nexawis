/**
 * NEXAWIS Frontend - Authenticated API Client.
 * Automatically injects verified Clerk session Bearer tokens and active X-Workspace-Id
 * headers for all requests sent to the FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// In-memory or localStorage cache for active workspace tenant ID
let activeWorkspaceId: string | null = null;
try {
  if (typeof localStorage !== 'undefined') {
    activeWorkspaceId = localStorage.getItem('nexawis_active_workspace_id');
  }
} catch {}

export function setActiveWorkspaceId(workspaceId: string | null): void {
  activeWorkspaceId = workspaceId;
  try {
    if (typeof localStorage !== 'undefined') {
      if (workspaceId) {
        localStorage.setItem('nexawis_active_workspace_id', workspaceId);
      } else {
        localStorage.removeItem('nexawis_active_workspace_id');
      }
    }
  } catch {}
}

let tokenGetter: (() => Promise<string | null>) | null = null;

/**
 * Registers an active session token provider (e.g. from Clerk React useAuth).
 */
export function setTokenGetter(getter: (() => Promise<string | null>) | null): void {
  tokenGetter = getter;
}

export function getActiveWorkspaceId(): string | null {
  return activeWorkspaceId;
}

export interface RequestOptions extends RequestInit {
  token?: string | null;
  workspaceId?: string | null;
}

/**
 * Standard authenticated fetch wrapper attaching Clerk Bearer tokens and tenant header.
 * Never leaks raw tokens to logs, errors, or storage.
 */
export async function authenticatedFetch<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, workspaceId, headers: customHeaders, ...rest } = options;

  const headers = new Headers(customHeaders || {});
  headers.set('Content-Type', 'application/json');

  // 1. Resolve Bearer token safely
  let authToken = token || null;
  if (!authToken && tokenGetter) {
    try {
      authToken = await tokenGetter();
    } catch {
      // In-flight token refresh error; will fall through to unauthenticated request or error
    }
  }

  // Fallback to window.Clerk if available
  if (!authToken) {
    try {
      const clerkWindow = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } })?.Clerk;
      if (clerkWindow?.session?.getToken) {
        authToken = await clerkWindow.session.getToken();
      }
    } catch {
      // Fallback failed quietly
    }
  }

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  // 2. Attach Workspace isolation header if present
  const currentWsId = workspaceId || activeWorkspaceId;
  if (currentWsId) {
    headers.set('X-Workspace-Id', currentWsId);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers,
    ...rest,
  });

  if (!response.ok) {
    let errorPayload: Record<string, unknown> = {};
    try {
      errorPayload = (await response.json()) as Record<string, unknown>;
    } catch {
      errorPayload = { message: response.statusText };
    }

    const errorDetail =
      (errorPayload.error as { message?: string })?.message ||
      (typeof errorPayload.detail === 'string' ? errorPayload.detail : null) ||
      (typeof errorPayload.message === 'string' ? errorPayload.message : null) ||
      `HTTP Error ${response.status}`;

    const error = new Error(errorDetail);
    (error as unknown as { status: number; payload: unknown }).status = response.status;
    (error as unknown as { status: number; payload: unknown }).payload = errorPayload;

    if (response.status === 401) {
      // Emit event for state synchronization without triggering infinite loops
      window.dispatchEvent(new CustomEvent('nexawis:auth_unauthorized', { detail: { status: 401 } }));
    }

    throw error;
  }

  return response.json() as Promise<T>;
}

