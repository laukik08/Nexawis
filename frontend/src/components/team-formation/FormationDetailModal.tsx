import { X } from 'lucide-react';
import { useTeamFormation } from '../../context/TeamFormationContext';

export function FormationDetailModal() {
  const { previewFormation, setPreviewFormation } = useTeamFormation();

  if (!previewFormation) return null;

  const item = previewFormation;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-strong)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-[--color-text-muted]">
                {item.id}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusBadge(item.status)}`}>
                {item.status}
              </span>
            </div>
            <h3 
              className="text-xl font-display font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {item.projectName}
            </h3>
            <p 
              className="text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {item.projectDepartment} • Formed on {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPreviewFormation(null)}
            className="p-2 rounded-xl text-[--color-text-muted] hover:text-[--color-text-primary] hover:bg-[--color-surface-2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* 4 Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle] text-center">
              <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">Team Fit</div>
              <div className="text-2xl font-display font-bold text-[--color-accent-cyan]">
                {item.teamFitScore}%
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle] text-center">
              <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">Team Size</div>
              <div className="text-2xl font-display font-bold text-[--color-text-primary]">
                {item.teamSize} Members
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle] text-center">
              <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">Skill Coverage</div>
              <div className="text-2xl font-display font-bold text-[--color-accent-lime]">
                {item.metrics.skillCoverage}%
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle] text-center">
              <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">Sustainability</div>
              <div className="text-2xl font-display font-bold text-[--color-accent-lime]">
                {item.metrics.sustainability}%
              </div>
            </div>
          </div>

          {/* Notes if present */}
          {item.notes && (
            <div className="p-3.5 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle] text-xs">
              <span className="font-bold text-[--color-text-primary] mr-1.5">Formation Notes:</span>
              <span className="text-[--color-text-secondary]">{item.notes}</span>
            </div>
          )}

          {/* Members Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[--color-text-primary]">
              Assigned Team Members ({item.members.length})
            </h4>

            <div className="space-y-2">
              {item.members.map((mem) => (
                <div 
                  key={mem.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border-subtle)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={mem.avatarUrl} 
                      alt={mem.name} 
                      className="w-10 h-10 rounded-full object-cover border"
                      style={{ borderColor: 'var(--color-border-strong)' }}
                    />
                    <div>
                      <div className="font-bold text-sm text-[--color-text-primary]">{mem.name}</div>
                      <div className="text-xs text-[--color-accent-cyan] font-semibold">{mem.assignedRole}</div>
                      <div className="text-[11px] text-[--color-text-muted]">{mem.role}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-right">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">Match</div>
                      <div className="font-bold text-[--color-accent-cyan]">{mem.matchScore}%</div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">AWIS Score</div>
                      <div className="font-bold text-[--color-text-primary]">{mem.awisScore}</div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">Wellbeing</div>
                      <span 
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          mem.wellbeingRisk === 'High' ? 'text-red-400 bg-red-400/10 border-red-400/25' :
                          mem.wellbeingRisk === 'Moderate' ? 'text-amber-400 bg-amber-400/10 border-amber-400/25' :
                          'text-[--color-accent-lime] bg-[--color-accent-lime]/10 border-[--color-accent-lime]/25'
                        }`}
                      >
                        {mem.wellbeingRisk}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div 
          className="p-4 border-t flex justify-end"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <button
            type="button"
            onClick={() => setPreviewFormation(null)}
            className="px-5 py-2 rounded-xl text-xs font-bold hover:bg-[--color-surface-2] transition-colors"
            style={{
              border: '1px solid var(--color-border-strong)',
              color: 'var(--color-text-primary)'
            }}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
