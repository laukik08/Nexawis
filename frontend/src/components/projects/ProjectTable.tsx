import { useState, useRef, useEffect } from 'react';
import type { Project } from '../../data/mockProjects';
import { MoreHorizontal, Edit, Users, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { EditProjectModal } from './EditProjectModal';
import { ManageTeamModal } from './ManageTeamModal';
import clsx from 'clsx';

interface ProjectTableProps {
  projects: Project[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false });

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [managingTeamProject, setManagingTeamProject] = useState<Project | null>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  const onMouseDown = (e: ReactMouseEvent) => {
    if (!scrollRef.current) return;
    dragState.current.isDown = true;
    dragState.current.moved = false;
    dragState.current.startX = e.pageX - scrollRef.current.offsetLeft;
    dragState.current.scrollLeft = scrollRef.current.scrollLeft;
  };

  const onMouseLeave = () => {
    dragState.current.isDown = false;
  };

  const onMouseUp = () => {
    dragState.current.isDown = false;
  };

  const onMouseMove = (e: ReactMouseEvent) => {
    if (!dragState.current.isDown || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.5;
    if (Math.abs(walk) > 5) {
      dragState.current.moved = true;
      e.preventDefault();
      scrollRef.current.scrollLeft = dragState.current.scrollLeft - walk;
    }
  };

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

  const getPriorityStyle = (priority: Project['priority']) => {
    switch(priority) {
      case 'Critical': return 'text-red-400 font-bold';
      case 'High': return 'text-[--color-accent-cyan] font-bold';
      default: return 'text-[--color-text-secondary]';
    }
  };

  const getRiskStyle = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-[--color-accent-lime]';
      case 'Medium': return 'text-[--color-accent-cyan]';
      case 'High': return 'text-red-400 font-bold';
      default: return 'text-[--color-text-secondary]';
    }
  };

  return (
    <>
      <div 
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        className="hidden md:block card-base p-0 overflow-x-auto rounded-2xl border border-[--color-border-subtle] active:cursor-grabbing cursor-grab"
      >
        <table className="w-full text-left border-collapse min-w-[1000px] select-none text-xs">
          <thead>
            <tr className="border-b border-[--color-border-subtle] bg-[--color-surface-2]/60">
              <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-[--color-text-secondary] whitespace-nowrap">Project</th>
              <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-[--color-text-secondary] whitespace-nowrap">Priority</th>
              <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-[--color-text-secondary] whitespace-nowrap">Status</th>
              <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-[--color-text-secondary] whitespace-nowrap">Team Size</th>
              <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-[--color-text-secondary] whitespace-nowrap">Progress</th>
              <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-[--color-text-secondary] whitespace-nowrap">Risk</th>
              <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-[--color-text-secondary] whitespace-nowrap">Team Fit</th>
              <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-[--color-text-secondary] text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[--color-border-subtle]">
            {projects.map((prj) => (
              <tr 
                key={prj.id} 
                onClick={() => {
                  if (!dragState.current.moved) {
                    navigate(`/app/projects/${prj.id}`);
                  }
                }}
                data-cursor="link"
                className="hover:bg-[--color-surface-2]/50 transition-colors group cursor-pointer"
              >
                {/* Project Info */}
                <td className="py-4 px-6 whitespace-nowrap align-middle">
                  <div>
                    <div className="font-bold text-sm text-[--color-text-primary] group-hover:text-[--color-accent-cyan] transition-colors">
                      {prj.name}
                    </div>
                    <div className="text-[11px] text-[--color-text-muted] mt-0.5">
                      <span className="font-mono">{prj.projectId}</span> • {prj.department}
                    </div>
                  </div>
                </td>
                
                {/* Priority */}
                <td className="py-4 px-6 whitespace-nowrap align-middle">
                  <span className={clsx("text-xs font-medium", getPriorityStyle(prj.priority))}>
                    {prj.priority}
                  </span>
                </td>

                {/* Status */}
                <td className="py-4 px-6 whitespace-nowrap align-middle">
                  <span className={clsx("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border", getStatusStyle(prj.status))}>
                    {prj.status}
                  </span>
                </td>

                {/* Team Size */}
                <td className="py-4 px-6 whitespace-nowrap align-middle">
                  <span className="text-xs text-[--color-text-secondary] font-medium">
                    {prj.currentTeam?.length || 0} / {prj.teamSize} target
                  </span>
                </td>

                {/* Progress */}
                <td className="py-4 px-6 align-middle">
                  <div className="w-24">
                    <div className="flex justify-between text-[11px] mb-1 font-bold text-[--color-text-primary]">
                      <span>{prj.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[--color-surface-2] rounded-full overflow-hidden border border-[--color-border-subtle]">
                      <div className="h-full bg-accent-cyan rounded-full" style={{ width: `${prj.progress}%`, backgroundColor: 'var(--color-accent-cyan)' }} />
                    </div>
                  </div>
                </td>

                {/* Risk */}
                <td className="py-4 px-6 whitespace-nowrap align-middle">
                  <span className={clsx("text-xs font-bold flex items-center space-x-1.5", getRiskStyle(prj.overallRisk))}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current" />
                    <span>{prj.overallRisk}</span>
                  </span>
                </td>

                {/* Team Fit */}
                <td className="py-4 px-6 align-middle">
                  <div className="w-24">
                    <div className="flex justify-between text-[11px] mb-1 font-bold text-[--color-text-primary]">
                      <span>{prj.teamFit}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[--color-surface-2] rounded-full overflow-hidden border border-[--color-border-subtle]">
                      <div className="h-full bg-accent-lime rounded-full" style={{ width: `${prj.teamFit}%`, backgroundColor: 'var(--color-accent-lime)' }} />
                    </div>
                  </div>
                </td>

                {/* Actions */}
                <td className="py-4 px-6 text-right align-middle relative">
                  <div className="inline-block text-left" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => setActiveMenuId(activeMenuId === prj.id ? null : prj.id)}
                      className="text-[--color-text-muted] hover:text-[--color-text-primary] p-1.5 rounded-lg hover:bg-[--color-surface-2] transition-colors"
                      title="Project Options"
                    >
                      <MoreHorizontal className="w-4 h-4 shrink-0" />
                    </button>

                    {activeMenuId === prj.id && (
                      <div className="absolute right-6 mt-1 w-44 rounded-xl bg-[--color-surface-1] border border-[--color-border-strong] shadow-xl z-30 p-1 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            navigate(`/app/projects/${prj.id}`);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-[--color-text-primary] hover:bg-[--color-surface-2] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[--color-text-muted]" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            setEditingProject(prj);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-[--color-text-primary] hover:bg-[--color-surface-2] transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5 text-[--color-text-muted]" />
                          <span>Edit Project</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            setManagingTeamProject(prj);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-[--color-text-primary] hover:bg-[--color-surface-2] transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 text-[--color-text-muted]" />
                          <span>Manage Team</span>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals triggered from table */}
      {editingProject && (
        <EditProjectModal
          isOpen={true}
          project={editingProject}
          onClose={() => setEditingProject(null)}
        />
      )}

      {managingTeamProject && (
        <ManageTeamModal
          isOpen={true}
          project={managingTeamProject}
          onClose={() => setManagingTeamProject(null)}
        />
      )}
    </>
  );
}
