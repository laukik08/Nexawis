import { useState, useEffect } from 'react';
import { useTeamFormation } from '../../context/TeamFormationContext';
import { 
  Sparkles, 
  Shield, 
  Zap, 
  Users, 
  RotateCcw, 
  Sliders, 
  Check, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';
import type { FormationOptionId } from '../../types/teamFormation';

export function CreateFormationOptionsModal() {
  const { 
    isOptionsModalOpen, 
    setIsOptionsModalOpen, 
    formationOptions, 
    config, 
    selectFormationOption 
  } = useTeamFormation();

  const [selectedId, setSelectedId] = useState<FormationOptionId>(config.formationOption || 'autonomous_ai');

  useEffect(() => {
    if (isOptionsModalOpen) {
      setSelectedId(config.formationOption || 'autonomous_ai');
    }
  }, [isOptionsModalOpen, config.formationOption]);

  if (!isOptionsModalOpen) return null;


  const getOptionIcon = (iconName: string) => {
    switch (iconName) {
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-[--color-accent-cyan]" />;
      case 'shield':
        return <Shield className="w-5 h-5 text-[--color-accent-lime]" />;
      case 'zap':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'users':
        return <Users className="w-5 h-5 text-purple-400" />;
      case 'rotate':
        return <RotateCcw className="w-5 h-5 text-cyan-400" />;
      case 'sliders':
        return <Sliders className="w-5 h-5 text-pink-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-[--color-accent-cyan]" />;
    }
  };

  const handleApply = () => {
    selectFormationOption(selectedId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOptionsModalOpen(false)}
      />

      {/* Modal Dialog */}
      <div 
        className="relative w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* Header */}
        <div 
          className="p-6 border-b flex items-start justify-between gap-4"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1.5"
                style={{
                  backgroundColor: 'rgba(2, 132, 199, 0.12)',
                  color: 'var(--color-accent-cyan)',
                  border: '1px solid rgba(2, 132, 199, 0.25)'
                }}
              >
                <Sparkles className="w-3 h-3" />
                Team Formation Intelligence
              </span>
            </div>
            <h2 
              className="text-xl sm:text-2xl font-display font-bold tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Select Team Formation Option
            </h2>
            <p 
              className="text-xs sm:text-sm mt-1 max-w-2xl"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Choose a workforce strategy mode. Each option tunes AWIS algorithms, risk barriers, and skill weightings to best serve your project delivery goals.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsOptionsModalOpen(false)}
            className="p-2 rounded-xl hover:bg-[--color-surface-2] transition-colors text-[--color-text-muted] hover:text-[--color-text-primary]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formationOptions.map((opt) => {
              const isSelected = selectedId === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedId(opt.id)}
                  className={`relative p-5 rounded-xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-[--color-accent-cyan] shadow-lg scale-[1.01]'
                      : 'hover:border-[--color-border-strong] hover:bg-[--color-surface-2]/50'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--color-surface-2)' : 'var(--color-surface-1)',
                    borderColor: isSelected ? 'var(--color-accent-cyan)' : 'var(--color-border-subtle)'
                  }}
                >
                  {/* Top indicator & badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: 'var(--color-surface-3)',
                          border: '1px solid var(--color-border-subtle)'
                        }}
                      >
                        {getOptionIcon(opt.iconName)}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span 
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{
                            backgroundColor: 'var(--color-surface-3)',
                            color: opt.accentColor,
                            border: '1px solid var(--color-border-subtle)'
                          }}
                        >
                          {opt.badge}
                        </span>

                        <div 
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            isSelected 
                              ? 'bg-[--color-accent-cyan] border-[--color-accent-cyan] text-white' 
                              : 'border-[--color-border-strong] bg-transparent'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 
                      className="font-display font-bold text-sm sm:text-base leading-snug mb-1.5"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {opt.title}
                    </h3>

                    {/* Description */}
                    <p 
                      className="text-xs leading-relaxed mb-3"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {opt.description}
                    </p>
                  </div>

                  {/* Highlights / Strategy Callout */}
                  <div 
                    className="pt-3 border-t mt-2"
                    style={{ borderColor: 'var(--color-border-subtle)' }}
                  >
                    <div className="text-[11px] font-medium leading-relaxed" style={{ color: opt.accentColor }}>
                      ✨ {opt.highlight}
                    </div>

                    {/* Preset details tag preview */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {opt.configPreset.workloadTolerance && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[--color-surface-3] text-[--color-text-muted] border border-[--color-border-subtle]">
                          Workload: {opt.configPreset.workloadTolerance}
                        </span>
                      )}
                      {opt.configPreset.wellbeingRiskTolerance && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[--color-surface-3] text-[--color-text-muted] border border-[--color-border-subtle]">
                          Risk: {opt.configPreset.wellbeingRiskTolerance}
                        </span>
                      )}
                      {opt.configPreset.minAvailability !== undefined && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[--color-surface-3] text-[--color-text-muted] border border-[--color-border-subtle]">
                          Min Avail: {opt.configPreset.minAvailability}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reassurance banner */}
          <div 
            className="p-4 rounded-xl flex items-center gap-3 text-xs"
            style={{
              backgroundColor: 'rgba(2, 132, 199, 0.08)',
              border: '1px solid rgba(2, 132, 199, 0.2)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <ShieldCheck className="w-4 h-4 text-[--color-accent-cyan] shrink-0" />
            <span>
              All formation options run through the multi-dimensional AWIS engine. You can adjust specific skills, headcount, and candidate replacements in subsequent steps.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ 
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border-subtle)' 
          }}
        >
          <div className="text-xs text-[--color-text-muted] hidden sm:block">
            Selected: <span className="font-semibold text-[--color-text-primary]">
              {formationOptions.find(o => o.id === selectedId)?.title}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsOptionsModalOpen(false)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-colors hover:bg-[--color-surface-3]"
              style={{
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex-1 sm:flex-none btn-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Proceed with Selected Option</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
