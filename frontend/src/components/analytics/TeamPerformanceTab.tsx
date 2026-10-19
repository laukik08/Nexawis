import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ArrowUpDown, 
  Eye, 
  Users, 
  Sparkles,
  Info 
} from 'lucide-react';
import type { TeamAnalyticsData } from '../../types/analytics';

interface TeamPerformanceTabProps {
  teams: TeamAnalyticsData;
}

export function TeamPerformanceTab({ teams }: TeamPerformanceTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'fit' | 'size' | 'skills' | 'sustainability'>('fit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredRows = useMemo(() => {
    let rows = teams.tableRows.filter(row => {
      const matchesSearch = 
        row.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.projectDepartment.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'All' || row.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    rows.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'fit') diff = a.teamFitScore - b.teamFitScore;
      else if (sortBy === 'size') diff = a.teamSize - b.teamSize;
      else if (sortBy === 'skills') diff = a.skillCoveragePercent - b.skillCoveragePercent;
      else if (sortBy === 'sustainability') diff = a.sustainabilityScore - b.sustainabilityScore;

      return sortOrder === 'desc' ? -diff : diff;
    });

    return rows;
  }, [teams.tableRows, searchQuery, selectedStatus, sortBy, sortOrder]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Finalized':
        return 'text-[--color-accent-lime] bg-[--color-accent-lime]/10 border-[--color-accent-lime]/30';
      case 'Active':
        return 'text-[--color-accent-cyan] bg-[--color-accent-cyan]/10 border-[--color-accent-cyan]/30';
      default:
        return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    }
  };

  return (
    <div className="space-y-6">

      {/* Row 1: Team Formation KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Formations Evaluated</span>
          <div className="text-2xl font-display font-bold text-[--color-text-primary] mt-1">{teams.totalFormations} Teams</div>
          <span className="text-[11px] text-[--color-accent-cyan]">Multi-agent AI matching</span>
        </div>

        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Avg Team Fit</span>
          <div className="text-2xl font-display font-bold text-[--color-text-primary] mt-1">{teams.avgTeamFit}%</div>
          <span className="text-[11px] text-[--color-accent-lime]">High synergy threshold</span>
        </div>

        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Avg Skill Coverage</span>
          <div className="text-2xl font-display font-bold text-[--color-text-primary] mt-1">{teams.avgSkillCoverage}%</div>
          <span className="text-[11px] text-[--color-text-secondary]">Technical role alignment</span>
        </div>

        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Avg Sustainability</span>
          <div className="text-2xl font-display font-bold text-[--color-text-primary] mt-1">{teams.avgSustainability}/100</div>
          <span className="text-[11px] text-purple-400">Burnout-protected rosters</span>
        </div>
      </div>

      {/* Distinction Note */}
      <div 
        className="p-4 rounded-xl flex items-center gap-3 text-xs border"
        style={{
          backgroundColor: 'rgba(2, 132, 199, 0.08)',
          borderColor: 'rgba(2, 132, 199, 0.2)',
          color: 'var(--color-text-secondary)'
        }}
      >
        <Info className="w-4 h-4 text-[--color-accent-cyan] shrink-0" />
        <span>
          <strong>Key Definition:</strong> An employee's <em>AWIS Score</em> measures individual competency across 9 dimensions, while <em>Team Fit</em> is a multi-agent composite score measuring collective synergy, skill complementarity, and workload safety across all members of that specific roster.
        </span>
      </div>

      {/* Row 2: Fit Distribution & Team Size Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Fit Score Distribution */}
        <div 
          className="card-base p-6 rounded-2xl border flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-surface-1)',
            borderColor: 'var(--color-border-subtle)'
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[--color-accent-cyan]" />
              <h3 
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Team-Fit Score Distribution
              </h3>
            </div>
            <p className="text-xs text-[--color-text-secondary] mb-4">
              Categorization of team formations by composite synergy rating.
            </p>
          </div>

          <div className="space-y-3 my-auto">
            {teams.fitDistribution.map(item => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[--color-text-primary] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-mono text-[11px] text-[--color-text-muted]">
                    {item.value} formation(s) ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-[--color-surface-3]">
                  <div className="h-full rounded-full transition-all" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[--color-border-subtle] text-xs text-[--color-text-muted]">
            Optimal benchmark: ≥90% composite synergy fit
          </div>
        </div>

        {/* Team Size Distribution */}
        <div 
          className="card-base p-6 rounded-2xl border flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-surface-1)',
            borderColor: 'var(--color-border-subtle)'
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-400" />
              <h3 
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Team Size Distribution
              </h3>
            </div>
            <p className="text-xs text-[--color-text-secondary] mb-4">
              Headcount clusters per formed project team unit.
            </p>
          </div>

          <div className="space-y-3 my-auto">
            {teams.teamSizeDistribution.map(item => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[--color-text-primary] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-mono text-[11px] text-[--color-text-muted]">
                    {item.value} team(s) ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-[--color-surface-3]">
                  <div className="h-full rounded-full transition-all" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[--color-border-subtle] text-xs text-[--color-text-muted]">
            Average formed team size: 4.8 members
          </div>
        </div>

      </div>

      {/* Row 3: Formation Comparison Table */}
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
              Formation Comparison Registry
            </h3>
            <p className="text-xs text-[--color-text-secondary]">
              Comparative telemetry of assembled teams, skill coverage, and sustainability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text-muted]" />
              <input
                type="text"
                placeholder="Search formation or project..."
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
              <option value="Finalized">Finalized</option>
              <option value="Draft">Draft</option>
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
                <th className="py-3 px-4">Formation ID</th>
                <th className="py-3 px-4">Target Project</th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-[--color-text-primary]"
                  onClick={() => toggleSort('fit')}
                >
                  <div className="flex items-center gap-1">
                    <span>Team Fit</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-[--color-text-primary]"
                  onClick={() => toggleSort('size')}
                >
                  <div className="flex items-center gap-1">
                    <span>Team Size</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-[--color-text-primary]"
                  onClick={() => toggleSort('skills')}
                >
                  <div className="flex items-center gap-1">
                    <span>Skill Coverage</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-[--color-text-primary]"
                  onClick={() => toggleSort('sustainability')}
                >
                  <div className="flex items-center gap-1">
                    <span>Sustainability</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border-subtle]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[--color-text-muted]">
                    No formations matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((item) => (
                  <tr key={item.id} className="hover:bg-[--color-surface-2]/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[--color-accent-cyan]">
                      {item.id}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-[--color-text-primary] text-sm">{item.projectName}</div>
                      <div className="text-[11px] text-[--color-text-muted]">{item.projectDepartment}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-[--color-accent-lime]">
                      {item.teamFitScore}%
                    </td>

                    <td className="py-3 px-4 font-semibold text-[--color-text-primary]">
                      {item.teamSize} Members
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {item.skillCoveragePercent}%
                    </td>

                    <td className="py-3 px-4 font-mono text-[--color-accent-cyan]">
                      {item.sustainabilityScore}/100
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/app/teams"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[--color-surface-2] text-[--color-accent-cyan] font-bold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Roster</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-[--color-text-muted]">
          <span>Showing {filteredRows.length} of {teams.tableRows.length} formations</span>
          <span>Synced with Team Formation module</span>
        </div>
      </div>

    </div>
  );
}
