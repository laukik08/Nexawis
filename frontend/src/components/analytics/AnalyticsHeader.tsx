import { useState } from 'react';
import { 
  Calendar, 
  RotateCw, 
  Download, 
  X, 
  Sparkles,
  Building2,
  FolderGit2
} from 'lucide-react';
import type { AnalyticsFilters, DateRangePreset } from '../../types/analytics';

interface AnalyticsHeaderProps {
  filters: AnalyticsFilters;
  onFilterChange: (updates: Partial<AnalyticsFilters>) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onExport: () => void;
  isRefreshing: boolean;
  departmentOptions: string[];
  projectOptions: Array<{ id: string; name: string }>;
  activeTabName: string;
}

export function AnalyticsHeader({
  filters,
  onFilterChange,
  onResetFilters,
  onRefresh,
  onExport,
  isRefreshing,
  departmentOptions,
  projectOptions,
  activeTabName
}: AnalyticsHeaderProps) {
  const [showCustomDates, setShowCustomDates] = useState(filters.dateRange.preset === 'custom');

  const datePresets: Array<{ id: DateRangePreset; label: string }> = [
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'Last 90 Days' },
    { id: 'custom', label: 'Custom Range' }
  ];

  const handlePresetSelect = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustomDates(true);
      onFilterChange({
        dateRange: {
          preset: 'custom',
          startDate: filters.dateRange.startDate || '2026-09-01',
          endDate: filters.dateRange.endDate || '2026-10-18',
          label: 'Custom Range'
        }
      });
    } else {
      setShowCustomDates(false);
      const label = datePresets.find(p => p.id === preset)?.label || 'Last 30 Days';
      onFilterChange({
        dateRange: {
          preset,
          label
        }
      });
    }
  };

  const hasActiveFilters = 
    filters.department !== 'All' || 
    filters.projectId !== 'All' || 
    filters.dateRange.preset !== '30d' ||
    Boolean(filters.searchQuery);

  return (
    <div className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5"
              style={{
                backgroundColor: 'rgba(2, 132, 199, 0.12)',
                color: 'var(--color-accent-cyan)',
                border: '1px solid rgba(2, 132, 199, 0.25)'
              }}
            >
              <Sparkles className="w-3 h-3" />
              Workforce Intelligence Suite
            </span>
          </div>

          <h1 
            className="text-2xl sm:text-3xl font-display font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Analytics
          </h1>

          <p 
            className="text-xs sm:text-sm mt-1 max-w-2xl"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Explore workforce intelligence, project performance, team effectiveness, and sustainable resource allocation.
          </p>
        </div>

        {/* Global Actions: Refresh & CSV Export */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 hover:bg-[--color-surface-2] border"
            style={{
              backgroundColor: 'var(--color-surface-1)',
              borderColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-primary)'
            }}
            title="Refresh analytics data"
          >
            <RotateCw className={`w-3.5 h-3.5 text-[--color-accent-cyan] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={onExport}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            title={`Export ${activeTabName} data to CSV`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Row */}
      <div 
        className="card-base p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 border shadow-sm"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-subtle)'
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle]">
            <Calendar className="w-3.5 h-3.5 ml-2 text-[--color-text-muted] shrink-0" />
            <div className="flex items-center gap-1">
              {datePresets.map(preset => {
                const isActive = filters.dateRange.preset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isActive 
                        ? 'bg-[--color-surface-1] text-[--color-text-primary] shadow-sm border border-[--color-border-subtle]' 
                        : 'text-[--color-text-secondary] hover:text-[--color-text-primary]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Department Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text-muted] pointer-events-none" />
              <select
                value={filters.department}
                onChange={(e) => onFilterChange({ department: e.target.value })}
                className="pl-8 pr-8 py-2 rounded-xl text-xs font-semibold focus:outline-none appearance-none transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-primary)'
                }}
              >
                {departmentOptions.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'All' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="relative">
              <FolderGit2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text-muted] pointer-events-none" />
              <select
                value={filters.projectId}
                onChange={(e) => onFilterChange({ projectId: e.target.value })}
                className="pl-8 pr-8 py-2 rounded-xl text-xs font-semibold focus:outline-none appearance-none transition-colors cursor-pointer max-w-[200px] truncate"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-primary)'
                }}
              >
                {projectOptions.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Clear Filters Action */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-surface-2] transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Custom Date Range Picker inputs when active */}
      {showCustomDates && (
        <div 
          className="card-base p-4 rounded-xl flex flex-wrap items-center gap-4 text-xs animate-in fade-in slide-in-from-top-1"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border-subtle)'
          }}
        >
          <span className="font-bold text-[--color-text-primary]">Custom Range:</span>
          <div className="flex items-center gap-2">
            <label className="text-[--color-text-muted]">Start Date:</label>
            <input
              type="date"
              value={filters.dateRange.startDate || '2026-09-01'}
              onChange={(e) => onFilterChange({
                dateRange: {
                  ...filters.dateRange,
                  startDate: e.target.value,
                  label: `Custom: ${e.target.value} to ${filters.dateRange.endDate || '2026-10-18'}`
                }
              })}
              className="px-3 py-1.5 rounded-lg bg-[--color-surface-1] border border-[--color-border-subtle] text-[--color-text-primary]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[--color-text-muted]">End Date:</label>
            <input
              type="date"
              value={filters.dateRange.endDate || '2026-10-18'}
              onChange={(e) => onFilterChange({
                dateRange: {
                  ...filters.dateRange,
                  endDate: e.target.value,
                  label: `Custom: ${filters.dateRange.startDate || '2026-09-01'} to ${e.target.value}`
                }
              })}
              className="px-3 py-1.5 rounded-lg bg-[--color-surface-1] border border-[--color-border-subtle] text-[--color-text-primary]"
            />
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[--color-text-muted]">
            Active Filters:
          </span>

          {filters.department !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary]">
              <span>Dept: {filters.department}</span>
              <button 
                type="button" 
                onClick={() => onFilterChange({ department: 'All' })}
                className="hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.projectId !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary]">
              <span>Project: {projectOptions.find(p => p.id === filters.projectId)?.name || filters.projectId}</span>
              <button 
                type="button" 
                onClick={() => onFilterChange({ projectId: 'All' })}
                className="hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.dateRange.preset !== '30d' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary]">
              <span>Range: {filters.dateRange.label}</span>
              <button 
                type="button" 
                onClick={() => handlePresetSelect('30d')}
                className="hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {Boolean(filters.searchQuery) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary]">
              <span>Search: "{filters.searchQuery}"</span>
              <button 
                type="button" 
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

    </div>
  );
}
