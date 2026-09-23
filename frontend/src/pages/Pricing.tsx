import { PageHeader } from '../components/PageHeader';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export function Pricing() {
  const plans = [
    {
      name: "Pilot",
      description: "For small organizations looking to validate sustainable team formation.",
      price: "Demo",
      features: [
        "Up to 50 active employee profiles",
        "Basic 9 Dimensions mapping",
        "Manual team synergy scoring",
        "Email support"
      ],
      buttonText: "Request Demo",
      popular: false
    },
    {
      name: "Enterprise",
      description: "Full AI workforce allocation for scaling organizations.",
      price: "Custom",
      features: [
        "Unlimited employee profiles",
        "Real-time burnout prediction",
        "Automated project intelligence",
        "API & HRIS Integrations",
        "Dedicated success manager"
      ],
      buttonText: "Contact Sales",
      popular: true
    }
  ];

  return (
    <div className="pb-32">
      <PageHeader 
        title="Predictable Pricing" 
        subtitle="Transparent plans that scale with your workforce. Stop paying for empty seats."
      />
      
      <section className="py-24 container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan, i) => (
            <div key={i} className={`relative p-10 rounded-[2rem] flex flex-col ${
              plan.popular 
                ? 'bg-[--color-surface-2] border border-[--color-accent-lime]/50 shadow-[0_20px_40px_rgba(232,243,154,0.05)]' 
                : 'bg-[--color-surface-1] border border-[--color-border-subtle]'
            }`}>
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[--color-accent-lime] text-[--color-bg-base] text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-[--color-text-primary] mb-2">{plan.name}</h3>
              <p className="text-[--color-text-secondary] text-sm mb-8 h-10">{plan.description}</p>
              
              <div className="mb-8 pb-8 border-b border-[--color-border-subtle]">
                <div className="text-4xl font-display font-bold text-[--color-text-primary]">{plan.price}</div>
              </div>
              
              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start space-x-3 text-[--color-text-secondary]">
                    <CheckCircle2 className="w-5 h-5 text-[--color-accent-cyan] shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className={`w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-300 ${
                plan.popular 
                  ? 'btn-accent text-[--color-bg-base]' 
                  : 'bg-[--color-surface-2] hover:bg-white hover:text-black border border-[--color-border-strong] text-[--color-text-primary]'
              }`}>
                <span>{plan.buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
