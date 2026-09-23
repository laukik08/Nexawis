import { EmployeeFilters } from '../../components/employees/EmployeeFilters';
import { EmployeeTable } from '../../components/employees/EmployeeTable';
import { EmployeeCards } from '../../components/employees/EmployeeCards';
import { mockEmployees } from '../../data/mockEmployees';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';

export function EmployeesIndex() {
  const [employees] = useState(mockEmployees);

  // Quick stats derived from mock data
  const total = employees.length;
  const available = employees.filter(e => e.status === 'Available').length;
  const atRisk = employees.filter(e => e.wellbeingRisk === 'High').length;

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
            className="flex items-center space-x-2 bg-[--color-text-primary] text-[--color-bg-base] hover:bg-[--color-text-secondary] px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-[--color-text-primary]/10"
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
          <div className="text-2xl font-display font-bold text-[--color-text-primary]">{total}</div>
        </div>
        <div className="bg-[--color-surface-1] border border-[--color-border-subtle] rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-1">Active</div>
          <div className="text-2xl font-display font-bold text-[--color-text-primary]">{total - employees.filter(e => e.status === 'On Leave').length}</div>
        </div>
        <div className="bg-[--color-surface-1] border border-[--color-border-subtle] rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-1">Available</div>
          <div className="text-2xl font-display font-bold text-[--color-accent-cyan]">{available}</div>
        </div>
        <div className="bg-[--color-surface-1] border border-[--color-border-subtle] rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-1">At Risk</div>
          <div className="text-2xl font-display font-bold text-red-400">{atRisk}</div>
        </div>
      </div>

      {/* Main Directory Area */}
      <EmployeeFilters />
      
      {/* Desktop Table & Mobile Cards */}
      <EmployeeTable employees={employees} />
      <EmployeeCards employees={employees} />

      {/* Pagination Placeholder */}
      <div className="mt-8 flex items-center justify-between border-t border-[--color-border-subtle] pt-6">
        <div className="text-sm text-[--color-text-secondary]">
          Showing <span className="font-bold text-[--color-text-primary]">1</span> to <span className="font-bold text-[--color-text-primary]">{total}</span> of <span className="font-bold text-[--color-text-primary]">{total}</span> employees
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 border border-[--color-border-strong] rounded-lg text-sm font-bold text-[--color-text-muted] cursor-not-allowed">
            Previous
          </button>
          <button className="px-4 py-2 border border-[--color-border-strong] rounded-lg text-sm font-bold text-[--color-text-muted] cursor-not-allowed">
            Next
          </button>
        </div>
      </div>

    </div>
  );
}
