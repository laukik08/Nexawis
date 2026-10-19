import React from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isResetting?: boolean;
}

export const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isResetting = false
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
    >
      <div 
        className="card-base max-w-md w-full p-6 sm:p-7 rounded-2xl border shadow-2xl space-y-4"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-strong)'
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div 
              className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: '#f59e0b',
                color: '#f59e0b'
              }}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="reset-modal-title" className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Reset to Factory Defaults?
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                This will revert all modified session settings across profile, regional localization, appearance, notifications, and workspace defaults back to standard NEXAWIS presets.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border transition-colors cursor-pointer hover:border-[var(--color-accent-cyan)] shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-muted)'
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div 
          className="p-3.5 rounded-xl border text-xs"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border-strong)',
            color: 'var(--color-text-secondary)'
          }}
        >
          <span className="font-bold text-[var(--color-text-primary)]">Scope of Reset:</span>
          <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
            <li>Restores default profile (Alex Rivera, Data & AI)</li>
            <li>Resets language to English (US) and timezone to Eastern</li>
            <li>Resets notification channel alerts to standard levels</li>
            <li>Workspace filters reset to organization-wide scope</li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isResetting}
            className="px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
            style={{
              backgroundColor: '#f59e0b',
              color: '#000000'
            }}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting...' : 'Confirm Reset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
