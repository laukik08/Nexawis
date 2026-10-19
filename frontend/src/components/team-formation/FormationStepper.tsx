import { Check, FolderKanban, Sliders, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTeamFormation } from '../../context/TeamFormationContext';

interface StepDef {
  step: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  icon: typeof FolderKanban;
}

const steps: StepDef[] = [
  { step: 1, title: 'Select Project', subtitle: 'Target scope & requirements', icon: FolderKanban },
  { step: 2, title: 'Configure Requirements', subtitle: 'Skills, capacity & priorities', icon: Sliders },
  { step: 3, title: 'AI Recommendations', subtitle: 'Matching & roster refinement', icon: Sparkles },
  { step: 4, title: 'Final Review', subtitle: 'Verify synergy & finalize', icon: CheckCircle2 }
];

export function FormationStepper() {
  const { currentStep, goToStep, selectedProject, candidates } = useTeamFormation();

  const isStepClickable = (s: number) => {
    if (s === currentStep) return false;
    if (s === 1) return true;
    if (s === 2) return Boolean(selectedProject);
    if (s === 3) return Boolean(candidates.length > 0);
    if (s === 4) return Boolean(candidates.length > 0);
    return false;
  };

  return (
    <div className="card-base p-4 sm:p-6 rounded-2xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 relative">
        {steps.map((item, idx) => {
          const isCompleted = currentStep > item.step;
          const isCurrent = currentStep === item.step;
          const isClickable = isStepClickable(item.step);
          const Icon = item.icon;

          return (
            <button
              key={item.step}
              type="button"
              disabled={!isClickable && !isCurrent}
              onClick={() => isClickable && goToStep(item.step)}
              className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all relative ${
                isClickable ? 'cursor-pointer hover:bg-[--color-surface-2]' : ''
              } ${isCurrent ? 'bg-[--color-surface-2] border border-[--color-accent-cyan]/30 shadow-sm' : ''}`}
            >
              {/* Step Icon / Circle */}
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform font-bold text-sm"
                style={
                  isCompleted 
                    ? {
                        backgroundColor: 'var(--color-accent-lime)',
                        color: 'var(--color-text-inverse)',
                        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
                      }
                    : isCurrent
                    ? {
                        backgroundColor: 'var(--color-accent-cyan)',
                        color: 'var(--color-text-inverse)',
                        boxShadow: '0 0 16px rgba(2, 132, 199, 0.4)'
                      }
                    : {
                        backgroundColor: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border-strong)',
                        color: 'var(--color-text-muted)'
                      }
                }
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Step Text */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span 
                    className="text-[10px] font-mono font-bold uppercase tracking-wider"
                    style={{
                      color: isCurrent 
                        ? 'var(--color-accent-cyan)' 
                        : isCompleted 
                        ? 'var(--color-accent-lime)' 
                        : 'var(--color-text-muted)'
                    }}
                  >
                    Step 0{item.step}
                  </span>
                </div>
                <div 
                  className="font-bold text-xs truncate"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {item.title}
                </div>
                <div 
                  className="text-[10px] truncate hidden sm:block"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {item.subtitle}
                </div>
              </div>

              {/* Connecting arrow for larger screens */}
              {idx < steps.length - 1 && (
                <div 
                  className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-[1px]"
                  style={{ backgroundColor: 'var(--color-border-strong)' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
