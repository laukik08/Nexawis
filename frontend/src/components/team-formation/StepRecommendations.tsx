import { useState } from 'react';
import { useTeamFormation } from '../../context/TeamFormationContext';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ArrowRightLeft, 
  Trash2, 
  Plus, 
  RotateCcw, 
  ArrowLeft, 
  ArrowRight, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Brain, 
  Activity 
} from 'lucide-react';
import { CandidateComparisonModal } from './CandidateComparisonModal';
import { EmployeeProfilePreviewModal } from './EmployeeProfilePreviewModal';
import type { TeamCandidate } from '../../types/teamFormation';
import { mockEmployees } from '../../data/mockEmployees';

export function StepRecommendations() {
  const { 
    selectedProject, 
    candidates, 
    metrics, 
    isGenerating, 
    goToStep,
    setCandidateToReplace,
    setPreviewEmployee,
    removeCandidate,
    generateRecommendations
  } = useTeamFormation();

  const [expandedRationaleId, setExpandedRationaleId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'replace' | 'add' | null>(null);

  // If loading recommendations
  if (isGenerating) {
    return (
      <div className="card-base p-16 text-center rounded-2xl flex flex-col items-center justify-center space-y-6">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[--color-accent-cyan]/20 animate-ping" />
          <div className="w-20 h-20 rounded-full border-4 border-t-[--color-accent-cyan] border-r-transparent border-b-[--color-accent-lime] border-l-transparent animate-spin" />
          <Sparkles className="w-8 h-8 text-[--color-accent-cyan] absolute" />
        </div>

        <div className="space-y-2 max-w-md">
          <h3 
            className="text-xl font-display font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Synthesizing Optimal Team Formation
          </h3>
          <p 
            className="text-xs leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Analyzing skill graphs, current allocation bandwidth, sprint history, and wellbeing sustainability across workforce candidates...
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-[--color-text-muted]">
          <span className="w-2 h-2 rounded-full bg-[--color-accent-lime] animate-pulse" />
          <span>Multi-dimensional constraints optimization active</span>
        </div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="card-base p-12 text-center rounded-2xl space-y-4">
        <Brain className="w-10 h-10 mx-auto text-[--color-text-muted]" />
        <h4 className="text-base font-bold text-[--color-text-primary]">No Recommendations Available</h4>
        <p className="text-xs text-[--color-text-secondary]">
          Requirements were updated or have not yet been evaluated for this project.
        </p>
        <button
          type="button"
          onClick={() => generateRecommendations()}
          className="btn-primary px-6 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Recommendations Now</span>
        </button>
      </div>
    );
  }

  const toggleRationale = (id: string) => {
    setExpandedRationaleId(prev => prev === id ? null : id);
  };

  const handleOpenReplace = (cand: TeamCandidate) => {
    setCandidateToReplace(cand);
    setModalMode('replace');
  };

  const handleOpenAdd = () => {
    setModalMode('add');
  };

  const handleViewProfile = (cand: TeamCandidate) => {
    const fullEmp = mockEmployees.find(e => e.id === cand.id);
    if (fullEmp) {
      setPreviewEmployee(fullEmp);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="card-base p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              Step 03 • AI Recommendations & Refinement
            </span>
          </div>
          <h3 
            className="text-xl font-display font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Recommended Team Roster for <span style={{ color: 'var(--color-accent-cyan)' }}>{selectedProject?.name}</span>
          </h3>
          <p 
            className="text-xs mt-0.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Review AI suggestions, explore candidate rationale, or swap members to suit project requirements.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => generateRecommendations()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[--color-surface-2] transition-colors"
            style={{
              border: '1px solid var(--color-border-strong)',
              color: 'var(--color-text-secondary)'
            }}
            title="Re-run recommendation engine with current settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-Generate</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Live Team Summary Analytics Bar */}
      {metrics && (
        <div 
          className="card-base p-6 rounded-2xl space-y-4"
          style={{
            borderColor: 'var(--color-accent-cyan)',
            backgroundColor: 'var(--color-surface-1)'
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[--color-border-subtle]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[--color-accent-cyan]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[--color-text-primary]">
                Live Team Chemistry & Balance Analytics
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[--color-text-muted]">
              Auto-recalculated on candidate modifications
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* Overall Fit */}
            <div className="p-3 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle]">
              <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">Overall Fit</div>
              <div className="text-2xl font-display font-bold text-[--color-accent-cyan]">
                {metrics.overallTeamFit}%
              </div>
              <div className="text-[10px] text-[--color-accent-lime] font-medium">Optimal Synergy</div>
            </div>

            {/* Team Size */}
            <div className="p-3 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle]">
              <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">Roster Size</div>
              <div className="text-2xl font-display font-bold text-[--color-text-primary]">
                {metrics.selectedCount} <span className="text-xs text-[--color-text-muted] font-normal">/ {metrics.targetCount} target</span>
              </div>
              <div className="text-[10px] text-[--color-text-secondary] font-medium">
                {metrics.selectedCount === metrics.targetCount ? 'Target Met' : `${Math.abs(metrics.targetCount - metrics.selectedCount)} Spot(s) Delta`}
              </div>
            </div>

            {/* Skill Coverage */}
            <div className="p-3 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle]">
              <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">Skill Coverage</div>
              <div className="text-2xl font-display font-bold text-[--color-accent-lime]">
                {metrics.skillCoveragePercent}%
              </div>
              <div className="text-[10px] text-[--color-text-secondary] font-medium">
                {metrics.coveredSkillsCount} of {metrics.totalSkillsRequired} skills
              </div>
            </div>

            {/* Workload Balance */}
            <div className="p-3 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle]">
              <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">Workload Health</div>
              <div className="text-2xl font-display font-bold text-[--color-text-primary]">
                {metrics.workloadBalanceScore}%
              </div>
              <div className="text-[10px] text-[--color-text-secondary] font-medium">Even distribution</div>
            </div>

            {/* Sustainability */}
            <div className="p-3 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle]">
              <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">Sustainability</div>
              <div className="text-2xl font-display font-bold text-[--color-accent-lime]">
                {metrics.sustainabilityScore}%
              </div>
              <div className="text-[10px] text-[--color-accent-lime] font-medium">Low fatigue risk</div>
            </div>

            {/* Availability */}
            <div className="p-3 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle]">
              <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">Avg Availability</div>
              <div className="text-2xl font-display font-bold text-[--color-accent-cyan]">
                {metrics.availabilityCoverageScore}%
              </div>
              <div className="text-[10px] text-[--color-text-secondary] font-medium">Immediate band</div>
            </div>

          </div>

          {/* Warnings Bar */}
          {metrics.warnings.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[--color-border-subtle]">
              {metrics.warnings.map(w => (
                <div 
                  key={w.id}
                  className="flex items-start gap-2.5 p-3 rounded-xl text-xs"
                  style={
                    w.type === 'alert' 
                      ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)' }
                      : w.type === 'warning'
                      ? { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.25)' }
                      : { backgroundColor: 'rgba(2, 132, 199, 0.1)', color: 'var(--color-accent-cyan)', border: '1px solid rgba(2, 132, 199, 0.25)' }
                  }
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold mr-1">{w.title}:</span>
                    <span>{w.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommended Candidates List */}
      <div className="space-y-4">
        
        {/* Desktop View Table */}
        <div className="hidden md:block card-base rounded-2xl overflow-hidden border border-[--color-border-subtle]">
          <div className="p-4 border-b border-[--color-border-subtle] flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[--color-text-primary]">
              Assigned Candidate Roster ({candidates.length})
            </h4>
            <span className="text-[11px] text-[--color-text-muted]">
              Click "Why Selected?" for demonstration explainability insights
            </span>
          </div>

          <div className="divide-y divide-[--color-border-subtle]">
            {candidates.map((cand, idx) => {
              const isExpanded = expandedRationaleId === cand.id;

              return (
                <div key={cand.id} className="transition-colors hover:bg-[--color-surface-2]/30">
                  <div className="p-4 flex items-center justify-between gap-4">
                    
                    {/* Left: Avatar & Identity */}
                    <div className="flex items-center gap-3.5 min-w-[240px]">
                      <span className="font-mono text-xs font-bold text-[--color-text-muted] w-5">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <img 
                        src={cand.avatarUrl} 
                        alt={cand.name} 
                        className="w-11 h-11 rounded-full object-cover border"
                        style={{ borderColor: 'var(--color-border-strong)' }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[--color-text-primary]">{cand.name}</span>
                          {cand.isOverride && (
                            <span 
                              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded"
                              style={{
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.3)'
                              }}
                            >
                              Manual Override
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[--color-text-muted]">
                          {cand.assignedRole} • <span className="text-[--color-accent-cyan]">{cand.department}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Metrics Badges */}
                    <div className="flex items-center gap-6 text-xs">
                      {/* Fit Score */}
                      <div className="text-center min-w-[60px]">
                        <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">Match</div>
                        <div className="text-base font-display font-bold text-[--color-accent-cyan]">
                          {cand.matchScore}%
                        </div>
                      </div>

                      {/* Performance */}
                      <div className="text-center min-w-[60px]">
                        <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">Velocity</div>
                        <div className="font-bold text-[--color-text-primary]">{cand.performanceScore}/100</div>
                      </div>

                      {/* Availability */}
                      <div className="text-center min-w-[70px]">
                        <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">Availability</div>
                        <div className="font-bold text-[--color-accent-lime]">{cand.availabilityPercent}%</div>
                      </div>

                      {/* Workload */}
                      <div className="text-center min-w-[65px]">
                        <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">Workload</div>
                        <div className="font-bold text-[--color-text-secondary]">{cand.currentWorkloadPercent}%</div>
                      </div>

                      {/* Risk */}
                      <div className="text-center min-w-[75px]">
                        <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">Risk</div>
                        <span 
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            cand.wellbeingRisk === 'High' ? 'text-red-400 bg-red-400/10 border-red-400/25' :
                            cand.wellbeingRisk === 'Moderate' ? 'text-amber-400 bg-amber-400/10 border-amber-400/25' :
                            'text-[--color-accent-lime] bg-[--color-accent-lime]/10 border-[--color-accent-lime]/25'
                          }`}
                        >
                          {cand.wellbeingRisk}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleRationale(cand.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1"
                        style={{
                          backgroundColor: isExpanded ? 'var(--color-surface-2)' : 'transparent',
                          color: 'var(--color-accent-cyan)',
                          border: '1px solid var(--color-border-subtle)'
                        }}
                      >
                        <span>Why selected?</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleViewProfile(cand)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[--color-surface-2] transition-colors"
                        style={{
                          border: '1px solid var(--color-border-strong)',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        Profile
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReplace(cand)}
                        className="p-2 rounded-xl text-[--color-text-secondary] hover:text-[--color-accent-cyan] hover:bg-[--color-surface-2] transition-colors"
                        title="Swap or Replace Candidate"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeCandidate(cand.id)}
                        className="p-2 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Remove candidate from roster"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                  {/* Expandable Explanation Drawer */}
                  {isExpanded && (
                    <div 
                      className="p-4 mx-4 mb-4 rounded-xl border space-y-3 animate-in fade-in slide-in-from-top-2"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: 'var(--color-border-strong)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-[--color-accent-cyan]" />
                          <span className="text-xs font-bold text-[--color-text-primary]">
                            Algorithmic Selection Rationale
                          </span>
                        </div>
                        <span 
                          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: 'rgba(2, 132, 199, 0.12)',
                            color: 'var(--color-accent-cyan)',
                            border: '1px solid rgba(2, 132, 199, 0.25)'
                          }}
                        >
                          Demonstration Insight
                        </span>
                      </div>

                      <p className="text-xs text-[--color-text-secondary] leading-relaxed">
                        {cand.whySelected.summary}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {/* Strengths */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[--color-accent-lime]">
                            Key Contributing Strengths
                          </div>
                          {cand.whySelected.strengths.map((st, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-[--color-text-secondary]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[--color-accent-lime] shrink-0 mt-0.5" />
                              <span>{st}</span>
                            </div>
                          ))}
                        </div>

                        {/* Considerations */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                            Operational Considerations
                          </div>
                          {cand.whySelected.considerations.map((c, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-[--color-text-secondary]">
                              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[--color-border-subtle] text-[10px] text-[--color-text-muted] italic">
                        * Note: This explanation is a simulated frontend demonstration for evaluation purposes.
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile View Cards */}
        <div className="md:hidden space-y-4">
          {candidates.map((cand) => {
            const isExpanded = expandedRationaleId === cand.id;

            return (
              <div 
                key={cand.id}
                className="card-base p-4 rounded-xl border border-[--color-border-subtle] space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={cand.avatarUrl} 
                      alt={cand.name} 
                      className="w-12 h-12 rounded-full object-cover border"
                      style={{ borderColor: 'var(--color-border-strong)' }}
                    />
                    <div>
                      <div className="font-bold text-sm text-[--color-text-primary]">{cand.name}</div>
                      <div className="text-xs text-[--color-text-muted]">{cand.assignedRole}</div>
                      <div className="text-[11px] text-[--color-accent-cyan]">{cand.department}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-display font-bold text-[--color-accent-cyan]">
                      {cand.matchScore}%
                    </div>
                    <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">Match</div>
                  </div>
                </div>

                {/* Mobile Metrics Strip */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-[--color-border-subtle] text-center text-xs">
                  <div>
                    <div className="text-[10px] text-[--color-text-muted] uppercase font-bold">Velocity</div>
                    <div className="font-bold text-[--color-text-primary]">{cand.performanceScore}/100</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[--color-text-muted] uppercase font-bold">Avail.</div>
                    <div className="font-bold text-[--color-accent-lime]">{cand.availabilityPercent}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[--color-text-muted] uppercase font-bold">Risk</div>
                    <div className="font-bold text-[--color-text-primary]">{cand.wellbeingRisk}</div>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => toggleRationale(cand.id)}
                    className="text-xs font-bold text-[--color-accent-cyan] flex items-center gap-1"
                  >
                    <span>Why selected?</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewProfile(cand)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold border border-[--color-border-strong]"
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenReplace(cand)}
                      className="p-1.5 rounded-lg border border-[--color-border-strong] text-[--color-accent-cyan]"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCandidate(cand.id)}
                      className="p-1.5 rounded-lg border border-red-400/30 text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mobile Rationale Drawer */}
                {isExpanded && (
                  <div className="p-3 rounded-lg bg-[--color-surface-2] text-xs space-y-2 mt-2">
                    <div className="font-bold text-[--color-text-primary]">Recommendation Rationale</div>
                    <p className="text-[11px] text-[--color-text-secondary]">{cand.whySelected.summary}</p>
                    <div className="space-y-1">
                      {cand.whySelected.strengths.map((st, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[11px] text-[--color-text-secondary]">
                          <CheckCircle2 className="w-3 h-3 text-[--color-accent-lime] shrink-0 mt-0.5" />
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Navigation Footer */}
      <div className="card-base p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => goToStep(2)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[--color-surface-2] transition-colors"
          style={{
            border: '1px solid var(--color-border-strong)',
            color: 'var(--color-text-secondary)'
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Configuration</span>
        </button>

        <button
          type="button"
          onClick={() => goToStep(4)}
          className="btn-primary px-7 py-3 rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-lg"
        >
          <span>Proceed to Final Review</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Candidate Swap / Add Modal */}
      {modalMode && (
        <CandidateComparisonModal
          mode={modalMode}
          onClose={() => setModalMode(null)}
        />
      )}

      {/* Employee Full Profile Preview Modal */}
      <EmployeeProfilePreviewModal />

    </div>
  );
}
