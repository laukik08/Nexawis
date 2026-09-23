import { PageHeader } from '../../components/PageHeader';
import { ArrowUpRight } from 'lucide-react';

export function Insights() {
  const articles = [
    {
      category: "Workforce Planning",
      date: "Oct 12, 2025",
      title: "Why Traditional Resourcing Fails in Agile Environments",
      excerpt: "Spreadsheets can't capture human behavioral nuances. Exploring the hidden costs of ignoring team chemistry."
    },
    {
      category: "AI Ethics",
      date: "Sep 28, 2025",
      title: "The Necessity of Explainable AI in HR Tech",
      excerpt: "When algorithms make decisions about human careers, black-boxes are unacceptable. How AWIS solves this."
    },
    {
      category: "Wellbeing",
      date: "Sep 15, 2025",
      title: "Predicting Burnout Before the Resignation Letter",
      excerpt: "Using multi-dimensional data to identify fatigue patterns and intervene proactively."
    },
    {
      category: "Product Update",
      date: "Aug 30, 2025",
      title: "Introducing the 9 Dimensions Visualization Engine",
      excerpt: "A deep dive into our latest update that lets managers visually explore team behavioral synergy."
    }
  ];

  return (
    <div className="pb-32">
      <PageHeader 
        title="Insights & Articles" 
        subtitle="Latest thoughts on sustainable team formation, explainable AI, and the future of workforce intelligence."
        badge="Resources"
      />
      
      <section className="py-24 container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.map((article, i) => (
            <div key={i} className="card-elevated p-8 group flex flex-col h-full cursor-pointer">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-semibold tracking-wider uppercase text-[--color-accent-cyan]">{article.category}</span>
                <span className="text-sm font-mono text-[--color-text-muted]">{article.date}</span>
              </div>
              <h3 className="text-2xl font-bold text-[--color-text-primary] mb-4 group-hover:text-[--color-accent-lime] transition-colors">
                {article.title}
              </h3>
              <p className="text-[--color-text-secondary] leading-relaxed mb-8 flex-1">
                {article.excerpt}
              </p>
              <div className="flex items-center text-sm font-bold text-[--color-text-primary] group-hover:text-[--color-accent-cyan] transition-colors mt-auto">
                <span>Read Article</span>
                <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
