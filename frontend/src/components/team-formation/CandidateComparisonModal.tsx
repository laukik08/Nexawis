import { useState, useMemo } from 'react';
import { X, Search, ArrowRightLeft, Plus } from 'lucide-react';
import { useTeamFormation } from '../../context/TeamFormationContext';
import { mockEmployees, type Employee } from '../../data/mockEmployees';

interface CandidateComparisonModalProps {
  mode: 'replace' | 'add';
  onClose: () => void;
}

export function CandidateComparisonModal({ mode, onClose }: CandidateComparisonModalProps) {
  const { 
    candidateToReplace, 
    candidates, 
    replaceCandidate, 
    addCandidate, 
    setPreviewEmployee 
  } = useTeamFormation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  // Existing assigned candidate IDs
  const assignedIds = useMemo(() => new Set(candidates.map(c => c.id)), [candidates]);

  // Available alternatives
  const availableEmployees = useMemo(() => {
    return mockEmployees.filter(emp => {
      // If replacing, exclude existing candidates except the one being replaced
      if (mode === 'replace') {
        if (assignedIds.has(emp.id) && emp.id !== candidateToReplace?.id) return false;
      } else {
        if (assignedIds.has(emp.id)) return false;
      }

      const matchesSearch = 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.skills.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept = selectedDept === 'All' || emp.department === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [assignedIds, mode, candidateToReplace, searchQuery, selectedDept]);

  const departments = useMemo(() => {
    const set = new Set(mockEmployees.map(e => e.department));
    return ['All', ...Array.from(set)];
  }, []);

  const handleSelectAlternative = (emp: Employee) => {
    if (mode === 'replace' && candidateToReplace) {
      replaceCandidate(candidateToReplace.id, emp, candidateToReplace.assignedRole);
    } else {
      addCandidate(emp);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl border animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-strong)'
        }}
      >
        {/* Modal Header */}
        <div 
          className="p-6 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(2, 132, 199, 0.12)',
                  color: 'var(--color-accent-cyan)',
                  border: '1px solid rgba(2, 132, 199, 0.25)'
                }}
              >
                {mode === 'replace' ? 'Candidate Replacement & Swap' : 'Add Team Member'}
              </span>
            </div>
            <h3 
              className="text-lg font-display font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {mode === 'replace' && candidateToReplace 
                ? `Find Alternative for ${candidateToReplace.name} (${candidateToReplace.assignedRole})`
                : 'Select Candidate to Add to Roster'
              }
            </h3>
            <p 
              className="text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Compare workforce metrics, availability balance, and skill match to optimize team chemistry.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[--color-text-muted] hover:text-[--color-text-primary] hover:bg-[--color-surface-2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Candidate being replaced snippet (if mode === 'replace') */}
        {mode === 'replace' && candidateToReplace && (
          <div 
            className="p-4 mx-6 mt-4 rounded-xl border flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border-subtle)'
            }}
          >
            <div className="flex items-center gap-3">
              <img 
                src={candidateToReplace.avatarUrl} 
                alt={candidateToReplace.name} 
                className="w-10 h-10 rounded-full object-cover border"
                style={{ borderColor: 'var(--color-border-strong)' }}
              />
              <div>
                <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">Currently Assigned</div>
                <div className="text-xs font-bold text-[--color-text-primary]">{candidateToReplace.name}</div>
                <div className="text-[11px] text-[--color-text-secondary]">{candidateToReplace.assignedRole}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <div className="text-[10px] text-[--color-text-muted] uppercase font-bold">Fit Score</div>
                <div className="font-bold text-[--color-accent-cyan]">{candidateToReplace.matchScore}%</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[--color-text-muted] uppercase font-bold">Availability</div>
                <div className="font-bold text-[--color-accent-lime]">{candidateToReplace.availabilityPercent}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div 
          className="p-4 mx-6 mt-4 rounded-xl border flex flex-col sm:flex-row items-center gap-3"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border-subtle)'
          }}
        >
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
            <input
              type="text"
              placeholder="Search available candidates by name, skill, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs font-medium focus:outline-none"
              style={{
                backgroundColor: 'var(--color-surface-1)',
                border: '1px solid var(--color-border-strong)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none"
            style={{
              backgroundColor: 'var(--color-surface-1)',
              border: '1px solid var(--color-border-strong)',
              color: 'var(--color-text-primary)'
            }}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
        </div>

        {/* Candidate Alternatives List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {availableEmployees.length === 0 ? (
            <div className="p-12 text-center text-xs text-[--color-text-muted]">
              No available candidates found matching your criteria. Try adjusting the search filters.
            </div>
          ) : (
            availableEmployees.map(emp => {
              const isHighRisk = emp.wellbeingRisk === 'High';

              return (
                <div 
                  key={emp.id}
                  className="p-4 rounded-xl border transition-all hover:bg-[--color-surface-2]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  style={{
                    backgroundColor: 'var(--color-surface-1)',
                    borderColor: 'var(--color-border-subtle)'
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <img 
                      src={emp.avatarUrl} 
                      alt={emp.name} 
                      className="w-12 h-12 rounded-full object-cover border shrink-0"
                      style={{ borderColor: 'var(--color-border-strong)' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-bold text-sm"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {emp.name}
                        </span>
                        <span 
                          className="text-[10px] font-mono px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: 'var(--color-surface-2)',
                            color: 'var(--color-text-muted)'
                          }}
                        >
                          {emp.employeeId}
                        </span>
                      </div>
                      <div className="text-xs text-[--color-text-secondary]">
                        {emp.role} • <span className="font-medium text-[--color-accent-cyan]">{emp.department}</span>
                      </div>

                      {/* Primary Skills */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {emp.skills.slice(0, 3).map(s => (
                          <span 
                            key={s.name}
                            className="text-[10px] px-2 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor: 'var(--color-surface-2)',
                              color: 'var(--color-text-primary)',
                              border: '1px solid var(--color-border-subtle)'
                            }}
                          >
                            {s.name} ({s.proficiency}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Metrics & Action Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-[--color-border-subtle]">
                    <div className="flex items-center gap-4 text-xs text-right">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">Performance</div>
                        <div className="font-bold text-[--color-text-primary]">{emp.performanceScore}/100</div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">Availability</div>
                        <div className="font-bold text-[--color-accent-lime]">{emp.availabilityScore}%</div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">Risk</div>
                        <span 
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isHighRisk ? 'text-red-400 bg-red-400/10 border-red-400/25' :
                            emp.wellbeingRisk === 'Moderate' ? 'text-amber-400 bg-amber-400/10 border-amber-400/25' :
                            'text-[--color-accent-lime] bg-[--color-accent-lime]/10 border-[--color-accent-lime]/25'
                          }`}
                        >
                          {emp.wellbeingRisk}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewEmployee(emp)}
                        className="px-3 py-2 rounded-xl text-xs font-bold hover:bg-[--color-surface-2] transition-colors"
                        style={{
                          border: '1px solid var(--color-border-strong)',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        Profile
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectAlternative(emp)}
                        className="btn-primary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                      >
                        {mode === 'replace' ? (
                          <>
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Swap In</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Team</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div 
          className="p-4 border-t flex items-center justify-between text-xs"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <span className="text-[--color-text-muted]">
            Showing {availableEmployees.length} eligible candidates
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-bold hover:bg-[--color-surface-2] transition-colors"
            style={{
              border: '1px solid var(--color-border-strong)',
              color: 'var(--color-text-primary)'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
