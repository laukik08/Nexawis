import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { EmployeeFilters } from '../../components/employees/EmployeeFilters';
import { EmployeeTable } from '../../components/employees/EmployeeTable';
import { EmployeeCards } from '../../components/employees/EmployeeCards';
import { AddEmployeeModal } from '../../components/employees/AddEmployeeModal';
import { employeeService } from '../../services/employeeService';
import type { Employee, EmployeeStatsResponse } from '../../types/employee';

export function EmployeesIndex() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStatsResponse>({
    total: 0,
    active: 0,
    available: 0,
    atRisk: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search State
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [risk, setRisk] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch Stats
  const loadStats = useCallback(async () => {
    try {
      const statsData = await employeeService.getEmployeeStats();
      setStats(statsData);
    } catch (err: unknown) {
      console.warn('Could not fetch employee stats:', err);
    }
  }, []);

  // Fetch Directory Data
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await employeeService.getEmployees({
        search: search.trim() || undefined,
        department: department || undefined,
        role: role || undefined,
        status: status || undefined,
        risk: risk || undefined,
        page,
        pageSize,
      });

      setEmployees(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.total);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to load employees from the server.';
      setError(msg);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [search, department, role, status, risk, page, pageSize]);

  // Initial load and filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmployees();
    }, 200); // 200ms debounce
    return () => clearTimeout(timer);
  }, [loadEmployees]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleClearFilters = () => {
    setSearch('');
    setDepartment('');
    setRole('');
    setStatus('');
    setRisk('');
    setPage(1);
  };

  const handleAddEmployeeSuccess = (newEmp: Employee) => {
    // Add to current view or reload list & stats
    setEmployees(prev => [newEmp, ...prev]);
    loadEmployees();
    loadStats();
  };

  const fromRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRecord = Math.min(page * pageSize, totalCount);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-[--color-text-primary] mb-2">
            Employees
          </h1>
          <p className="text-[--color-text-secondary] max-w-lg text-sm">
            Understand your workforce through skills, performance, capacity, and wellbeing.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            data-cursor="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 btn-primary px-6 py-2.5 rounded-xl font-bold cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[--color-surface-1] border border-[--color-border-subtle] rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-1">Total Employees</div>
          <div className="text-2xl font-display font-bold text-[--color-text-primary]">{stats.total}</div>
        </div>
        <div className="bg-[--color-surface-1] border border-[--color-border-subtle] rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-1">Active</div>
          <div className="text-2xl font-display font-bold text-[--color-text-primary]">{stats.active}</div>
        </div>
        <div className="bg-[--color-surface-1] border border-[--color-border-subtle] rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-1">Available</div>
          <div className="text-2xl font-display font-bold text-[--color-accent-cyan]">{stats.available}</div>
        </div>
        <div className="bg-[--color-surface-1] border border-[--color-border-subtle] rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-1">At Risk</div>
          <div className="text-2xl font-display font-bold text-red-400">{stats.atRisk}</div>
        </div>
      </div>

      {/* Main Directory Area */}
      <EmployeeFilters 
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        department={department}
        onDepartmentChange={(v) => { setDepartment(v); setPage(1); }}
        role={role}
        onRoleChange={(v) => { setRole(v); setPage(1); }}
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
        risk={risk}
        onRiskChange={(v) => { setRisk(v); setPage(1); }}
        onClearFilters={handleClearFilters}
      />

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button 
            onClick={() => { loadEmployees(); loadStats(); }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:text-white text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton / Indicator */}
      {loading ? (
        <div className="card-base p-16 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-[--color-accent-cyan] animate-spin" />
          <p className="text-sm text-[--color-text-secondary] font-medium">Loading workforce records...</p>
        </div>
      ) : employees.length === 0 ? (
        /* Empty State */
        <div className="card-base p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[--color-surface-2] border border-[--color-border-subtle] flex items-center justify-center text-[--color-text-muted]">
            <UserPlus className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[--color-text-primary] mb-1">No employees found</h3>
            <p className="text-sm text-[--color-text-secondary] max-w-sm">
              {search || department || role || status || risk 
                ? "No employees match your search and filter criteria. Try adjusting your filters." 
                : "No employee records have been onboarded to this workspace yet."}
            </p>
          </div>
          <div className="flex space-x-3">
            {(search || department || role || status || risk) && (
              <button 
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-xl border border-[--color-border-strong] text-sm font-bold text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
              >
                Clear Filters
              </button>
            )}
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary px-5 py-2 rounded-xl text-sm font-bold"
            >
              Add First Employee
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table & Mobile Cards */}
          <EmployeeTable employees={employees} />
          <EmployeeCards employees={employees} />
        </>
      )}

      {/* Pagination Controls */}
      <div className="mt-8 flex items-center justify-between border-t border-[--color-border-subtle] pt-6">
        <div className="text-sm text-[--color-text-secondary]">
          Showing <span className="font-bold text-[--color-text-primary]">{fromRecord}</span> to <span className="font-bold text-[--color-text-primary]">{toRecord}</span> of <span className="font-bold text-[--color-text-primary]">{totalCount}</span> employees
        </div>
        <div className="flex space-x-2">
          <button 
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 border border-[--color-border-strong] rounded-lg text-sm font-bold text-[--color-text-primary] disabled:text-[--color-text-muted] disabled:cursor-not-allowed hover:bg-[--color-surface-2] transition-colors"
          >
            Previous
          </button>
          <button 
            disabled={page >= totalPages || loading}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-4 py-2 border border-[--color-border-strong] rounded-lg text-sm font-bold text-[--color-text-primary] disabled:text-[--color-text-muted] disabled:cursor-not-allowed hover:bg-[--color-surface-2] transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddEmployeeSuccess}
      />

    </div>
  );
}
