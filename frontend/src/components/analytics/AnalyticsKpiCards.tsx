import { 
  BrainCircuit, 
  Cpu, 
  Users2, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Info 
} from 'lucide-react';
import type { AnalyticsKpiSummary, KpiMetric } from '../../types/analytics';

interface AnalyticsKpiCardsProps {
  kpis: AnalyticsKpiSummary;
}

export function AnalyticsKpiCards({ kpis }: AnalyticsKpiCardsProps) {
  const cards: Array<{
    metric: KpiMetric;
    icon: typeof BrainCircuit;
    accentColor: string;
    bgGlow: string;
    progressPercent: number;
  }> = [
    {
      metric: kpis.averageAwisScore,
      icon: BrainCircuit,
      accentColor: 'var(--color-accent-cyan)',
      bgGlow: 'rgba(2, 132, 199, 0.12)',
      progressPercent: typeof kpis.averageAwisScore.value === 'number' ? kpis.averageAwisScore.value : 88.4
    },
    {
      metric: kpis.workforceUtilization,
      icon: Cpu,
      accentColor: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.12)',
      progressPercent: typeof kpis.workforceUtilization.value === 'number' ? kpis.workforceUtilization.value : 76
    },
    {
      metric: kpis.averageTeamFit,
      icon: Users2,
      accentColor: 'var(--color-accent-lime)',
      bgGlow: 'rgba(22, 163, 74, 0.12)',
      progressPercent: typeof kpis.averageTeamFit.value === 'number' ? kpis.averageTeamFit.value : 91.8
    },
    {
      metric: kpis.workforceSustainability,
      icon: ShieldCheck,
      accentColor: '#a855f7',
      bgGlow: 'rgba(168, 85, 247, 0.12)',
      progressPercent: typeof kpis.workforceSustainability.value === 'number' ? kpis.workforceSustainability.value : 94.6
    }
  ];

  return (
    <div className="space-y-2">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ metric, icon: Icon, accentColor, bgGlow, progressPercent }) => {
          const isUp = metric.changeDirection === 'up';
          const isPositive = (isUp && metric.id !== 'kpi-utilization') || (!isUp && metric.id === 'kpi-utilization');

          return (
            <div 
              key={metric.id}
              className="card-base p-5 rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--color-surface-1)',
                borderColor: 'var(--color-border-subtle)'
              }}
            >
              <div>
                {/* Header: Icon & Title */}
                <div className="flex items-center justify-between mb-3">
                  <span 
                    className="text-xs font-bold uppercase tracking-wider line-clamp-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {metric.title}
                  </span>

                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: bgGlow,
                      color: accentColor
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Main Metric Value */}
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span 
                    className="text-3xl font-display font-bold tracking-tight"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {metric.value}
                  </span>
                  {metric.unit && (
                    <span 
                      className="text-xs font-semibold"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {metric.unit}
                    </span>
                  )}
                </div>

                {/* Progress bar visual indicator */}
                <div 
                  className="w-full h-1.5 rounded-full overflow-hidden mb-3"
                  style={{ backgroundColor: 'var(--color-surface-3)' }}
                >
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(5, progressPercent))}%`,
                      backgroundColor: accentColor
                    }}
                  />
                </div>
              </div>

              {/* Footer: Trend & Benchmark */}
              <div 
                className="pt-2.5 border-t flex items-center justify-between gap-2 text-xs"
                style={{ borderColor: 'var(--color-border-subtle)' }}
              >
                <div className="flex items-center gap-1 font-semibold">
                  {isUp ? (
                    <TrendingUp className={`w-3.5 h-3.5 ${isPositive ? 'text-[--color-accent-lime]' : 'text-amber-400'}`} />
                  ) : (
                    <TrendingDown className={`w-3.5 h-3.5 ${isPositive ? 'text-[--color-accent-lime]' : 'text-red-400'}`} />
                  )}
                  <span className={isPositive ? 'text-[--color-accent-lime]' : 'text-amber-400'}>
                    {metric.changePercent !== undefined ? `${metric.changePercent > 0 ? '+' : ''}${metric.changePercent}%` : ''}
                  </span>
                  <span className="text-[11px] text-[--color-text-muted] truncate">
                    {metric.changeLabel}
                  </span>
                </div>

                {metric.benchmark && (
                  <span 
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded text-[--color-text-muted]"
                    style={{ backgroundColor: 'var(--color-surface-2)' }}
                    title={metric.description}
                  >
                    {metric.benchmark}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle Demo Data Note */}
      <div className="flex items-center justify-end px-1">
        <span 
          className="text-[10px] font-mono text-[--color-text-muted] flex items-center gap-1 opacity-75"
        >
          <Info className="w-3 h-3" />
          <span>Demo Data • Illustrative values calculated from mock dataset until backend integration</span>
        </span>
      </div>
    </div>
  );
}
