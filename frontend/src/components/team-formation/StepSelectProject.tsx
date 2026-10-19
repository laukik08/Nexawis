import { useState, useMemo } from 'react';
import { useTeamFormation } from '../../context/TeamFormationContext';
import { 
  Search, 
  Calendar, 
  Users, 
  Check, 
  ArrowRight, 
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import type { Project } from '../../data/mockProjects';

export function StepSelectProject() {
  const { 
    projects, 
    selectedProject, 
    selectProject, 
    goToStep,
    activeFormationOption,
    setIsOptionsModalOpen
  } = useTeamFormation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  const departments = useMemo(() => {
    const set = new Set(projects.map(p => p.department));
    return ['All', ...Array.from(set)];
  }, [projects]);

  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.projectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.department.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDept = selectedDepartment === 'All' || p.department === selectedDepartment;
      const matchesPriority = selectedPriority === 'All' || p.priority === selectedPriority;

      return matchesSearch && matchesDept && matchesPriority;
    });
  }, [projects, searchQuery, selectedDepartment, selectedPriority]);

  const getPriorityStyle = (priority: Project['priority']) => {
    switch (priority) {
      case 'Critical': return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'High': return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
      case 'Medium': return 'badge-active';
      default: return 'text-secondary-color border-subtle-color bg-surface-2';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="card-base p-6 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 
              className="text-lg font-display font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Select Target Project
            </h3>
            <p 
              className="text-xs mt-0.5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Choose a project to analyze requirements, assemble candidates, and optimize team synergy.
            </p>
          </div>

          {/* Search Input & Formation Option Badge */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setIsOptionsModalOpen(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between sm:justify-start gap-2 hover:bg-[--color-surface-2] border shrink-0"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border-subtle)',
                color: 'var(--color-text-primary)'
              }}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[--color-accent-cyan]" />
                <span className="text-[11px] font-semibold text-[--color-text-secondary]">Mode:</span>
                <span className="font-bold">{activeFormationOption.title}</span>
              </div>
              <span 
                className="text-[10px] font-bold px-1.5 py-0.2 rounded"
                style={{
                  backgroundColor: 'var(--color-surface-3)',
                  color: activeFormationOption.accentColor,
                  border: '1px solid var(--color-border-subtle)'
                }}
              >
                {activeFormationOption.badge}
              </span>
            </button>

            <div className="relative w-full sm:w-72">
              <Search 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" 
                style={{ color: 'var(--color-text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[--color-accent-cyan] transition-all"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[--color-border-subtle] text-xs">
          <div className="flex items-center gap-1.5 text-[--color-text-muted] font-bold text-[11px] uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Department dropdown */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-[--color-accent-cyan]"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              border: '1px solid var(--color-border-strong)',
              color: 'var(--color-text-primary)'
            }}
          >
            {departments.map(d => (
              <option key={d} value={d}>
                {d === 'All' ? 'All Departments' : d}
              </option>
            ))}
          </select>

          {/* Priority chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {priorities.map(pr => {
              const isActive = selectedPriority === pr;
              return (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setSelectedPriority(pr)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    isActive ? 'btn-primary' : 'hover:bg-[--color-surface-2]'
                  }`}
                  style={!isActive ? {
                    border: '1px solid var(--color-border-subtle)',
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'var(--color-surface-1)'
                  } : {}}
                >
                  {pr}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((project) => {
          const isSelected = selectedProject?.id === project.id;

          return (
            <div
              key={project.id}
              onClick={() => selectProject(project)}
              className="card-base p-5 rounded-2xl cursor-pointer transition-all relative flex flex-col justify-between hover:translate-y-[-2px]"
              style={{
                border: isSelected 
                  ? '2px solid var(--color-accent-cyan)' 
                  : '1px solid var(--color-border-subtle)',
                boxShadow: isSelected 
                  ? '0 6px 24px rgba(2, 132, 199, 0.18)' 
                  : 'none'
              }}
            >
              {/* Top Tag & Selection Indicator */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span 
                      className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ 
                        backgroundColor: 'var(--color-surface-2)',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      {project.projectId}
                    </span>
                    <h4 
                      className="text-base font-bold font-display mt-1.5 leading-snug line-clamp-1"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {project.name}
                    </h4>
                    <p 
                      className="text-[11px] font-medium"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {project.department}
                    </p>
                  </div>

                  {/* Selection Check Badge */}
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform"
                    style={
                      isSelected
                        ? {
                            backgroundColor: 'var(--color-accent-cyan)',
                            color: 'var(--color-text-inverse)',
                            boxShadow: '0 0 12px rgba(2, 132, 199, 0.4)'
                          }
                        : {
                            backgroundColor: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border-strong)',
                            color: 'transparent'
                          }
                    }
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>

                <p 
                  className="text-xs line-clamp-2 mb-4 leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {project.description}
                </p>

                {/* Requirements Skills Pills */}
                <div className="space-y-1.5 mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[--color-text-muted]">
                    Required Stack ({project.requirements.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {project.requirements.slice(0, 4).map((req, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border-subtle)',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        {req.skill}
                      </span>
                    ))}
                    {project.requirements.length > 4 && (
                      <span 
                        className="text-[10px] font-medium px-2 py-0.5 rounded"
                        style={{ 
                          backgroundColor: 'var(--color-surface-2)',
                          color: 'var(--color-text-muted)'
                        }}
                      >
                        +{project.requirements.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Meta & Badges */}
              <div 
                className="pt-3 border-t flex items-center justify-between text-xs"
                style={{ borderColor: 'var(--color-border-subtle)' }}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getPriorityStyle(project.priority)}`}>
                    {project.priority}
                  </span>
                  <div 
                    className="flex items-center gap-1 text-[11px]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{project.teamSize} target</span>
                  </div>
                </div>

                <div 
                  className="flex items-center gap-1 text-[11px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--color-accent-cyan)' }} />
                  <span>{new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Project Full Details Summary & CTA */}
      {selectedProject && (
        <div 
          className="card-base p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          style={{
            border: '1px solid var(--color-accent-cyan)',
            backgroundColor: 'var(--color-surface-1)'
          }}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(2, 132, 199, 0.12)',
                  color: 'var(--color-accent-cyan)',
                  border: '1px solid rgba(2, 132, 199, 0.25)'
                }}
              >
                Ready for Configuration
              </span>
              <span className="text-xs font-mono font-medium text-[--color-text-muted]">
                Target: {selectedProject.teamSize} Member Roster
              </span>
            </div>

            <h4 
              className="text-lg font-display font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {selectedProject.name} — <span className="font-normal text-sm text-[--color-text-secondary]">{selectedProject.department}</span>
            </h4>

            <p 
              className="text-xs max-w-3xl leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {selectedProject.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => goToStep(2)}
            className="btn-primary px-7 py-3 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 shrink-0 self-start lg:self-center shadow-lg"
          >
            <span>Configure Requirements</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
