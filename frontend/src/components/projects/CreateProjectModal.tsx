import { useState, type FormEvent, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, Info, Loader2 } from 'lucide-react';
import { useProjects, type CreateProjectInput } from '../../context/ProjectsContext';
import type { ProjectRequirement } from '../../data/mockProjects';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
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
const COMPLEXITIES: Array<'High' | 'Medium' | 'Low'> = ['High', 'Medium', 'Low'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { createProject } = useProjects();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: 'Engineering',
    priority: 'High' as 'Critical' | 'High' | 'Medium' | 'Low',
    status: 'Planning' as 'Planning' | 'Active' | 'On Track' | 'At Risk' | 'Completed',
    startDate: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    teamSize: 4,
    complexity: 'Medium' as 'High' | 'Medium' | 'Low',
    client: '',
    projectManager: ''
  });

  const [requirements, setRequirements] = useState<ProjectRequirement[]>([
    { skill: 'React', priority: 'High', level: 'Advanced' },
    { skill: 'TypeScript', priority: 'Medium', level: 'Intermediate' }
  ]);

  const [newSkill, setNewSkill] = useState('');
  const [newSkillPriority, setNewSkillPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [newSkillLevel, setNewSkillLevel] = useState('Advanced');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverNotice, setServerNotice] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Project name must be at least 3 characters';
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

    if (!formData.teamSize || formData.teamSize < 1) {
      newErrors.teamSize = 'Team size must be at least 1 member';
    }

    if (requirements.length === 0) {
      newErrors.requirements = 'At least one required skill is recommended';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (requirements.some(r => r.skill.toLowerCase() === newSkill.trim().toLowerCase())) {
      setErrors(prev => ({ ...prev, skill: 'Skill already added' }));
      return;
    }
    setRequirements(prev => [
      ...prev,
      { skill: newSkill.trim(), priority: newSkillPriority, level: newSkillLevel }
    ]);
    setNewSkill('');
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.skill;
      delete copy.requirements;
      return copy;
    });
  };

  const handleRemoveSkill = (index: number) => {
    setRequirements(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerNotice(null);

    try {
      const input: CreateProjectInput = {
        name: formData.name,
        description: formData.description,
        department: formData.department,
        priority: formData.priority,
        status: formData.status,
        startDate: formData.startDate,
        deadline: formData.deadline,
        requirements,
        teamSize: Number(formData.teamSize),
        complexity: formData.complexity,
        client: formData.client || undefined,
        projectManager: formData.projectManager || undefined
      };

      const res = await createProject(input);

      if (res.success) {
        onClose();
      } else {
        setServerNotice(res.error || 'Failed to create project');
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={() => !isSubmitting && onClose()} 
      />

      {/* NEXAWIS Styled Modal Dialog */}
      <div className="relative w-full max-w-3xl card-base p-0 overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col border border-[--color-border-strong]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[--color-border-subtle] bg-[--color-surface-2]">
          <div>
            <h2 className="text-xl font-display font-bold text-[--color-text-primary]">
              Create New Project
            </h2>
            <p className="text-xs text-[--color-text-secondary] mt-0.5">
              Define requirements, timeline, and staffing goals for AWIS intelligence.
            </p>
          </div>
          <button 
            onClick={onClose}
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
            <strong>Local Project Store:</strong> Newly created projects are stored in your active workspace session. (Remote API <code className="text-[11px] font-mono bg-[--color-accent-cyan]/15 px-1 py-0.5 rounded">POST /api/projects</code> is pending backend deployment).
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[--color-surface-1]">
          
          {serverNotice && (
            <div className="p-3.5 rounded-xl bg-red-400/10 border border-red-400/30 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverNotice}</span>
            </div>
          )}

          {/* Basic Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-text-muted]">
              1. Project Fundamentals
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
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
                  placeholder="e.g. Apollo Quantum Core"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border text-sm text-[--color-text-primary] placeholder-[--color-text-muted] focus:outline-none focus:bg-[--color-surface-1] transition-colors ${
                    errors.name ? 'border-red-400 focus:border-red-400' : 'border-[--color-border-strong] focus:border-[--color-accent-cyan]'
                  }`}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Description */}
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
                  placeholder="Provide an overview of the project scope, technical context, and intended impact..."
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border text-sm text-[--color-text-primary] placeholder-[--color-text-muted] focus:outline-none focus:bg-[--color-surface-1] transition-colors ${
                    errors.description ? 'border-red-400 focus:border-red-400' : 'border-[--color-border-strong] focus:border-[--color-accent-cyan]'
                  }`}
                />
                {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
              </div>

              {/* Department */}
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

              {/* Client / Sponsor */}
              <div>
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Client / Stakeholder <span className="text-[--color-text-muted] font-normal">(Optional)</span>
                </label>
                <input 
                  type="text"
                  value={formData.client}
                  onChange={e => setFormData({ ...formData, client: e.target.value })}
                  placeholder="e.g. Global FinCorp"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-strong] text-sm text-[--color-text-primary] placeholder-[--color-text-muted] focus:outline-none focus:border-[--color-accent-cyan]"
                />
              </div>

              {/* Project Manager */}
              <div>
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Project Lead / Manager <span className="text-[--color-text-muted] font-normal">(Optional)</span>
                </label>
                <input 
                  type="text"
                  value={formData.projectManager}
                  onChange={e => setFormData({ ...formData, projectManager: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-strong] text-sm text-[--color-text-primary] placeholder-[--color-text-muted] focus:outline-none focus:border-[--color-accent-cyan]"
                />
              </div>

              {/* Complexity */}
              <div>
                <label className="block text-xs font-bold text-[--color-text-secondary] mb-1.5">
                  Project Complexity <span className="text-red-400">*</span>
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
            </div>
          </div>

          {/* Status, Priority & Dates */}
          <div className="space-y-4 pt-4 border-t border-[--color-border-subtle]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-text-muted]">
              2. Status & Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Priority */}
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

              {/* Status */}
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

              {/* Start Date */}
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
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border text-sm text-[--color-text-primary] focus:outline-none ${
                    errors.startDate ? 'border-red-400' : 'border-[--color-border-strong] focus:border-[--color-accent-cyan]'
                  }`}
                />
                {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate}</p>}
              </div>

              {/* Deadline */}
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
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[--color-surface-2] border text-sm text-[--color-text-primary] focus:outline-none ${
                    errors.deadline ? 'border-red-400' : 'border-[--color-border-strong] focus:border-[--color-accent-cyan]'
                  }`}
                />
                {errors.deadline && <p className="text-red-400 text-xs mt-1">{errors.deadline}</p>}
              </div>
            </div>
          </div>

          {/* Team Size & Required Skills */}
          <div className="space-y-4 pt-4 border-t border-[--color-border-subtle]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-text-muted]">
                3. Workforce & Skills Requirements
              </h3>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[--color-text-secondary]">Target Team Size <span className="text-red-400">*</span>:</label>
                <input 
                  type="number"
                  min="1"
                  max="100"
                  value={formData.teamSize}
                  onChange={e => setFormData({ ...formData, teamSize: parseInt(e.target.value) || 1 })}
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-[--color-surface-2] border border-[--color-border-strong] text-sm text-[--color-text-primary] text-center font-bold"
                />
              </div>
            </div>
            {errors.teamSize && <p className="text-red-400 text-xs">{errors.teamSize}</p>}

            {/* Existing Skills list */}
            <div className="space-y-2">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle] text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[--color-text-primary]">{req.skill}</span>
                    <span className="px-2 py-0.5 rounded bg-[--color-surface-1] text-[--color-text-secondary] border border-[--color-border-subtle]">
                      {req.level}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      req.priority === 'High' ? 'text-[--color-accent-cyan] bg-[--color-accent-cyan]/10 border border-[--color-accent-cyan]/20' :
                      req.priority === 'Medium' ? 'text-[--color-text-secondary] bg-[--color-surface-1] border border-[--color-border-subtle]' :
                      'text-[--color-text-muted] bg-[--color-surface-1] border border-[--color-border-subtle]'
                    }`}>
                      {req.priority} Priority
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleRemoveSkill(idx)}
                    className="text-[--color-text-muted] hover:text-red-400 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add skill row */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <input 
                type="text"
                placeholder="Skill name (e.g. Rust, PyTorch, Kubernetes)"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-[--color-surface-2] border border-[--color-border-strong] text-xs text-[--color-text-primary] placeholder-[--color-text-muted] focus:outline-none focus:border-[--color-accent-cyan]"
              />
              <select 
                value={newSkillLevel}
                onChange={e => setNewSkillLevel(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[--color-surface-2] border border-[--color-border-strong] text-xs text-[--color-text-primary]"
              >
                {SKILL_LEVELS.map(lvl => (
                  <option key={lvl} value={lvl} className="bg-[--color-surface-1] text-[--color-text-primary]">{lvl}</option>
                ))}
              </select>
              <select 
                value={newSkillPriority}
                onChange={e => setNewSkillPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                className="px-3 py-2 rounded-xl bg-[--color-surface-2] border border-[--color-border-strong] text-xs text-[--color-text-primary]"
              >
                <option value="High" className="bg-[--color-surface-1] text-[--color-text-primary]">High</option>
                <option value="Medium" className="bg-[--color-surface-1] text-[--color-text-primary]">Medium</option>
                <option value="Low" className="bg-[--color-surface-1] text-[--color-text-primary]">Low</option>
              </select>
              <button 
                type="button"
                onClick={handleAddSkill}
                className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-[--color-surface-2] hover:bg-[--color-surface-1] border border-[--color-border-strong] text-xs font-bold text-[--color-text-primary] transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[--color-accent-cyan]" />
                <span>Add Skill</span>
              </button>
            </div>
            {errors.skill && <p className="text-red-400 text-xs">{errors.skill}</p>}
            {errors.requirements && <p className="text-red-400 text-xs">{errors.requirements}</p>}
          </div>

          {/* Modal Footer */}
          <div className="pt-6 border-t border-[--color-border-subtle] flex items-center justify-end gap-3 bg-[--color-surface-1]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-[--color-border-strong] text-sm font-bold text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-surface-2] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl btn-primary font-bold text-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Project...</span>
                </>
              ) : (
                <span>Create Project</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
