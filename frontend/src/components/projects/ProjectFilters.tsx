import { Search, SlidersHorizontal, X, Check, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ProjectFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatuses: string[];
  onToggleStatus: (status: string) => void;
  selectedPriorities: string[];
  onTogglePriority: (priority: string) => void;
  selectedRisks: string[];
  onToggleRisk: (risk: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onClearAll: () => void;
  activeFilterCount: number;
}

const ALL_STATUSES = ['Planning', 'Active', 'On Track', 'At Risk', 'Completed'];
const ALL_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const ALL_RISKS = ['Low', 'Medium', 'High'];
const ALL_DEPARTMENTS = [
  'All Departments',
  'Engineering',
  'Product',
  'Data Science',
  'Design',
  'Operations',
  'Internal IT'
];

export function ProjectFilters({
  searchQuery,
  onSearchChange,
  selectedStatuses,
  onToggleStatus,
  selectedPriorities,
  onTogglePriority,
  selectedRisks,
  onToggleRisk,
  selectedDepartment,
  onDepartmentChange,
  sortBy,
  onSortChange,
  onClearAll,
  activeFilterCount
}: ProjectFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="mb-6 space-y-3">
      {/* Top Bar: Search Input & Filter Toggle Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects by name, ID, department, skill, or manager..." 
            className="w-full pl-11 pr-10 py-3 rounded-xl bg-[--color-surface-1] border border-[--color-border-subtle] text-sm text-[--color-text-primary] placeholder-[--color-text-muted] focus:outline-none focus:border-[--color-accent-cyan] transition-colors shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-muted] hover:text-[--color-text-primary] p-1 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Drawer Toggle Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl border text-sm font-bold transition-all shadow-sm ${
              showFilters || activeFilterCount > 0
                ? 'bg-[--color-accent-cyan]/10 text-[--color-accent-cyan] border-[--color-accent-cyan]'
                : 'bg-[--color-surface-1] border-[--color-border-strong] text-[--color-text-secondary] hover:text-[--color-text-primary]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[--color-accent-cyan] text-white text-[11px] font-bold flex items-center justify-center ml-1">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={onClearAll}
              className="px-3.5 py-3 rounded-xl border border-[--color-border-subtle] bg-[--color-surface-1] text-xs font-bold text-[--color-text-muted] hover:text-red-400 transition-colors shadow-sm flex items-center space-x-1"
              title="Reset all active filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[--color-text-muted] font-semibold text-[11px] uppercase tracking-wider mr-1">
            Active:
          </span>
          
          {selectedStatuses.map(s => (
            <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[--color-surface-1] border border-[--color-border-strong] text-[--color-text-primary] shadow-sm font-medium">
              <span>Status: <strong className="text-[--color-accent-cyan] font-bold">{s}</strong></span>
              <button onClick={() => onToggleStatus(s)} className="text-[--color-text-muted] hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {selectedPriorities.map(p => (
            <span key={p} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[--color-surface-1] border border-[--color-border-strong] text-[--color-text-primary] shadow-sm font-medium">
              <span>Priority: <strong className="text-[--color-accent-cyan] font-bold">{p}</strong></span>
              <button onClick={() => onTogglePriority(p)} className="text-[--color-text-muted] hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {selectedRisks.map(r => (
            <span key={r} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[--color-surface-1] border border-[--color-border-strong] text-[--color-text-primary] shadow-sm font-medium">
              <span>Risk: <strong className="text-[--color-accent-cyan] font-bold">{r}</strong></span>
              <button onClick={() => onToggleRisk(r)} className="text-[--color-text-muted] hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {selectedDepartment !== 'All Departments' && (
            <span key={selectedDepartment} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[--color-surface-1] border border-[--color-border-strong] text-[--color-text-primary] shadow-sm font-medium">
              <span>Dept: <strong className="text-[--color-accent-cyan] font-bold">{selectedDepartment}</strong></span>
              <button onClick={() => onDepartmentChange('All Departments')} className="text-[--color-text-muted] hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[--color-surface-1] border border-[--color-border-strong] text-[--color-text-primary] shadow-sm font-medium">
              <span>Keyword: <strong className="text-[--color-accent-cyan] font-bold">"{searchQuery}"</strong></span>
              <button onClick={() => onSearchChange('')} className="text-[--color-text-muted] hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button 
            onClick={onClearAll}
            className="text-xs font-bold text-[--color-accent-cyan] hover:underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Expanded Clean Filter Panel with Pure NEXAWIS Design Tokens */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="card-base p-6 rounded-2xl shadow-xl border border-[--color-border-strong] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Column 1: Status */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[--color-text-muted] mb-3 block">
                  Project Status
                </label>
                <div className="space-y-1.5">
                  {ALL_STATUSES.map(status => {
                    const isChecked = selectedStatuses.includes(status);
                    return (
                      <button 
                        key={status} 
                        type="button"
                        onClick={() => onToggleStatus(status)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                          isChecked 
                            ? 'bg-[--color-accent-cyan]/15 text-[--color-accent-cyan] border-[--color-accent-cyan] font-bold shadow-sm' 
                            : 'bg-[--color-surface-2] border-[--color-border-subtle] text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-surface-1]'
                        }`}
                      >
                        <span>{status}</span>
                        {isChecked ? (
                          <Check className="w-3.5 h-3.5 text-[--color-accent-cyan]" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-[--color-border-strong]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: Priority */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[--color-text-muted] mb-3 block">
                  Priority
                </label>
                <div className="space-y-1.5">
                  {ALL_PRIORITIES.map(priority => {
                    const isChecked = selectedPriorities.includes(priority);
                    return (
                      <button 
                        key={priority} 
                        type="button"
                        onClick={() => onTogglePriority(priority)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                          isChecked 
                            ? 'bg-[--color-accent-cyan]/15 text-[--color-accent-cyan] border-[--color-accent-cyan] font-bold shadow-sm' 
                            : 'bg-[--color-surface-2] border-[--color-border-subtle] text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-surface-1]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            priority === 'Critical' ? 'bg-red-400' :
                            priority === 'High' ? 'bg-[--color-accent-cyan]' :
                            priority === 'Medium' ? 'bg-amber-400' : 'bg-[--color-text-muted]'
                          }`} />
                          <span>{priority}</span>
                        </span>
                        {isChecked ? (
                          <Check className="w-3.5 h-3.5 text-[--color-accent-cyan]" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-[--color-border-strong]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 3: Risk Level */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[--color-text-muted] mb-3 block">
                  Risk Level
                </label>
                <div className="space-y-1.5">
                  {ALL_RISKS.map(risk => {
                    const isChecked = selectedRisks.includes(risk);
                    return (
                      <button 
                        key={risk} 
                        type="button"
                        onClick={() => onToggleRisk(risk)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                          isChecked 
                            ? 'bg-[--color-accent-cyan]/15 text-[--color-accent-cyan] border-[--color-accent-cyan] font-bold shadow-sm' 
                            : 'bg-[--color-surface-2] border-[--color-border-subtle] text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-surface-1]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            risk === 'High' ? 'bg-red-400' :
                            risk === 'Medium' ? 'bg-[--color-accent-cyan]' :
                            'bg-[--color-accent-lime]'
                          }`} />
                          <span>{risk} Risk</span>
                        </span>
                        {isChecked ? (
                          <Check className="w-3.5 h-3.5 text-[--color-accent-cyan]" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-[--color-border-strong]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 4: Department & Sort By */}
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[--color-text-muted] mb-2 block">
                    Department
                  </label>
                  <select 
                    value={selectedDepartment}
                    onChange={(e) => onDepartmentChange(e.target.value)}
                    className="w-full bg-[--color-surface-2] border border-[--color-border-strong] rounded-xl px-3.5 py-2.5 text-xs text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-cyan]"
                  >
                    {ALL_DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept} className="bg-[--color-surface-1] text-[--color-text-primary]">{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[--color-text-muted] mb-2 block">
                    Sort By
                  </label>
                  <select 
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="w-full bg-[--color-surface-2] border border-[--color-border-strong] rounded-xl px-3.5 py-2.5 text-xs text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-cyan]"
                  >
                    <option value="priority-desc" className="bg-[--color-surface-1] text-[--color-text-primary]">Priority (Critical to Low)</option>
                    <option value="priority-asc" className="bg-[--color-surface-1] text-[--color-text-primary]">Priority (Low to Critical)</option>
                    <option value="progress-desc" className="bg-[--color-surface-1] text-[--color-text-primary]">Progress (Highest First)</option>
                    <option value="progress-asc" className="bg-[--color-surface-1] text-[--color-text-primary]">Progress (Lowest First)</option>
                    <option value="deadline-asc" className="bg-[--color-surface-1] text-[--color-text-primary]">Deadline (Earliest First)</option>
                    <option value="teamfit-desc" className="bg-[--color-surface-1] text-[--color-text-primary]">Team Fit (Highest First)</option>
                    <option value="name-asc" className="bg-[--color-surface-1] text-[--color-text-primary]">Name (Alphabetical)</option>
                  </select>
                </div>
                
                <div className="pt-2">
                  <button 
                    type="button"
                    onClick={onClearAll}
                    disabled={activeFilterCount === 0}
                    className="w-full py-2.5 px-4 rounded-xl bg-[--color-surface-2] hover:bg-[--color-surface-1] text-[--color-text-secondary] hover:text-red-400 border border-[--color-border-strong] text-xs font-bold transition-colors disabled:opacity-40"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
