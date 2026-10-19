import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Fingerprint, 
  ExternalLink, 
  FileText, 
  Check, 
  RotateCcw, 
  Save, 
  Server,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PrivacyPreferences } from '../../types/settings';

interface PrivacySecuritySectionProps {
  initialPrivacy: PrivacyPreferences;
  onSave: (privacy: PrivacyPreferences) => Promise<void>;
  isSaving: boolean;
  onMarkModified: (isModified: boolean) => void;
}

export const PrivacySecuritySection: React.FC<PrivacySecuritySectionProps> = ({
  initialPrivacy,
  onSave,
  isSaving,
  onMarkModified
}) => {
  const [formData, setFormData] = useState<PrivacyPreferences>(initialPrivacy);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setFormData(initialPrivacy);
  }, [initialPrivacy]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialPrivacy);

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
    setFormData(initialPrivacy);
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
              Privacy & Security
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Session monitoring, anonymous product telemetry, and enterprise compliance references.
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
            <span>Privacy preferences saved to active session.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Active Session Telemetry Card */}
          <div 
            className="p-5 rounded-2xl border space-y-3 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)'
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-[var(--color-accent-cyan)]" />
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Active Client Session Telemetry
                </h3>
              </div>
              <span 
                className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-1)',
                  borderColor: 'var(--color-accent-lime)',
                  color: 'var(--color-accent-lime)'
                }}
              >
                Session Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-muted)' }}>
                  Client Address
                </span>
                <span className="text-xs font-mono font-bold block mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                  {formData.clientIp}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-muted)' }}>
                  Host Device & Browser
                </span>
                <span className="text-xs font-semibold block mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                  {formData.browserDevice}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-muted)' }}>
                  Session Duration
                </span>
                <span className="text-xs font-mono font-semibold block mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                  {formData.sessionDuration}
                </span>
              </div>
            </div>
          </div>

          {/* Telemetry Preference Toggle */}
          <div 
            className="p-4 rounded-xl border flex items-center justify-between gap-4 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)'
            }}
          >
            <div>
              <span className="text-xs font-bold block" style={{ color: 'var(--color-text-primary)' }}>
                Demonstration Telemetry & Algorithm Training Diagnostics
              </span>
              <span className="text-[11px] block mt-0.5 leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
                Share anonymized component latency and interaction metrics to optimize AWIS dimensional scoring heuristics.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, shareTelemetry: !prev.shareTelemetry }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.shareTelemetry ? 'bg-[var(--color-accent-cyan)]' : 'bg-slate-400'
              }`}
              role="switch"
              aria-checked={formData.shareTelemetry}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.shareTelemetry ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Legal Compliance & Policies */}
          <div 
            className="p-4 rounded-xl border space-y-2.5 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)'
            }}
          >
            <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-secondary)' }}>
              Data Governance & Regulatory Policies
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/privacy"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:border-[var(--color-accent-cyan)] transition-colors shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-1)',
                  borderColor: 'var(--color-border-strong)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <FileText className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
                <span>Privacy Policy</span>
                <ExternalLink className="w-3 h-3 text-[var(--color-text-muted)]" />
              </Link>

              <Link
                to="/terms"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:border-[var(--color-accent-cyan)] transition-colors shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-1)',
                  borderColor: 'var(--color-border-strong)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <FileText className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
                <span>Terms of Service</span>
                <ExternalLink className="w-3 h-3 text-[var(--color-text-muted)]" />
              </Link>

              <Link
                to="/cookie-policy"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:border-[var(--color-accent-cyan)] transition-colors shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-1)',
                  borderColor: 'var(--color-border-strong)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <FileText className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
                <span>Cookie Policy</span>
                <ExternalLink className="w-3 h-3 text-[var(--color-text-muted)]" />
              </Link>
            </div>
          </div>

          {/* Honest Roadmap: Enterprise Security Capabilities */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Enterprise Security Controls (Backend Integration Roadmap)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* MFA Card */}
              <div 
                className="p-4 rounded-xl border space-y-2 opacity-85 shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border-strong)'
                }}
              >
                <div className="flex items-center justify-between">
                  <Fingerprint className="w-5 h-5 text-purple-400" />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Phase 2 API
                  </span>
                </div>
                <div className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Multi-Factor Auth (MFA)
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Hardware FIDO2 / TOTP authenticator enrollment requires cryptographic server verification.
                </p>
              </div>

              {/* SSO Card */}
              <div 
                className="p-4 rounded-xl border space-y-2 opacity-85 shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border-strong)'
                }}
              >
                <div className="flex items-center justify-between">
                  <KeyRound className="w-5 h-5 text-[var(--color-accent-cyan)]" />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Phase 2 API
                  </span>
                </div>
                <div className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  SAML 2.0 / Okta SSO
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Enterprise IdP federation will connect to corporate identity directories in future backend phases.
                </p>
              </div>

              {/* RBAC Audit Card */}
              <div 
                className="p-4 rounded-xl border space-y-2 opacity-85 shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border-strong)'
                }}
              >
                <div className="flex items-center justify-between">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Phase 2 API
                  </span>
                </div>
                <div className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Immutable Audit Logs
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Append-only cryptographic security audit logs will be persisted to dedicated SIEM collectors.
                </p>
              </div>
            </div>
          </div>

          {/* Actions Toolbar */}
          <div className="flex items-center justify-between pt-4 border-t flex-wrap gap-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
              <span>NEXAWIS frontend does not store passwords or unauthorized credential cookies.</span>
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
                <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
