import type { Project } from '../../data/mockProjects';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

interface ProjectCardsProps {
  projects: Project[];
}

export function ProjectCards({ projects }: ProjectCardsProps) {
  const navigate = useNavigate();

  const getStatusStyle = (status: Project['status']) => {
    switch (status) {
      case 'Planning': return 'badge-planning';
      case 'Active': return 'badge-active';
      case 'On Track': return 'badge-ontrack';
      case 'At Risk': return 'badge-risk';
      case 'Completed': return 'text-muted-color border-subtle-color bg-transparent';
      default: return 'badge-planning';
    }
  };
  
  const getRiskStyle = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-[--color-accent-lime]';
      case 'Medium': return 'text-[--color-accent-cyan]';
      case 'High': return 'text-red-400';
      default: return 'text-[--color-text-secondary]';
    }
  };

  return (
    <div className="md:hidden space-y-4">
      {projects.map((prj) => (
        <div 
          key={prj.id}
          onClick={() => navigate(`/app/projects/${prj.id}`)}
          data-cursor="link"
          className="card-base p-5 cursor-pointer hover:bg-[--color-surface-2]/30 transition-colors"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="font-bold text-[--color-text-primary] text-lg leading-tight mb-1">{prj.name}</div>
              <div className="text-xs text-[--color-text-muted]">{prj.projectId} • {prj.department}</div>
            </div>
            <span className={clsx("text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border shrink-0 ml-3", getStatusStyle(prj.status))}>
              {prj.status}
            </span>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-[--color-text-muted] mb-1">Progress</div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-[--color-text-primary] w-8">{prj.progress}%</span>
                <div className="flex-1 h-1.5 bg-[--color-surface-2] rounded-full overflow-hidden">
                  <div className="h-full bg-accent-cyan rounded-full" style={{ width: `${prj.progress}%`, backgroundColor: 'var(--color-accent-cyan)' }} />
                </div>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-[--color-text-muted] mb-1">Team Fit</div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-[--color-text-primary] w-8">{prj.teamFit}%</span>
                <div className="flex-1 h-1.5 bg-[--color-surface-2] rounded-full overflow-hidden">
                  <div className="h-full bg-accent-lime rounded-full" style={{ width: `${prj.teamFit}%`, backgroundColor: 'var(--color-accent-lime)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Risk & Priority */}
          <div className="flex flex-wrap gap-2 mb-5">
             <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[--color-border-subtle] bg-[--color-surface-2] text-[--color-text-secondary]">
              Priority: {prj.priority}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[--color-border-subtle] bg-[--color-surface-2] text-[--color-text-secondary]">
              Size: {prj.teamSize}
            </span>
            <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded border border-[--color-border-subtle] bg-[--color-surface-2]", getRiskStyle(prj.overallRisk))}>
              Risk: {prj.overallRisk}
            </span>
          </div>

          {/* Footer Action */}
          <div className="pt-3 flex justify-between items-center border-t border-[--color-border-subtle]">
            <div className="text-xs text-[--color-text-muted]">
              Due {new Date(prj.deadline).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </div>
            <div className="flex items-center text-xs font-bold text-[--color-accent-cyan]">
              View Project
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
