import React from 'react';
import { 
  User, 
  Globe, 
  Palette, 
  Bell, 
  Building2, 
  ShieldCheck, 
  Database,
  ChevronRight
} from 'lucide-react';
import type { SettingsSectionId } from '../../types/settings';
import { settingsSections } from '../../data/mockSettings';

interface SettingsNavProps {
  activeSection: SettingsSectionId;
  onSelectSection: (section: SettingsSectionId) => void;
  modifiedSections?: Record<string, boolean>;
}

const sectionIcons: Record<SettingsSectionId, React.ElementType> = {
  profile: User,
  account: Globe,
  appearance: Palette,
  notifications: Bell,
  workspace: Building2,
  privacy: ShieldCheck,
  data: Database
};

export const SettingsNav: React.FC<SettingsNavProps> = ({
  activeSection,
  onSelectSection,
  modifiedSections = {}
}) => {
  return (
    <aside className="w-full lg:w-72 shrink-0">
      {/* Mobile Horizontal Pill Scroll Rail */}
      <div 
        className="flex lg:hidden overflow-x-auto p-1.5 rounded-2xl gap-1.5 border mb-6 no-scrollbar"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-strong)'
        }}
        role="tablist"
        aria-label="Settings sections"
      >
        {settingsSections.map((sec) => {
          const Icon = sectionIcons[sec.id];
          const isActive = activeSection === sec.id;
          const isSecModified = modifiedSections[sec.id];

          return (
            <button
              key={sec.id}
              role="tab"
              type="button"
              data-cursor="button"
              aria-selected={isActive}
              onClick={() => onSelectSection(sec.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive 
                  ? 'btn-primary shadow-sm' 
                  : 'hover:bg-[var(--color-surface-hover)]'
              }`}
              style={!isActive ? {
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border-strong)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border-strong)'
              } : {}}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{sec.label}</span>
              {isSecModified && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unsaved modifications" />
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop Vertical Nav Card */}
      <div 
        className="hidden lg:block card-base p-2 border shadow-lg sticky top-24 rounded-2xl"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-strong)'
        }}
      >
        <div className="px-3 py-2.5 mb-1 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            Configuration Sections
          </span>
        </div>

        <nav className="space-y-1" role="tablist" aria-orientation="vertical">
          {settingsSections.map((sec) => {
            const Icon = sectionIcons[sec.id];
            const isActive = activeSection === sec.id;
            const isSecModified = modifiedSections[sec.id];

            return (
              <button
                key={sec.id}
                role="tab"
                type="button"
                data-cursor="button"
                aria-selected={isActive}
                onClick={() => onSelectSection(sec.id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${
                  isActive 
                    ? 'border shadow-xs' 
                    : 'hover:bg-[var(--color-surface-hover)] border border-transparent'
                }`}
                style={isActive ? {
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-accent-cyan)',
                  color: 'var(--color-text-primary)'
                } : {
                  color: 'var(--color-text-secondary)'
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors shadow-xs"
                    style={{
                      backgroundColor: isActive ? 'var(--color-surface-1)' : 'var(--color-surface-2)',
                      borderColor: isActive ? 'var(--color-accent-cyan)' : 'var(--color-border-strong)',
                      color: isActive ? 'var(--color-accent-cyan)' : 'var(--color-text-muted)'
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className={`truncate ${isActive ? 'text-[var(--color-text-primary)] font-extrabold' : 'group-hover:text-[var(--color-text-primary)]'}`}>
                      {sec.label}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] truncate hidden xl:block font-normal">
                      {sec.id === 'profile' ? 'Avatar, Name, Role' : 
                       sec.id === 'account' ? 'Locale & Time Zone' :
                       sec.id === 'appearance' ? 'Theme & Density' :
                       sec.id === 'notifications' ? 'Alerts & Digests' :
                       sec.id === 'workspace' ? 'Scopes & Baselines' :
                       sec.id === 'privacy' ? 'Security & Sessions' : 'Reset & JSON Export'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isSecModified && (
                    <span 
                      className="w-2 h-2 rounded-full bg-amber-400" 
                      title="Modified in current session" 
                    />
                  )}
                  <ChevronRight 
                    className={`w-4 h-4 transition-transform ${
                      isActive ? 'text-[var(--color-accent-cyan)] translate-x-0.5' : 'text-[var(--color-text-muted)] opacity-40 group-hover:opacity-100'
                    }`} 
                  />
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
