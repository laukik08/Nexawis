import { dashboardData } from '../../data/mockDashboard';
import { MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';

export function ActiveProjects() {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'On Track': return 'text-[--color-accent-lime] bg-[--color-accent-lime]/10 border-[--color-accent-lime]/20';
      case 'In Progress': return 'text-[--color-accent-cyan] bg-[--color-accent-cyan]/10 border-[--color-accent-cyan]/20';
      case 'At Risk': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-[--color-text-secondary] bg-[--color-surface-2] border-[--color-border-strong]';
    }
  };

  return (
    <section className="mb-8 relative z-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[--color-text-primary] tracking-tight">Active Projects</h2>
        <button className="text-sm font-bold text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors">
          View All
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block card-base overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[--color-border-subtle] bg-[--color-surface-2]/50">
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[--color-text-secondary]">Project</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[--color-text-secondary]">Priority</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[--color-text-secondary]">Team Size</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[--color-text-secondary]">Progress</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[--color-text-secondary]">Team Fit</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[--color-text-secondary]">Status</th>
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[--color-text-secondary] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[--color-border-subtle]">
            {dashboardData.activeProjects.map((project) => (
              <tr key={project.id} className="hover:bg-[--color-surface-2]/30 transition-colors group">
                <td className="py-4 px-6 font-bold text-[--color-text-primary]">{project.name}</td>
                <td className="py-4 px-6">
                  <span className="text-sm text-[--color-text-secondary]">{project.priority}</span>
                </td>
                <td className="py-4 px-6 text-sm text-[--color-text-secondary]">{project.teamSize} members</td>
                <td className="py-4 px-6">
                  <div className="w-28">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold text-[var(--color-text-primary)]">{project.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]">
                      <div className="h-full bg-[var(--color-accent-cyan)] rounded-full" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="w-28">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold text-[var(--color-text-primary)]">{project.teamFit}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]">
                      <div className="h-full bg-[var(--color-accent-lime)] rounded-full" style={{ width: `${project.teamFit}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className={clsx("text-xs font-bold px-2.5 py-1 rounded-full border", getStatusColor(project.status))}>
                    {project.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="text-[--color-text-muted] hover:text-[--color-text-primary] p-1 rounded transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {dashboardData.activeProjects.map((project) => (
          <div key={project.id} className="card-base p-5 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-[--color-text-primary]">{project.name}</h3>
              <span className={clsx("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border", getStatusColor(project.status))}>
                {project.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <div className="text-[--color-text-muted] text-xs mb-1">Priority</div>
                <div className="text-[--color-text-secondary]">{project.priority}</div>
              </div>
              <div>
                <div className="text-[--color-text-muted] text-xs mb-1">Team Size</div>
                <div className="text-[--color-text-secondary]">{project.teamSize} members</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-[--color-text-secondary]">Progress</span>
                  <span className="font-bold text-[--color-text-primary]">{project.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]">
                  <div className="h-full bg-[var(--color-accent-cyan)] rounded-full" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-[--color-text-secondary]">Team Fit</span>
                  <span className="font-bold text-[--color-text-primary]">{project.teamFit}%</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]">
                  <div className="h-full bg-[var(--color-accent-lime)] rounded-full" style={{ width: `${project.teamFit}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
