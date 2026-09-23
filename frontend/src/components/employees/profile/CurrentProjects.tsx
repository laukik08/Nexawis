import type { Employee } from '../../../data/mockEmployees';
import { Briefcase, ArrowRight } from 'lucide-react';

interface CurrentProjectsProps {
  employee: Employee;
}

export function CurrentProjects({ employee }: CurrentProjectsProps) {
  const { currentProjects } = employee;

  if (currentProjects.length === 0) {
    return (
      <div className="card-base p-6 md:p-8 flex flex-col h-full border-dashed border-2">
        <div className="flex items-center space-x-2 mb-6">
          <Briefcase className="w-5 h-5 text-[--color-text-muted]" />
          <h3 className="font-bold text-[--color-text-primary]">Current Projects</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <Briefcase className="w-12 h-12 text-[--color-text-muted] mb-4 opacity-50" />
          <h4 className="text-sm font-bold text-[--color-text-primary] mb-1">No Active Projects</h4>
          <p className="text-xs text-[--color-text-secondary] max-w-[200px]">This employee is currently fully available for allocation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-base p-6 md:p-8 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Briefcase className="w-5 h-5 text-[--color-accent-cyan]" />
          <h3 className="font-bold text-[--color-text-primary]">Current Projects</h3>
        </div>
        <div className="text-xs font-bold text-[--color-text-secondary] bg-[--color-surface-2] px-3 py-1 rounded-full border border-[--color-border-subtle]">
          {currentProjects.length} Active
        </div>
      </div>
      
      <div className="space-y-4 flex-1">
        {currentProjects.map((project) => (
          <div key={project.id} className="group p-4 bg-[--color-surface-2] rounded-xl border border-[--color-border-subtle] hover:border-[--color-accent-cyan]/50 transition-colors cursor-pointer">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-[--color-text-primary] group-hover:text-[--color-accent-cyan] transition-colors">{project.name}</h4>
                <div className="text-xs text-[--color-text-secondary] mt-0.5">{project.role}</div>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-[--color-border-strong]">
                {project.status}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[--color-text-muted] font-bold mb-1">Allocation</div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-[--color-text-primary]">{project.allocationPercent}%</span>
                  <div className="flex-1 h-1 bg-[--color-surface-1] rounded-full overflow-hidden">
                    <div className="h-full bg-[--color-accent-cyan]" style={{ width: `${project.allocationPercent}%` }} />
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[--color-text-muted] font-bold mb-1">Team Fit</div>
                <div className="text-sm font-bold text-[--color-text-primary]">{project.teamFit}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button className="flex items-center text-xs font-bold text-[--color-accent-cyan] hover:text-cyan-400 transition-colors">
          View Project Details
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
}
