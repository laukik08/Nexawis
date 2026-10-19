import { 
  Plus, 
  Download, 
  RotateCw, 
  Clock, 
  Sparkles, 
  Info 
} from 'lucide-react';

interface ReportsHeaderProps {
  onCreateReport: () => void;
  onExportLibrary: () => void;
  onOpenSchedule: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function ReportsHeader({
  onCreateReport,
  onExportLibrary,
  onOpenSchedule,
  onRefresh,
  isRefreshing
}: ReportsHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Title & Actions Row */}
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
              Intelligence Reporting Center
            </span>
          </div>

          <h1 
            className="text-2xl sm:text-3xl font-display font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Reports
          </h1>

          <p 
            className="text-xs sm:text-sm mt-1 max-w-2xl"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Generate actionable workforce intelligence and project performance reports for informed, sustainable decision-making.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Refresh Action */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-xs font-bold transition-all hover:bg-[var(--color-surface-hover)] border shadow-xs cursor-pointer"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-primary)'
            }}
            title="Refresh reports library"
          >
            <RotateCw className={`w-4 h-4 text-[var(--color-accent-cyan)] ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Schedule Reports */}
          <button
            type="button"
            onClick={onOpenSchedule}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 hover:bg-[var(--color-surface-hover)] border shadow-xs cursor-pointer"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-primary)'
            }}
          >
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Schedules</span>
          </button>

          {/* Export Library CSV */}
          <button
            type="button"
            onClick={onExportLibrary}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 hover:bg-[var(--color-surface-hover)] border shadow-xs cursor-pointer"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-primary)'
            }}
            title="Export all reports metadata to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
            <span>Export CSV</span>
          </button>

          {/* Create Report (Flagship CTA) */}
          <button
            type="button"
            onClick={onCreateReport}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Report</span>
          </button>
        </div>
      </div>

      {/* Demo Data Disclaimer Indicator */}
      <div className="flex items-center justify-between px-1 text-xs">
        <span 
          className="text-[11px] font-mono text-[--color-text-muted] flex items-center gap-1.5"
        >
          <Info className="w-3.5 h-3.5 text-[--color-accent-cyan]" />
          <span>Demo Data Mode • Generated report records and metrics reflect mock datasets until backend integration</span>
        </span>
      </div>
    </div>
  );
}
