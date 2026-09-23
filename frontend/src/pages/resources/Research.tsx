import { PageHeader } from '../../components/PageHeader';
import { FileText, Download } from 'lucide-react';

export function Research() {
  const papers = [
    {
      title: "Predictive Burnout Modeling in Agile Software Teams",
      journal: "International Journal of Workforce Intelligence",
      year: "2025",
      description: "An empirical study on using multi-dimensional behavioral vectors to accurately predict team burnout up to 3 months in advance."
    },
    {
      title: "The Impact of Cognitive Diversity on Delivery Velocity",
      journal: "NEXAWIS Internal Research Labs",
      year: "2024",
      description: "Analyzing 10,000 project outcomes to determine the mathematical relationship between personality overlap and execution speed."
    },
    {
      title: "Sustainable Team Formation via Explainable AI",
      journal: "IEEE Conference on Applied AI",
      year: "2024",
      description: "A framework for removing algorithmic black-boxes when making human capital allocation decisions."
    }
  ];

  return (
    <div className="pb-32">
      <PageHeader 
        title="Research & Publications" 
        subtitle="NEXAWIS is built on a foundation of peer-reviewed science, organizational psychology, and rigorous empirical data."
        badge="Resources"
      />
      
      <section className="py-24 container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {papers.map((paper, i) => (
            <div key={i} className="card-elevated p-8 group flex flex-col md:flex-row gap-8 items-start">
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-[--color-surface-2] border border-[--color-border-strong] flex items-center justify-center text-[--color-text-secondary] group-hover:text-[--color-accent-lime] group-hover:border-[--color-accent-lime]/30 transition-all duration-300">
                <FileText className="w-8 h-8" />
              </div>
              
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="text-xs font-mono px-2 py-1 rounded bg-[--color-surface-2] text-[--color-text-secondary] border border-[--color-border-subtle]">{paper.year}</span>
                  <span className="text-sm font-semibold text-[--color-accent-cyan]">{paper.journal}</span>
                </div>
                <h3 className="text-2xl font-bold text-[--color-text-primary] mb-4">{paper.title}</h3>
                <p className="text-[--color-text-secondary] leading-relaxed mb-6">
                  {paper.description}
                </p>
                <button className="flex items-center space-x-2 text-sm font-semibold text-[--color-text-primary] hover:text-[--color-accent-lime] transition-colors group/btn">
                  <Download className="w-4 h-4 group-hover/btn:-translate-y-1 transition-transform" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
