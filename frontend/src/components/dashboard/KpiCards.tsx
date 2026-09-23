import { Users, Briefcase, Activity, HeartPulse } from 'lucide-react';
import { dashboardData } from '../../data/mockDashboard';
import { motion } from 'framer-motion';

const iconMap = {
  total_employees: Users,
  active_projects: Briefcase,
  awis_score: Activity,
  workforce_health: HeartPulse
};

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {dashboardData.kpis.map((kpi, index) => {
        const Icon = iconMap[kpi.id as keyof typeof iconMap] || Activity;
        const isPositive = kpi.trendUp;
        
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            key={kpi.id} 
            className="card-base p-6 relative overflow-hidden group hover:border-[--color-border-strong] transition-colors"
          >
            {/* Subtle Accent Glow */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[--color-accent-cyan] blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-xs font-bold tracking-wider text-[--color-text-secondary]">{kpi.label}</span>
              <div className="p-2 bg-[--color-surface-2] rounded-lg border border-[--color-border-subtle]">
                <Icon className="w-4 h-4 text-[--color-text-primary]" />
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="text-3xl font-display font-bold text-[--color-text-primary] mb-2">{kpi.value}</div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-[--color-accent-lime]/10 text-[--color-accent-lime] border border-[--color-accent-lime]/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
                  {kpi.trend}
                </span>
                <span className="text-xs text-[--color-text-muted]">{kpi.subtext}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
