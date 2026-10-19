import React, { useState } from 'react';
import { 
  Download, 
  RotateCcw, 
  Check, 
  FileJson, 
  Server
} from 'lucide-react';
import type { SettingsState } from '../../types/settings';
import { settingsService } from '../../services/settingsService';

interface DataPreferencesSectionProps {
  currentSettings: SettingsState;
  onResetDefaultsClick: () => void;
  onClearSessionEdits: () => void;
  isModified: boolean;
}

export const DataPreferencesSection: React.FC<DataPreferencesSectionProps> = ({
  currentSettings,
  onResetDefaultsClick,
  onClearSessionEdits,
  isModified
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportJson = async () => {
    try {
      setIsExporting(true);
      const { jsonString, filename } = await settingsService.exportSettingsJson();
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div 
        className="card-base p-6 rounded-2xl border shadow-sm"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-strong)'
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Data & Preferences Management
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Inspect your session configuration snapshot, export definitions, or restore system factory defaults.
            </p>
          </div>

          {isModified && (
            <div className="flex items-center gap-2">
              <span 
                className="px-2.5 py-1 text-xs font-bold rounded-lg border shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: '#f59e0b',
                  color: '#f59e0b'
                }}
              >
                Session Modified
              </span>
              <button
                type="button"
                onClick={onClearSessionEdits}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer hover:border-[var(--color-accent-cyan)] shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border-strong)',
                  color: 'var(--color-text-secondary)'
                }}
                title="Discard in-session unsaved changes"
              >
                Reset Unsaved Edits
              </button>
            </div>
          )}
        </div>

        {exportSuccess && (
          <div 
            className="my-4 p-3 rounded-xl border text-xs flex items-center gap-2 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-accent-lime)',
              color: 'var(--color-accent-lime)'
            }}
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>Settings exported successfully to JSON download.</span>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {/* Active Configuration Matrix Summary */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Active Configuration Snapshot
            </span>

            <div 
              className="rounded-xl border overflow-hidden shadow-xs divide-y"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border-strong)'
              }}
            >
              <div className="p-3.5 flex items-center justify-between text-xs">
                <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Operator Profile:</span>
                <span className="font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
                  {currentSettings.profile.name} ({currentSettings.profile.department})
                </span>
              </div>

              <div className="p-3.5 flex items-center justify-between text-xs">
                <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Active Theme Mode:</span>
                <span className="font-bold capitalize" style={{ color: 'var(--color-accent-cyan)' }}>
                  {currentSettings.appearance.theme} Mode
                </span>
              </div>

              <div className="p-3.5 flex items-center justify-between text-xs">
                <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Primary Locale & Timezone:</span>
                <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {currentSettings.account.language} • {currentSettings.account.timezone.split(' ')[0]}
                </span>
              </div>

              <div className="p-3.5 flex items-center justify-between text-xs">
                <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Default Route Landing:</span>
                <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--color-accent-lime)' }}>
                  {currentSettings.account.defaultLandingPage}
                </span>
              </div>

              <div className="p-3.5 flex items-center justify-between text-xs">
                <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Workspace Baseline Scope:</span>
                <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {currentSettings.workspace.workspaceName} ({currentSettings.workspace.defaultDepartment})
                </span>
              </div>
            </div>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Export JSON Card */}
            <div 
              className="p-5 rounded-2xl border flex flex-col justify-between space-y-4 shadow-xs"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border-strong)'
              }}
            >
              <div>
                <div className="w-9 h-9 rounded-xl border flex items-center justify-center mb-3 shadow-xs" style={{ backgroundColor: 'var(--color-surface-1)', borderColor: 'var(--color-accent-cyan)', color: 'var(--color-accent-cyan)' }}>
                  <FileJson className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Export Configuration (.JSON)
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Download a structured JSON backup of your active preferences, localization formats, and notification policies.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportJson}
                disabled={isExporting}
                className="btn-secondary w-full py-2.5 text-xs font-bold cursor-pointer hover:border-[var(--color-accent-cyan)] shadow-xs flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[var(--color-accent-cyan)]" />
                <span>{isExporting ? 'Generating JSON...' : 'Export JSON File'}</span>
              </button>
            </div>

            {/* Factory Reset Card */}
            <div 
              className="p-5 rounded-2xl border flex flex-col justify-between space-y-4 shadow-xs"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border-strong)'
              }}
            >
              <div>
                <div className="w-9 h-9 rounded-xl border flex items-center justify-center mb-3 shadow-xs" style={{ backgroundColor: 'var(--color-surface-1)', borderColor: '#f59e0b', color: '#f59e0b' }}>
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Restore Factory Defaults
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Revert all session preferences to standardized initial values. Requires user confirmation before execution.
                </p>
              </div>

              <button
                type="button"
                onClick={onResetDefaultsClick}
                className="w-full py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 hover:border-amber-500 hover:text-amber-400"
                style={{
                  backgroundColor: 'var(--color-surface-1)',
                  borderColor: 'var(--color-border-strong)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Reset to Factory Defaults</span>
              </button>
            </div>
          </div>

          {/* Session Memory Lifecycle Card */}
          <div 
            className="p-4 rounded-xl border flex items-start gap-3 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)',
              borderLeft: '4px solid var(--color-accent-cyan)'
            }}
          >
            <Server className="w-4 h-4 text-[var(--color-accent-cyan)] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Demonstration State Architecture Notice
              </span>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                NEXAWIS Settings are wired to an asynchronous typed service (`settingsService.ts`) operating in session memory. 
                When real backend endpoints are connected, this service will issue authenticated REST/GraphQL calls to PostgreSQL / Supabase with zero UI rework.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
