import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Activity, 
  Check, 
  RotateCcw, 
  Save, 
  Sparkles,
  Eye
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { AppearancePreferences } from '../../types/settings';

interface AppearanceSectionProps {
  initialAppearance: AppearancePreferences;
  onSave: (appearance: AppearancePreferences) => Promise<void>;
  isSaving: boolean;
  onMarkModified: (isModified: boolean) => void;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  initialAppearance,
  onSave,
  isSaving,
  onMarkModified
}) => {
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState<AppearancePreferences>({
    ...initialAppearance,
    theme: theme as any
  });
  const [isSuccess, setIsSuccess] = useState(false);

  // Keep theme synced with actual global context
  useEffect(() => {
    setFormData(prev => ({ ...prev, theme: theme as any }));
  }, [theme]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialAppearance);

  const prevDirtyRef = useRef<boolean>(false);
  useEffect(() => {
    if (prevDirtyRef.current !== isDirty) {
      prevDirtyRef.current = isDirty;
      onMarkModified(isDirty);
    }
  }, [isDirty, onMarkModified]);

  const handleSelectTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setFormData(prev => ({ ...prev, theme: newTheme }));
    if (newTheme === 'system') {
      const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(systemDark ? 'dark' : 'light');
    } else {
      setTheme(newTheme);
    }
  };

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
    setFormData(initialAppearance);
    if (initialAppearance.theme === 'system') {
      const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(systemDark ? 'dark' : 'light');
    } else {
      setTheme(initialAppearance.theme);
    }
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
              Appearance & Design System
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Customize visual mode, layout density, and interface motion preferences across NEXAWIS.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span 
              className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg border shadow-xs"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-accent-cyan)',
                color: 'var(--color-accent-cyan)'
              }}
            >
              Active Theme: {theme.toUpperCase()}
            </span>

            {isDirty && (
              <span 
                className="px-2.5 py-1 text-xs font-bold rounded-lg border shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: '#f59e0b',
                  color: '#f59e0b'
                }}
              >
                Modified
              </span>
            )}
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
            <span>Appearance preferences saved to active session.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Theme Palette Selection Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Application Theme
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Light Theme */}
              <div
                onClick={() => handleSelectTheme('light')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-sm relative group hover:scale-102 ${
                  formData.theme === 'light' ? 'ring-2 ring-[var(--color-accent-cyan)]' : ''
                }`}
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: formData.theme === 'light' ? 'var(--color-accent-cyan)' : 'rgba(0,0,0,0.1)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
                    <Sun className="w-4 h-4" />
                  </div>
                  {formData.theme === 'light' && (
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="font-bold text-sm text-slate-900">Light Mode</div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Clean crisp surfaces, dark typography, and restrained borders.
                </p>
              </div>

              {/* Dark Theme */}
              <div
                onClick={() => handleSelectTheme('dark')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-sm relative group hover:scale-102 ${
                  formData.theme === 'dark' ? 'ring-2 ring-[var(--color-accent-cyan)]' : ''
                }`}
                style={{
                  backgroundColor: '#0a141a',
                  borderColor: formData.theme === 'dark' ? 'var(--color-accent-cyan)' : 'rgba(255,255,255,0.15)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-950/80 text-teal-400 flex items-center justify-center border border-teal-800">
                    <Moon className="w-4 h-4" />
                  </div>
                  {formData.theme === 'dark' && (
                    <span className="w-5 h-5 rounded-full bg-[var(--color-accent-cyan)] text-slate-950 flex items-center justify-center text-xs font-bold">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="font-bold text-sm text-white">Dark Mode</div>
                <p className="text-[11px] text-teal-200/70 mt-1 leading-snug">
                  NEXAWIS signature deep teal/cyan canvas with high contrast.
                </p>
              </div>

              {/* System Preference */}
              <div
                onClick={() => handleSelectTheme('system')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-sm relative group hover:scale-102 ${
                  formData.theme === 'system' ? 'ring-2 ring-[var(--color-accent-cyan)]' : ''
                }`}
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: formData.theme === 'system' ? 'var(--color-accent-cyan)' : 'var(--color-border-strong)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center border"
                    style={{
                      backgroundColor: 'var(--color-surface-1)',
                      borderColor: 'var(--color-border-strong)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <Monitor className="w-4 h-4" />
                  </div>
                  {formData.theme === 'system' && (
                    <span className="w-5 h-5 rounded-full bg-[var(--color-accent-cyan)] text-white flex items-center justify-center text-xs font-bold">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>System Default</div>
                <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
                  Automatically syncs with your operating system light / dark mode.
                </p>
              </div>
            </div>
          </div>

          {/* Interface Density & Motion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Density */}
            <div>
              <label className="block text-xs font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Interface Density
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, density: 'comfortable' }))}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 shadow-xs ${
                    formData.density === 'comfortable' ? 'ring-2 ring-[var(--color-accent-cyan)]' : ''
                  }`}
                  style={{
                    backgroundColor: formData.density === 'comfortable' ? 'var(--color-surface-2)' : 'var(--color-surface-1)',
                    borderColor: formData.density === 'comfortable' ? 'var(--color-accent-cyan)' : 'var(--color-border-strong)',
                    color: formData.density === 'comfortable' ? 'var(--color-accent-cyan)' : 'var(--color-text-secondary)'
                  }}
                >
                  <Maximize2 className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <div className="font-bold text-xs">Comfortable</div>
                    <div className="text-[10px] opacity-75">Standard spacious grid</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, density: 'compact' }))}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 shadow-xs ${
                    formData.density === 'compact' ? 'ring-2 ring-[var(--color-accent-cyan)]' : ''
                  }`}
                  style={{
                    backgroundColor: formData.density === 'compact' ? 'var(--color-surface-2)' : 'var(--color-surface-1)',
                    borderColor: formData.density === 'compact' ? 'var(--color-accent-cyan)' : 'var(--color-border-strong)',
                    color: formData.density === 'compact' ? 'var(--color-accent-cyan)' : 'var(--color-text-secondary)'
                  }}
                >
                  <Minimize2 className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <div className="font-bold text-xs">Compact</div>
                    <div className="text-[10px] opacity-75">Higher data density</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Motion Preference */}
            <div>
              <label className="block text-xs font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Motion & Transitions
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, motion: 'full' }))}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 shadow-xs ${
                    formData.motion === 'full' ? 'ring-2 ring-[var(--color-accent-cyan)]' : ''
                  }`}
                  style={{
                    backgroundColor: formData.motion === 'full' ? 'var(--color-surface-2)' : 'var(--color-surface-1)',
                    borderColor: formData.motion === 'full' ? 'var(--color-accent-cyan)' : 'var(--color-border-strong)',
                    color: formData.motion === 'full' ? 'var(--color-accent-cyan)' : 'var(--color-text-secondary)'
                  }}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <div className="font-bold text-xs">Full Motion</div>
                    <div className="text-[10px] opacity-75">Smooth micro-motion</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, motion: 'reduced' }))}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 shadow-xs ${
                    formData.motion === 'reduced' ? 'ring-2 ring-[var(--color-accent-cyan)]' : ''
                  }`}
                  style={{
                    backgroundColor: formData.motion === 'reduced' ? 'var(--color-surface-2)' : 'var(--color-surface-1)',
                    borderColor: formData.motion === 'reduced' ? 'var(--color-accent-cyan)' : 'var(--color-border-strong)',
                    color: formData.motion === 'reduced' ? 'var(--color-accent-cyan)' : 'var(--color-text-secondary)'
                  }}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <div className="font-bold text-xs">Reduced Motion</div>
                    <div className="text-[10px] opacity-75">Accessibility compliant</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* High Contrast Enterprise Borders Toggle */}
          <div 
            className="p-4 rounded-xl border flex items-center justify-between gap-4 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)'
            }}
          >
            <div>
              <span className="text-xs font-bold block" style={{ color: 'var(--color-text-primary)' }}>
                High-Contrast Enterprise Borders
              </span>
              <span className="text-[11px] block mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                Enforces prominent 1px solid card contours to optimize visibility across multi-monitor setups.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, highContrastBorders: !prev.highContrastBorders }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.highContrastBorders ? 'bg-[var(--color-accent-cyan)]' : 'bg-slate-400'
              }`}
              role="switch"
              aria-checked={formData.highContrastBorders}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.highContrastBorders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Live Component Sandbox Preview */}
          <div 
            className="p-5 rounded-2xl border space-y-3 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-strong)'
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-accent-cyan)' }}>
                <Eye className="w-3.5 h-3.5" />
                Live Design System Sandbox
              </span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                Tokens dynamically reacting to active theme
              </span>
            </div>

            <div 
              className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 shadow-xs"
              style={{
                backgroundColor: 'var(--color-surface-1)',
                borderColor: 'var(--color-border-strong)'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Sample Card
                </span>
                <span 
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-full border"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-accent-lime)',
                    color: 'var(--color-accent-lime)'
                  }}
                >
                  AWIS Online
                </span>
                <span 
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-full border"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-accent-cyan)',
                    color: 'var(--color-accent-cyan)'
                  }}
                >
                  Deep Teal Mode
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" className="btn-secondary px-3 py-1.5 text-xs font-bold">
                  Secondary
                </button>
                <button type="button" className="btn-primary px-3 py-1.5 text-xs font-bold shadow-xs">
                  Primary Action
                </button>
              </div>
            </div>
          </div>

          {/* Actions Toolbar */}
          <div className="flex items-center justify-between pt-4 border-t flex-wrap gap-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
              <span>Theme changes execute immediately through the shared global ThemeProvider.</span>
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
                <span>{isSaving ? 'Saving...' : 'Save Appearance'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
