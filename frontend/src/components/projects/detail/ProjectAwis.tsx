import type { Project } from '../../../data/mockProjects';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectAwisProps {
  project: Project;
}

export function ProjectAwis({ project }: ProjectAwisProps) {
  const navigate = useNavigate();
  const { awisFit } = project;

  return (
    <div className="space-y-6">
      
      {/* AWIS Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[--color-accent-cyan] bg-[--color-accent-cyan]/10 px-2.5 py-0.5 rounded-full border border-[--color-accent-cyan]/20">
            Workforce Intelligence
          </span>
        </div>
        <h2 className="text-xl font-display font-bold text-[--color-text-primary] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[--color-accent-cyan]" />
          Team Fit Intelligence
        </h2>
        <p className="text-xs text-[--color-text-secondary] mt-0.5">
          AWIS multidimensional alignment analysis of workforce capability against project requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Overall Fit Score */}
        <div className="card-elevated p-8 rounded-2xl flex flex-col justify-center items-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-[--color-accent-cyan]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[--color-text-muted] mb-4">Overall Team Fit</div>
            
            {/* Simple Radial visualization substitute */}
            <div className="relative w-40 h-40 mx-auto flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-[--color-surface-2]" />
              <div 
                className="absolute inset-0 rounded-full border-4 shadow-[0_0_15px_rgba(2,132,199,0.3)]"
                style={{ 
                  borderColor: 'var(--color-accent-cyan)',
                  clipPath: `polygon(50% 50%, 50% 0, ${awisFit.overallScore > 25 ? '100% 0,' : ''} ${awisFit.overallScore > 50 ? '100% 100%,' : ''} ${awisFit.overallScore > 75 ? '0 100%,' : ''} ${awisFit.overallScore === 100 ? '0 0,' : ''} ${awisFit.overallScore <= 25 ? `${50 + (awisFit.overallScore/25)*50}% 0` : awisFit.overallScore <= 50 ? `100% ${((awisFit.overallScore-25)/25)*50}%` : awisFit.overallScore <= 75 ? `${100 - ((awisFit.overallScore-50)/25)*50}% 100%` : `0 ${100 - ((awisFit.overallScore-75)/25)*50}%`})`
                }}
              />
              <div className="text-4xl font-display font-bold text-[--color-text-primary]">
                {awisFit.overallScore.toFixed(1)}
              </div>
            </div>

            <button 
              type="button"
              onClick={() => navigate('/app/teams')}
              className="flex items-center justify-center space-x-2 btn-primary px-6 py-3 rounded-xl font-bold w-full cursor-pointer"
            >
              <span>Build / Optimize Team</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dimension Breakdown */}
        <div className="card-base p-6 md:p-8 rounded-2xl">
          <h3 className="text-sm font-bold text-[--color-text-primary] uppercase tracking-wider mb-6 border-b border-[--color-border-subtle] pb-4">Fit Dimensions</h3>
          
          <div className="space-y-5">
            {[
              { label: 'Skills Match', value: awisFit.skillsMatch },
              { label: 'Experience Level', value: awisFit.experienceMatch },
              { label: 'Availability', value: awisFit.availabilityMatch },
              { label: 'Workload Balance', value: awisFit.workloadBalance },
              { label: 'Wellbeing Impact', value: awisFit.wellbeingImpact },
            ].map(dim => (
              <div key={dim.label}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-[--color-text-secondary]">{dim.label}</span>
                  <span className="text-[--color-text-primary]">{dim.value}%</span>
                </div>
                <div className="w-full h-1.5 bg-[--color-surface-2] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${dim.value}%`, backgroundColor: 'var(--color-accent-cyan)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights & Explainability */}
        <div className="card-base p-6 md:p-8 rounded-2xl flex flex-col">
          <h3 className="text-sm font-bold text-[--color-text-primary] uppercase tracking-wider mb-6 border-b border-[--color-border-subtle] pb-4">Analysis & Explainability</h3>
          
          <div className="space-y-6 flex-1">
            <div>
              <div className="text-xs font-bold text-[--color-text-muted] uppercase tracking-wider mb-3">Why this team?</div>
              <ul className="space-y-2">
                {awisFit.explanation.positives.map((item, i) => (
                  <li key={i} className="flex items-start text-sm text-[--color-text-secondary]">
                    <span className="text-[--color-accent-lime] mr-2 mt-0.5">+</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {awisFit.explanation.concerns.length > 0 && (
              <div>
                <div className="text-xs font-bold text-[--color-text-muted] uppercase tracking-wider mb-3">Concerns</div>
                <ul className="space-y-2">
                  {awisFit.explanation.concerns.map((item, i) => (
                    <li key={i} className="flex items-start text-sm text-[--color-text-secondary]">
                      <span className="text-red-400 mr-2 mt-0.5">-</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="mt-6 p-4 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle]">
            <div className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-wider mb-2">Key Insight</div>
            <p className="text-sm font-medium text-[--color-text-primary]">
              {awisFit.insights[0]}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
