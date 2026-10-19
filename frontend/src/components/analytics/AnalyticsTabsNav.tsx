import { 
  LayoutGrid, 
  Users, 
  FolderKanban, 
  Network, 
  ShieldCheck 
} from 'lucide-react';

export type AnalyticsTabId = 'overview' | 'workforce' | 'projects' | 'teams' | 'sustainability';

interface AnalyticsTabsNavProps {
  activeTab: AnalyticsTabId;
  onTabChange: (tab: AnalyticsTabId) => void;
  workforceCount?: number;
  projectCount?: number;
  formationCount?: number;
}

export function AnalyticsTabsNav({
  activeTab,
  onTabChange,
  workforceCount,
  projectCount,
  formationCount
}: AnalyticsTabsNavProps) {
  const tabs: Array<{
    id: AnalyticsTabId;
    label: string;
    icon: typeof LayoutGrid;
    count?: number;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'workforce', label: 'Workforce', icon: Users, count: workforceCount },
    { id: 'projects', label: 'Projects', icon: FolderKanban, count: projectCount },
    { id: 'teams', label: 'Team Performance', icon: Network, count: formationCount },
    { id: 'sustainability', label: 'Sustainability', icon: ShieldCheck }
  ];

  return (
    <div 
      className="p-1 rounded-2xl flex items-center gap-1 overflow-x-auto border"
      style={{
        backgroundColor: 'var(--color-surface-1)',
        borderColor: 'var(--color-border-subtle)'
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              isActive ? 'btn-primary' : 'hover:bg-[--color-surface-2]'
            }`}
            style={!isActive ? {
              color: 'var(--color-text-secondary)'
            } : {}}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span 
                className="text-[10px] font-mono px-1.5 py-0.2 rounded-full"
                style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--color-surface-2)',
                  color: isActive ? '#ffffff' : 'var(--color-text-muted)'
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
