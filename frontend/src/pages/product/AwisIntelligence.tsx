import { PageHeader } from '../../components/PageHeader';
import { AiEngines } from '../../components/AiEngines';
import { AwisGrid } from '../../components/AwisGrid';
import { BrainCircuit, Activity, ShieldCheck, Database, Layers } from 'lucide-react';

export function AwisIntelligence() {
  return (
    <div className="pb-32">
      <PageHeader 
        title="AWIS Intelligence" 
        subtitle="The Adaptive Workforce Intelligence System. Stop guessing, start predicting. Build sustainable teams with explainable AI."
        badge="NEXAWIS Core"
      />
      
      {/* Overview Section */}
      <section className="py-24 container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div className="card-elevated p-10 flex flex-col items-start text-left group">
            <div className="w-14 h-14 rounded-2xl bg-[--color-surface-2] border border-[--color-border-strong] flex items-center justify-center mb-6 text-[--color-accent-cyan] group-hover:scale-110 transition-transform duration-500">
              <BrainCircuit className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-[--color-text-primary] mb-4 text-display">Workforce Intelligence</h3>
            <p className="text-[--color-text-secondary] text-body leading-relaxed">
              Continuously analyze your entire talent pool. Understand skill distribution, capacity, and historical performance to make data-driven allocation decisions.
            </p>
          </div>

          <div className="card-elevated p-10 flex flex-col items-start text-left group">
            <div className="w-14 h-14 rounded-2xl bg-[--color-surface-2] border border-[--color-border-strong] flex items-center justify-center mb-6 text-[--color-accent-lime] group-hover:scale-110 transition-transform duration-500">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-[--color-text-primary] mb-4 text-display">Employee Intelligence</h3>
            <p className="text-[--color-text-secondary] text-body leading-relaxed">
              Go beyond skills. Evaluate behavioral compatibility, burnout risk, and working preferences to ensure individuals thrive in their assigned roles.
            </p>
          </div>

          <div className="card-elevated p-10 flex flex-col items-start text-left group">
            <div className="w-14 h-14 rounded-2xl bg-[--color-surface-2] border border-[--color-border-strong] flex items-center justify-center mb-6 text-[--color-text-primary] group-hover:scale-110 transition-transform duration-500">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-[--color-text-primary] mb-4 text-display">Project Intelligence</h3>
            <p className="text-[--color-text-secondary] text-body leading-relaxed">
              Deconstruct project requirements into multi-dimensional vectors. Match the exact technical and behavioral needs with the right combinations of people.
            </p>
          </div>

        </div>
      </section>

      {/* Embed the AI Engines visualizer */}
      <div className="border-t border-[--color-border-subtle]">
        <AiEngines />
      </div>
      
      {/* Explainable AI Section */}
      <section className="py-24 container mx-auto px-6 relative z-10 border-t border-[--color-border-subtle]">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold text-[--color-text-primary] mb-6 tracking-tight text-display">Explainable Recommendations</h2>
          <p className="text-[--color-text-secondary] text-body text-lg">
            NEXAWIS doesn't just give you a "black box" answer. Every team formation recommendation comes with clear, human-readable rationale based on the 9 Dimensions.
          </p>
        </div>
        
        <div className="bg-[--color-surface-2] border border-[--color-border-strong] rounded-[2rem] p-8 md:p-12 shadow-[--shadow-premium-soft]">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6 text-left">
              <div className="flex items-start space-x-4">
                <ShieldCheck className="w-6 h-6 text-[--color-accent-lime] mt-1 shrink-0" />
                <div>
                  <h4 className="text-lg font-bold text-[--color-text-primary] mb-2">Confidence Scoring</h4>
                  <p className="text-[--color-text-secondary] text-sm">See exactly why a team matches a project, with percentage scores across technical and behavioral axes.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Database className="w-6 h-6 text-[--color-accent-cyan] mt-1 shrink-0" />
                <div>
                  <h4 className="text-lg font-bold text-[--color-text-primary] mb-2">Historical Context</h4>
                  <p className="text-[--color-text-secondary] text-sm">Recommendations reference past successful projects and highlight similar winning team combinations.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full bg-[--color-surface-1] rounded-2xl border border-[--color-border-subtle] p-6 text-left font-mono text-sm overflow-hidden relative">
              <div className="text-[#8db3bd] mb-2">// Recommendation Rationale generated by AWIS</div>
              <div className="text-[--color-text-primary] mb-4">{`{`}</div>
              <div className="pl-4 space-y-2">
                <div><span className="text-[--color-accent-cyan]">"team_synergy"</span>: <span className="text-[--color-accent-lime]">94.2</span>,</div>
                <div><span className="text-[--color-accent-cyan]">"burnout_risk"</span>: <span className="text-[--color-text-primary]">"Low"</span>,</div>
                <div><span className="text-[--color-accent-cyan]">"rationale"</span>: <span className="text-[--color-text-secondary]">"Strong behavioral overlap in communication styles. Developer A and B have successfully shipped 3 similar projects together."</span></div>
              </div>
              <div className="text-[--color-text-primary] mt-4">{`}`}</div>
              
              {/* Glass reflection */}
              <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/[0.03] to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>
      
      {/* Show 9 Dimensions Grid */}
      <div className="border-t border-[--color-border-subtle]">
        <AwisGrid />
      </div>

    </div>
  );
}
