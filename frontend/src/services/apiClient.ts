/**
 * NEXAWIS Frontend - Authenticated API Client.
 * Automatically injects verified Clerk session Bearer tokens and active X-Workspace-Id
 * headers for all requests sent to the FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// In-memory or localStorage cache for active workspace tenant ID
let activeWorkspaceId: string | null = localStorage.getItem('nexawis_active_workspace_id');

export function setActiveWorkspaceId(workspaceId: string | null): void {
  activeWorkspaceId = workspaceId;
  if (workspaceId) {
    localStorage.setItem('nexawis_active_workspace_id', workspaceId);
  } else {
    localStorage.removeItem('nexawis_active_workspace_id');
  }
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
 */
export async function authenticatedFetch<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, workspaceId, headers: customHeaders, ...rest } = options;

  const headers = new Headers(customHeaders || {});
  headers.set('Content-Type', 'application/json');

  // 1. Attach Bearer token if provided or from global Clerk session
  const authToken = token || (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string> } } })?.Clerk?.session ? await (window as unknown as { Clerk: { session: { getToken: () => Promise<string> } } }).Clerk.session.getToken() : null;
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
    let errorPayload;
    try {
      errorPayload = await response.json();
    } catch {
      errorPayload = { message: response.statusText };
    }
    const error = new Error(errorPayload.error?.message || errorPayload.message || 'API request failed');
    (error as unknown as { status: number; payload: unknown }).status = response.status;
    (error as unknown as { status: number; payload: unknown }).payload = errorPayload;
    throw error;
  }

  return response.json() as Promise<T>;
}
