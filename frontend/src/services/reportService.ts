import { 
  initialMockReports, 
  initialScheduledReports, 
  mockReportCategories, 
  mockReportKpis 
} from '../data/mockReports';
import type { 
  ReportRecord, 
  ReportConfig, 
  ScheduledReportDef, 
  ReportKpiMetrics, 
  ReportCategoryDef,
  ReportLibraryFilters
} from '../types/reports';
import { buildReportFromConfig } from '../utils/reportBuilder';
import { mockEmployees } from '../data/mockEmployees';
import { mockProjects } from '../data/mockProjects';

const STORAGE_REPORTS_KEY = 'nexawis_reports_v1';
const STORAGE_SCHEDULES_KEY = 'nexawis_schedules_v1';

function loadReportsFromStorage(): ReportRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_REPORTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return initialMockReports;
}

function persistReports(reports: ReportRecord[]) {
  try {
    localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(reports));
  } catch (e) {
    console.warn('Could not persist reports to storage:', e);
  }
}

function loadSchedulesFromStorage(): ScheduledReportDef[] {
  try {
    const raw = localStorage.getItem(STORAGE_SCHEDULES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return initialScheduledReports;
}

function persistSchedules(schedules: ScheduledReportDef[]) {
  try {
    localStorage.setItem(STORAGE_SCHEDULES_KEY, JSON.stringify(schedules));
  } catch (e) {
    console.warn('Could not persist schedules to storage:', e);
  }
}

let reportsCache: ReportRecord[] = loadReportsFromStorage();
let schedulesCache: ScheduledReportDef[] = loadSchedulesFromStorage();

export const reportService = {
  /**
   * Get report overview KPI counters
   */
  async getReportKpis(): Promise<ReportKpiMetrics> {
    await new Promise(r => setTimeout(r, 60));
    const reports = reportsCache;
    const scheduled = schedulesCache;
    const latest = reports.length > 0 ? reports[0] : null;

    return {
      totalReports: reports.length,
      reportsGenerated: mockReportKpis.reportsGenerated + (reports.length - initialMockReports.length),
      scheduledReports: scheduled.filter(s => s.enabled).length,
      latestReportDate: latest ? latest.createdAt.slice(0, 10) : '2026-10-18',
      latestReportName: latest ? latest.name : 'Executive Intelligence Brief'
    };
  },

  /**
   * Get all report category definitions
   */
  async getCategories(): Promise<ReportCategoryDef[]> {
    return mockReportCategories;
  },

  /**
   * Get department and project dropdown options
   */
  async getFilterOptions(): Promise<{ departments: string[]; projects: Array<{ id: string; name: string }> }> {
    const depts = Array.from(new Set(mockEmployees.map(e => e.department))).sort();
    const projs = mockProjects.map(p => ({ id: p.id, name: p.name }));
    return {
      departments: ['All', ...depts],
      projects: [{ id: 'All', name: 'All Projects' }, ...projs]
    };
  },

  /**
   * Get list of reports with optional filtering & sorting
   */
  async getReports(filters?: Partial<ReportLibraryFilters>): Promise<ReportRecord[]> {
    await new Promise(r => setTimeout(r, 90));
    let list = [...reportsCache];

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
  },

  /**
   * Retrieve single report record by ID
   */
  async getReportById(id: string): Promise<ReportRecord | undefined> {
    await new Promise(r => setTimeout(r, 40));
    return reportsCache.find(r => r.id === id);
  },

  /**
   * Generate a new demonstration report and append to library
   */
  async generateReport(config: ReportConfig): Promise<ReportRecord> {
    // Simulate generation latency (450ms)
    await new Promise(r => setTimeout(r, 450));
    const newReport = buildReportFromConfig(config);
    reportsCache = [newReport, ...reportsCache];
    persistReports(reportsCache);
    return newReport;
  },

  /**
   * Delete a report from the library
   */
  async deleteReport(id: string): Promise<boolean> {
    await new Promise(r => setTimeout(r, 80));
    const beforeCount = reportsCache.length;
    reportsCache = reportsCache.filter(r => r.id !== id);
    persistReports(reportsCache);
    return reportsCache.length < beforeCount;
  },

  /**
   * Duplicate report configuration
   */
  async duplicateReport(id: string): Promise<ReportRecord | null> {
    const existing = reportsCache.find(r => r.id === id);
    if (!existing) return null;

    const duplicatedConfig: ReportConfig = {
      ...existing.config,
      title: `${existing.name} (Copy)`
    };

    return this.generateReport(duplicatedConfig);
  },

  /**
   * Get all demonstration scheduled reports
   */
  async getScheduledReports(): Promise<ScheduledReportDef[]> {
    await new Promise(r => setTimeout(r, 50));
    return schedulesCache;
  },

  /**
   * Save or update a demonstration scheduled report
   */
  async saveScheduledReport(schedule: Omit<ScheduledReportDef, 'id' | 'createdAt'> & { id?: string }): Promise<ScheduledReportDef> {
    await new Promise(r => setTimeout(r, 120));
    const id = schedule.id || `SCHED-0${schedulesCache.length + 1}`;
    const timestamp = new Date().toISOString();

    const fullSchedule: ScheduledReportDef = {
      ...schedule,
      id,
      createdAt: timestamp
    };

    const existingIndex = schedulesCache.findIndex(s => s.id === id);
    if (existingIndex >= 0) {
      schedulesCache[existingIndex] = fullSchedule;
    } else {
      schedulesCache = [fullSchedule, ...schedulesCache];
    }

    persistSchedules(schedulesCache);
    return fullSchedule;
  },

  /**
   * Toggle enabled status of a scheduled report
   */
  async toggleScheduleEnabled(id: string): Promise<ScheduledReportDef | undefined> {
    await new Promise(r => setTimeout(r, 50));
    const item = schedulesCache.find(s => s.id === id);
    if (item) {
      item.enabled = !item.enabled;
      persistSchedules(schedulesCache);
      return { ...item };
    }
    return undefined;
  }
};
