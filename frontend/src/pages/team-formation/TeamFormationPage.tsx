import { 
  Sparkles, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  X,
  SlidersHorizontal
} from 'lucide-react';
import { TeamFormationProvider, useTeamFormation } from '../../context/TeamFormationContext';
import { FormationMetricsCards } from '../../components/team-formation/FormationMetricsCards';
import { FormationStepper } from '../../components/team-formation/FormationStepper';
import { StepSelectProject } from '../../components/team-formation/StepSelectProject';
import { StepConfigureRequirements } from '../../components/team-formation/StepConfigureRequirements';
import { StepRecommendations } from '../../components/team-formation/StepRecommendations';
import { StepReviewConfirmation } from '../../components/team-formation/StepReviewConfirmation';
import { FormationHistoryTable } from '../../components/team-formation/FormationHistoryTable';
import { CreateFormationOptionsModal } from '../../components/team-formation/CreateFormationOptionsModal';

function TeamFormationContent() {
  const { 
    activeTab, 
    setActiveTab, 
    currentStep, 
    history, 
    feedbackMessage, 
    clearFeedback,
    activeFormationOption,
    setIsOptionsModalOpen,
    openCreateFormationWithOptions
  } = useTeamFormation();

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              Workforce Intelligence Module
            </span>
          </div>
          <h1 
            className="text-2xl sm:text-3xl font-display font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Team Formation
          </h1>
          <p 
            className="text-xs sm:text-sm mt-1 max-w-2xl"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Build balanced, high-performing, and sustainable project teams with workforce intelligence.
          </p>
        </div>

        {/* Primary View Switcher / Actions */}
        <div 
          className="p-1 rounded-xl flex items-center gap-1 self-start md:self-auto border"
          style={{
            backgroundColor: 'var(--color-surface-1)',
            borderColor: 'var(--color-border-subtle)'
          }}
        >
          <button
            type="button"
            onClick={openCreateFormationWithOptions}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'create' ? 'btn-primary' : 'hover:bg-[--color-surface-2]'
            }`}
            style={activeTab !== 'create' ? {
              color: 'var(--color-text-secondary)'
            } : {}}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Formation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history' ? 'btn-primary' : 'hover:bg-[--color-surface-2]'
            }`}
            style={activeTab !== 'history' ? {
              color: 'var(--color-text-secondary)'
            } : {}}
          >
            <History className="w-3.5 h-3.5" />
            <span>Previous Formations</span>
            <span 
              className="text-[10px] font-mono px-1.5 py-0.2 rounded-full"
              style={{
                backgroundColor: activeTab === 'history' ? 'rgba(255,255,255,0.2)' : 'var(--color-surface-2)',
                color: activeTab === 'history' ? '#ffffff' : 'var(--color-text-muted)'
              }}
            >
              {history.length}
            </span>
          </button>
        </div>
      </div>

      {/* Floating or Inline Feedback Toast */}
      {feedbackMessage && (
        <div 
          className="p-4 rounded-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2"
          style={
            feedbackMessage.type === 'error'
              ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)' }
              : feedbackMessage.type === 'info'
              ? { backgroundColor: 'rgba(2, 132, 199, 0.1)', color: 'var(--color-accent-cyan)', border: '1px solid rgba(2, 132, 199, 0.25)' }
              : { backgroundColor: 'rgba(22, 163, 74, 0.1)', color: 'var(--color-accent-lime)', border: '1px solid rgba(22, 163, 74, 0.25)' }
          }
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {feedbackMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            {feedbackMessage.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
            {feedbackMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{feedbackMessage.text}</span>
          </div>

          <button
            type="button"
            onClick={clearFeedback}
            className="p-1 hover:opacity-70 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Overview Metric Cards (Always available to monitor workforce intelligence) */}
      <FormationMetricsCards />

      {/* Active Tab View */}
      {activeTab === 'create' ? (
        <div className="space-y-6">
          {/* Active Formation Strategy Banner */}
          <div 
            className="card-base p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border shadow-sm"
            style={{
              backgroundColor: 'var(--color-surface-1)',
              borderColor: 'var(--color-border-subtle)'
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'rgba(2, 132, 199, 0.12)',
                  color: 'var(--color-accent-cyan)',
                  border: '1px solid rgba(2, 132, 199, 0.25)'
                }}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xs sm:text-sm font-display font-bold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Strategy: {activeFormationOption.title}
                  </span>
                  <span 
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      color: activeFormationOption.accentColor,
                      border: '1px solid var(--color-border-subtle)'
                    }}
                  >
                    {activeFormationOption.badge}
                  </span>
                </div>
                <p 
                  className="text-xs line-clamp-1 mt-0.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {activeFormationOption.highlight}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOptionsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold self-start sm:self-auto hover:bg-[--color-surface-2] transition-colors flex items-center gap-1.5"
              style={{
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-primary)'
              }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[--color-accent-cyan]" />
              <span>Change Formation Option</span>
            </button>
          </div>

          {/* Multi-Step Stepper */}
          <FormationStepper />

          {/* Active Step Content */}
          {currentStep === 1 && <StepSelectProject />}
          {currentStep === 2 && <StepConfigureRequirements />}
          {currentStep === 3 && <StepRecommendations />}
          {currentStep === 4 && <StepReviewConfirmation />}
        </div>
      ) : (
        <FormationHistoryTable />
      )}

      {/* Team Formation Strategy Options Modal */}
      <CreateFormationOptionsModal />

    </div>
  );
}

export function TeamFormationPage() {
  return (
    <TeamFormationProvider>
      <TeamFormationContent />
    </TeamFormationProvider>
  );
}
