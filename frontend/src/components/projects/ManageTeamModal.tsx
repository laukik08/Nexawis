import { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, AlertCircle, CheckCircle2, CheckCircle, Loader2 } from 'lucide-react';
import { useProjects } from '../../context/ProjectsContext';
import { employeeService } from '../../services/employeeService';
import { mockEmployees } from '../../data/mockEmployees';
import type { Employee } from '../../types/employee';
import type { Project, ProjectTeamMember } from '../../data/mockProjects';

interface ManageTeamModalProps {
  isOpen: boolean;
  project: Project;
  onClose: () => void;
}

export function ManageTeamModal({ isOpen, project, onClose }: ManageTeamModalProps) {
  const { addTeamMember, removeTeamMember } = useProjects();

  const [employeesList, setEmployeesList] = useState<Employee[]>(mockEmployees);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [allocationPercent, setAllocationPercent] = useState(100);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch live workspace employees when modal opens
  useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      employeeService
        .getEmployees({ pageSize: 100 })
        .then(res => {
          if (isMounted && res.items && res.items.length > 0) {
            setEmployeesList(res.items);
          }
        })
        .catch(err => {
          console.warn('[ManageTeamModal] Using default employee list:', err);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [isOpen]);

  // Available employees who are not already on the team
  const availableEmployees = employeesList.filter(
    emp => !project.currentTeam.some(m => m.id === emp.id || m.id === emp.employeeId || m.name.toLowerCase() === emp.name.toLowerCase())
  );

  // Auto-fill role when employee selected
  useEffect(() => {
    if (selectedEmpId) {
      const emp = employeesList.find(e => e.id === selectedEmpId || e.employeeId === selectedEmpId);
      if (emp) {
        setMemberRole(emp.role);
      }
    } else {
      setMemberRole('');
    }
  }, [selectedEmpId, employeesList]);

  // Clear feedback when modal opens
  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setSelectedEmpId('');
      setMemberRole('');
      setAllocationPercent(100);
    }
  }, [isOpen]);

  // Close on Escape
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

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      setFeedback({ type: 'error', message: 'Please select an employee to assign.' });
      return;
    }

    const emp = employeesList.find(e => e.id === selectedEmpId || e.employeeId === selectedEmpId);
    if (!emp) {
      setFeedback({ type: 'error', message: 'Employee not found in workforce directory.' });
      return;
    }

    // Check duplicate
    if (project.currentTeam.some(m => m.id === emp.id || m.id === emp.employeeId)) {
      setFeedback({ type: 'error', message: `${emp.name} is already assigned to this project.` });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const primarySkill = emp.skills.find(s => s.isPrimary)?.name || emp.skills[0]?.name || 'General';

    const newMember: ProjectTeamMember = {
      id: emp.id,
      name: emp.name,
      avatarUrl: emp.avatarUrl,
      role: memberRole.trim() || emp.role,
      primarySkill,
      allocationPercent: Number(allocationPercent) || 100,
      performanceScore: emp.performanceScore,
      teamFit: Math.round(emp.awisFitScore || 90),
      wellbeingRisk: emp.wellbeingRisk
    };

    const res = await addTeamMember(project.id, newMember);

    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', message: `${emp.name} added to ${project.name} successfully.` });
      setSelectedEmpId('');
      setMemberRole('');
      setAllocationPercent(100);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to assign team member.' });
    }
  };

  const handleRemoveMember = async (member: ProjectTeamMember) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await removeTeamMember(project.id, member.id);

    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', message: `${member.name} removed from the project team.` });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to remove team member.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Solid Opaque Modal Dialog */}
      <div className="relative w-full max-w-4xl card-base p-0 rounded-2xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden border border-[--color-border-strong]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[--color-border-subtle] bg-[--color-surface-2]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[--color-text-secondary] bg-[--color-surface-1] border border-[--color-border-subtle] px-2 py-0.5 rounded">
                {project.projectId}
              </span>
              <span className="text-xs text-[--color-accent-cyan] font-bold">Team Allocation</span>
            </div>
            <h2 className="text-xl font-display font-bold text-[--color-text-primary]">
              Manage Team — {project.name}
            </h2>
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
        <div className="px-6 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2.5 text-xs text-[--color-text-primary]">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <strong>Active Workspace Allocation:</strong> Assignments are validated and persisted directly to your workspace database (<code className="text-[11px] font-mono bg-emerald-500/15 px-1 py-0.5 rounded">POST /api/v1/projects/:id/team</code>).
          </span>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3.5 mx-6 mt-4 rounded-xl border text-xs flex items-center gap-2.5 ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
              : 'bg-red-500/10 border-red-500/30 text-red-500'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[--color-surface-1]">
          
          {/* Add Team Member Section */}
          <div className="p-5 rounded-2xl bg-[--color-surface-2] border border-[--color-border-subtle]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-text-primary] flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4 text-[--color-accent-cyan]" />
              <span>Assign Workforce Member</span>
            </h3>

            {availableEmployees.length === 0 ? (
              <p className="text-xs text-[--color-text-muted] italic">
                All registered employees in the workforce directory are currently allocated to this project.
              </p>
            ) : (
              <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Employee select */}
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-bold text-[--color-text-secondary] mb-1">
                    Select Employee
                  </label>
                  <select
                    value={selectedEmpId}
                    onChange={e => setSelectedEmpId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[--color-surface-1] border border-[--color-border-strong] text-xs text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-cyan]"
                  >
                    <option value="" className="bg-[--color-surface-1]">Choose an employee...</option>
                    {availableEmployees.map(emp => (
                      <option key={emp.id} value={emp.id} className="bg-[--color-surface-1]">
                        {emp.name} — {emp.role} ({emp.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role in Project */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-[--color-text-secondary] mb-1">
                    Project Role
                  </label>
                  <input
                    type="text"
                    value={memberRole}
                    onChange={e => setMemberRole(e.target.value)}
                    placeholder="e.g. Lead Architect"
                    className="w-full px-3 py-2 rounded-xl bg-[--color-surface-1] border border-[--color-border-strong] text-xs text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-cyan]"
                  />
                </div>

                {/* Allocation % */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[--color-text-secondary] mb-1">
                    Allocation %
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="150"
                    step="10"
                    value={allocationPercent}
                    onChange={e => setAllocationPercent(parseInt(e.target.value) || 100)}
                    className="w-full px-3 py-2 rounded-xl bg-[--color-surface-1] border border-[--color-border-strong] text-xs text-[--color-text-primary] text-center font-bold focus:outline-none focus:border-[--color-accent-cyan]"
                  />
                </div>

                {/* Submit button */}
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedEmpId}
                    className="w-full py-2 px-3 rounded-xl btn-primary font-bold text-xs flex items-center justify-center space-x-1 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Assign</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Current Assigned Team Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[--color-text-muted]">
                Currently Assigned Team ({project.currentTeam.length} / {project.teamSize} target)
              </h3>
              <span className="text-xs text-[--color-text-secondary]">
                Capacity Allocated: <strong className="text-[--color-text-primary]">{project.capacity.allocated} hrs</strong>
              </span>
            </div>

            {project.currentTeam.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-[--color-border-strong] bg-[--color-surface-2] text-xs text-[--color-text-muted]">
                No workforce members are currently assigned to this project. Use the form above to assign employees.
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-[--color-border-subtle] bg-[--color-surface-1]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[--color-border-subtle] bg-[--color-surface-2] text-[--color-text-secondary] uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Project Role</th>
                      <th className="py-3 px-4">Primary Skill</th>
                      <th className="py-3 px-4 text-center">Allocation</th>
                      <th className="py-3 px-4 text-center">Team Fit</th>
                      <th className="py-3 px-4 text-center">Wellbeing Risk</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[--color-border-subtle]">
                    {project.currentTeam.map(member => (
                      <tr key={member.id} className="hover:bg-[--color-surface-2]/60 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={member.avatarUrl} 
                              alt={member.name}
                              className="w-8 h-8 rounded-full border border-[--color-border-strong] shrink-0 object-cover" 
                            />
                            <div>
                              <div className="font-bold text-[--color-text-primary]">{member.name}</div>
                              <div className="text-[10px] text-[--color-text-muted]">{member.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-[--color-text-secondary] font-medium whitespace-nowrap">
                          {member.role}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-secondary] font-mono text-[11px]">
                            {member.primarySkill}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`font-bold px-2 py-0.5 rounded ${
                            member.allocationPercent > 100 
                              ? 'bg-red-400/10 text-red-500 border border-red-400/30' 
                              : 'bg-[--color-surface-2] text-[--color-text-primary]'
                          }`}>
                            {member.allocationPercent}%
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="font-bold text-[--color-accent-lime]">
                            {member.teamFit}%
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            member.wellbeingRisk === 'High' ? 'bg-red-400/10 text-red-500' :
                            member.wellbeingRisk === 'Moderate' ? 'bg-[--color-accent-cyan]/10 text-[--color-accent-cyan]' :
                            'bg-[--color-accent-lime]/10 text-[--color-accent-lime]'
                          }`}>
                            {member.wellbeingRisk}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member)}
                            disabled={isSubmitting}
                            className="p-1.5 rounded-lg text-[--color-text-muted] hover:text-red-500 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                            title="Remove from project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[--color-border-subtle] bg-[--color-surface-2] flex items-center justify-between">
          <div className="text-xs text-[--color-text-muted]">
            Changes reflect instantly across project intelligence and execution views.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[--color-surface-1] hover:bg-[--color-surface-2] border border-[--color-border-strong] text-xs font-bold text-[--color-text-primary] transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
