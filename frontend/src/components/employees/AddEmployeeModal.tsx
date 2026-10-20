import { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { employeeService } from '../../services/employeeService';
import type { Employee } from '../../types/employee';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEmployee: Employee) => void;
}

export function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [role, setRole] = useState('');
  const [experienceYears, setExperienceYears] = useState('3.0');
  const [status, setStatus] = useState('Available');
  const [skillsStr, setSkillsStr] = useState('React, TypeScript');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const parsedSkills = skillsStr
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map((s, idx) => ({
          name: s,
          proficiency: idx === 0 ? 90 : 80,
          isPrimary: idx < 2,
        }));

      const created = await employeeService.createEmployee({
        employeeId: employeeId.trim(),
        name: name.trim(),
        email: email.trim(),
        department: department.trim(),
        role: role.trim(),
        experienceYears: parseFloat(experienceYears) || 0,
        status,
        skills: parsedSkills,
      });

      onSuccess(created);
      onClose();
      // Reset form
      setEmployeeId('');
      setName('');
      setEmail('');
      setRole('');
      setSkillsStr('React, TypeScript');
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Failed to create employee';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-lg bg-[--color-surface-1] border border-[--color-border-strong] rounded-2xl p-6 md:p-8 shadow-2xl relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[--color-border-subtle]">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-[--color-accent-cyan]/10 text-[--color-accent-cyan] border border-[--color-accent-cyan]/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[--color-text-primary]">Add New Employee</h2>
                  <p className="text-xs text-[--color-text-muted]">Onboard persistent workforce record to workspace</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-[--color-text-muted] hover:text-[--color-text-primary] p-2 rounded-lg hover:bg-[--color-surface-2] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-400/10 border border-red-400/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider">
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. NXW-1045"
                    className="w-full px-3 py-2 bg-[--color-surface-2] border border-[--color-border-subtle] rounded-xl text-sm text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent-cyan]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-2 bg-[--color-surface-2] border border-[--color-border-subtle] rounded-xl text-sm text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent-cyan]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider">
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.doe@company.com"
                  className="w-full px-3 py-2 bg-[--color-surface-2] border border-[--color-border-subtle] rounded-xl text-sm text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent-cyan]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider">
                    Department *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-[--color-surface-2] border border-[--color-border-subtle] rounded-xl text-sm text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent-cyan]"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Data">Data</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider">
                    Job Title / Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Full Stack Engineer"
                    className="w-full px-3 py-2 bg-[--color-surface-2] border border-[--color-border-subtle] rounded-xl text-sm text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent-cyan]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3 py-2 bg-[--color-surface-2] border border-[--color-border-subtle] rounded-xl text-sm text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent-cyan]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[--color-surface-2] border border-[--color-border-subtle] rounded-xl text-sm text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent-cyan]"
                  >
                    <option value="Available">Available</option>
                    <option value="Allocated">Allocated</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Overloaded">Overloaded</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="e.g. React, Node.js, Python, AWS"
                  className="w-full px-3 py-2 bg-[--color-surface-2] border border-[--color-border-subtle] rounded-xl text-sm text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent-cyan]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[--color-border-subtle]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-[--color-border-strong] text-[--color-text-secondary] hover:text-[--color-text-primary] text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 btn-primary px-6 py-2.5 rounded-xl font-bold disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>{loading ? 'Creating...' : 'Create Employee'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
