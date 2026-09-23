import { PageHeader } from '../../components/PageHeader';
import { Hexagon } from 'lucide-react';

export function About() {
  return (
    <div className="pb-32">
      <PageHeader 
        title="About NEXAWIS" 
        subtitle="We believe that project success is fundamentally a human challenge, not just a technical one."
        badge="Company"
      />
      
      <section className="py-24 container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto space-y-16">
          
          <div className="text-center">
            <div className="bg-[--color-surface-2] w-20 h-20 rounded-3xl border border-[--color-border-strong] flex items-center justify-center mx-auto mb-8 shadow-[--shadow-premium-soft]">
              <Hexagon className="w-10 h-10 text-[--color-accent-cyan] fill-[--color-accent-cyan]/10" />
            </div>
            <h2 className="text-3xl font-bold text-[--color-text-primary] mb-6 text-display">The Vision</h2>
            <p className="text-[--color-text-secondary] text-lg leading-relaxed max-w-2xl mx-auto">
              To transform the way organizations perceive their workforce—moving away from viewing employees as interchangeable resources, and towards understanding them as complex, dynamic individuals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-elevated p-8 border-t-4 border-t-[--color-accent-lime]">
              <h3 className="text-xl font-bold text-[--color-text-primary] mb-4">The Mission</h3>
              <p className="text-[--color-text-secondary] leading-relaxed">
                Provide engineering leaders with the explainable, data-driven intelligence they need to construct highly synergistic teams, prevent burnout, and guarantee project delivery.
              </p>
            </div>
            <div className="card-elevated p-8 border-t-4 border-t-[--color-accent-cyan]">
              <h3 className="text-xl font-bold text-[--color-text-primary] mb-4">The Innovation</h3>
              <p className="text-[--color-text-secondary] leading-relaxed">
                By combining behavioral psychology with advanced machine learning, we built the AWIS Engine—the first platform that can mathematically predict team friction and execution speed.
              </p>
            </div>
          </div>

          <div className="card-base p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[--color-accent-cyan]/10 to-[--color-accent-lime]/10 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-[--color-text-primary] mb-4">People + Data + AI + Sustainability</h2>
              <p className="text-[--color-text-secondary] max-w-xl mx-auto">
                These are the core pillars of NEXAWIS. We don't use AI to replace human judgment; we use it to augment it, ensuring that every project is staffed ethically and effectively.
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
