import { useState } from 'react';
import type { Project } from '../../../data/mockProjects';
import clsx from 'clsx';
import { Users, MoreHorizontal, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ManageTeamModal } from '../ManageTeamModal';

interface ProjectTeamProps {
  project: Project;
}

export function ProjectTeam({ project }: ProjectTeamProps) {
  const navigate = useNavigate();
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false);

  const capacityAllocated = project.capacity.allocated;
  const capacityTotal = project.capacity.totalRequired || 1;
  const capacityPercent = Math.min(Math.round((capacityAllocated / capacityTotal) * 100), 100);
  const isOverAllocated = capacityAllocated > capacityTotal;

  return (
    <div className="space-y-6">
      
      {/* Team Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[--color-accent-cyan] bg-[--color-accent-cyan]/10 px-2.5 py-0.5 rounded-full border border-[--color-accent-cyan]/20">
              Workforce Allocation
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-[--color-text-primary]">
            Project Team & Staffing Capacity
          </h2>
          <p className="text-xs text-[--color-text-secondary] mt-0.5">
            Real-time workforce assignments, allocation rates, and capacity balance.
          </p>
        </div>

        <button 
          onClick={() => setIsManageTeamOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl btn-primary font-bold text-xs self-start sm:self-auto"
        >
          <Users className="w-4 h-4" />
          <span>Manage Team ({project.currentTeam.length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Current Team Members (2 columns) */}
        <div className="lg:col-span-2 card-base p-6 md:p-8 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[--color-border-subtle]">
              <h3 className="text-xs font-bold text-[--color-text-muted] uppercase tracking-wider">
                Assigned Employees ({project.currentTeam.length} / {project.teamSize} target)
              </h3>
              <button 
                onClick={() => setIsManageTeamOpen(true)}
                className="text-xs font-bold text-[--color-accent-cyan] hover:underline"
              >
                + Add / Remove Members
              </button>
            </div>
            
            <div className="space-y-3">
              {project.currentTeam.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-[--color-surface-2]/30 border border-dashed border-[--color-border-strong]">
                  <p className="text-xs text-[--color-text-muted] mb-3">
                    No workforce members currently assigned to this project.
                  </p>
                  <button
                    onClick={() => setIsManageTeamOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[--color-surface-2] hover:bg-[--color-surface-1] border border-[--color-border-strong] text-xs font-bold text-[--color-text-primary] transition-colors"
                  >
                    Assign First Member
                  </button>
                </div>
              ) : (
                project.currentTeam.map((member) => (
                  <div 
                    key={member.id} 
                    onClick={() => navigate(`/app/employees/${member.id}`)}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[--color-surface-2]/30 hover:bg-[--color-surface-2] border border-[--color-border-subtle] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3.5">
                      <img 
                        src={member.avatarUrl} 
                        alt={member.name} 
                        className="w-10 h-10 rounded-full border border-[--color-border-strong] shrink-0 object-cover" 
                      />
                      <div>
                        <div className="font-bold text-sm text-[--color-text-primary] group-hover:text-[--color-accent-cyan] transition-colors">
                          {member.name}
                        </div>
                        <div className="text-xs text-[--color-text-muted]">
                          {member.role} • <span className="font-mono text-[11px] text-[--color-text-secondary]">{member.primarySkill}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 sm:space-x-6 text-xs">
                      <div className="text-right">
                        <div className="text-[10px] font-bold uppercase text-[--color-text-muted] mb-0.5">Allocation</div>
                        <span className={clsx(
                          "font-bold px-2 py-0.5 rounded text-xs",
                          member.allocationPercent > 100 
                            ? 'text-red-400 bg-red-400/10 border border-red-400/30' 
                            : 'text-[--color-text-primary] bg-[--color-surface-1]'
                        )}>
                          {member.allocationPercent}%
                        </span>
                      </div>

                      <div className="text-right hidden sm:block">
                        <div className="text-[10px] font-bold uppercase text-[--color-text-muted] mb-0.5">Team Fit</div>
                        <span className="font-bold text-[--color-accent-lime] text-xs">
                          {member.teamFit}%
                        </span>
                      </div>

                      <div className="text-right hidden md:block">
                        <div className="text-[10px] font-bold uppercase text-[--color-text-muted] mb-0.5">Risk</div>
                        <span className={clsx(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                          member.wellbeingRisk === 'High' ? 'text-red-400 bg-red-400/10' :
                          member.wellbeingRisk === 'Moderate' ? 'text-[--color-accent-cyan] bg-[--color-accent-cyan]/10' :
                          'text-[--color-accent-lime] bg-[--color-accent-lime]/10'
                        )}>
                          {member.wellbeingRisk}
                        </span>
                      </div>

                      <button 
                        className="text-[--color-text-muted] hover:text-[--color-text-primary] p-1.5 rounded-lg hover:bg-[--color-surface-1] transition-colors" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsManageTeamOpen(true);
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[--color-border-subtle] flex items-center justify-between text-xs text-[--color-text-muted]">
            <span>Click any team member to view their comprehensive employee profile.</span>
            <span className="font-bold text-[--color-text-primary]">
              {project.currentTeam.length >= project.teamSize ? 'Fully Staffed' : `${project.teamSize - project.currentTeam.length} Spots Open`}
            </span>
          </div>
        </div>

        {/* Team Capacity & Allocation Analytics (1 column) */}
        <div className="card-base p-6 md:p-8 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[--color-border-subtle]">
              <h3 className="text-xs font-bold text-[--color-text-muted] uppercase tracking-wider">
                Capacity Analytics
              </h3>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                isOverAllocated 
                  ? 'bg-red-400/10 text-red-400 border-red-400/30' 
                  : 'bg-[--color-accent-lime]/10 text-[--color-accent-lime] border-[--color-accent-lime]/30'
              }`}>
                {isOverAllocated ? 'Overloaded' : 'Balanced'}
              </span>
            </div>
            
            {/* Primary Hours */}
            <div className="mb-6">
              <div className="text-3xl font-display font-bold text-[--color-text-primary] mb-1">
                {capacityAllocated}
                <span className="text-sm font-normal text-[--color-text-muted]"> / {project.capacity.totalRequired} hrs/wk</span>
              </div>
              <div className="text-xs text-[--color-text-secondary]">
                Total Weekly Workforce Hours Allocated
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-[--color-surface-2] rounded-full overflow-hidden mb-6 border border-[--color-border-subtle]">
              <div 
                className="h-full rounded-full transition-all duration-700"
                style={{ 
                  width: `${Math.min(capacityPercent, 100)}%`,
                  backgroundColor: isOverAllocated ? '#f87171' : 'var(--color-accent-cyan)'
                }}
              />
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-[--color-surface-2]/40 border border-[--color-border-subtle]">
                <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">
                  Balanced Members
                </div>
                <div className="text-xl font-bold text-[--color-text-primary] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[--color-accent-lime]" />
                  <span>{project.capacity.balancedMembers}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[--color-surface-2]/40 border border-[--color-border-subtle]">
                <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">
                  Overloaded Members
                </div>
                <div className="text-xl font-bold text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>{project.capacity.overloadedMembers}</span>
                </div>
              </div>
            </div>

            {/* Resource Warning / Advice */}
            <div className="p-3.5 rounded-xl bg-[--color-surface-2]/60 border border-[--color-border-subtle] text-xs">
              {project.capacity.overloadedMembers > 0 ? (
                <div className="flex items-start gap-2 text-amber-500">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-[--color-text-secondary]">
                    <strong className="text-amber-500">{project.capacity.overloadedMembers} member(s)</strong> are allocated over 100% capacity. Burnout risk elevated.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-[--color-text-secondary]">
                  <CheckCircle2 className="w-4 h-4 text-[--color-accent-lime] shrink-0 mt-0.5" />
                  <span>All assigned workforce members are operating within healthy allocation bands.</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-[--color-border-subtle]">
            <button
              onClick={() => setIsManageTeamOpen(true)}
              className="w-full py-2.5 rounded-xl bg-[--color-surface-2] hover:bg-[--color-surface-1] border border-[--color-border-strong] text-xs font-bold text-[--color-text-primary] transition-colors"
            >
              Adjust Team Allocations
            </button>
          </div>
        </div>

      </div>

      {/* Manage Team Modal */}
      <ManageTeamModal 
        isOpen={isManageTeamOpen}
        project={project}
        onClose={() => setIsManageTeamOpen(false)}
      />
    </div>
  );
}
