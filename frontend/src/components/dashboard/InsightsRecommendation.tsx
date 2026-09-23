import { dashboardData } from '../../data/mockDashboard';
import { Sparkles, ArrowRight, CheckCircle2, Lightbulb } from 'lucide-react';

export function InsightsRecommendation() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 relative z-10">
      
      {/* Recent AI Recommendation */}
      <div className="card-elevated p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles className="w-24 h-24 text-[--color-accent-lime]" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-6">
            <Sparkles className="w-5 h-5 text-[--color-accent-lime]" />
            <h2 className="text-lg font-bold text-[--color-text-primary]">Recent AI Recommendation</h2>
          </div>
          
          <div className="mb-6 pb-6 border-b border-[--color-border-subtle]">
            <div className="text-xs font-bold uppercase tracking-wider text-[--color-text-muted] mb-1">Project Alpha</div>
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-xl font-bold text-[--color-text-primary]">Recommended Team</h3>
                <div className="text-sm text-[--color-text-secondary]">8 members optimized for delivery</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-display font-bold text-[--color-accent-lime]">92.4</div>
                <div className="text-[10px] uppercase tracking-wider text-[--color-text-muted]">Team Fit</div>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <div className="text-sm font-bold text-[--color-text-primary] mb-4">Why this team?</div>
            <ul className="space-y-3">
              {[
                "Strong skill compatibility across required vectors",
                "Balanced workload prevents localized burnout",
                "Low burnout risk based on historical pacing",
                "Relevant experience in similar past projects"
              ].map((reason, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-[--color-accent-cyan] shrink-0 mt-0.5" />
                  <span className="text-sm text-[--color-text-secondary] leading-relaxed">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <button data-cursor="link" className="flex items-center space-x-2 text-sm font-bold text-[--color-text-primary] hover:text-[--color-accent-lime] transition-colors group/btn">
            <span>View Recommendation details</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="card-base p-8">
        <div className="flex items-center space-x-2 mb-6">
          <Lightbulb className="w-5 h-5 text-[--color-accent-cyan]" />
          <h2 className="text-lg font-bold text-[--color-text-primary]">Quick Insights</h2>
        </div>
        
        <div className="space-y-4">
          {dashboardData.quickInsights.map((insight, i) => (
            <div key={i} className="p-4 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle] flex items-start space-x-4 group hover:border-[--color-border-strong] transition-colors">
              <div className="w-2 h-2 rounded-full bg-[--color-accent-cyan] mt-2 shrink-0 group-hover:bg-[--color-accent-lime] transition-colors" />
              <p className="text-sm text-[--color-text-secondary] leading-relaxed">
                {insight}
              </p>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
