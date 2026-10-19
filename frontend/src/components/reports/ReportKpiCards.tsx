import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Calendar 
} from 'lucide-react';
import type { ReportKpiMetrics } from '../../types/reports';

interface ReportKpiCardsProps {
  kpis: ReportKpiMetrics | null;
  isLoading?: boolean;
}

export function ReportKpiCards({ kpis, isLoading = false }: ReportKpiCardsProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(n => (
          <div 
            key={n} 
            className="card-base p-5 rounded-2xl border animate-pulse flex flex-col justify-between h-32"
            style={{
              backgroundColor: 'var(--color-surface-1)',
              borderColor: 'var(--color-border-subtle)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-20 bg-[var(--color-surface-2)] rounded" />
              <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-2)]" />
            </div>
            <div className="h-7 w-28 bg-[var(--color-surface-2)] rounded my-1" />
            <div className="h-3 w-36 bg-[var(--color-surface-2)] rounded mt-2" />
          </div>
        ))}
      </div>
    );
  }
  const cards = [
    {
      id: 'kpi-total',
      title: 'Total Reports',
      value: kpis.totalReports,
      subtitle: 'Available in library',
      icon: FileText,
      accentColor: 'var(--color-accent-cyan)',
      bgGlow: 'rgba(2, 132, 199, 0.12)'
    },
    {
      id: 'kpi-generated',
      title: 'Reports Generated',
      value: kpis.reportsGenerated,
      subtitle: 'Completed demo audits',
      icon: CheckCircle2,
      accentColor: 'var(--color-accent-lime)',
      bgGlow: 'rgba(22, 163, 74, 0.12)'
    },
    {
      id: 'kpi-scheduled',
      title: 'Scheduled Reports',
      value: kpis.scheduledReports,
      subtitle: 'Active recurring cadence',
      icon: Clock,
      accentColor: '#a855f7',
      bgGlow: 'rgba(168, 85, 247, 0.12)'
    },
    {
      id: 'kpi-latest',
      title: 'Latest Report',
      value: kpis.latestReportDate,
      subtitle: kpis.latestReportName,
      icon: Calendar,
      accentColor: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.12)',
      isDate: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            className="card-base p-5 rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--color-surface-1)',
              borderColor: 'var(--color-border-subtle)'
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span 
                  className="text-xs font-bold uppercase tracking-wider text-[--color-text-secondary]"
                >
                  {card.title}
                </span>

                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: card.bgGlow,
                    color: card.accentColor
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mb-2">
                <span 
                  className={`${card.isDate ? 'text-2xl' : 'text-3xl'} font-display font-bold tracking-tight text-[--color-text-primary]`}
                >
                  {card.value}
                </span>
              </div>
            </div>

            <div 
              className="pt-2.5 border-t border-[--color-border-subtle] text-xs text-[--color-text-muted] truncate"
              title={card.subtitle}
            >
              {card.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
