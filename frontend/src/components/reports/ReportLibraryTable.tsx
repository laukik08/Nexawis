import React, { useState } from 'react';
import { 
  Search, 
  Eye, 
  Download, 
  Copy, 
  Trash2, 
  Calendar, 
  User, 
  FileText, 
  RotateCcw,
  AlertCircle,
  X
} from 'lucide-react';
import type { ReportRecord, ReportLibraryFilters, ReportCategory, ReportStatus } from '../../types/reports';
import { ReportEmptyState } from './ReportEmptyState';

interface ReportLibraryTableProps {
  reports: ReportRecord[];
  filters: ReportLibraryFilters;
  onFilterChange: (filters: ReportLibraryFilters) => void;
  onClearFilters: () => void;
  onViewReport: (report: ReportRecord) => void;
  onDuplicateReport: (report: ReportRecord) => void;
  onDownloadReport: (report: ReportRecord) => void;
  onDeleteReport: (id: string) => void;
  onCreateReport: () => void;
  isLoading?: boolean;
}

export const ReportLibraryTable: React.FC<ReportLibraryTableProps> = ({
  reports,
  filters,
  onFilterChange,
  onClearFilters,
  onViewReport,
  onDuplicateReport,
  onDownloadReport,
  onDeleteReport,
  onCreateReport,
  isLoading = false
}) => {
  const [deleteTarget, setDeleteTarget] = useState<ReportRecord | null>(null);

  const hasActiveFilters = 
    Boolean(filters.searchQuery) || 
    filters.category !== 'All' || 
    filters.status !== 'All' || 
    filters.sortBy !== 'date-desc';

  const getCategoryBadgeStyle = (category: ReportCategory): React.CSSProperties => {
    switch (category) {
      case 'workforce':
        return {
          backgroundColor: 'var(--color-surface-2)',
          borderColor: '#3b82f6',
          color: '#3b82f6'
        };
      case 'projects':
        return {
          backgroundColor: 'var(--color-surface-2)',
          borderColor: '#10b981',
          color: '#10b981'
        };
      case 'team_formation':
        return {
          backgroundColor: 'var(--color-surface-2)',
          borderColor: '#a855f7',
          color: '#a855f7'
        };
      case 'awis_intelligence':
        return {
          backgroundColor: 'var(--color-surface-2)',
          borderColor: 'var(--color-accent-cyan)',
          color: 'var(--color-accent-cyan)'
        };
      case 'sustainability':
        return {
          backgroundColor: 'var(--color-surface-2)',
          borderColor: 'var(--color-accent-lime)',
          color: 'var(--color-accent-lime)'
        };
      case 'executive':
      default:
        return {
          backgroundColor: 'var(--color-surface-2)',
          borderColor: 'var(--color-teal-500)',
          color: 'var(--color-teal-500)'
        };
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'Ready':
        return (
          <span 
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: '#10b981',
              color: '#10b981'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10b981' }}></span>
            Ready
          </span>
        );
      case 'Scheduled':
        return (
          <span 
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-accent-cyan)',
              color: 'var(--color-accent-cyan)'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-accent-cyan)' }}></span>
            Scheduled
          </span>
        );
      case 'Draft':
      default:
        return (
          <span 
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: '#f59e0b',
              color: '#f59e0b'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f59e0b' }}></span>
            Draft
          </span>
        );
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteReport(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Toolbar */}
      <div className="card-base p-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports by title, ID, author..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-9 pr-9 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-teal-500)] transition-colors"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Dropdown */}
            <select
              value={filters.category}
              onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
              className="px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-teal-500)] cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="executive">Executive</option>
              <option value="workforce">Workforce</option>
              <option value="projects">Projects</option>
              <option value="team_formation">Team Formation</option>
              <option value="awis_intelligence">AWIS Intelligence</option>
              <option value="sustainability">Sustainability</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
              className="px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-teal-500)] cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Ready">Ready</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Draft">Draft</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any })}
              className="px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-teal-500)] cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name (A–Z)</option>
              <option value="category-asc">Category</option>
            </select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium cursor-pointer"
                title="Reset all search and filter values"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Status count summary bar */}
        <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
          <span>
            Showing <strong className="text-[var(--color-text)]">{reports.length}</strong> {reports.length === 1 ? 'report' : 'reports'}
            {hasActiveFilters && ' (filtered)'}
          </span>
          <span className="hidden sm:inline">
            Demonstration repository • Client-side preview & export
          </span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="card-base p-8 space-y-4">
          <div className="h-6 w-1/4 bg-[var(--color-surface-hover)] rounded animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-12 w-full bg-[var(--color-surface-hover)] rounded animate-pulse" />
            ))}
          </div>
        </div>
      ) : reports.length === 0 ? (
        <ReportEmptyState 
          hasFilters={hasActiveFilters}
          onClearFilters={onClearFilters}
          onCreateReport={onCreateReport}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="card-base overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-hover)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Report Name</th>
                    <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Category</th>
                    <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Period</th>
                    <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Created</th>
                    <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                    <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Format</th>
                    <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {reports.map((report) => (
                    <tr 
                      key={report.id}
                      className="hover:bg-[var(--color-surface-hover)] transition-colors group cursor-pointer"
                      onClick={() => onViewReport(report)}
                    >
                      {/* Name & ID */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-start gap-2.5">
                          <div 
                            className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors shadow-xs"
                            style={{
                              backgroundColor: 'var(--color-surface-2)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-teal-500)'
                            }}
                          >
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--color-text)] group-hover:text-teal-400 transition-colors">
                              {report.name}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                              <span className="font-mono">{report.id}</span>
                              <span>•</span>
                              <span>{report.createdBy}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span 
                          className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize border shadow-xs"
                          style={getCategoryBadgeStyle(report.category)}
                        >
                          {report.category.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Period */}
                      <td className="px-4 py-3.5 text-[var(--color-text-secondary)] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                          <span>{report.reportingPeriod}</span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3.5 text-[var(--color-text-secondary)] whitespace-nowrap">
                        <div>{new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(report.status)}
                      </td>

                      {/* Format */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                          {report.format}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td 
                        className="px-5 py-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewReport(report)}
                            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-teal-400 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                            title="View Full Report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDownloadReport(report)}
                            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-cyan-400 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                            title="Download CSV"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDuplicateReport(report)}
                            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-lime-400 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                            title="Duplicate Configuration"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(report)}
                            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-rose-400 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Responsive Mobile Cards View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:hidden">
            {reports.map((report) => (
              <div
                key={report.id}
                className="card-base p-4 flex flex-col justify-between space-y-3 cursor-pointer hover:border-teal-500/40 transition-colors"
                onClick={() => onViewReport(report)}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span 
                      className="inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full capitalize border shadow-xs"
                      style={getCategoryBadgeStyle(report.category)}
                    >
                      {report.category.replace('_', ' ')}
                    </span>
                    {getStatusBadge(report.status)}
                  </div>

                  <h4 className="text-sm font-bold text-[var(--color-text)] line-clamp-2">
                    {report.name}
                  </h4>
                  <p className="text-xs font-mono text-[var(--color-text-secondary)] mt-0.5">
                    {report.id}
                  </p>
                </div>

                <div className="space-y-1 text-xs text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border)]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-400" />
                      <span>{report.reportingPeriod}</span>
                    </span>
                    <span className="font-mono">{report.format}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{report.createdBy}</span>
                  </div>
                </div>

                <div 
                  className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onViewReport(report)}
                    className="btn-secondary flex-1 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => onDownloadReport(report)}
                    className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-cyan-400 cursor-pointer"
                    title="Download CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDuplicateReport(report)}
                    className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-lime-400 cursor-pointer"
                    title="Duplicate Configuration"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(report)}
                    className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-rose-400 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="card-base max-w-md w-full p-6 shadow-2xl border border-[var(--color-border)] space-y-4">
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: '#ef4444',
                  color: '#ef4444'
                }}
              >
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[var(--color-text)]">
                  Delete Demonstration Report?
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Are you sure you want to remove <strong className="text-[var(--color-text)]">{deleteTarget.name}</strong> ({deleteTarget.id})? This will remove the mock record from your current session cache.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-colors shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
