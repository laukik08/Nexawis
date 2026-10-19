import React from 'react';
import { 
  Settings as SettingsIcon, 
  RotateCcw, 
  Download, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface SettingsHeaderProps {
  onResetDefaults: () => void;
  onExportJson: () => void;
  isModified: boolean;
  lastSavedAt?: string;
  isSaving?: boolean;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  onResetDefaults,
  onExportJson,
  isModified,
  lastSavedAt,
  isSaving = false
}) => {
  return (
    <div className="space-y-4 mb-8">
      {/* Top Title & Actions Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border shadow-xs"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-accent-cyan)',
                color: 'var(--color-accent-cyan)'
              }}
            >
              <SettingsIcon className="w-3 h-3" />
              Workspace & Account Controls
            </span>

            {isModified && (
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: '#f59e0b',
                  color: '#f59e0b'
                }}
              >
                In-Session Modifications
              </span>
            )}
          </div>

          <h1 
            className="text-2xl sm:text-3xl font-display font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Settings
          </h1>

          <p 
            className="text-xs sm:text-sm mt-1 max-w-2xl"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Manage your account, preferences, notifications, and workspace experience.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Export JSON Button */}
          <button
            type="button"
            onClick={onExportJson}
            className="btn-secondary px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer hover:border-[var(--color-accent-cyan)]"
            title="Download active settings configuration as JSON"
          >
            <Download className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
            <span>Export Config</span>
          </button>

          {/* Reset to Defaults Button */}
          <button
            type="button"
            onClick={onResetDefaults}
            className="btn-secondary px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer hover:border-amber-500 hover:text-amber-400"
            title="Restore all settings to factory presets"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Informative Status Banner */}
      <div 
        className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-xs"
        style={{
          backgroundColor: 'var(--color-surface-2)',
          borderColor: 'var(--color-border-strong)',
          borderLeft: '4px solid var(--color-accent-cyan)',
          color: 'var(--color-text-primary)'
        }}
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[var(--color-accent-cyan)] shrink-0" />
          <span style={{ color: 'var(--color-text-secondary)' }}>
            <strong className="text-[var(--color-text-primary)]">Frontend Demonstration Mode: </strong>
            All settings updates are retained in active session memory. No database writes or external auth tokens are committed.
          </span>
        </div>

        {lastSavedAt && (
          <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
            {isSaving ? (
              <span className="text-[var(--color-accent-cyan)] animate-pulse">Saving changes...</span>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-accent-lime)]" />
                <span>Session synced: {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
