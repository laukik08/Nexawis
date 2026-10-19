import type { Project } from '../../../data/mockProjects';
import clsx from 'clsx';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ProjectIntelligenceProps {
  project: Project;
}

export function ProjectIntelligence({ project }: ProjectIntelligenceProps) {
  const { intelligence, requirements, risks } = project;

  const getMetricColor = (value: number, invert = false) => {
    // If invert is true, lower is better (like technical risk)
    if (invert) {
      if (value < 40) return 'var(--color-accent-lime)';
      if (value < 70) return 'var(--color-accent-cyan)';
      return '#f87171';
    }
    if (value > 70) return 'var(--color-accent-lime)';
    if (value > 40) return 'var(--color-accent-cyan)';
    return '#f87171';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-[--color-accent-lime]" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-[--color-text-muted]" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intelligence Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[--color-accent-cyan] bg-[--color-accent-cyan]/10 px-2.5 py-0.5 rounded-full border border-[--color-accent-cyan]/20">
            Predictive Analysis
          </span>
        </div>
        <h2 className="text-xl font-display font-bold text-[--color-text-primary]">
          Project Intelligence & Risk Factors
        </h2>
        <p className="text-xs text-[--color-text-secondary] mt-0.5">
          Multi-dimensional factors influencing project execution velocity and success probability.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Core Intelligence Metrics */}
        <div className="card-base p-6 md:p-8 rounded-2xl space-y-6">
          <h3 className="text-sm font-bold text-[--color-text-primary] uppercase tracking-wider mb-6 border-b border-[--color-border-subtle] pb-4">Execution Factors</h3>
          
          {[
            { label: 'Technical Risk', value: intelligence.technicalRisk, invert: true },
            { label: 'Schedule Pressure', value: intelligence.schedulePressure, invert: true },
            { label: 'Requirement Stability', value: intelligence.requirementStability, invert: false },
            { label: 'Client Engagement', value: intelligence.clientEngagement, invert: false },
            { label: 'Innovation Index', value: intelligence.innovationIndex, invert: false }
          ].map(metric => (
            <div key={metric.label}>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-[--color-text-secondary]">{metric.label}</span>
                <span className="text-[--color-text-primary]">{metric.value}/100</span>
              </div>
              <div className="w-full h-1.5 bg-[--color-surface-2] rounded-full overflow-hidden border border-[--color-border-subtle]">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${metric.value}%`,
                    backgroundColor: getMetricColor(metric.value, metric.invert)
                  }} 
                />
              </div>
            </div>
          ))}
        </div>

        {/* Project Success Prediction */}
        <div className="card-elevated p-6 md:p-8 rounded-2xl flex flex-col">
          <div className="flex items-center space-x-2 mb-6">
            <Target className="w-5 h-5 text-[--color-accent-cyan]" />
            <h3 className="text-sm font-bold text-[--color-text-primary] uppercase tracking-wider">Project Success Score</h3>
          </div>
          
          <div className="flex items-end space-x-4 mb-8">
            <div className="text-6xl font-display font-bold text-[--color-text-primary] leading-none">
              {intelligence.successPrediction.score.toFixed(1)}
            </div>
            <div className="pb-1.5">{getTrendIcon(intelligence.successPrediction.trend)}</div>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <div className="text-xs font-bold text-[--color-text-muted] uppercase tracking-wider mb-3">Supporting Factors</div>
              <ul className="space-y-2">
                {intelligence.successPrediction.positiveFactors.map((factor, i) => (
                  <li key={i} className="flex items-start text-sm text-[--color-text-secondary]">
                    <span className="text-[--color-accent-lime] mr-2 mt-0.5">+</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
            
            {intelligence.successPrediction.negativeFactors.length > 0 && (
              <div>
                <div className="text-xs font-bold text-[--color-text-muted] uppercase tracking-wider mb-3">Potential Concerns</div>
                <ul className="space-y-2">
                  {intelligence.successPrediction.negativeFactors.map((factor, i) => (
                    <li key={i} className="flex items-start text-sm text-[--color-text-secondary]">
                      <span className="text-red-400 mr-2 mt-0.5">-</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Project Requirements */}
        <div className="card-base p-6 md:p-8 rounded-2xl">
          <h3 className="text-sm font-bold text-[--color-text-primary] uppercase tracking-wider mb-6 border-b border-[--color-border-subtle] pb-4">Workforce Requirements</h3>
          
          <div className="space-y-3">
            {requirements.map((req, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[--color-surface-2] border border-[--color-border-subtle]">
                <div className="font-bold text-sm text-[--color-text-primary]">{req.skill}</div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[--color-text-muted]">{req.level}</span>
                  <span className={clsx(
                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded border",
                    req.priority === 'High' ? 'text-[--color-accent-cyan] border-[--color-accent-cyan]/30' : 
                    req.priority === 'Medium' ? 'text-[--color-text-secondary] border-[--color-border-strong]' : 
                    'text-[--color-text-muted] border-[--color-border-subtle]'
                  )}>
                    {req.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Risk */}
        <div className="card-base p-6 md:p-8 rounded-2xl">
          <h3 className="text-sm font-bold text-[--color-text-primary] uppercase tracking-wider mb-6 border-b border-[--color-border-subtle] pb-4">Active Risks</h3>
          
          <div className="space-y-4">
            {risks.length === 0 ? (
              <div className="text-sm text-[--color-text-muted] italic">No significant risks detected.</div>
            ) : (
              risks.map((risk, i) => (
                <div key={i} className="flex items-start space-x-4">
                  <div className="shrink-0 mt-1">
                    <div className={clsx(
                      "w-2.5 h-2.5 rounded-full",
                      risk.level === 'High' ? 'bg-red-400' :
                      risk.level === 'Medium' ? 'bg-[--color-accent-cyan]' : 'bg-[--color-accent-lime]'
                    )} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-sm text-[--color-text-primary]">{risk.category}</span>
                      {getTrendIcon(risk.trend)}
                    </div>
                    <p className="text-sm text-[--color-text-secondary] leading-relaxed">
                      {risk.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
