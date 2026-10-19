import { useState, useMemo } from 'react';
import { useTeamFormation } from '../../context/TeamFormationContext';
import { 
  Search, 
  Eye, 
  Calendar, 
  Users, 
  Layers, 
  Plus
} from 'lucide-react';
import { FormationDetailModal } from './FormationDetailModal';

export function FormationHistoryTable() {
  const { 
    history, 
    setPreviewFormation, 
    resetWorkflow, 
    openCreateFormationWithOptions 
  } = useTeamFormation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Finalized' | 'Active' | 'Draft'>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'fit-desc' | 'size-desc'>('date-desc');

  const filteredHistory = useMemo(() => {
    let list = history.filter(item => {
      const matchesSearch = 
        item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.projectDepartment.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    list.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'fit-desc') {
        return b.teamFitScore - a.teamFitScore;
      }
      if (sortBy === 'size-desc') {
        return b.teamSize - a.teamSize;
      }
      return 0;
    });

    return list;
  }, [history, searchQuery, statusFilter, sortBy]);

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
      
      {/* Header & Filter Controls */}
      <div className="card-base p-6 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 
              className="text-lg font-display font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Formation History & Archives
            </h3>
            <p 
              className="text-xs mt-0.5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Explore historical rosters, team-fit outcomes, and finalized team structures.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetWorkflow();
              openCreateFormationWithOptions();
            }}
            className="btn-primary px-5 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 self-start md:self-auto shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Formation</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-[--color-border-subtle]">
          
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
            <input
              type="text"
              placeholder="Search by project name, department, or formation ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[--color-accent-cyan]"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {(['All', 'Finalized', 'Active', 'Draft'] as const).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st ? 'btn-primary' : 'hover:bg-[--color-surface-2]'
                }`}
                style={statusFilter !== st ? {
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-surface-1)'
                } : {}}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              border: '1px solid var(--color-border-strong)',
              color: 'var(--color-text-primary)'
            }}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="fit-desc">Highest Team Fit</option>
            <option value="size-desc">Largest Team Size</option>
          </select>

        </div>
      </div>

      {/* History Table (Desktop) */}
      <div className="hidden md:block card-base rounded-2xl overflow-hidden border border-[--color-border-subtle]">
        {filteredHistory.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Layers className="w-10 h-10 mx-auto text-[--color-text-muted]" />
            <div className="text-sm font-bold text-[--color-text-primary]">No Formation Records Found</div>
            <p className="text-xs text-[--color-text-secondary] max-w-sm mx-auto">
              No historical formations matched your search or status filters. Try clearing your filters or create a new team formation.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr 
                className="border-b text-[10px] uppercase font-bold tracking-wider"
                style={{ 
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text-muted)'
                }}
              >
                <th className="py-3.5 px-6">Formation ID</th>
                <th className="py-3.5 px-6">Target Project</th>
                <th className="py-3.5 px-6">Date Created</th>
                <th className="py-3.5 px-6">Team Size</th>
                <th className="py-3.5 px-6">Team Fit</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border-subtle] text-xs">
              {filteredHistory.map((item) => (
                <tr 
                  key={item.id}
                  className="hover:bg-[--color-surface-2]/40 transition-colors"
                >
                  <td className="py-4 px-6 font-mono font-bold text-[--color-accent-cyan]">
                    {item.id}
                  </td>

                  <td className="py-4 px-6">
                    <div className="font-bold text-[--color-text-primary] text-sm">
                      {item.projectName}
                    </div>
                    <div className="text-[11px] text-[--color-text-muted]">
                      {item.projectDepartment}
                    </div>
                  </td>

                  <td className="py-4 px-6 text-[--color-text-secondary]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[--color-text-muted]" />
                      <span>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 text-[--color-text-primary] font-semibold">
                      <Users className="w-3.5 h-3.5 text-[--color-text-muted]" />
                      <span>{item.teamSize} Members</span>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-sm text-[--color-accent-cyan]">
                        {item.teamFitScore}%
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => setPreviewFormation(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[--color-surface-2] transition-colors"
                      style={{
                        border: '1px solid var(--color-border-strong)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* History Cards (Mobile) */}
      <div className="md:hidden space-y-4">
        {filteredHistory.map((item) => (
          <div 
            key={item.id}
            className="card-base p-5 rounded-2xl border border-[--color-border-subtle] space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-[--color-accent-cyan]">
                  {item.id}
                </span>
                <h4 className="text-base font-bold text-[--color-text-primary] mt-1">
                  {item.projectName}
                </h4>
                <p className="text-xs text-[--color-text-muted]">{item.projectDepartment}</p>
              </div>

              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusBadge(item.status)}`}>
                {item.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-[--color-border-subtle] text-center text-xs">
              <div>
                <div className="text-[10px] text-[--color-text-muted] uppercase font-bold">Team Fit</div>
                <div className="font-display font-bold text-sm text-[--color-accent-cyan]">{item.teamFitScore}%</div>
              </div>
              <div>
                <div className="text-[10px] text-[--color-text-muted] uppercase font-bold">Team Size</div>
                <div className="font-bold text-sm text-[--color-text-primary]">{item.teamSize}</div>
              </div>
              <div>
                <div className="text-[10px] text-[--color-text-muted] uppercase font-bold">Date</div>
                <div className="text-[11px] font-medium text-[--color-text-secondary]">
                  {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPreviewFormation(item)}
              className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[--color-surface-2] transition-colors"
              style={{
                border: '1px solid var(--color-border-strong)',
                color: 'var(--color-text-primary)'
              }}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Roster & Analytics</span>
            </button>
          </div>
        ))}
      </div>

      {/* Formation Record Details Modal */}
      <FormationDetailModal />

    </div>
  );
}
