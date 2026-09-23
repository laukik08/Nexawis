import { PageHeader } from '../../components/PageHeader';
import { BookOpen, Key, Users, Settings, BrainCircuit, Activity } from 'lucide-react';

export function Documentation() {
  const docsCategories = [
    {
      title: "Getting Started",
      icon: <BookOpen className="w-6 h-6" />,
      items: ["Platform Overview", "Quick Start Guide", "Integration Basics", "Authentication"]
    },
    {
      title: "AWIS Engine",
      icon: <BrainCircuit className="w-6 h-6" />,
      items: ["The 9 Dimensions Model", "Data Ingestion", "Confidence Scoring", "Explainability"]
    },
    {
      title: "Workforce Intelligence",
      icon: <Users className="w-6 h-6" />,
      items: ["Skills Mapping", "Capacity Forecasting", "Utilization Analytics", "Gap Analysis"]
    },
    {
      title: "Employee Wellbeing",
      icon: <Activity className="w-6 h-6" />,
      items: ["Burnout Risk Metrics", "Workload Balancing", "Retention Forecasting", "Intervention Workflows"]
    },
    {
      title: "API Reference",
      icon: <Key className="w-6 h-6" />,
      items: ["REST endpoints", "GraphQL API", "Webhooks", "Rate Limits"]
    },
    {
      title: "Administration",
      icon: <Settings className="w-6 h-6" />,
      items: ["Role-Based Access", "SSO Configuration", "Data Export", "Compliance"]
    }
  ];

  return (
    <div className="pb-32">
      <PageHeader 
        title="Documentation" 
        subtitle="Everything you need to integrate, deploy, and master the NEXAWIS platform."
        badge="Resources"
      />
      
      <section className="py-24 container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {docsCategories.map((cat, i) => (
            <div key={i} className="card-elevated p-8 group flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-[--color-surface-2] border border-[--color-border-strong] flex items-center justify-center mb-6 text-[--color-accent-cyan] group-hover:text-[--color-accent-lime] group-hover:scale-110 transition-all duration-300">
                {cat.icon}
              </div>
              <h3 className="text-xl font-bold text-[--color-text-primary] mb-6">{cat.title}</h3>
              <ul className="space-y-3 mt-auto">
                {cat.items.map((item, j) => (
                  <li key={j}>
                    <a href="#" className="text-[--color-text-secondary] hover:text-[--color-text-primary] text-sm hover:underline decoration-[--color-accent-cyan] underline-offset-4 transition-all flex items-center">
                      <span className="w-1 h-1 rounded-full bg-[--color-border-strong] mr-3" />
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
