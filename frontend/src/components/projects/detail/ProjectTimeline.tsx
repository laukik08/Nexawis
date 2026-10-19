import type { Project, ProjectMilestone } from '../../../data/mockProjects';
import { Check, Clock, Calendar } from 'lucide-react';

interface ProjectTimelineProps {
  project: Project;
}

export function ProjectTimeline({ project }: ProjectTimelineProps) {
  const milestones: ProjectMilestone[] = project.milestones || [];

  const completedCount = milestones.filter(m => m.status === 'Completed').length;
  const currentMilestone = milestones.find(m => m.status === 'Current');

  if (milestones.length === 0) {
    return null;
  }

  return (
    <section className="card-base p-6 md:p-8 rounded-2xl">
      {/* Section Header */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 gap-4"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
              style={{
                color: 'var(--color-accent-cyan)',
                backgroundColor: 'rgba(2, 132, 199, 0.1)',
                border: '1px solid rgba(2, 132, 199, 0.25)'
              }}
            >
              Execution Roadmap
            </span>
          </div>
          <h2 
            className="text-xl font-display font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Project Milestones & Timeline
          </h2>
          <p 
            className="text-xs mt-0.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Key delivery gates and target completion milestones in chronological sequence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div 
              className="text-xs font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {completedCount} of {milestones.length} Completed
            </div>
            <div 
              className="text-[11px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {currentMilestone ? `Current: ${currentMilestone.name}` : 'All Milestones Completed'}
            </div>
          </div>
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-accent-cyan)'
            }}
          >
            {Math.round((completedCount / milestones.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Desktop Horizontal Timeline (>= lg screens) */}
      <div className="hidden lg:block relative pt-2 pb-2">
        {/* Continuous Connecting Line - placed right through circle centers */}
        <div 
          className="absolute top-[28px] left-10 right-10 h-1 z-0 rounded-full" 
          style={{ backgroundColor: 'var(--color-border-strong)' }}
        />

        {/* Milestone Steps Grid */}
        <div 
          className="grid gap-4 relative z-10"
          style={{ gridTemplateColumns: `repeat(${milestones.length}, minmax(0, 1fr))` }}
        >
          {milestones.map((milestone, idx) => {
            const isCompleted = milestone.status === 'Completed';
            const isCurrent = milestone.status === 'Current';
            const isUpcoming = milestone.status === 'Upcoming';

            return (
              <div key={milestone.id} className="flex flex-col items-center text-center group">
                
                {/* Node Marker */}
                <div className="mb-4">
                  {isCompleted && (
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform group-hover:scale-110 z-10"
                      style={{
                        backgroundColor: 'var(--color-accent-lime)',
                        border: '3px solid var(--color-surface-1)',
                        color: 'var(--color-text-inverse)',
                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                      }}
                      title="Completed Milestone"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}

                  {isCurrent && (
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 z-10 animate-pulse"
                      style={{
                        backgroundColor: 'var(--color-accent-cyan)',
                        border: '3px solid var(--color-surface-1)',
                        color: 'var(--color-text-inverse)',
                        boxShadow: '0 0 20px rgba(2, 132, 199, 0.45)'
                      }}
                      title="Current Milestone"
                    >
                      <Clock className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}

                  {isUpcoming && (
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-colors group-hover:opacity-100 z-10"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        border: '2px solid var(--color-border-strong)',
                        color: 'var(--color-text-muted)'
                      }}
                      title="Upcoming Milestone"
                    >
                      <span className="text-xs font-bold font-mono">{idx + 1}</span>
                    </div>
                  )}
                </div>

                {/* Milestone Card */}
                <div 
                  className="w-full p-4 rounded-xl text-left flex flex-col justify-between min-h-[125px] transition-all hover:translate-y-[-2px]"
                  style={{
                    backgroundColor: isCurrent 
                      ? 'var(--color-surface-1)' 
                      : 'var(--color-surface-2)',
                    border: isCurrent 
                      ? '2px solid var(--color-accent-cyan)' 
                      : '1px solid var(--color-border-subtle)',
                    boxShadow: isCurrent 
                      ? '0 6px 24px rgba(2, 132, 199, 0.18)' 
                      : 'none',
                    opacity: isUpcoming ? 0.85 : 1
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span 
                        className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded"
                        style={
                          isCompleted 
                            ? { 
                                backgroundColor: 'rgba(22, 163, 74, 0.15)', 
                                color: 'var(--color-accent-lime)',
                                border: '1px solid rgba(22, 163, 74, 0.25)' 
                              }
                            : isCurrent 
                            ? { 
                                backgroundColor: 'rgba(2, 132, 199, 0.15)', 
                                color: 'var(--color-accent-cyan)',
                                border: '1px solid rgba(2, 132, 199, 0.3)' 
                              }
                            : { 
                                backgroundColor: 'var(--color-surface-1)', 
                                color: 'var(--color-text-muted)',
                                border: '1px solid var(--color-border-subtle)' 
                              }
                        }
                      >
                        {milestone.status}
                      </span>
                      <span 
                        className="text-[10px] font-mono font-medium"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Step {idx + 1}
                      </span>
                    </div>
                    
                    <h4 
                      className="text-xs font-bold line-clamp-2 leading-snug"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {milestone.name}
                    </h4>
                  </div>

                  <div 
                    className="flex items-center space-x-1.5 text-[11px] pt-2 mt-2"
                    style={{ 
                      color: 'var(--color-text-muted)',
                      borderTop: '1px solid var(--color-border-subtle)' 
                    }}
                  >
                    <Calendar className="w-3 h-3 shrink-0" style={{ color: 'var(--color-accent-cyan)' }} />
                    <span>
                      {new Date(milestone.date).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile & Tablet Vertical Timeline (< lg screens) */}
      <div className="lg:hidden relative pl-6 space-y-6">
        {/* Vertical Connecting Line */}
        <div 
          className="absolute left-[20px] top-4 bottom-4 w-1 rounded-full" 
          style={{ backgroundColor: 'var(--color-border-strong)' }}
        />

        {milestones.map((milestone, idx) => {
          const isCompleted = milestone.status === 'Completed';
          const isCurrent = milestone.status === 'Current';
          const isUpcoming = milestone.status === 'Upcoming';

          return (
            <div key={milestone.id} className="relative flex items-start space-x-4">
              
              {/* Vertical Marker */}
              <div className="shrink-0 z-10 -ml-3">
                {isCompleted && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                    style={{
                      backgroundColor: 'var(--color-accent-lime)',
                      border: '2px solid var(--color-surface-1)',
                      color: 'var(--color-text-inverse)',
                      boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
                    }}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {isCurrent && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-md animate-pulse"
                    style={{
                      backgroundColor: 'var(--color-accent-cyan)',
                      border: '2px solid var(--color-surface-1)',
                      color: 'var(--color-text-inverse)',
                      boxShadow: '0 0 16px rgba(2, 132, 199, 0.45)'
                    }}
                  >
                    <Clock className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {isUpcoming && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      border: '2px solid var(--color-border-strong)',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    <span className="text-[10px] font-bold font-mono">{idx + 1}</span>
                  </div>
                )}
              </div>

              {/* Card */}
              <div 
                className="flex-1 p-4 rounded-xl transition-all"
                style={{
                  backgroundColor: isCurrent ? 'var(--color-surface-1)' : 'var(--color-surface-2)',
                  border: isCurrent ? '2px solid var(--color-accent-cyan)' : '1px solid var(--color-border-subtle)',
                  boxShadow: isCurrent ? '0 4px 18px rgba(2, 132, 199, 0.16)' : 'none',
                  opacity: isUpcoming ? 0.85 : 1
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span 
                    className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded"
                    style={
                      isCompleted 
                        ? { 
                            backgroundColor: 'rgba(22, 163, 74, 0.15)', 
                            color: 'var(--color-accent-lime)',
                            border: '1px solid rgba(22, 163, 74, 0.25)' 
                          }
                        : isCurrent 
                        ? { 
                            backgroundColor: 'rgba(2, 132, 199, 0.15)', 
                            color: 'var(--color-accent-cyan)',
                            border: '1px solid rgba(2, 132, 199, 0.3)' 
                          }
                        : { 
                            backgroundColor: 'var(--color-surface-1)', 
                            color: 'var(--color-text-muted)',
                            border: '1px solid var(--color-border-subtle)' 
                          }
                    }
                  >
                    {milestone.status}
                  </span>
                  <div 
                    className="flex items-center space-x-1 text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <Calendar className="w-3 h-3" style={{ color: 'var(--color-accent-cyan)' }} />
                    <span>
                      {new Date(milestone.date).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>

                <h4 
                  className="text-sm font-bold mt-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {milestone.name}
                </h4>
              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
}

