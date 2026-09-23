import { dashboardData } from '../../data/mockDashboard';
import { Target, Zap, ShieldAlert } from 'lucide-react';

export function WorkforceIntelligence() {
  const { skills, capacity } = dashboardData.workforceIntelligence;
  const totalCapacity = capacity.available + capacity.utilized;
  const utilizedPercent = Math.round((capacity.utilized / totalCapacity) * 100);

  return (
    <section className="mb-8 relative z-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[--color-text-primary] tracking-tight">Workforce Intelligence</h2>
        <p className="text-sm text-[--color-text-secondary]">A real-time view of workforce capability, capacity, and wellbeing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Skill Coverage */}
        <div className="card-base p-6 border-t-2 border-t-[--color-accent-cyan]">
          <div className="flex items-center space-x-2 mb-6">
            <Target className="w-5 h-5 text-[--color-accent-cyan]" />
            <h3 className="font-bold text-[--color-text-primary]">Skill Coverage</h3>
          </div>
          <div className="space-y-4">
            {skills.map((skill, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-[--color-text-secondary]">{skill.name}</span>
                  <span className="font-bold text-[--color-text-primary]">{skill.coverage}%</span>
                </div>
                <div className="h-1.5 w-full bg-[--color-surface-2] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[--color-accent-cyan] rounded-full"
                    style={{ width: `${skill.coverage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Capacity & Workload */}
        <div className="card-base p-6 border-t-2 border-t-[--color-accent-lime]">
          <div className="flex items-center space-x-2 mb-6">
            <Zap className="w-5 h-5 text-[--color-accent-lime]" />
            <h3 className="font-bold text-[--color-text-primary]">Capacity & Workload</h3>
          </div>
          
          <div className="flex items-end justify-between mb-2">
            <div className="text-3xl font-display font-bold text-[--color-text-primary]">{utilizedPercent}%</div>
            <div className="text-xs text-[--color-text-secondary] mb-1">Utilized</div>
          </div>
          
          <div className="h-4 w-full bg-[--color-surface-2] rounded-full overflow-hidden mb-6 flex">
            <div className="h-full bg-[--color-accent-lime]" style={{ width: `${utilizedPercent}%` }} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[--color-surface-2] rounded-xl p-3 border border-[--color-border-subtle]">
              <div className="text-xs text-[--color-text-secondary]">Available</div>
              <div className="font-bold text-[--color-text-primary]">{capacity.available}</div>
            </div>
            <div className="bg-[--color-surface-2] rounded-xl p-3 border border-[--color-border-subtle]">
              <div className="text-xs text-[--color-text-secondary]">Assigned</div>
              <div className="font-bold text-[--color-text-primary]">{capacity.utilized}</div>
            </div>
          </div>
        </div>

        {/* Wellbeing */}
        <div className="card-base p-6 border-t-2 border-t-red-400">
          <div className="flex items-center space-x-2 mb-6">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-[--color-text-primary]">Burnout Risk</h3>
          </div>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 rounded-full border-4 border-red-400/20 flex items-center justify-center border-t-red-400 transform -rotate-45">
              <span className="text-xl font-bold text-[--color-text-primary] transform rotate-45">8%</span>
            </div>
            <div>
              <div className="text-sm font-bold text-red-400">High Risk</div>
              <div className="text-xs text-[--color-text-secondary]">Requires intervention</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[--color-text-secondary] flex items-center"><span className="w-2 h-2 rounded-full bg-[--color-accent-lime] mr-2"/>Low Risk</span>
              <span className="font-bold text-[--color-text-primary]">72%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[--color-text-secondary] flex items-center"><span className="w-2 h-2 rounded-full bg-[--color-accent-cyan] mr-2"/>Moderate</span>
              <span className="font-bold text-[--color-text-primary]">20%</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
