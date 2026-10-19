import { 
  Layers, 
  Users, 
  FolderKanban, 
  Network, 
  BrainCircuit, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import type { ReportCategory } from '../../types/reports';

interface ReportCategorySelectorProps {
  selectedCategory: string; // 'All' or specific category
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
}

export function ReportCategorySelector({
  selectedCategory,
  onSelectCategory,
  categoryCounts
}: ReportCategorySelectorProps) {
  const categories: Array<{
    id: string;
    label: string;
    icon: typeof Layers;
    categoryKey?: ReportCategory;
  }> = [
    { id: 'All', label: 'All Reports', icon: Sparkles },
    { id: 'executive', label: 'Executive Briefs', icon: Layers, categoryKey: 'executive' },
    { id: 'workforce', label: 'Workforce Intelligence', icon: Users, categoryKey: 'workforce' },
    { id: 'projects', label: 'Project Performance', icon: FolderKanban, categoryKey: 'projects' },
    { id: 'team_formation', label: 'Team Formation', icon: Network, categoryKey: 'team_formation' },
    { id: 'awis_intelligence', label: 'AWIS Dimensions', icon: BrainCircuit, categoryKey: 'awis_intelligence' },
    { id: 'sustainability', label: 'Sustainability & Wellbeing', icon: ShieldCheck, categoryKey: 'sustainability' }
  ];

  return (
    <div 
      className="p-1 rounded-2xl flex items-center gap-1 overflow-x-auto border"
      style={{
        backgroundColor: 'var(--color-surface-1)',
        borderColor: 'var(--color-border-subtle)'
      }}
    >
      {categories.map((cat) => {
        const isActive = selectedCategory === cat.id;
        const Icon = cat.icon;
        const count = cat.id === 'All' 
          ? Object.values(categoryCounts).reduce((a, b) => a + b, 0) 
          : categoryCounts[cat.id] || 0;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              isActive ? 'btn-primary shadow-sm' : 'hover:bg-[var(--color-surface-hover)]'
            }`}
            style={!isActive ? {
              color: 'var(--color-text-secondary)',
              border: '1px solid transparent'
            } : {}}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{cat.label}</span>
            <span 
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shadow-xs"
              style={{
                backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'var(--color-surface-2)',
                borderColor: isActive ? 'rgba(255,255,255,0.4)' : 'var(--color-border-subtle)',
                color: isActive ? '#ffffff' : 'var(--color-text-secondary)'
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
