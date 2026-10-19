import { useState } from 'react';
import { useTeamFormation } from '../../context/TeamFormationContext';
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Sliders, 
  Shield, 
  Clock, 
  TrendingUp, 
  BrainCircuit,
  ChevronRight
} from 'lucide-react';
import { mockRolePresets, mockSkillPresets } from '../../data/mockTeamFormations';

export function StepConfigureRequirements() {
  const { 
    selectedProject, 
    config, 
    updateConfig, 
    goToStep, 
    generateRecommendations, 
    isGenerating,
    formationOptions,
    selectFormationOption,
    setIsOptionsModalOpen
  } = useTeamFormation();

  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillPriority, setNewSkillPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [newSkillProficiency, setNewSkillProficiency] = useState(80);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!selectedProject) {
    return (
      <div className="card-base p-12 text-center rounded-2xl">
        <p className="text-sm text-[--color-text-secondary] mb-4">No project selected. Please choose a project first.</p>
        <button 
          type="button" 
          onClick={() => goToStep(1)} 
          className="btn-primary px-6 py-2 rounded-xl text-xs font-bold"
        >
          Return to Project Selection
        </button>
      </div>
    );
  }

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const exists = config.requiredSkills.some(
      s => s.skill.toLowerCase() === newSkillName.trim().toLowerCase()
    );
    if (exists) {
      setValidationError('Skill is already listed in requirements.');
      return;
    }

    updateConfig({
      requiredSkills: [
        ...config.requiredSkills,
        {
          skill: newSkillName.trim(),
          minProficiency: newSkillProficiency,
          priority: newSkillPriority
        }
      ]
    });
    setNewSkillName('');
    setValidationError(null);
  };

  const handleRemoveSkill = (skillName: string) => {
    updateConfig({
      requiredSkills: config.requiredSkills.filter(s => s.skill !== skillName)
    });
  };

  const handleToggleRole = (role: string) => {
    const exists = config.preferredRoles.includes(role);
    const updated = exists
      ? config.preferredRoles.filter(r => r !== role)
      : [...config.preferredRoles, role];
    updateConfig({ preferredRoles: updated });
  };

  const handleValidateAndSubmit = () => {
    if (config.teamSize < 2) {
      setValidationError('Team size must be at least 2 members.');
      return;
    }
    if (config.requiredSkills.length === 0) {
      setValidationError('Please configure at least one required skill for the project.');
      return;
    }
    setValidationError(null);
    generateRecommendations();
  };

  return (
    <div className="space-y-6">
      
      {/* Configuration Header Card */}
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
              Step 02 • Requirements Configuration
            </span>
          </div>
          <h3 
            className="text-xl font-display font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Configure Team Parameters for <span style={{ color: 'var(--color-accent-cyan)' }}>{selectedProject.name}</span>
          </h3>
          <p 
            className="text-xs mt-0.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Fine-tune size, required technical proficiencies, role allocations, and workforce wellbeing constraints.
          </p>
        </div>

        <button
          type="button"
          onClick={() => goToStep(1)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors self-start sm:self-auto hover:bg-[--color-surface-2]"
          style={{
            border: '1px solid var(--color-border-strong)',
            color: 'var(--color-text-secondary)'
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Project</span>
        </button>
      </div>

      {validationError && (
        <div 
          className="p-4 rounded-xl flex items-center gap-3 animate-in fade-in"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171'
          }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-xs font-semibold">{validationError}</span>
        </div>
      )}

      {/* Main Grid: Core Roster Config & Algorithmic Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Team Size, Skills, Preferred Roles (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Team Formation Strategy Option Selector */}
          <div className="card-base p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Formation Strategy Option
                  </h4>
                  <span 
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'rgba(2, 132, 199, 0.12)',
                      color: 'var(--color-accent-cyan)',
                      border: '1px solid rgba(2, 132, 199, 0.25)'
                    }}
                  >
                    AI Optimization Mode
                  </span>
                </div>
                <p 
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Select the algorithmic objective mode used to assemble, balance, and score team candidates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOptionsModalOpen(true)}
                className="text-xs font-bold hover:underline flex items-center gap-1 self-start sm:self-auto"
                style={{ color: 'var(--color-accent-cyan)' }}
              >
                <span>View Full Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Option Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {formationOptions.map((opt) => {
                const isSelected = (config.formationOption || 'autonomous_ai') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => selectFormationOption(opt.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'ring-2 ring-[--color-accent-cyan] shadow-md'
                        : 'hover:border-[--color-border-strong] hover:bg-[--color-surface-2]/60'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--color-surface-2)' : 'var(--color-surface-1)',
                      borderColor: isSelected ? 'var(--color-accent-cyan)' : 'var(--color-border-subtle)'
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span 
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                          style={{
                            backgroundColor: 'var(--color-surface-3)',
                            color: opt.accentColor,
                            border: '1px solid var(--color-border-subtle)'
                          }}
                        >
                          {opt.badge}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[--color-accent-cyan] flex items-center justify-center text-white">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div 
                        className="text-xs font-bold line-clamp-1"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {opt.title}
                      </div>
                      <p 
                        className="text-[11px] line-clamp-2 mt-1 leading-snug"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {opt.description}
                      </p>
                    </div>

                    <div 
                      className="mt-2.5 pt-2 border-t text-[10px] font-medium truncate"
                      style={{ 
                        borderColor: 'var(--color-border-subtle)',
                        color: opt.accentColor 
                      }}
                    >
                      {opt.highlight}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Team Size */}
          <div className="card-base p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Target Team Size
                </h4>
                <p 
                  className="text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Total headcount recommended for sprint scope execution.
                </p>
              </div>

              {/* Number Stepper */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateConfig({ teamSize: Math.max(2, config.teamSize - 1) })}
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg hover:bg-[--color-surface-2] transition-colors"
                  style={{
                    border: '1px solid var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  -
                </button>
                <div 
                  className="w-12 h-9 rounded-xl flex items-center justify-center font-display font-bold text-lg"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    color: 'var(--color-accent-cyan)'
                  }}
                >
                  {config.teamSize}
                </div>
                <button
                  type="button"
                  onClick={() => updateConfig({ teamSize: Math.min(10, config.teamSize + 1) })}
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg hover:bg-[--color-surface-2] transition-colors"
                  style={{
                    border: '1px solid var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 pt-2 border-t border-[--color-border-subtle]">
              <span className="text-[11px] font-medium text-[--color-text-muted]">Presets:</span>
              {[3, 4, 5, 6].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => updateConfig({ teamSize: n })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    config.teamSize === n ? 'btn-primary' : 'hover:bg-[--color-surface-2]'
                  }`}
                  style={config.teamSize !== n ? {
                    border: '1px solid var(--color-border-subtle)',
                    color: 'var(--color-text-secondary)'
                  } : {}}
                >
                  {n} Members
                </button>
              ))}
            </div>
          </div>

          {/* Required Skills Management */}
          <div className="card-base p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Required Capabilities & Skills ({config.requiredSkills.length})
                </h4>
                <p 
                  className="text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Technical competencies needed in the team roster.
                </p>
              </div>
            </div>

            {/* Existing Skills List */}
            <div className="space-y-2.5">
              {config.requiredSkills.map((req) => (
                <div 
                  key={req.skill}
                  className="flex items-center justify-between p-3 rounded-xl border transition-all"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border-subtle)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="font-bold text-xs"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {req.skill}
                    </span>
                    <span 
                      className="text-[10px] font-mono font-medium px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: 'var(--color-surface-1)',
                        color: 'var(--color-accent-cyan)',
                        border: '1px solid var(--color-border-subtle)'
                      }}
                    >
                      Min {req.minProficiency}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span 
                      className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                        req.priority === 'High' 
                          ? 'text-red-400 bg-red-400/10 border-red-400/25'
                          : req.priority === 'Medium'
                          ? 'text-amber-400 bg-amber-400/10 border-amber-400/25'
                          : 'text-[--color-text-muted] bg-[--color-surface-1] border-[--color-border-subtle]'
                      }`}
                    >
                      {req.priority}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(req.skill)}
                      className="p-1 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                      title="Remove skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Skill Form */}
            <div 
              className="p-4 rounded-xl border space-y-3"
              style={{
                backgroundColor: 'var(--color-surface-1)',
                borderColor: 'var(--color-border-strong)'
              }}
            >
              <div className="text-xs font-bold text-[--color-text-primary]">Add Additional Skill</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  placeholder="e.g. PyTorch, Rust, Kubernetes"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[--color-accent-cyan]"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border-subtle)',
                    color: 'var(--color-text-primary)'
                  }}
                />

                <select
                  value={newSkillProficiency}
                  onChange={(e) => setNewSkillProficiency(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border-subtle)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value={70}>Min 70% (Proficient)</option>
                  <option value={80}>Min 80% (Advanced)</option>
                  <option value={90}>Min 90% (Expert)</option>
                </select>

                <select
                  value={newSkillPriority}
                  onChange={(e) => setNewSkillPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                  className="px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border-subtle)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Skill</span>
                </button>
              </div>

              {/* Preset Skill Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-[--color-text-muted]">Suggested:</span>
                {mockSkillPresets.slice(0, 6).map(sp => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => {
                      setNewSkillName(sp);
                    }}
                    className="text-[10px] font-medium px-2 py-0.5 rounded hover:bg-[--color-surface-2] transition-colors"
                    style={{
                      border: '1px dashed var(--color-border-strong)',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    + {sp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preferred Roles Selection */}
          <div className="card-base p-6 rounded-2xl space-y-4">
            <div>
              <h4 
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Preferred Roster Roles
              </h4>
              <p 
                className="text-xs"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Select key positions you want represented in the recommended team structure.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {mockRolePresets.map(role => {
                const isSelected = config.preferredRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleToggleRole(role)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected ? 'btn-primary' : 'hover:bg-[--color-surface-2]'
                    }`}
                    style={!isSelected ? {
                      border: '1px solid var(--color-border-strong)',
                      color: 'var(--color-text-secondary)',
                      backgroundColor: 'var(--color-surface-2)'
                    } : {}}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{role}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Algorithmic & Workforce Optimization Parameters */}
        <div className="space-y-6">
          
          <div className="card-base p-6 rounded-2xl space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-[--color-border-subtle]">
              <BrainCircuit className="w-4 h-4" style={{ color: 'var(--color-accent-cyan)' }} />
              <h4 
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Workforce Optimization Constraints
              </h4>
            </div>

            {/* Min Availability */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[--color-text-primary] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[--color-accent-cyan]" />
                  Min. Availability
                </span>
                <span className="font-mono font-bold text-[--color-accent-cyan]">
                  {config.minAvailability}%
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="10"
                value={config.minAvailability}
                onChange={(e) => updateConfig({ minAvailability: Number(e.target.value) })}
                className="w-full accent-[--color-accent-cyan] cursor-pointer"
              />
              <p className="text-[10px] text-[--color-text-muted]">
                Exclude candidates currently scheduled above {(100 - config.minAvailability)}% total allocation.
              </p>
            </div>

            {/* Workload Tolerance */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[--color-text-primary] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[--color-accent-cyan]" />
                Workload Balance Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Strict', 'Balanced', 'HighVelocity'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateConfig({ workloadTolerance: mode })}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold text-center transition-all ${
                      config.workloadTolerance === mode ? 'btn-primary' : 'hover:bg-[--color-surface-2]'
                    }`}
                    style={config.workloadTolerance !== mode ? {
                      backgroundColor: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border-subtle)',
                      color: 'var(--color-text-secondary)'
                    } : {}}
                  >
                    {mode === 'Strict' ? 'Fatigue Safe' : mode === 'Balanced' ? 'Balanced' : 'Velocity'}
                  </button>
                ))}
              </div>
            </div>

            {/* Wellbeing Risk Tolerance */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[--color-text-primary] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[--color-accent-lime]" />
                Burnout Risk Tolerance
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'LowOnly', label: 'Low Risk Only', desc: 'Strict wellness protection (Recommended)' },
                  { id: 'ModerateAllowed', label: 'Moderate Allowed', desc: 'Permits members with balanced load' },
                  { id: 'Flexible', label: 'Flexible', desc: 'Maximum skill matching without restriction' }
                ].map(item => (
                  <label
                    key={item.id}
                    onClick={() => updateConfig({ wellbeingRiskTolerance: item.id as any })}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      config.wellbeingRiskTolerance === item.id 
                        ? 'border-[--color-accent-cyan] bg-[--color-surface-2]' 
                        : 'border-[--color-border-subtle] hover:bg-[--color-surface-2]/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="wellbeingTolerance"
                      checked={config.wellbeingRiskTolerance === item.id}
                      onChange={() => {}}
                      className="mt-0.5 accent-[--color-accent-cyan]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[--color-text-primary]">{item.label}</div>
                      <div className="text-[10px] text-[--color-text-muted]">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Performance Preference */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[--color-text-primary] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[--color-accent-cyan]" />
                Performance Priority
              </label>
              <select
                value={config.performancePreference}
                onChange={(e) => updateConfig({ performancePreference: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border-strong)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="HighPerformer">High Performer Bias (Top 10% sprint velocity)</option>
                <option value="Balanced">Balanced Experience (Mix of senior & mid)</option>
                <option value="GrowthFocused">Mentorship & Growth (Pair senior with juniors)</option>
              </select>
            </div>

            {/* Growth Opportunities Toggle */}
            <div 
              className="p-3.5 rounded-xl border flex items-center justify-between cursor-pointer"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border-subtle)'
              }}
              onClick={() => updateConfig({ includeGrowthOpportunities: !config.includeGrowthOpportunities })}
            >
              <div>
                <div className="text-xs font-bold text-[--color-text-primary]">Growth Pairing</div>
                <div className="text-[10px] text-[--color-text-muted]">Include high-potential junior members</div>
              </div>
              <input
                type="checkbox"
                checked={config.includeGrowthOpportunities}
                onChange={() => {}}
                className="w-4 h-4 accent-[--color-accent-cyan] cursor-pointer"
              />
            </div>
          </div>

          {/* Action Trigger Card */}
          <div className="card-elevated p-6 rounded-2xl text-center space-y-4">
            <div>
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-[--color-accent-cyan] animate-pulse" />
              <h4 
                className="text-base font-display font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Ready to Assemble Team
              </h4>
              <p 
                className="text-xs mt-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Analyze {config.teamSize} positions across {config.requiredSkills.length} required skills.
              </p>
            </div>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleValidateAndSubmit}
              className="w-full btn-primary py-3.5 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Optimal Roster...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Recommendations</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
