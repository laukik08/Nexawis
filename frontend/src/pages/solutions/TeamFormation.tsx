import { PageHeader } from '../../components/PageHeader';
import { GitMerge, Users2, Brain } from 'lucide-react';

export function TeamFormation() {
  return (
    <div className="pb-32">
      <PageHeader 
        title="Team Formation" 
        subtitle="Go beyond matching skills. Build synergistic project teams engineered for maximum execution velocity."
        badge="Solutions"
      />
      
      <section className="py-24 container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row-reverse gap-16 items-center">
          {/* Text Content */}
          <div className="w-full lg:w-1/2">
            <h2 className="text-3xl font-bold text-[--color-text-primary] mb-6 text-display tracking-tight">Chemistry isn't magic. It's data.</h2>
            <p className="text-[--color-text-secondary] text-lg leading-relaxed mb-8">
              Putting your five smartest engineers on one project often leads to disaster. NEXAWIS analyzes behavioral compatibility, working styles, and communication preferences to build teams that inherently collaborate well.
            </p>
            <ul className="space-y-6">
              <li className="flex items-start space-x-4">
                <div className="bg-[--color-surface-2] p-2 rounded-lg border border-[--color-border-strong] mt-1 shrink-0">
                  <Brain className="w-5 h-5 text-[--color-accent-lime]" />
                </div>
                <div>
                  <h4 className="font-bold text-[--color-text-primary]">Behavioral Synergy</h4>
                  <p className="text-[--color-text-secondary] text-sm">Balance personalities to avoid conflict and maximize cognitive diversity.</p>
                </div>
              </li>
              <li className="flex items-start space-x-4">
                <div className="bg-[--color-surface-2] p-2 rounded-lg border border-[--color-border-strong] mt-1 shrink-0">
                  <GitMerge className="w-5 h-5 text-[--color-accent-cyan]" />
                </div>
                <div>
                  <h4 className="font-bold text-[--color-text-primary]">Historical Success</h4>
                  <p className="text-[--color-text-secondary] text-sm">Identify combinations of individuals who have historically delivered on time.</p>
                </div>
              </li>
              <li className="flex items-start space-x-4">
                <div className="bg-[--color-surface-2] p-2 rounded-lg border border-[--color-border-strong] mt-1 shrink-0">
                  <Users2 className="w-5 h-5 text-[--color-text-primary]" />
                </div>
                <div>
                  <h4 className="font-bold text-[--color-text-primary]">Leadership Distribution</h4>
                  <p className="text-[--color-text-secondary] text-sm">Ensure every project has the right mix of senior guidance and execution power.</p>
                </div>
              </li>
            </ul>
          </div>
          
          {/* Visual Component */}
          <div className="w-full lg:w-1/2 relative">
            <div className="bg-[--color-surface-2] border border-[--color-border-strong] rounded-3xl p-8 relative overflow-hidden shadow-[--shadow-premium-soft]">
              <div className="absolute inset-0 bg-gradient-to-br from-[--color-accent-lime]/5 to-transparent pointer-events-none" />
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-[--color-text-primary]">Generated Team Proposal</span>
                  <span className="text-xs font-mono text-[--color-accent-lime] bg-[--color-accent-lime]/10 px-2 py-1 rounded-full border border-[--color-accent-lime]/20">Synergy: 94%</span>
                </div>
                
                <div className="flex justify-center">
                  <div className="relative w-48 h-48">
                    {/* Simplified network graph visualization */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-[--color-surface-1] border-2 border-[--color-accent-cyan] rounded-full flex items-center justify-center z-10 shadow-lg">Lead</div>
                    <div className="absolute bottom-4 left-0 w-12 h-12 bg-[--color-surface-1] border-2 border-[--color-accent-lime] rounded-full flex items-center justify-center z-10 shadow-lg">Dev</div>
                    <div className="absolute bottom-4 right-0 w-12 h-12 bg-[--color-surface-1] border-2 border-[--color-text-primary] rounded-full flex items-center justify-center z-10 shadow-lg">UX</div>
                    
                    {/* Connecting lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                      <line x1="50%" y1="24px" x2="24px" y2="100%" stroke="var(--color-border-strong)" strokeWidth="2" strokeDasharray="4 4" />
                      <line x1="50%" y1="24px" x2="100%" y2="100%" stroke="var(--color-border-strong)" strokeWidth="2" />
                      <line x1="24px" y1="100%" x2="100%" y2="100%" stroke="var(--color-border-strong)" strokeWidth="2" strokeDasharray="4 4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ambient glow behind visual */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[--color-accent-lime] blur-[100px] opacity-10 pointer-events-none -z-10" />
          </div>
        </div>
      </section>
    </div>
  );
}
