import { useState, type FormEvent, useEffect, useMemo } from 'react';
import { X, AlertCircle, Info, Loader2, AlertTriangle } from 'lucide-react';
import { useProjects } from '../../context/ProjectsContext';
import type { Project } from '../../data/mockProjects';

interface EditProjectModalProps {
  isOpen: boolean;
  project: Project;
  onClose: () => void;
  onSuccess?: (updated: Project) => void;
}

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Data Science',
  'Design',
  'Operations',
  'Internal IT'
];

const PRIORITIES: Array<'Critical' | 'High' | 'Medium' | 'Low'> = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: Array<'Planning' | 'Active' | 'On Track' | 'At Risk' | 'Completed'> = [
  'Planning',
  'Active',
  'On Track',
  'At Risk',
  'Completed'
];
const RISKS: Array<'Low' | 'Medium' | 'High'> = ['Low', 'Medium', 'High'];
const COMPLEXITIES: Array<'High' | 'Medium' | 'Low'> = ['High', 'Medium', 'Low'];

export function EditProjectModal({ isOpen, project, onClose, onSuccess }: EditProjectModalProps) {
  const { updateProject } = useProjects();

  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description,
    department: project.department,
    client: project.client || '',
    projectManager: project.projectManager || '',
    priority: project.priority,
    status: project.status,
    complexity: project.complexity,
    teamSize: project.teamSize,
    progress: project.progress,
    overallRisk: project.overallRisk,
    startDate: project.startDate,
    deadline: project.deadline
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverNotice, setServerNotice] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Sync initial state when modal opens or project changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: project.name,
        description: project.description,
        department: project.department,
        client: project.client || '',
        projectManager: project.projectManager || '',
        priority: project.priority,
        status: project.status,
        complexity: project.complexity,
        teamSize: project.teamSize,
        progress: project.progress,
        overallRisk: project.overallRisk,
        startDate: project.startDate,
        deadline: project.deadline
      });
      setErrors({});
      setServerNotice(null);
      setShowDiscardConfirm(false);
    }
  }, [isOpen, project]);

  // Determine if form has unsaved modifications
  const isDirty = useMemo(() => {
    return (
      formData.name !== project.name ||
      formData.description !== project.description ||
      formData.department !== project.department ||
      formData.client !== (project.client || '') ||
      formData.projectManager !== (project.projectManager || '') ||
      formData.priority !== project.priority ||
      formData.status !== project.status ||
      formData.complexity !== project.complexity ||
      formData.teamSize !== project.teamSize ||
      formData.progress !== project.progress ||
      formData.overallRisk !== project.overallRisk ||
      formData.startDate !== project.startDate ||
      formData.deadline !== project.deadline
    );
  }, [formData, project]);

  const handleAttemptClose = () => {
    if (isSubmitting) return;
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleAttemptClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, isDirty]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else if (formData.startDate && new Date(formData.deadline) < new Date(formData.startDate)) {
      newErrors.deadline = 'Deadline cannot be earlier than start date';
    }
    if (formData.teamSize < 1) {
      newErrors.teamSize = 'Team size must be at least 1 member';
    }
    if (formData.progress < 0 || formData.progress > 100) {
      newErrors.progress = 'Progress must be between 0 and 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerNotice(null);

    try {
      const updates: Partial<Project> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        department: formData.department,
        client: formData.client.trim() || undefined,
        projectManager: formData.projectManager.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        complexity: formData.complexity,
        teamSize: Number(formData.teamSize),
        progress: Number(formData.progress),
        overallRisk: formData.overallRisk,
        startDate: formData.startDate,
        deadline: formData.deadline
      };

      const res = await updateProject(project.id, updates);

      if (res.success && res.project) {
        onSuccess?.(res.project);
        onClose();
      } else {
        setServerNotice(res.error || 'Failed to save changes');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setServerNotice(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={handleAttemptClose}
      />

      {/* Solid Opaque Modal Dialog */}
      <div className="relative w-full max-w-3xl card-base p-0 rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden border border-[--color-border-strong]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[--color-border-subtle] bg-[--color-surface-2]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[--color-text-secondary] bg-[--color-surface-1] border border-[--color-border-subtle] px-2 py-0.5 rounded">
                {project.projectId}
              </span>
              <span className="text-xs text-[--color-accent-cyan] font-bold">Edit Project</span>
            </div>
            <h2 className="text-xl font-display font-bold text-[--color-text-primary]">
              {formData.name || 'Edit Project'}
            </h2>
          </div>
          <button 
            onClick={handleAttemptClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-[--color-text-muted] hover:text-[--color-text-primary] hover:bg-[--color-surface-1] transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Backend Note Banner */}
        <div className="px-6 py-2.5 bg-[--color-accent-cyan]/10 border-b border-[--color-accent-cyan]/20 flex items-center gap-2.5 text-xs text-[--color-text-primary]">
          <Info className="w-4 h-4 text-[--color-accent-cyan] shrink-0" />
          <span>
            <strong>Workspace Store:</strong> Edits are saved to your active project workspace. (Remote API <code className="text-[11px] font-mono bg-[--color-accent-cyan]/15 px-1 py-0.5 rounded">PUT /api/projects/:id</code> is pending backend deployment).
          </span>
        </div>

        {/* Discard Confirmation Alert */}
        {showDiscardConfirm && (
          <div className="p-4 mx-6 mt-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-start gap-2.5 text-xs text-amber-500">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>You have unsaved changes.</strong>
                <p className="mt-0.5 text-[--color-text-secondary]">Are you sure you want to discard your edits?</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-3 py-1 rounded-lg bg-[--color-surface-2] hover:bg-[--color-surface-1] text-xs font-bold text-[--color-text-secondary] border border-[--color-border-strong]"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-xs font-bold text-white transition-colors"
              >
                Discard Changes
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[--color-surface-1]">
          
          {serverNotice && (
            <div className="p-3.5 rounded-xl bg-red-400/10 border border-red-400/30 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverNotice}</span>
            </div>
          )}

          {/* Section 1: Core Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-text-muted]">
              Core Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Project Name <span className="text-red-400">*</span>
                </label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={e => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border text-sm text-[--color-text-primary] focus:outline-none focus:bg-[--color-surface-1] transition-colors ${
                    errors.name ? 'border-red-400 focus:border-red-400' : 'border-[--color-border-strong] focus:border-[--color-accent-cyan]'
                  }`}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={e => {
                    setFormData({ ...formData, description: e.target.value });
                    if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border text-sm text-[--color-text-primary] focus:outline-none focus:bg-[--color-surface-1] transition-colors ${
                    errors.description ? 'border-red-400 focus:border-red-400' : 'border-[--color-border-strong] focus:border-[--color-accent-cyan]'
                  }`}
                />
                {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Department <span className="text-red-400">*</span>
                </label>
                <select 
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-strong] text-sm text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-cyan]"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d} className="bg-[--color-surface-1] text-[--color-text-primary]">{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Complexity <span className="text-red-400">*</span>
                </label>
                <select 
                  value={formData.complexity}
                  onChange={e => setFormData({ ...formData, complexity: e.target.value as 'High' | 'Medium' | 'Low' })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-strong] text-sm text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-cyan]"
                >
                  {COMPLEXITIES.map(c => (
                    <option key={c} value={c} className="bg-[--color-surface-1] text-[--color-text-primary]">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Client / Sponsor
                </label>
                <input 
                  type="text"
                  value={formData.client}
                  onChange={e => setFormData({ ...formData, client: e.target.value })}
                  placeholder="e.g. Global FinCorp"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-strong] text-sm text-[--color-text-primary] placeholder-[--color-text-muted] focus:outline-none focus:bg-[--color-surface-1] focus:border-[--color-accent-cyan]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Project Lead / Manager
                </label>
                <input 
                  type="text"
                  value={formData.projectManager}
                  onChange={e => setFormData({ ...formData, projectManager: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-strong] text-sm text-[--color-text-primary] placeholder-[--color-text-muted] focus:outline-none focus:bg-[--color-surface-1] focus:border-[--color-accent-cyan]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Execution Status, Risk & Progress */}
          <div className="space-y-4 pt-4 border-t border-[--color-border-subtle]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-text-muted]">
              Execution & Progress
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Priority <span className="text-red-400">*</span>
                </label>
                <select 
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as 'Critical' | 'High' | 'Medium' | 'Low' })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-strong] text-sm text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-cyan]"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p} className="bg-[--color-surface-1] text-[--color-text-primary]">{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Status <span className="text-red-400">*</span>
                </label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as 'Planning' | 'Active' | 'On Track' | 'At Risk' | 'Completed' })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-strong] text-sm text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-cyan]"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s} className="bg-[--color-surface-1] text-[--color-text-primary]">{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Overall Risk <span className="text-red-400">*</span>
                </label>
                <select 
                  value={formData.overallRisk}
                  onChange={e => setFormData({ ...formData, overallRisk: e.target.value as 'Low' | 'Medium' | 'High' })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-strong] text-sm text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-cyan]"
                >
                  {RISKS.map(r => (
                    <option key={r} value={r} className="bg-[--color-surface-1] text-[--color-text-primary]">{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Progress ({formData.progress}%)
                </label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={e => setFormData({ ...formData, progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-strong] text-sm text-[--color-text-primary] focus:outline-none focus:bg-[--color-surface-1] focus:border-[--color-accent-cyan]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Timeline & Team Capacity */}
          <div className="space-y-4 pt-4 border-t border-[--color-border-subtle]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-text-muted]">
              Timeline & Staffing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Start Date <span className="text-red-400">*</span>
                </label>
                <input 
                  type="date"
                  value={formData.startDate}
                  onChange={e => {
                    setFormData({ ...formData, startDate: e.target.value });
                    if (errors.startDate) setErrors(prev => ({ ...prev, startDate: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border text-sm text-[--color-text-primary] focus:outline-none focus:bg-[--color-surface-1] ${
                    errors.startDate ? 'border-red-400 focus:border-red-400' : 'border-[--color-border-strong] focus:border-[--color-accent-cyan]'
                  }`}
                />
                {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Deadline <span className="text-red-400">*</span>
                </label>
                <input 
                  type="date"
                  value={formData.deadline}
                  onChange={e => {
                    setFormData({ ...formData, deadline: e.target.value });
                    if (errors.deadline) setErrors(prev => ({ ...prev, deadline: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border text-sm text-[--color-text-primary] focus:outline-none focus:bg-[--color-surface-1] ${
                    errors.deadline ? 'border-red-400 focus:border-red-400' : 'border-[--color-border-strong] focus:border-[--color-accent-cyan]'
                  }`}
                />
                {errors.deadline && <p className="text-red-400 text-xs mt-1">{errors.deadline}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Target Team Size <span className="text-red-400">*</span>
                </label>
                <input 
                  type="number"
                  min="1"
                  max="100"
                  value={formData.teamSize}
                  onChange={e => setFormData({ ...formData, teamSize: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-strong] text-sm text-[--color-text-primary] focus:outline-none focus:bg-[--color-surface-1] focus:border-[--color-accent-cyan]"
                />
                {errors.teamSize && <p className="text-red-400 text-xs mt-1">{errors.teamSize}</p>}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-6 border-t border-[--color-border-subtle] flex items-center justify-end gap-3 bg-[--color-surface-1]">
            <button
              type="button"
              onClick={handleAttemptClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-[--color-border-strong] text-sm font-bold text-[--color-text-secondary] hover:bg-[--color-surface-2] hover:text-[--color-text-primary] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl btn-primary font-bold text-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
