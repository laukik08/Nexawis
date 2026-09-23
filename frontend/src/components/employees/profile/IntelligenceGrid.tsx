import type { Employee } from '../../../data/mockEmployees';
import { Target, Zap, ShieldAlert, TrendingUp, Clock, Activity } from 'lucide-react';
import clsx from 'clsx';

interface IntelligenceGridProps {
  employee: Employee;
}

export function IntelligenceGrid({ employee }: IntelligenceGridProps) {
  
  const getWellbeingColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-[--color-accent-lime] border-[--color-accent-lime]';
      case 'Moderate': return 'text-[--color-accent-cyan] border-[--color-accent-cyan]';
      case 'High': return 'text-red-400 border-red-400';
      default: return 'text-[--color-text-secondary] border-[--color-border-strong]';
    }
  };

  const metrics = [
    {
      id: 'performance',
      label: 'Performance',
      value: `${employee.performanceScore}`,
      icon: Target,
      color: 'text-[--color-accent-cyan]',
      subtext: employee.performanceTrend === 'up' ? 'Trending upward' : employee.performanceTrend === 'down' ? 'Declining' : 'Stable performance'
    },
    {
      id: 'availability',
      label: 'Availability',
      value: `${employee.availabilityScore}%`,
      icon: Clock,
      color: 'text-[--color-accent-lime]',
      subtext: 'Current capacity'
    },
    {
      id: 'workload',
      label: 'Workload',
      value: `${employee.workloadScore}%`,
      icon: Zap,
      color: employee.workloadScore > 90 ? 'text-red-400' : 'text-[--color-accent-cyan]',
      subtext: 'Current allocation'
    },
    {
      id: 'wellbeing',
      label: 'Burnout Risk',
      value: employee.wellbeingRisk,
      icon: ShieldAlert,
      color: getWellbeingColor(employee.wellbeingRisk).split(' ')[0], // Extract text color
      subtext: 'Predictive assessment'
    },
    {
      id: 'growth',
      label: 'Growth Potential',
      value: `${employee.growthPotential}`,
      icon: TrendingUp,
      color: 'text-[--color-accent-lime]',
      subtext: 'Trajectory index'
    },
    {
      id: 'fit',
      label: 'AWIS Match',
      value: `${employee.awisFitScore}`,
      icon: Activity,
      color: 'text-[--color-text-primary]',
      subtext: 'Overall organizational fit'
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-[--color-text-primary] tracking-tight mb-4">Intelligence Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric) => (
          <div key={metric.id} className="bg-[--color-surface-1] border border-[--color-border-subtle] rounded-xl p-4 flex flex-col items-start justify-between shadow-sm hover:border-[--color-border-strong] transition-colors group">
            <div className="flex items-center space-x-2 mb-3">
              <metric.icon className={clsx("w-4 h-4", metric.color)} />
              <span className="text-[10px] font-bold text-[--color-text-secondary] uppercase tracking-wider">{metric.label}</span>
            </div>
            <div>
              <div className={clsx("text-2xl font-display font-bold tracking-tight mb-1", metric.color)}>
                {metric.value}
              </div>
              <div className="text-[10px] text-[--color-text-muted] font-medium">
                {metric.subtext}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
