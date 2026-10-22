import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ArrowUpDown, 
  Eye, 
  Clock, 
  Layers 
} from 'lucide-react';
import type { ProjectAnalyticsData } from '../../types/analytics';

interface ProjectsTabProps {
  projects: ProjectAnalyticsData;
}

export function ProjectsTab({ projects }: ProjectsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'teamFit' | 'teamSize'>('progress');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredRows = useMemo(() => {
    let rows = projects.tableRows.filter(proj => {
      const matchesSearch = 
        proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proj.projectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proj.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'All' || proj.status === selectedStatus;
      const matchesPriority = selectedPriority === 'All' || proj.priority === selectedPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    rows.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'name') diff = a.name.localeCompare(b.name);
      else if (sortBy === 'progress') diff = a.progress - b.progress;
      else if (sortBy === 'teamFit') diff = a.teamFit - b.teamFit;
      else if (sortBy === 'teamSize') diff = a.teamSize - b.teamSize;

      return sortOrder === 'desc' ? -diff : diff;
    });

    return rows;
  }, [projects.tableRows, searchQuery, selectedStatus, selectedPriority, sortBy, sortOrder]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'High':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'Medium':
        return 'text-[--color-accent-cyan] bg-[--color-accent-cyan]/10 border-[--color-accent-cyan]/30';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'On Track':
        return 'text-[--color-accent-lime] bg-[--color-accent-lime]/10 border-[--color-accent-lime]/30';
      case 'At Risk':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'Delayed':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  return (
    <div className="space-y-6">

      {/* Row 1: Project Macro KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Portfolio Size</span>
          <div className="text-2xl font-display font-bold text-[--color-text-primary] mt-1">{projects.totalProjects} Initiatives</div>
          <span className="text-[11px] text-[--color-accent-cyan]">{projects.activeProjectsCount} actively staffed</span>
        </div>

        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Critical Priority</span>
          <div className="text-2xl font-display font-bold text-[--color-text-primary] mt-1">{projects.criticalProjectsCount} Initiatives</div>
          <span className="text-[11px] text-amber-400">High business impact</span>
        </div>

        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Average Progress</span>
          <div className="text-2xl font-display font-bold text-[--color-text-primary] mt-1">{projects.avgProgress}%</div>
          <span className="text-[11px] text-[--color-accent-lime]">Portfolio milestone velocity</span>
        </div>

        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Avg Team Fit</span>
          <div className="text-2xl font-display font-bold text-[--color-text-primary] mt-1">{projects.avgTeamFit}%</div>
          <span className="text-[11px] text-[--color-text-secondary]">Skill & capacity alignment</span>
        </div>
      </div>

      {/* Row 2: Status & Schedule Health Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status Breakdown */}
        <div 
          className="card-base p-6 rounded-2xl border flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-surface-1)',
            borderColor: 'var(--color-border-subtle)'
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-[--color-accent-cyan]" />
              <h3 
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Project Status & Stage Distribution
              </h3>
            </div>
            <p className="text-xs text-[--color-text-secondary] mb-4">
              Current project phases across filtered departments and portfolios.
            </p>
          </div>

          <div className="space-y-3 my-auto">
            {projects.statusDistribution.map(item => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[--color-text-primary] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-mono text-[11px] text-[--color-text-muted]">
                    {item.value} project(s) ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-[--color-surface-3]">
                  <div className="h-full rounded-full transition-all" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[--color-border-subtle] text-xs text-[--color-text-muted]">
            {projects.totalProjects} total initiatives represented
          </div>
        </div>

        {/* Schedule Health & Deadline Risk */}
        <div 
          className="card-base p-6 rounded-2xl border flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-surface-1)',
            borderColor: 'var(--color-border-subtle)'
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Schedule Health & Delivery Confidence
              </h3>
            </div>
            <p className="text-xs text-[--color-text-secondary] mb-4">
              Delivery schedule confidence based on progress vs deadline timelines.
            </p>
          </div>

          <div className="space-y-3 my-auto">
            {projects.scheduleHealthDistribution.map(item => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[--color-text-primary] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-mono text-[11px] text-[--color-text-muted]">
                    {item.value} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-[--color-surface-3]">
                  <div className="h-full rounded-full transition-all" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[--color-border-subtle] text-xs text-[--color-text-muted]">
            Operational schedule health calculated from verified start dates, target deadlines, and recorded delivery delays.
          </div>
        </div>

      </div>

      {/* Row 3: Project Analytics Table */}
      <div 
        className="card-base p-6 rounded-2xl border space-y-4"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-subtle)'
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 
              className="text-base font-display font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Project Intelligence Registry
            </h3>
            <p className="text-xs text-[--color-text-secondary]">
              Real-time portfolio status, progress velocity, and team fit scores.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text-muted]" />
              <input
                type="text"
                placeholder="Search project name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary] focus:outline-none"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary] focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Planning">Planning</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary] focus:outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[--color-border-subtle]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr 
                className="border-b text-[10px] uppercase font-bold tracking-wider"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text-muted)'
                }}
              >
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-[--color-text-primary]"
                  onClick={() => toggleSort('progress')}
                >
                  <div className="flex items-center gap-1">
                    <span>Progress</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-[--color-text-primary]"
                  onClick={() => toggleSort('teamFit')}
                >
                  <div className="flex items-center gap-1">
                    <span>Team Fit</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Schedule Health</th>
                <th className="py-3 px-4">ML Simulation</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border-subtle]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[--color-text-muted]">
                    No projects matching current filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((proj) => (
                  <tr key={proj.id} className="hover:bg-[--color-surface-2]/40 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-bold text-[--color-text-primary] text-sm">{proj.name}</div>
                        <div className="text-[11px] text-[--color-text-muted]">{proj.projectId} • {proj.department}</div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(proj.priority)}`}>
                        {proj.priority}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-[--color-text-primary]">{proj.status}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[--color-surface-3] overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-[--color-accent-cyan]" 
                            style={{ width: `${proj.progress}%` }} 
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold">{proj.progress}%</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-[--color-accent-cyan]">
                      {proj.teamFit}%
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getHealthBadge(proj.scheduleHealth)}`}>
                        {proj.scheduleHealth}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] text-[--color-accent-lime] font-bold">
                        {proj.demoSuccessScore}%
                      </span>
                      <span className="text-[9px] text-[--color-text-muted] ml-1">(simulation)</span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/app/projects/${proj.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[--color-surface-2] text-[--color-accent-cyan] font-bold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-[--color-text-muted]">
          <span>Showing {filteredRows.length} of {projects.tableRows.length} projects</span>
          <span>Explicitly labelled as demonstration outcomes</span>
        </div>
      </div>

    </div>
  );
}
