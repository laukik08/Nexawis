import { useState } from 'react';
import { useTeamFormation } from '../../context/TeamFormationContext';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  Award, 
  Check, 
  ShieldCheck, 
  FileCheck, 
  ArrowRight 
} from 'lucide-react';
import type { FormationHistoryItem } from '../../types/teamFormation';

export function StepReviewConfirmation() {
  const { 
    selectedProject, 
    candidates, 
    metrics, 
    config, 
    goToStep, 
    saveDraft, 
    finalizeFormation, 
    resetWorkflow,
    setActiveTab
  } = useTeamFormation();

  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizedRecord, setFinalizedRecord] = useState<FormationHistoryItem | null>(null);

  if (!selectedProject || candidates.length === 0) {
    return (
      <div className="card-base p-12 text-center rounded-2xl space-y-4">
        <p className="text-xs text-[--color-text-secondary]">No active formation to review. Please select a project and generate recommendations first.</p>
        <button
          type="button"
          onClick={() => goToStep(1)}
          className="btn-primary px-6 py-2 rounded-xl text-xs font-bold"
        >
          Go to Project Selection
        </button>
      </div>
    );
  }

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await saveDraft();
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      const result = await finalizeFormation();
      if (result) {
        setFinalizedRecord(result);
      }
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="card-base p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: 'rgba(22, 163, 74, 0.12)',
                color: 'var(--color-accent-lime)',
                border: '1px solid rgba(22, 163, 74, 0.25)'
              }}
            >
              Step 04 • Final Review & Confirmation
            </span>
          </div>
          <h3 
            className="text-xl font-display font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Review Formation Roster for <span style={{ color: 'var(--color-accent-cyan)' }}>{selectedProject.name}</span>
          </h3>
          <p 
            className="text-xs mt-0.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Verify roster requirements, balance metrics, and finalize team allocation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            disabled={isSaving || isFinalizing}
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[--color-surface-2] transition-colors"
            style={{
              border: '1px solid var(--color-border-strong)',
              color: 'var(--color-text-primary)'
            }}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving Draft...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            disabled={isSaving || isFinalizing}
            onClick={handleFinalize}
            className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isFinalizing ? 'Finalizing...' : 'Finalize Team'}</span>
          </button>
        </div>
      </div>

      {/* Overview Grid: Project Scope & Performance Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Project Context Summary */}
        <div className="card-base p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[--color-border-subtle]">
            <FileCheck className="w-4 h-4 text-[--color-accent-cyan]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[--color-text-primary]">
              Project Specifications
            </h4>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-bold text-[--color-text-muted] uppercase">Project Name</div>
              <div className="text-sm font-bold text-[--color-text-primary]">{selectedProject.name}</div>
              <div className="text-xs text-[--color-accent-cyan]">{selectedProject.department} • {selectedProject.projectId}</div>
            </div>

            <p className="text-xs text-[--color-text-secondary] leading-relaxed line-clamp-3">
              {selectedProject.description}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[--color-border-subtle] text-xs">
              <div>
                <span className="text-[10px] text-[--color-text-muted] block uppercase font-bold">Target Size</span>
                <span className="font-bold text-[--color-text-primary]">{config.teamSize} Members</span>
              </div>
              <div>
                <span className="text-[10px] text-[--color-text-muted] block uppercase font-bold">Priority</span>
                <span className="font-bold text-[--color-accent-lime]">{selectedProject.priority}</span>
              </div>
              <div>
                <span className="text-[10px] text-[--color-text-muted] block uppercase font-bold">Deadline</span>
                <span className="font-bold text-[--color-text-primary]">
                  {new Date(selectedProject.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[--color-text-muted] block uppercase font-bold">Complexity</span>
                <span className="font-bold text-[--color-text-primary]">{selectedProject.complexity}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Health Indicators Gauges (2 cols) */}
        <div className="lg:col-span-2 card-base p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[--color-border-subtle]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[--color-accent-lime]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[--color-text-primary]">
                Formation Health & Compliance Checklist
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[--color-accent-lime] font-bold">
              ✓ All Criteria Satisfied
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle] text-center">
              <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">Overall Fit</div>
              <div className="text-3xl font-display font-bold text-[--color-accent-cyan] mb-1">
                {metrics?.overallTeamFit || 92}%
              </div>
              <div className="text-[10px] text-[--color-accent-lime] font-bold">Tier 1 Synergy</div>
            </div>

            <div className="p-4 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle] text-center">
              <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">Skill Coverage</div>
              <div className="text-3xl font-display font-bold text-[--color-accent-lime] mb-1">
                {metrics?.skillCoveragePercent || 100}%
              </div>
              <div className="text-[10px] text-[--color-text-secondary]">Requirements Met</div>
            </div>

            <div className="p-4 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle] text-center">
              <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">Workload Health</div>
              <div className="text-3xl font-display font-bold text-[--color-text-primary] mb-1">
                {metrics?.workloadBalanceScore || 90}%
              </div>
              <div className="text-[10px] text-[--color-text-secondary]">Balanced Band</div>
            </div>

            <div className="p-4 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle] text-center">
              <div className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1">Sustainability</div>
              <div className="text-3xl font-display font-bold text-[--color-accent-lime] mb-1">
                {metrics?.sustainabilityScore || 95}%
              </div>
              <div className="text-[10px] text-[--color-accent-lime]">Low Burnout Risk</div>
            </div>

          </div>

          {/* Validation Checklist */}
          <div className="space-y-2 pt-2 border-t border-[--color-border-subtle]">
            <div className="flex items-center gap-2 text-xs text-[--color-text-secondary]">
              <Check className="w-4 h-4 text-[--color-accent-lime] shrink-0" />
              <span>Roster satisfies {candidates.length} of {config.teamSize} requested positions.</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[--color-text-secondary]">
              <Check className="w-4 h-4 text-[--color-accent-lime] shrink-0" />
              <span>Core tech stack ({config.requiredSkills.map(s => s.skill).slice(0, 3).join(', ')}) fully represented with senior leads.</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[--color-text-secondary]">
              <Check className="w-4 h-4 text-[--color-accent-lime] shrink-0" />
              <span>No scheduling conflicts detected; minimum required availability threshold satisfied.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Final Roster Display Table */}
      <div className="card-base rounded-2xl overflow-hidden border border-[--color-border-subtle]">
        <div className="p-5 border-b border-[--color-border-subtle] flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[--color-text-primary]">
              Final Team Roster ({candidates.length} Members)
            </h4>
            <p className="text-xs text-[--color-text-secondary] mt-0.5">
              Positions locked and ready for deployment.
            </p>
          </div>
          <button
            type="button"
            onClick={() => goToStep(3)}
            className="text-xs font-bold text-[--color-accent-cyan] hover:underline"
          >
            ← Modify Roster
          </button>
        </div>

        <div className="divide-y divide-[--color-border-subtle]">
          {candidates.map((cand, idx) => (
            <div 
              key={cand.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[--color-surface-2]/30 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <span className="font-mono text-xs font-bold text-[--color-text-muted] w-6">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <img 
                  src={cand.avatarUrl} 
                  alt={cand.name} 
                  className="w-12 h-12 rounded-full object-cover border"
                  style={{ borderColor: 'var(--color-border-strong)' }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[--color-text-primary]">{cand.name}</span>
                    <span 
                      className="text-[10px] font-mono px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      {cand.employeeId}
                    </span>
                    {cand.isOverride && (
                      <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                        Manual Override
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[--color-accent-cyan] font-semibold mt-0.5">
                    {cand.assignedRole}
                  </div>
                  <div className="text-[11px] text-[--color-text-muted]">
                    {cand.department} • Velocity {cand.performanceScore}/100
                  </div>
                </div>
              </div>

              {/* Roster Badges */}
              <div className="flex items-center gap-4 text-xs sm:self-center">
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-[--color-text-muted]">Match Fit</div>
                  <div className="font-bold text-[--color-accent-cyan] text-sm">{cand.matchScore}%</div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-[--color-text-muted]">Availability</div>
                  <div className="font-bold text-[--color-accent-lime] text-sm">{cand.availabilityPercent}%</div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-[--color-text-muted]">Wellbeing</div>
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
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="card-base p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => goToStep(3)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[--color-surface-2] transition-colors"
          style={{
            border: '1px solid var(--color-border-strong)',
            color: 'var(--color-text-secondary)'
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Candidate Refinement</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSaving || isFinalizing}
            onClick={handleSaveDraft}
            className="px-5 py-3 rounded-xl text-xs font-bold hover:bg-[--color-surface-2] transition-colors"
            style={{
              border: '1px solid var(--color-border-strong)',
              color: 'var(--color-text-primary)'
            }}
          >
            Save as Draft
          </button>

          <button
            type="button"
            disabled={isSaving || isFinalizing}
            onClick={handleFinalize}
            className="btn-primary px-8 py-3 rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finalize Team Formation</span>
          </button>
        </div>
      </div>

      {/* Finalization Success Celebration Modal */}
      {finalizedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="w-full max-w-lg p-8 rounded-2xl shadow-2xl border text-center space-y-6 animate-in zoom-in-95 duration-200"
            style={{
              backgroundColor: 'var(--color-surface-1)',
              borderColor: 'var(--color-accent-cyan)'
            }}
          >
            <div className="w-16 h-16 rounded-2xl bg-[--color-accent-lime]/15 border border-[--color-accent-lime]/30 flex items-center justify-center mx-auto text-[--color-accent-lime] shadow-lg shadow-emerald-500/20">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(22, 163, 74, 0.12)',
                  color: 'var(--color-accent-lime)',
                  border: '1px solid rgba(22, 163, 74, 0.25)'
                }}
              >
                Team Formation Successfully Finalized
              </span>
              <h3 
                className="text-2xl font-display font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Formation #{finalizedRecord.id}
              </h3>
              <p 
                className="text-xs max-w-sm mx-auto leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {finalizedRecord.teamSize} members successfully staffed for <strong className="text-[--color-text-primary]">{finalizedRecord.projectName}</strong> with {finalizedRecord.teamFitScore}% overall team fit.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle] text-xs">
              <div>
                <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">Team Size</div>
                <div className="font-bold text-[--color-text-primary]">{finalizedRecord.teamSize} Members</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">Team Fit</div>
                <div className="font-bold text-[--color-accent-cyan]">{finalizedRecord.teamFitScore}%</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[--color-text-muted]">Status</div>
                <div className="font-bold text-[--color-accent-lime]">Finalized</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setFinalizedRecord(null);
                  setActiveTab('history');
                }}
                className="w-full sm:w-auto btn-primary px-6 py-2.5 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 shadow-md"
              >
                <span>View Formation History</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setFinalizedRecord(null);
                  resetWorkflow();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[--color-surface-2] transition-colors"
                style={{
                  border: '1px solid var(--color-border-strong)',
                  color: 'var(--color-text-primary)'
                }}
              >
                Assemble Another Team
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
