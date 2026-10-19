import React from 'react';
import { FileSearch, RotateCcw, Plus } from 'lucide-react';

interface ReportEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreateReport: () => void;
}

export const ReportEmptyState: React.FC<ReportEmptyStateProps> = ({
  hasFilters,
  onClearFilters,
  onCreateReport
}) => {
  return (
    <div className="card-base p-12 text-center flex flex-col items-center justify-center my-6 border border-dashed border-[var(--color-border)]">
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-105"
        style={{ 
          backgroundColor: 'var(--color-surface-2)',
          border: '1px solid var(--color-teal-500)'
        }}
      >
        <FileSearch className="w-8 h-8 text-[var(--color-teal-500)]" />
      </div>

      <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">
        {hasFilters ? 'No Matching Reports Found' : 'No Reports Generated Yet'}
      </h3>

      <p className="text-sm text-[var(--color-text-secondary)] max-w-md mb-6 leading-relaxed">
        {hasFilters
          ? 'No reports matched your current search and filter combination. Try adjusting your query or resetting all active filters.'
          : 'Your intelligence report library is empty. Generate your first workforce, project, or executive intelligence report to get started.'}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm font-semibold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Filters</span>
          </button>
        )}
        <button
          onClick={onCreateReport}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Report</span>
        </button>
      </div>
    </div>
  );
};
