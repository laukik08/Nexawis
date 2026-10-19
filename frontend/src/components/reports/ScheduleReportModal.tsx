import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Mail, 
  Plus, 
  Check, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import type { ScheduledReportDef, ReportCategory, ReportFormat } from '../../types/reports';

interface ScheduleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: ScheduledReportDef[];
  onSaveSchedule: (schedule: Omit<ScheduledReportDef, 'id' | 'createdAt'>) => Promise<void>;
  onToggleSchedule: (id: string) => Promise<void>;
}

export const ScheduleReportModal: React.FC<ScheduleReportModalProps> = ({
  isOpen,
  onClose,
  schedules,
  onSaveSchedule,
  onToggleSchedule
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ReportCategory>('executive');
  const [frequency, setFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [nextRunDate, setNextRunDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [department, setDepartment] = useState('All');
  const [format, setFormat] = useState<ReportFormat>('PDF');
  const [emailInput, setEmailInput] = useState('');
  const [recipients, setRecipients] = useState<string[]>(['executive-team@nexawis.internal']);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddEmail = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = emailInput.trim();
    if (!clean) return;
    if (!clean.includes('@')) {
      setError('Please provide a valid email format');
      return;
    }
    if (!recipients.includes(clean)) {
      setRecipients([...recipients, clean]);
    }
    setEmailInput('');
    setError(null);
  };

  const handleRemoveEmail = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Schedule name is required');
      return;
    }
    if (recipients.length === 0) {
      setError('At least one recipient email address is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSaveSchedule({
        name: name.trim(),
        category,
        frequency,
        nextRunDate,
        recipients,
        enabled,
        format,
        department
      });

      setSuccessMessage('Demonstration schedule saved successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
        setActiveTab('list');
        // Reset form
        setName('');
        setRecipients(['team-leads@nexawis.internal']);
      }, 1200);
    } catch {
      setError('Failed to save schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
    >
      <div className="card-base max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[var(--color-border)] relative my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-teal-500)',
                color: 'var(--color-teal-500)'
              }}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 id="schedule-modal-title" className="text-lg font-bold text-[var(--color-text)]">
                Automated Report Scheduling
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Demonstration recurring report generation and mock distribution profiles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        <div 
          className="my-4 p-3 rounded-xl flex items-start gap-2.5 text-xs border shadow-xs"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            borderLeft: '4px solid var(--color-teal-500)',
            color: 'var(--color-text)'
          }}
        >
          <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-teal-400">Demonstration Scheduling: </span>
            <span className="text-[var(--color-text-secondary)]">
              Scheduled configs are stored in mock service state. No real background workers, SMTP mailers, or recurring crons are active in this frontend phase.
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mb-6 p-1 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)]">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            Active Schedules ({schedules.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Schedule</span>
          </button>
        </div>

        {/* Tab 1: Schedules List */}
        {activeTab === 'list' && (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {schedules.length === 0 ? (
              <div className="text-center py-10 text-xs text-[var(--color-text-secondary)]">
                No active report schedules found. Create your first automated schedule.
              </div>
            ) : (
              schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-500/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-[var(--color-text)]">
                        {schedule.name}
                      </h4>
                      <span 
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize border shadow-xs"
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          borderColor: 'var(--color-teal-500)',
                          color: 'var(--color-teal-500)'
                        }}
                      >
                        {schedule.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                        {schedule.frequency}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)] flex-wrap pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-400" />
                        Next Run: {schedule.nextRunDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        {schedule.recipients.length} {schedule.recipients.length === 1 ? 'recipient' : 'recipients'}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      {schedule.enabled ? 'Enabled' : 'Paused'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleSchedule(schedule.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        schedule.enabled ? 'bg-teal-500' : 'bg-[var(--color-border)]'
                      }`}
                      role="switch"
                      aria-checked={schedule.enabled}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          schedule.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Create Schedule Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div 
                className="p-3 rounded-lg border text-xs flex items-center gap-2 shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: '#ef4444',
                  color: '#ef4444'
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div 
                className="p-3 rounded-lg border text-xs flex items-center gap-2 shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-teal-500)',
                  color: 'var(--color-teal-500)'
                }}
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                Schedule Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Weekly Executive Workforce Digest"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  Report Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReportCategory)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-teal-500"
                >
                  <option value="executive">Executive</option>
                  <option value="workforce">Workforce</option>
                  <option value="projects">Projects</option>
                  <option value="team_formation">Team Formation</option>
                  <option value="awis_intelligence">AWIS Intelligence</option>
                  <option value="sustainability">Sustainability</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-teal-500"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  First Run Date
                </label>
                <input
                  type="date"
                  value={nextRunDate}
                  onChange={(e) => setNextRunDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  Department Scope
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-teal-500"
                >
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Design">Design</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  Export Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ReportFormat)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-teal-500"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="CSV">CSV Data Export</option>
                </select>
              </div>
            </div>

            {/* Recipient Emails */}
            <div>
              <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                Recipient Email Addresses *
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleAddEmail}
                  placeholder="e.g. director@nexawis.internal (Press Enter)"
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="btn-secondary px-3 py-2 text-xs font-semibold cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Recipient Chips */}
              <div className="flex flex-wrap gap-2 mt-2.5">
                {recipients.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text)]"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="text-[var(--color-text-secondary)] hover:text-rose-400 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Enable switch */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="schedule-enabled-check"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded border-[var(--color-border)] text-teal-500 focus:ring-teal-500 h-4 w-4"
              />
              <label htmlFor="schedule-enabled-check" className="text-xs font-medium text-[var(--color-text)] cursor-pointer">
                Enable schedule immediately upon creation
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary px-5 py-2 text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Saving Schedule...' : 'Save Schedule'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
