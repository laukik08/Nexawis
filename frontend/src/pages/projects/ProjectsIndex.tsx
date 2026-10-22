import { ProjectFilters } from '../../components/projects/ProjectFilters';
import { ProjectTable } from '../../components/projects/ProjectTable';
import { ProjectCards } from '../../components/projects/ProjectCards';
import { CreateProjectModal } from '../../components/projects/CreateProjectModal';
import { useProjects } from '../../context/ProjectsContext';
import { Plus, FolderKanban, RotateCcw, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useState, useMemo } from 'react';

export function ProjectsIndex() {
  const { projects, loading, error, refreshProjects } = useProjects();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [sortBy, setSortBy] = useState('priority-desc');

  // Toggle helpers
  const handleToggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleTogglePriority = (priority: string) => {
    setSelectedPriorities(prev => 
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    );
  };

  const handleToggleRisk = (risk: string) => {
    setSelectedRisks(prev => 
      prev.includes(risk) ? prev.filter(r => r !== risk) : [...prev, risk]
    );
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setSelectedRisks([]);
    setSelectedDepartment('All Departments');
    setSortBy('priority-desc');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    count += selectedStatuses.length;
    count += selectedPriorities.length;
    count += selectedRisks.length;
    if (selectedDepartment !== 'All Departments') count++;
    return count;
  }, [searchQuery, selectedStatuses, selectedPriorities, selectedRisks, selectedDepartment]);

  // Priority weight for sorting
  const priorityWeight: Record<string, number> = {
    'Critical': 4,
    'High': 3,
    'Medium': 2,
    'Low': 1
  };

  // Filtered and Sorted Projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = project.name.toLowerCase().includes(q);
        const matchId = project.projectId.toLowerCase().includes(q);
        const matchDept = project.department.toLowerCase().includes(q);
        const matchClient = project.client?.toLowerCase().includes(q);
        const matchPM = project.projectManager?.toLowerCase().includes(q);
        const matchDesc = project.description?.toLowerCase().includes(q);
        const matchSkills = project.requirements?.some(r => r.skill.toLowerCase().includes(q));

        if (!matchName && !matchId && !matchDept && !matchClient && !matchPM && !matchDesc && !matchSkills) {
          return false;
        }
      }

      // Status
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(project.status)) {
        return false;
      }

      // Priority
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(project.priority)) {
        return false;
      }

      // Risk
      if (selectedRisks.length > 0 && !selectedRisks.includes(project.overallRisk)) {
        return false;
      }

      // Department
      if (selectedDepartment !== 'All Departments' && project.department !== selectedDepartment) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'priority-desc':
          return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        case 'priority-asc':
          return (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0);
        case 'progress-desc':
          return b.progress - a.progress;
        case 'progress-asc':
          return a.progress - b.progress;
        case 'deadline-asc':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'teamfit-desc':
          return b.teamFit - a.teamFit;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [projects, searchQuery, selectedStatuses, selectedPriorities, selectedRisks, selectedDepartment, sortBy]);

  // Overall quick stats
  const total = projects.length;
  const active = projects.filter(p => p.status === 'Active').length;
  const onTrack = projects.filter(p => p.status === 'On Track').length;
  const atRisk = projects.filter(p => p.status === 'At Risk' || p.overallRisk === 'High').length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[--color-accent-cyan] bg-[--color-accent-cyan]/10 px-2.5 py-0.5 rounded-full border border-[--color-accent-cyan]/20">
              Workforce Intelligence
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold text-[--color-text-primary] tracking-tight mb-2">
            Projects Directory
          </h1>
          <p className="text-[--color-text-secondary] max-w-xl text-sm leading-relaxed">
            Monitor real-time project requirements, execution health, risk vectors, and AWIS workforce alignment.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            data-cursor="button"
            className="flex items-center space-x-2 btn-primary px-5 py-2.5 rounded-xl font-bold shrink-0 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card-base p-4">
          <div className="text-xs font-bold text-[--color-text-muted] uppercase tracking-wider mb-1">Total Projects</div>
          <div className="text-2xl font-bold text-[--color-text-primary]">{total}</div>
        </div>
        <div className="card-base p-4">
          <div className="text-xs font-bold text-[--color-text-muted] uppercase tracking-wider mb-1">Active</div>
          <div className="text-2xl font-bold text-[--color-accent-cyan]">{active}</div>
        </div>
        <div className="card-base p-4">
          <div className="text-xs font-bold text-[--color-text-muted] uppercase tracking-wider mb-1">On Track</div>
          <div className="text-2xl font-bold text-[--color-accent-lime]">{onTrack}</div>
        </div>
        <div className="card-base p-4">
          <div className="text-xs font-bold text-[--color-text-muted] uppercase tracking-wider mb-1">At Risk</div>
          <div className="text-2xl font-bold text-red-400">{atRisk}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <ProjectFilters 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatuses={selectedStatuses}
        onToggleStatus={handleToggleStatus}
        selectedPriorities={selectedPriorities}
        onTogglePriority={handleTogglePriority}
        selectedRisks={selectedRisks}
        onToggleRisk={handleToggleRisk}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onClearAll={handleClearAll}
        activeFilterCount={activeFilterCount}
      />

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button 
            onClick={() => refreshProjects()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}
      
      {/* Main Content: Table or Cards */}
      <div className="mt-4">
        {loading ? (
          <div className="card-base p-16 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-[--color-accent-cyan] animate-spin" />
            <p className="text-sm text-[--color-text-secondary] font-medium">Loading workspace projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="card-base p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[--color-surface-2] flex items-center justify-center text-[--color-text-muted] mb-4">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[--color-text-primary] mb-1">
              No matching projects found
            </h3>
            <p className="text-xs text-[--color-text-secondary] max-w-sm mb-6">
              {activeFilterCount > 0 
                ? "Try adjusting or clearing your search filters to find what you are looking for."
                : "No project profiles have been created in this workspace yet."}
            </p>
            <div className="flex items-center space-x-3">
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearAll}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[--color-surface-2] hover:bg-[--color-border-strong] text-xs font-bold text-[--color-text-primary] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Create First Project
              </button>
            </div>
          </div>
        ) : (
          <>
            <ProjectTable projects={filteredProjects} />
            <ProjectCards projects={filteredProjects} />
          </>
        )}
      </div>
      
      {/* Pagination Footer */}
      <div className="mt-8 flex items-center justify-between border-t border-[--color-border-subtle] pt-6">
        <div className="text-xs text-[--color-text-secondary]">
          Showing <span className="font-bold text-[--color-text-primary]">{filteredProjects.length}</span> of <span className="font-bold text-[--color-text-primary]">{total}</span> total projects
        </div>
        {activeFilterCount > 0 && (
          <div className="text-xs text-[--color-accent-cyan]">
            {filteredProjects.length === total ? 'Showing all' : `Filtered to ${filteredProjects.length}`}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
