import { PageHeader } from '../../components/PageHeader';
import { Users, BarChart3, TrendingUp } from 'lucide-react';

export function WorkforceAllocation() {
  return (
    <div className="pb-32">
      <PageHeader 
        title="Workforce Allocation" 
        subtitle="Optimize your bench. Deploy the right talent to the right projects at exactly the right time."
        badge="Solutions"
      />
      
      <section className="py-24 container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Text Content */}
          <div className="w-full lg:w-1/2">
            <h2 className="text-3xl font-bold text-[--color-text-primary] mb-6 text-display tracking-tight">Stop guessing who is available and capable.</h2>
            <p className="text-[--color-text-secondary] text-lg leading-relaxed mb-8">
              Traditional resource management relies on outdated spreadsheets and subjective manager opinions. NEXAWIS ingests your entire talent landscape to provide real-time, data-driven allocation recommendations that balance business needs with employee growth.
            </p>
            <ul className="space-y-6">
              <li className="flex items-start space-x-4">
                <div className="bg-[--color-surface-2] p-2 rounded-lg border border-[--color-border-strong] mt-1 shrink-0">
                  <Users className="w-5 h-5 text-[--color-accent-cyan]" />
                </div>
                <div>
                  <h4 className="font-bold text-[--color-text-primary]">Skills-Gap Analysis</h4>
                  <p className="text-[--color-text-secondary] text-sm">Instantly identify missing capabilities across your organization.</p>
                </div>
              </li>
              <li className="flex items-start space-x-4">
                <div className="bg-[--color-surface-2] p-2 rounded-lg border border-[--color-border-strong] mt-1 shrink-0">
                  <BarChart3 className="w-5 h-5 text-[--color-accent-lime]" />
                </div>
                <div>
                  <h4 className="font-bold text-[--color-text-primary]">Capacity Forecasting</h4>
                  <p className="text-[--color-text-secondary] text-sm">Predict when key personnel will become available before projects end.</p>
                </div>
              </li>
              <li className="flex items-start space-x-4">
                <div className="bg-[--color-surface-2] p-2 rounded-lg border border-[--color-border-strong] mt-1 shrink-0">
                  <TrendingUp className="w-5 h-5 text-[--color-text-primary]" />
                </div>
                <div>
                  <h4 className="font-bold text-[--color-text-primary]">Utilization Optimization</h4>
                  <p className="text-[--color-text-secondary] text-sm">Ensure your most expensive assets are deployed effectively without causing burnout.</p>
                </div>
              </li>
            </ul>
          </div>
          
          {/* Visual Component */}
          <div className="w-full lg:w-1/2 relative">
            <div className="bg-[--color-surface-2] border border-[--color-border-strong] rounded-3xl p-8 relative overflow-hidden shadow-[--shadow-premium-soft]">
              <div className="absolute inset-0 bg-gradient-to-br from-[--color-accent-cyan]/5 to-transparent pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                {[
                  { name: "Senior Backend Eng.", avail: "Available in 2w", util: 85, color: "bg-[--color-accent-cyan]" },
                  { name: "UX Researcher", avail: "Available Now", util: 40, color: "bg-[--color-accent-lime]" },
                  { name: "DevOps Lead", avail: "Overallocated", util: 110, color: "bg-red-400" },
                  { name: "Frontend Dev", avail: "Available in 1w", util: 70, color: "bg-[--color-accent-cyan]" },
                ].map((item, i) => (
                  <div key={i} className="bg-[--color-surface-1] border border-[--color-border-subtle] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-[--color-text-primary]">{item.name}</div>
                      <div className="text-xs text-[--color-text-secondary]">{item.avail}</div>
                    </div>
                    <div className="flex items-center space-x-3 w-1/3">
                      <div className="flex-1 h-2 bg-[--color-surface-2] rounded-full overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${Math.min(item.util, 100)}%` }} />
                      </div>
                      <span className="text-xs font-mono text-[--color-text-secondary] w-8 text-right">{item.util}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Ambient glow behind visual */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[--color-accent-cyan] blur-[100px] opacity-10 pointer-events-none -z-10" />
          </div>
        </div>
      </section>
    </div>
  );
}
