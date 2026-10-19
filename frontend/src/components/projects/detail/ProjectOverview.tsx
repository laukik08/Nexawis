import type { Project } from '../../../data/mockProjects';

interface ProjectOverviewProps {
  project: Project;
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  return (
    <section className="card-base p-6 md:p-8 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[--color-accent-cyan] bg-[--color-accent-cyan]/10 px-2.5 py-0.5 rounded-full border border-[--color-accent-cyan]/20">
          Scope & Context
        </span>
      </div>
      <h2 className="text-xl font-display font-bold text-[--color-text-primary] mb-4">
        Project Overview
      </h2>
      
      <p className="text-[--color-text-primary] text-base md:text-lg font-medium leading-relaxed mb-8 max-w-4xl">
        {project.description}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-6 border-t border-[--color-border-subtle]">
        <div className="p-3 rounded-xl bg-[--color-surface-2]/40 border border-[--color-border-subtle]">
          <div className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-wider mb-1">Department</div>
          <div className="text-sm font-bold text-[--color-text-primary]">{project.department}</div>
        </div>

        {project.client && (
          <div className="p-3 rounded-xl bg-[--color-surface-2]/40 border border-[--color-border-subtle]">
            <div className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-wider mb-1">Client / Sponsor</div>
            <div className="text-sm font-bold text-[--color-text-primary]">{project.client}</div>
          </div>
        )}

        {project.projectManager && (
          <div className="p-3 rounded-xl bg-[--color-surface-2]/40 border border-[--color-border-subtle]">
            <div className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-wider mb-1">Project Lead</div>
            <div className="text-sm font-bold text-[--color-text-primary]">{project.projectManager}</div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-[--color-surface-2]/40 border border-[--color-border-subtle]">
          <div className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-wider mb-1">Complexity</div>
          <div className="text-sm font-bold text-[--color-text-primary]">{project.complexity}</div>
        </div>

        <div className="p-3 rounded-xl bg-[--color-surface-2]/40 border border-[--color-border-subtle]">
          <div className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-wider mb-1">Start Date</div>
          <div className="text-sm font-bold text-[--color-text-primary]">
            {new Date(project.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[--color-surface-2]/40 border border-[--color-border-subtle]">
          <div className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-wider mb-1">Target Deadline</div>
          <div className="text-sm font-bold text-[--color-text-primary]">
            {new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[--color-surface-2]/40 border border-[--color-border-subtle]">
          <div className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-wider mb-1">Team Size</div>
          <div className="text-sm font-bold text-[--color-text-primary]">{project.teamSize} Members Target</div>
        </div>

        <div className="p-3 rounded-xl bg-[--color-surface-2]/40 border border-[--color-border-subtle]">
          <div className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-wider mb-1">Overall Risk Level</div>
          <div className="text-sm font-bold text-[--color-text-primary] flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              project.overallRisk === 'High' ? 'bg-red-400' :
              project.overallRisk === 'Medium' ? 'bg-[--color-accent-cyan]' : 'bg-[--color-accent-lime]'
            }`} />
            <span>{project.overallRisk}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
