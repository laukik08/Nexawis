/**
 * NEXAWIS Frontend - Employee Service.
 * Connects the Employees module to persistent, workspace-isolated FastAPI endpoints.
 */

import { authenticatedFetch } from './apiClient';
import type {
  Employee,
  EmployeeListResponse,
  EmployeeStatsResponse,
  EmployeeFilterParams,
  EmployeeCreatePayload,
} from '../types/employee';

export const employeeService = {
  /**
   * Retrieves paginated, filtered, and sorted employee directory records for the active workspace.
   */
  async getEmployees(params: EmployeeFilterParams = {}): Promise<EmployeeListResponse> {
    const query = new URLSearchParams();

    if (params.search) query.set('search', params.search);
    if (params.department && params.department.toLowerCase() !== 'all') {
      query.set('department', params.department);
    }
    if (params.role && params.role.toLowerCase() !== 'all') {
      query.set('role', params.role);
    }
    if (params.status && params.status.toLowerCase() !== 'all') {
      query.set('status', params.status);
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
    const endpoint = queryString ? `/employees?${queryString}` : '/employees';
    return authenticatedFetch<EmployeeListResponse>(endpoint);
  },

  /**
   * Retrieves quick organizational capacity stats (total, active, available, at_risk)
   * for the active workspace.
   */
  async getEmployeeStats(): Promise<EmployeeStatsResponse> {
    return authenticatedFetch<EmployeeStatsResponse>('/employees/stats');
  },

  /**
   * Retrieves comprehensive employee profile by ID or employee code.
   */
  async getEmployeeById(id: string): Promise<Employee> {
    return authenticatedFetch<Employee>(`/employees/${encodeURIComponent(id)}`);
  },

  /**
   * Creates a new employee profile in the active workspace.
   */
  async createEmployee(payload: EmployeeCreatePayload): Promise<Employee> {
    return authenticatedFetch<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Updates permitted attributes of an existing employee record.
   */
  async updateEmployee(id: string, payload: Partial<EmployeeCreatePayload>): Promise<Employee> {
    return authenticatedFetch<Employee>(`/employees/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Archives/deactivates an employee to preserve audit history and past project allocations.
   */
  async archiveEmployee(id: string): Promise<{ message: string; id: string; status: string }> {
    return authenticatedFetch<{ message: string; id: string; status: string }>(
      `/employees/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
  },
};
