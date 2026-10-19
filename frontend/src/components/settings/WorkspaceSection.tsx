import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Layers, 
  Calendar, 
  LayoutGrid, 
  BarChart2, 
  FileText, 
  Check, 
  RotateCcw, 
  Save, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import type { WorkspaceSettings } from '../../types/settings';
import { departmentOptions } from '../../data/mockSettings';

interface WorkspaceSectionProps {
  initialWorkspace: WorkspaceSettings;
  onSave: (workspace: WorkspaceSettings) => Promise<void>;
  isSaving: boolean;
  onMarkModified: (isModified: boolean) => void;
}

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({
  initialWorkspace,
  onSave,
  isSaving,
  onMarkModified
}) => {
  const [formData, setFormData] = useState<WorkspaceSettings>(initialWorkspace);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setFormData(initialWorkspace);
  }, [initialWorkspace]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialWorkspace);

  const prevDirtyRef = useRef<boolean>(false);
  useEffect(() => {
    if (prevDirtyRef.current !== isDirty) {
      prevDirtyRef.current = isDirty;
      onMarkModified(isDirty);
    }
  }, [isDirty, onMarkModified]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workspaceName.trim()) {
      setError('Workspace name cannot be empty.');
      return;
    }

    try {
      setError(null);
      await onSave(formData);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update workspace settings.');
    }
  };

  const handleCancel = () => {
    setFormData(initialWorkspace);
    setError(null);
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
              Workspace Configuration
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Establish tenant naming, default department filters, and reporting baselines.
            </p>
          </div>

          {isDirty && (
            <span 
              className="px-2.5 py-1 text-xs font-bold rounded-lg border shadow-xs"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: '#f59e0b',
                color: '#f59e0b'
              }}
            >
              Unsaved Changes
            </span>
          )}
        </div>

        {error && (
          <div 
            className="my-4 p-3 rounded-xl border text-xs flex items-center gap-2 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: '#ef4444',
              color: '#ef4444'
            }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess && (
          <div 
            className="my-4 p-3 rounded-xl border text-xs flex items-center gap-2 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-accent-lime)',
              color: 'var(--color-accent-lime)'
            }}
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>Workspace configuration successfully updated in active session.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Workspace Identity Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Workspace Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input 
                  type="text"
                  value={formData.workspaceName}
                  onChange={(e) => setFormData(prev => ({ ...prev, workspaceName: e.target.value }))}
                  placeholder="e.g. NEXAWIS Global Technologies"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Tenant Identifier Slug <span className="text-[11px] font-normal" style={{ color: 'var(--color-text-muted)' }}>(Immutable System Key)</span>
              </label>
              <input 
                type="text"
                value={formData.workspaceSlug}
                readOnly
                disabled
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border font-mono opacity-80 cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text-secondary)'
                }}
              />
            </div>
          </div>

          {/* Module Baselines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Default Department Filter */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Default Department Filter Scope
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <select
                  value={formData.defaultDepartment}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultDepartment: e.target.value }))}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {departmentOptions.map(dept => (
                    <option key={dept} value={dept}>
                      {dept === 'All' ? 'All Departments (Organization-Wide)' : dept}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                Pre-selected filter when opening Employees, Analytics, and Reports tables.
              </p>
            </div>

            {/* Default Reporting Period */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Default Reporting Period
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <select
                  value={formData.defaultReportingPeriod}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultReportingPeriod: e.target.value }))}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Quarter to Date">Quarter to Date (Q4 2026)</option>
                  <option value="Year to Date">Year to Date (2026)</option>
                  <option value="Trailing 12 Months">Trailing 12 Months</option>
                </select>
              </div>
            </div>

            {/* Default Project View */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Default Project View Layout
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, defaultProjectView: 'grid' }))}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                    formData.defaultProjectView === 'grid' ? 'ring-2 ring-[var(--color-accent-cyan)]' : ''
                  }`}
                  style={{
                    backgroundColor: formData.defaultProjectView === 'grid' ? 'var(--color-surface-1)' : 'var(--color-surface-2)',
                    borderColor: formData.defaultProjectView === 'grid' ? 'var(--color-accent-cyan)' : 'var(--color-border-strong)',
                    color: formData.defaultProjectView === 'grid' ? 'var(--color-accent-cyan)' : 'var(--color-text-secondary)'
                  }}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Card Grid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, defaultProjectView: 'table' }))}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                    formData.defaultProjectView === 'table' ? 'ring-2 ring-[var(--color-accent-cyan)]' : ''
                  }`}
                  style={{
                    backgroundColor: formData.defaultProjectView === 'table' ? 'var(--color-surface-1)' : 'var(--color-surface-2)',
                    borderColor: formData.defaultProjectView === 'table' ? 'var(--color-accent-cyan)' : 'var(--color-border-strong)',
                    color: formData.defaultProjectView === 'table' ? 'var(--color-accent-cyan)' : 'var(--color-text-secondary)'
                  }}
                >
                  <Layers className="w-4 h-4" />
                  <span>Detailed Table</span>
                </button>
              </div>
            </div>

            {/* Default Report Format */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Default Report Output Format
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, defaultReportFormat: 'PDF' }))}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                    formData.defaultReportFormat === 'PDF' ? 'ring-2 ring-[var(--color-accent-cyan)]' : ''
                  }`}
                  style={{
                    backgroundColor: formData.defaultReportFormat === 'PDF' ? 'var(--color-surface-1)' : 'var(--color-surface-2)',
                    borderColor: formData.defaultReportFormat === 'PDF' ? 'var(--color-accent-cyan)' : 'var(--color-border-strong)',
                    color: formData.defaultReportFormat === 'PDF' ? 'var(--color-accent-cyan)' : 'var(--color-text-secondary)'
                  }}
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF Document</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, defaultReportFormat: 'CSV' }))}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                    formData.defaultReportFormat === 'CSV' ? 'ring-2 ring-[var(--color-accent-cyan)]' : ''
                  }`}
                  style={{
                    backgroundColor: formData.defaultReportFormat === 'CSV' ? 'var(--color-surface-1)' : 'var(--color-surface-2)',
                    borderColor: formData.defaultReportFormat === 'CSV' ? 'var(--color-accent-cyan)' : 'var(--color-border-strong)',
                    color: formData.defaultReportFormat === 'CSV' ? 'var(--color-accent-cyan)' : 'var(--color-text-secondary)'
                  }}
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>CSV Raw Data</span>
                </button>
              </div>
            </div>
          </div>

          {/* Actions Toolbar */}
          <div className="flex items-center justify-between pt-4 border-t flex-wrap gap-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
              <span>Workspace defaults apply to table initial states and report generation wizards.</span>
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              {isDirty && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  <span>Cancel</span>
                </button>
              )}

              <button
                type="submit"
                disabled={!isDirty || isSaving}
                className="btn-primary px-5 py-2 text-xs font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                <span>{isSaving ? 'Saving...' : 'Save Workspace'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
