/**
 * NEXAWIS Frontend - Reporting and Export Service.
 * Connects the Reporting center directly to workspace-scoped FastAPI endpoints,
 * supporting vector PDF streaming, formula-safe CSV export, and live report generation.
 * Enforces production mock-data isolation with opt-in demo mode fallback.
 */

import { authenticatedFetch, getActiveWorkspaceId } from './apiClient';
import type { 
  ReportRecord, 
  ReportConfig, 
  ScheduledReportDef, 
  ReportKpiMetrics, 
  ReportCategoryDef,
  ReportLibraryFilters
} from '../types/reports';
import { 
  initialMockReports, 
  initialScheduledReports, 
  mockReportCategories, 
  mockReportKpis 
} from '../data/mockReports';
import { buildReportFromConfig } from '../utils/reportBuilder';
import { mockEmployees } from '../data/mockEmployees';
import { mockProjects } from '../data/mockProjects';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

let demoModeOverride: boolean | null = null;

export function setDemoModeOverride(enabled: boolean | null): void {
  demoModeOverride = enabled;
}

export function isDemoModeActive(): boolean {
  if (demoModeOverride !== null) {
    return demoModeOverride;
  }
  const isEnvDemo = typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_DEMO_MODE === 'true';
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    if (localStorage.getItem('nexawis_demo_mode') === 'true') {
      return true;
    }
  }
  return isEnvDemo;
}

// Local demo fallback caches
let demoReportsCache: ReportRecord[] = [...initialMockReports];
let demoSchedulesCache: ScheduledReportDef[] = [...initialScheduledReports];

export const reportService = {
  /**
   * Get report overview KPI counters from backend API
   */
  async getReportKpis(): Promise<ReportKpiMetrics> {
    try {
      return await authenticatedFetch<ReportKpiMetrics>('/reports/kpis');
    } catch (err) {
      if (isDemoModeActive()) {
        console.warn('Backend /reports/kpis failed; using demo fallback because demo mode is active:', err);
        const reports = demoReportsCache;
        const scheduled = demoSchedulesCache;
        const latest = reports.length > 0 ? reports[0] : null;
        return {
          totalReports: reports.length,
          reportsGenerated: mockReportKpis.reportsGenerated + (reports.length - initialMockReports.length),
          scheduledReports: scheduled.filter(s => s.enabled).length,
          latestReportDate: latest ? latest.createdAt.slice(0, 10) : '2026-10-18',
          latestReportName: latest ? latest.name : 'Executive Intelligence Brief'
        };
      }
      throw err;
    }
  },

  /**
   * Get all report category definitions
   */
  async getCategories(): Promise<ReportCategoryDef[]> {
    try {
      return await authenticatedFetch<ReportCategoryDef[]>('/reports/categories');
    } catch (err) {
      if (isDemoModeActive()) {
        return mockReportCategories;
      }
      throw err;
    }
  },

  /**
   * Get department and project dropdown options
   */
  async getFilterOptions(): Promise<{ departments: string[]; projects: Array<{ id: string; name: string }> }> {
    try {
      return await authenticatedFetch<{ departments: string[]; projects: Array<{ id: string; name: string }> }>('/reports/filter-options');
    } catch (err) {
      if (isDemoModeActive()) {
        const depts = Array.from(new Set(mockEmployees.map(e => e.department))).sort();
        const projs = mockProjects.map(p => ({ id: p.id, name: p.name }));
        return {
          departments: ['All', ...depts],
          projects: [{ id: 'All', name: 'All Projects' }, ...projs]
        };
      }
      throw err;
    }
  },

  /**
   * Get list of reports with optional filtering & sorting
   */
  async getReports(filters?: Partial<ReportLibraryFilters>): Promise<ReportRecord[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.category && filters.category !== 'All') {
        params.set('category', filters.category);
      }
      if (filters?.searchQuery) {
        params.set('search', filters.searchQuery);
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/reports/?${queryString}` : '/reports/';
      let list = await authenticatedFetch<ReportRecord[]>(endpoint);

      // Apply client-side sorting and secondary status filter
      if (filters) {
        if (filters.status && filters.status !== 'All') {
          list = list.filter(r => r.status === filters.status);
        }
        if (filters.sortBy) {
          list.sort((a, b) => {
            if (filters.sortBy === 'date-desc') {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            if (filters.sortBy === 'date-asc') {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }
            if (filters.sortBy === 'name-asc') {
              return a.name.localeCompare(b.name);
            }
            if (filters.sortBy === 'category-asc') {
              return a.category.localeCompare(b.category);
            }
            return 0;
          });
        }
      }

      return list;
    } catch (err) {
      if (isDemoModeActive()) {
        console.warn('Backend /reports/ failed; using demo fallback because demo mode is active:', err);
        let list = [...demoReportsCache];
        if (filters) {
          if (filters.searchQuery) {
            const q = filters.searchQuery.toLowerCase();
            list = list.filter(r => 
              r.name.toLowerCase().includes(q) ||
              r.id.toLowerCase().includes(q) ||
              r.createdBy.toLowerCase().includes(q)
            );
          }
          if (filters.category && filters.category !== 'All') {
            list = list.filter(r => r.category === filters.category);
          }
          if (filters.status && filters.status !== 'All') {
            list = list.filter(r => r.status === filters.status);
          }
        }
        return list;
      }
      throw err;
    }
  },

  /**
   * Retrieve single report record by ID
   */
  async getReportById(id: string): Promise<ReportRecord | undefined> {
    try {
      return await authenticatedFetch<ReportRecord>(`/reports/${encodeURIComponent(id)}`);
    } catch (err) {
      if (isDemoModeActive()) {
        return demoReportsCache.find(r => r.id === id);
      }
      throw err;
    }
  },

  /**
   * Generate a new report and append to library
   */
  async generateReport(config: ReportConfig): Promise<ReportRecord> {
    try {
      return await authenticatedFetch<ReportRecord>('/reports/generate', {
        method: 'POST',
        body: JSON.stringify(config),
      });
    } catch (err) {
      if (isDemoModeActive()) {
        console.warn('Backend /reports/generate failed; using demo fallback because demo mode is active:', err);
        const newReport = buildReportFromConfig(config);
        demoReportsCache = [newReport, ...demoReportsCache];
        return newReport;
      }
      throw err;
    }
  },

  /**
   * Delete a report from the library
   */
  async deleteReport(id: string): Promise<boolean> {
    try {
      await authenticatedFetch<void>(`/reports/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      if (isDemoModeActive()) {
        const beforeCount = demoReportsCache.length;
        demoReportsCache = demoReportsCache.filter(r => r.id !== id);
        return demoReportsCache.length < beforeCount;
      }
      throw err;
    }
  },

  /**
   * Duplicate report configuration
   */
  async duplicateReport(id: string): Promise<ReportRecord | null> {
    try {
      return await authenticatedFetch<ReportRecord>(`/reports/${encodeURIComponent(id)}/duplicate`, {
        method: 'POST',
      });
    } catch (err) {
      if (isDemoModeActive()) {
        const existing = demoReportsCache.find(r => r.id === id);
        if (!existing) return null;
        const duplicatedConfig: ReportConfig = {
          ...existing.config,
          title: `${existing.name} (Copy)`
        };
        const newReport = buildReportFromConfig(duplicatedConfig);
        demoReportsCache = [newReport, ...demoReportsCache];
        return newReport;
      }
      throw err;
    }
  },

  /**
   * Get all scheduled reports
   */
  async getScheduledReports(): Promise<ScheduledReportDef[]> {
    try {
      return await authenticatedFetch<ScheduledReportDef[]>('/reports/scheduled/list');
    } catch (err) {
      if (isDemoModeActive()) {
        return demoSchedulesCache;
      }
      throw err;
    }
  },

  /**
   * Save or update a scheduled report
   */
  async saveScheduledReport(schedule: Omit<ScheduledReportDef, 'id' | 'createdAt'> & { id?: string }): Promise<ScheduledReportDef> {
    try {
      return await authenticatedFetch<ScheduledReportDef>('/reports/scheduled/create', {
        method: 'POST',
        body: JSON.stringify({
          name: schedule.name,
          category: schedule.category,
          frequency: schedule.frequency,
          recipients: schedule.recipients,
          enabled: schedule.enabled,
          format: schedule.format,
          department: schedule.department || 'All'
        }),
      });
    } catch (err) {
      if (isDemoModeActive()) {
        const id = schedule.id || `SCHED-0${demoSchedulesCache.length + 1}`;
        const timestamp = new Date().toISOString();
        const fullSchedule: ScheduledReportDef = {
          ...schedule,
          id,
          createdAt: timestamp
        };
        demoSchedulesCache = [fullSchedule, ...demoSchedulesCache];
        return fullSchedule;
      }
      throw err;
    }
  },

  /**
   * Toggle enabled status of a scheduled report
   */
  async toggleScheduleEnabled(id: string): Promise<ScheduledReportDef | undefined> {
    if (isDemoModeActive()) {
      const item = demoSchedulesCache.find(s => s.id === id);
      if (item) {
        item.enabled = !item.enabled;
        return { ...item };
      }
      return undefined;
    }
    // In backend, schedule update is handled via manage endpoint or future phase
    return undefined;
  },

  /**
   * Download binary PDF or sanitized CSV report from backend endpoint
   */
  async downloadReportFile(reportId: string, format: 'pdf' | 'csv' = 'pdf', fallbackTitle: string = 'nexawis_report'): Promise<void> {
    const url = `${API_BASE_URL}/reports/${encodeURIComponent(reportId)}/export?format=${format.toLowerCase()}`;
    
    // Obtain active token and workspace header
    let token: string | null = null;
    try {
      const clerkWindow = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } })?.Clerk;
      if (clerkWindow?.session?.getToken) {
        token = await clerkWindow.session.getToken();
      }
    } catch {
      // Ignored
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const wsId = getActiveWorkspaceId();
    if (wsId) {
      headers['X-Workspace-Id'] = wsId;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Export failed (${response.status}): ${errorText}`);
    }

    // Extract filename from Content-Disposition header if available
    let filename = `${fallbackTitle}.${format.toLowerCase()}`;
    const disposition = response.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename=["']?([^"';]+)["']?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }
};
