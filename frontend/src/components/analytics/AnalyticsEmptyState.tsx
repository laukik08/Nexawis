import { FilterX, RotateCcw } from 'lucide-react';

interface AnalyticsEmptyStateProps {
  title?: string;
  message?: string;
  onClearFilters: () => void;
}

export function AnalyticsEmptyState({
  title = 'No Matching Analytics Records',
  message = 'No workforce, project, or formation records matched your current filter criteria. Try adjusting or clearing your active filters.',
  onClearFilters
}: AnalyticsEmptyStateProps) {
  return (
    <div 
      className="card-base p-12 text-center rounded-2xl border space-y-4 max-w-lg mx-auto my-8 animate-in fade-in"
      style={{
        backgroundColor: 'var(--color-surface-1)',
        borderColor: 'var(--color-border-subtle)'
      }}
    >
      <div 
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
        style={{
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          color: 'var(--color-accent-cyan)'
        }}
      >
        <FilterX className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 
          className="text-lg font-display font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {title}
        </h3>
        <p 
          className="text-xs max-w-md mx-auto leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onClearFilters}
        className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset & Clear All Filters</span>
      </button>
    </div>
  );
}
