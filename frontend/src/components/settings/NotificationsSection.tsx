import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  FolderKanban, 
  Network, 
  BrainCircuit, 
  FileText, 
  Sparkles, 
  Mail, 
  Smartphone, 
  Check, 
  RotateCcw, 
  Save, 
  Info
} from 'lucide-react';
import type { NotificationPreferences } from '../../types/settings';

interface NotificationsSectionProps {
  initialNotifications: NotificationPreferences;
  onSave: (notifications: NotificationPreferences) => Promise<void>;
  isSaving: boolean;
  onMarkModified: (isModified: boolean) => void;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  initialNotifications,
  onSave,
  isSaving,
  onMarkModified
}) => {
  const [formData, setFormData] = useState<NotificationPreferences>(initialNotifications);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setFormData(initialNotifications);
  }, [initialNotifications]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialNotifications);

  const prevDirtyRef = useRef<boolean>(false);
  useEffect(() => {
    if (prevDirtyRef.current !== isDirty) {
      prevDirtyRef.current = isDirty;
      onMarkModified(isDirty);
    }
  }, [isDirty, onMarkModified]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    setFormData(initialNotifications);
  };

  // Helper toggle component
  const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: () => void;
    label: string;
    description: string;
    id: string;
  }> = ({ checked, onChange, label, description, id }) => (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <label htmlFor={id} className="text-xs font-bold block cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </label>
        <span className="text-[11px] block mt-0.5 leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </span>
      </div>

      <button
        type="button"
        id={id}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-[var(--color-accent-cyan)]' : 'bg-slate-400'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  // Group master toggle helpers
  const setAllProjectUpdates = (value: boolean) => {
    setFormData(prev => ({
      ...prev,
      projectUpdates: {
        statusChanges: value,
        deadlines: value,
        riskThreshold: value
      }
    }));
  };

  const setAllTeamFormation = (value: boolean) => {
    setFormData(prev => ({
      ...prev,
      teamFormation: {
        optimizationComplete: value,
        recommendationsReady: value,
        balanceAlerts: value
      }
    }));
  };

  const setAllWorkforce = (value: boolean) => {
    setFormData(prev => ({
      ...prev,
      workforceIntelligence: {
        burnoutRisk: value,
        skillScarcity: value,
        awisFluctuations: value
      }
    }));
  };

  const setAllReports = (value: boolean) => {
    setFormData(prev => ({
      ...prev,
      reports: {
        automatedGenerated: value,
        weeklyDigest: value,
        scheduledDistribution: value
      }
    }));
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
              Notification Preferences
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Configure algorithmic triggers, risk warning alerts, and automated briefing channels.
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

        {/* Informative Disclaimer */}
        <div 
          className="my-4 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs shadow-xs"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border-strong)',
            borderLeft: '4px solid var(--color-accent-cyan)',
            color: 'var(--color-text-primary)'
          }}
        >
          <Info className="w-4 h-4 text-[var(--color-accent-cyan)] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[var(--color-accent-cyan)]">Demonstration Notification Controls: </span>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Toggles update frontend state and alert filters in session memory. No actual SMTP email dispatches, SMS gateways, or background workers are connected during this build phase.
            </span>
          </div>
        </div>

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
            <span>Notification preferences successfully updated in active session.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Global Delivery Channels Banner */}
          <div 
            className="p-4 rounded-xl border shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)'
            }}
          >
            <span className="text-xs font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Active Delivery Channels
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-surface-1)', borderColor: 'var(--color-border-strong)' }}>
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-[var(--color-accent-cyan)]" />
                  <div>
                    <div className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>In-App Topbar Badges</div>
                    <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Real-time bell notification icons</div>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={formData.deliveryChannels.inAppBadge}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    deliveryChannels: { ...prev.deliveryChannels, inAppBadge: e.target.checked }
                  }))}
                  className="rounded border-[var(--color-border-strong)] text-[var(--color-accent-cyan)] h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-surface-1)', borderColor: 'var(--color-border-strong)' }}>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Executive Email Summaries</div>
                    <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Digest sent to alex@nexawis.com</div>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={formData.deliveryChannels.emailDigest}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    deliveryChannels: { ...prev.deliveryChannels, emailDigest: e.target.checked }
                  }))}
                  className="rounded border-[var(--color-border-strong)] text-[var(--color-accent-cyan)] h-4 w-4"
                />
              </div>
            </div>
          </div>

          {/* Group 1: Project Updates */}
          <div 
            className="p-5 rounded-2xl border space-y-3 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)'
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-center gap-2.5">
                <FolderKanban className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Project Updates & Delivery Alerts
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllProjectUpdates(true)}
                  className="text-[11px] font-semibold text-[var(--color-accent-cyan)] hover:underline cursor-pointer"
                >
                  Enable All
                </button>
                <span className="text-[var(--color-text-muted)]">•</span>
                <button
                  type="button"
                  onClick={() => setAllProjectUpdates(false)}
                  className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:underline cursor-pointer"
                >
                  Mute All
                </button>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <ToggleSwitch
                id="toggle-project-status"
                checked={formData.projectUpdates.statusChanges}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  projectUpdates: { ...prev.projectUpdates, statusChanges: !prev.projectUpdates.statusChanges }
                }))}
                label="Milestone Progress & Status Shifts"
                description="Receive updates whenever initiative stages move to In Progress, Staged, or Completed."
              />

              <ToggleSwitch
                id="toggle-project-deadlines"
                checked={formData.projectUpdates.deadlines}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  projectUpdates: { ...prev.projectUpdates, deadlines: !prev.projectUpdates.deadlines }
                }))}
                label="Sprint Deadline Approaching Alerts"
                description="Trigger notices 7 days and 48 hours prior to delivery milestones."
              />

              <ToggleSwitch
                id="toggle-project-risk"
                checked={formData.projectUpdates.riskThreshold}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  projectUpdates: { ...prev.projectUpdates, riskThreshold: !prev.projectUpdates.riskThreshold }
                }))}
                label="High Delivery Risk Warnings (>65%)"
                description="Immediate warnings when resource allocation models predict velocity bottlenecks."
              />
            </div>
          </div>

          {/* Group 2: Team Formation */}
          <div 
            className="p-5 rounded-2xl border space-y-3 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)'
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-center gap-2.5">
                <Network className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Team Formation AI
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllTeamFormation(true)}
                  className="text-[11px] font-semibold text-[var(--color-accent-cyan)] hover:underline cursor-pointer"
                >
                  Enable All
                </button>
                <span className="text-[var(--color-text-muted)]">•</span>
                <button
                  type="button"
                  onClick={() => setAllTeamFormation(false)}
                  className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:underline cursor-pointer"
                >
                  Mute All
                </button>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <ToggleSwitch
                id="toggle-team-opt"
                checked={formData.teamFormation.optimizationComplete}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  teamFormation: { ...prev.teamFormation, optimizationComplete: !prev.teamFormation.optimizationComplete }
                }))}
                label="Formation Optimization Completion"
                description="Notify when team synergy simulation algorithms finish computing candidate configurations."
              />

              <ToggleSwitch
                id="toggle-team-recs"
                checked={formData.teamFormation.recommendationsReady}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  teamFormation: { ...prev.teamFormation, recommendationsReady: !prev.teamFormation.recommendationsReady }
                }))}
                label="AI Staffing Recommendations Ready"
                description="Alert when new candidate matches achieve >80% AWIS synergy fit."
              />

              <ToggleSwitch
                id="toggle-team-balance"
                checked={formData.teamFormation.balanceAlerts}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  teamFormation: { ...prev.teamFormation, balanceAlerts: !prev.teamFormation.balanceAlerts }
                }))}
                label="Cognitive & Skill Diversity Imbalances"
                description="Highlight teams showing critical skill deficits or single-point failure dependencies."
              />
            </div>
          </div>

          {/* Group 3: Workforce Intelligence */}
          <div 
            className="p-5 rounded-2xl border space-y-3 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)'
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-center gap-2.5">
                <BrainCircuit className="w-4 h-4 text-[var(--color-accent-cyan)]" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Workforce Intelligence & Wellbeing
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllWorkforce(true)}
                  className="text-[11px] font-semibold text-[var(--color-accent-cyan)] hover:underline cursor-pointer"
                >
                  Enable All
                </button>
                <span className="text-[var(--color-text-muted)]">•</span>
                <button
                  type="button"
                  onClick={() => setAllWorkforce(false)}
                  className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:underline cursor-pointer"
                >
                  Mute All
                </button>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <ToggleSwitch
                id="toggle-workforce-burnout"
                checked={formData.workforceIntelligence.burnoutRisk}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  workforceIntelligence: { ...prev.workforceIntelligence, burnoutRisk: !prev.workforceIntelligence.burnoutRisk }
                }))}
                label="Workload & Burnout Saturation Alerts"
                description="Notify when any talent allocation exceeds 85% sustained capacity over 3 consecutive weeks."
              />

              <ToggleSwitch
                id="toggle-workforce-scarcity"
                checked={formData.workforceIntelligence.skillScarcity}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  workforceIntelligence: { ...prev.workforceIntelligence, skillScarcity: !prev.workforceIntelligence.skillScarcity }
                }))}
                label="Key Skill Scarcity Deficits"
                description="Alert when critical competencies fall below required bench depth."
              />

              <ToggleSwitch
                id="toggle-workforce-awis"
                checked={formData.workforceIntelligence.awisFluctuations}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  workforceIntelligence: { ...prev.workforceIntelligence, awisFluctuations: !prev.workforceIntelligence.awisFluctuations }
                }))}
                label="AWIS 9-Dimension Composite Deviations"
                description="Broadcast significant departmental shifts in psychological safety or autonomy metrics."
              />
            </div>
          </div>

          {/* Group 4: Reports & Briefings */}
          <div 
            className="p-5 rounded-2xl border space-y-3 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)'
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[var(--color-accent-lime)]" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Reports & Scheduled Briefs
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllReports(true)}
                  className="text-[11px] font-semibold text-[var(--color-accent-cyan)] hover:underline cursor-pointer"
                >
                  Enable All
                </button>
                <span className="text-[var(--color-text-muted)]">•</span>
                <button
                  type="button"
                  onClick={() => setAllReports(false)}
                  className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:underline cursor-pointer"
                >
                  Mute All
                </button>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <ToggleSwitch
                id="toggle-report-gen"
                checked={formData.reports.automatedGenerated}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  reports: { ...prev.reports, automatedGenerated: !prev.reports.automatedGenerated }
                }))}
                label="Report Generation Ready"
                description="Notice when asynchronous PDF / CSV compilation completes in the library."
              />

              <ToggleSwitch
                id="toggle-report-weekly"
                checked={formData.reports.weeklyDigest}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  reports: { ...prev.reports, weeklyDigest: !prev.reports.weeklyDigest }
                }))}
                label="Weekly Executive Workforce Digest"
                description="Automated Monday summary of enterprise allocation, hiring velocity, and delivery score."
              />

              <ToggleSwitch
                id="toggle-report-sched"
                checked={formData.reports.scheduledDistribution}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  reports: { ...prev.reports, scheduledDistribution: !prev.reports.scheduledDistribution }
                }))}
                label="Automated Distribution Confirmations"
                description="Status receipts when automated reports are distributed to stakeholding directors."
              />
            </div>
          </div>

          {/* Group 5: Product Updates */}
          <div 
            className="p-5 rounded-2xl border space-y-3 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)'
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Platform Maintenance & AWIS Model Releases
                </h3>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <ToggleSwitch
                id="toggle-product-maint"
                checked={formData.productUpdates.systemMaintenance}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  productUpdates: { ...prev.productUpdates, systemMaintenance: !prev.productUpdates.systemMaintenance }
                }))}
                label="Scheduled Infrastructure Maintenance"
                description="Early warnings for scheduled maintenance windows and database migrations."
              />

              <ToggleSwitch
                id="toggle-product-features"
                checked={formData.productUpdates.featureAnnouncements}
                onChange={() => setFormData(prev => ({
                  ...prev,
                  productUpdates: { ...prev.productUpdates, featureAnnouncements: !prev.productUpdates.featureAnnouncements }
                }))}
                label="New AWIS Dimensional Models & Feature Releases"
                description="Monthly release notes covering algorithm updates and interface enhancements."
              />
            </div>
          </div>

          {/* Actions Toolbar */}
          <div className="flex items-center justify-between pt-4 border-t flex-wrap gap-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Bell className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
              <span>Notification channel preferences are stored for the current session.</span>
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
                <span>{isSaving ? 'Saving...' : 'Save Notifications'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
