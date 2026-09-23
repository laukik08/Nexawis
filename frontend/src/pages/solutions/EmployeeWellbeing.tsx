import { PageHeader } from '../../components/PageHeader';
import { HeartPulse, ShieldAlert, Activity } from 'lucide-react';

export function EmployeeWellbeing() {
  return (
    <div className="pb-32">
      <PageHeader 
        title="Employee Wellbeing" 
        subtitle="Predict and prevent burnout before it happens. Retain your best talent by ensuring sustainable workloads."
        badge="Solutions"
      />
      
      <section className="py-24 container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Text Content */}
          <div className="w-full lg:w-1/2">
            <h2 className="text-3xl font-bold text-[--color-text-primary] mb-6 text-display tracking-tight">Turnover is expensive. Burnout is predictable.</h2>
            <p className="text-[--color-text-secondary] text-lg leading-relaxed mb-8">
              NEXAWIS monitors allocation density, context-switching frequency, and project intensity to give you early warning signs of employee fatigue, allowing you to intervene before you lose critical talent.
            </p>
            <ul className="space-y-6">
              <li className="flex items-start space-x-4">
                <div className="bg-[--color-surface-2] p-2 rounded-lg border border-[--color-border-strong] mt-1 shrink-0">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h4 className="font-bold text-[--color-text-primary]">Burnout Prediction</h4>
                  <p className="text-[--color-text-secondary] text-sm">Identify individuals at high risk based on historical workload patterns.</p>
                </div>
              </li>
              <li className="flex items-start space-x-4">
                <div className="bg-[--color-surface-2] p-2 rounded-lg border border-[--color-border-strong] mt-1 shrink-0">
                  <Activity className="w-5 h-5 text-[--color-accent-lime]" />
                </div>
                <div>
                  <h4 className="font-bold text-[--color-text-primary]">Workload Balancing</h4>
                  <p className="text-[--color-text-secondary] text-sm">Automatically suggest re-allocations to distribute stress evenly across the team.</p>
                </div>
              </li>
              <li className="flex items-start space-x-4">
                <div className="bg-[--color-surface-2] p-2 rounded-lg border border-[--color-border-strong] mt-1 shrink-0">
                  <HeartPulse className="w-5 h-5 text-[--color-accent-cyan]" />
                </div>
                <div>
                  <h4 className="font-bold text-[--color-text-primary]">Retention Intelligence</h4>
                  <p className="text-[--color-text-secondary] text-sm">Keep your top performers engaged by ensuring they are challenged, but not overwhelmed.</p>
                </div>
              </li>
            </ul>
          </div>
          
          {/* Visual Component */}
          <div className="w-full lg:w-1/2 relative">
            <div className="bg-[--color-surface-2] border border-[--color-border-strong] rounded-3xl p-8 relative overflow-hidden shadow-[--shadow-premium-soft]">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[--color-text-primary]">Fatigue Monitoring</span>
                  <span className="flex items-center text-xs font-mono text-red-400 bg-red-400/10 px-2 py-1 rounded-full border border-red-400/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse mr-2" />
                    Alert Active
                  </span>
                </div>
                
                <div className="bg-[--color-surface-1] border border-red-400/30 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-400" />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-bold text-[--color-text-primary]">Sarah Jenkins</div>
                      <div className="text-xs text-[--color-text-secondary]">Lead Architect</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-display font-bold text-red-400">92%</div>
                      <div className="text-[10px] uppercase tracking-wider text-[--color-text-muted]">Burnout Risk</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4 border-t border-[--color-border-subtle] pt-4 text-xs font-mono text-[--color-text-secondary]">
                    <div className="flex justify-between">
                      <span>Recent Overtime:</span>
                      <span className="text-[--color-text-primary]">45hrs / 2wks</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Context Switches:</span>
                      <span className="text-red-400 font-bold">12 / day</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ambient glow behind visual */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-red-500 blur-[100px] opacity-10 pointer-events-none -z-10" />
          </div>
        </div>
      </section>
    </div>
  );
}
