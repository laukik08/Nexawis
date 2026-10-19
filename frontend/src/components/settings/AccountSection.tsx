import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  Clock, 
  Calendar, 
  Compass, 
  Check, 
  RotateCcw, 
  Save 
} from 'lucide-react';
import type { AccountPreferences } from '../../types/settings';
import { 
  languageOptions, 
  timezoneOptions, 
  dateFormatOptions, 
  defaultLandingPageOptions 
} from '../../data/mockSettings';

interface AccountSectionProps {
  initialAccount: AccountPreferences;
  onSave: (account: AccountPreferences) => Promise<void>;
  isSaving: boolean;
  onMarkModified: (isModified: boolean) => void;
}

export const AccountSection: React.FC<AccountSectionProps> = ({
  initialAccount,
  onSave,
  isSaving,
  onMarkModified
}) => {
  const [formData, setFormData] = useState<AccountPreferences>(initialAccount);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setFormData(initialAccount);
  }, [initialAccount]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialAccount);

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
    setFormData(initialAccount);
  };

  // Helper for live preview display
  const getSampleFormattedDate = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    switch (formData.dateFormat) {
      case 'MM/DD/YYYY':
        return `${mm}/${dd}/${yyyy}`;
      case 'DD/MM/YYYY':
        return `${dd}/${mm}/${yyyy}`;
      case 'MMM D, YYYY':
        return `${monthNames[now.getMonth()]} ${now.getDate()}, ${yyyy}`;
      case 'YYYY-MM-DD':
      default:
        return `${yyyy}-${mm}-${dd}`;
    }
  };

  const getSampleFormattedTime = () => {
    const now = new Date();
    if (formData.timeFormat === '24h') {
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
    const hours = now.getHours() % 12 || 12;
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    return `${hours}:${String(now.getMinutes()).padStart(2, '0')} ${ampm}`;
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
              Account Preferences
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Configure regional localization, time zone conventions, and your default starting view.
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
            <span>Account preferences successfully updated in active session.</span>
          </div>
        )}

        {/* Live Regional Formatting Preview Tile */}
        <div 
          className="mt-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border-strong)'
          }}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--color-accent-cyan)' }}>
              Live Format Preview
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-base font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
                {getSampleFormattedDate()}
              </span>
              <span className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                • {getSampleFormattedTime()}
              </span>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Time Zone: {formData.timezone.split(' ')[0]}
            </p>
          </div>

          <div 
            className="px-3 py-1.5 rounded-lg border text-xs font-semibold self-start sm:self-center"
            style={{
              backgroundColor: 'var(--color-surface-1)',
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-secondary)'
            }}
          >
            Language: {languageOptions.find(l => l.code === formData.language)?.name || 'English'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Preferred Language
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <select
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.note})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                NEXAWIS is natively delivered in English (US). Additional locales represent demonstration configuration profiles.
              </p>
            </div>

            {/* Time Zone */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                System Time Zone
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                Determines reporting generation timestamps, sprint deadlines, and activity logs.
              </p>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Date Format
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <select
                  value={formData.dateFormat}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateFormat: e.target.value }))}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {dateFormatOptions.map((df) => (
                    <option key={df.value} value={df.value}>{df.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time Format */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Time Display Format
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, timeFormat: '12h' }))}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                    formData.timeFormat === '12h' ? 'ring-2 ring-[var(--color-accent-cyan)]' : ''
                  }`}
                  style={{
                    backgroundColor: formData.timeFormat === '12h' ? 'var(--color-surface-1)' : 'var(--color-surface-2)',
                    borderColor: formData.timeFormat === '12h' ? 'var(--color-accent-cyan)' : 'var(--color-border-strong)',
                    color: formData.timeFormat === '12h' ? 'var(--color-accent-cyan)' : 'var(--color-text-secondary)'
                  }}
                >
                  <span>12-Hour (02:45 PM)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, timeFormat: '24h' }))}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                    formData.timeFormat === '24h' ? 'ring-2 ring-[var(--color-accent-cyan)]' : ''
                  }`}
                  style={{
                    backgroundColor: formData.timeFormat === '24h' ? 'var(--color-surface-1)' : 'var(--color-surface-2)',
                    borderColor: formData.timeFormat === '24h' ? 'var(--color-accent-cyan)' : 'var(--color-border-strong)',
                    color: formData.timeFormat === '24h' ? 'var(--color-accent-cyan)' : 'var(--color-text-secondary)'
                  }}
                >
                  <span>24-Hour (14:45)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Default Landing Page */}
          <div className="pt-2">
            <label className="block text-xs font-bold mb-2.5" style={{ color: 'var(--color-text-primary)' }}>
              Default Landing Page Upon Login
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {defaultLandingPageOptions.map((opt) => {
                const isSelected = formData.defaultLandingPage === opt.route;
                return (
                  <div
                    key={opt.route}
                    onClick={() => setFormData(prev => ({ ...prev, defaultLandingPage: opt.route }))}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                      isSelected ? 'ring-2 ring-[var(--color-accent-cyan)]' : 'hover:border-[var(--color-accent-cyan)]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--color-surface-2)' : 'var(--color-surface-1)',
                      borderColor: isSelected ? 'var(--color-accent-cyan)' : 'var(--color-border-strong)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: isSelected ? 'var(--color-accent-cyan)' : 'var(--color-text-primary)' }}>
                        {opt.label}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                      {opt.description}
                    </p>
                    <span className="text-[10px] font-mono mt-1.5 inline-block" style={{ color: 'var(--color-text-secondary)' }}>
                      {opt.route}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions Toolbar */}
          <div className="flex items-center justify-between pt-4 border-t flex-wrap gap-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Compass className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
              <span>Landing page preference applies to topbar logo and session restores.</span>
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
