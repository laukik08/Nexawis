import { X } from 'lucide-react';
import { useTeamFormation } from '../../context/TeamFormationContext';

export function EmployeeProfilePreviewModal() {
  const { previewEmployee, setPreviewEmployee } = useTeamFormation();

  if (!previewEmployee) return null;

  const emp = previewEmployee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-strong)'
        }}
      >
        {/* Modal Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <div className="flex items-center gap-4">
            <img 
              src={emp.avatarUrl} 
              alt={emp.name} 
              className="w-14 h-14 rounded-full object-cover border-2 shadow-sm"
              style={{ borderColor: 'var(--color-accent-cyan)' }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 
                  className="text-lg font-display font-bold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {emp.name}
                </h3>
                <span 
                  className="text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border-subtle)'
                  }}
                >
                  {emp.employeeId}
                </span>
              </div>
              <p 
                className="text-xs"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {emp.role} • <span style={{ color: 'var(--color-accent-cyan)' }}>{emp.department}</span>
              </p>
              <div className="text-[11px] text-[--color-text-muted] mt-0.5">
                {emp.experienceYears} Years Experience • Status: <span className="font-bold text-[--color-accent-lime]">{emp.status}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPreviewEmployee(null)}
            className="p-2 rounded-xl text-[--color-text-muted] hover:text-[--color-text-primary] hover:bg-[--color-surface-2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div 
              className="p-3.5 rounded-xl border text-center"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border-subtle)'
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-[--color-text-muted] mb-1">AWIS Score</div>
              <div className="text-2xl font-display font-bold" style={{ color: 'var(--color-accent-cyan)' }}>
                {emp.awisFitScore}
              </div>
            </div>

            <div 
              className="p-3.5 rounded-xl border text-center"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border-subtle)'
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-[--color-text-muted] mb-1">Performance</div>
              <div className="text-2xl font-display font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {emp.performanceScore}/100
              </div>
            </div>

            <div 
              className="p-3.5 rounded-xl border text-center"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border-subtle)'
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-[--color-text-muted] mb-1">Availability</div>
              <div className="text-2xl font-display font-bold" style={{ color: 'var(--color-accent-lime)' }}>
                {emp.availabilityScore}%
              </div>
            </div>

            <div 
              className="p-3.5 rounded-xl border text-center"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border-subtle)'
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-[--color-text-muted] mb-1">Wellbeing Risk</div>
              <div className="mt-1">
                <span 
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    emp.wellbeingRisk === 'High' ? 'text-red-400 bg-red-400/10 border-red-400/25' :
                    emp.wellbeingRisk === 'Moderate' ? 'text-amber-400 bg-amber-400/10 border-amber-400/25' :
                    'text-[--color-accent-lime] bg-[--color-accent-lime]/10 border-[--color-accent-lime]/25'
                  }`}
                >
                  {emp.wellbeingRisk}
                </span>
              </div>
            </div>
          </div>

          {/* Technical Skills Breakdown */}
          <div className="space-y-3">
            <h4 
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Core Proficiencies & Skills ({emp.skills.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {emp.skills.map(s => (
                <div 
                  key={s.name}
                  className="p-3 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border-subtle)'
                  }}
                >
                  <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                    <span style={{ color: 'var(--color-text-primary)' }}>{s.name}</span>
                    <span style={{ color: s.isPrimary ? 'var(--color-accent-cyan)' : 'var(--color-text-secondary)' }}>
                      {s.proficiency}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/10">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${s.proficiency}%`,
                        backgroundColor: s.isPrimary ? 'var(--color-accent-cyan)' : 'var(--color-accent-lime)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Allocations */}
          <div className="space-y-3">
            <h4 
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Active Project Allocations
            </h4>
            {emp.currentProjects.length === 0 ? (
              <p className="text-xs text-[--color-text-muted] italic">Currently 100% unallocated and ready for assignment.</p>
            ) : (
              <div className="space-y-2">
                {emp.currentProjects.map(cp => (
                  <div 
                    key={cp.id}
                    className="flex items-center justify-between p-3 rounded-xl border text-xs"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                  >
                    <div>
                      <div className="font-bold text-[--color-text-primary]">{cp.name}</div>
                      <div className="text-[11px] text-[--color-text-muted]">{cp.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[--color-accent-cyan]">{cp.allocationPercent}%</div>
                      <div className="text-[10px] text-[--color-text-muted]">Allocation</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div 
          className="p-4 border-t flex justify-end"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <button
            type="button"
            onClick={() => setPreviewEmployee(null)}
            className="px-5 py-2 rounded-xl text-xs font-bold hover:bg-[--color-surface-2] transition-colors"
            style={{
              border: '1px solid var(--color-border-strong)',
              color: 'var(--color-text-primary)'
            }}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
