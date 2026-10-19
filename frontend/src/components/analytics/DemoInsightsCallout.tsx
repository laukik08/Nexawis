import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight,
  Info 
} from 'lucide-react';
import type { DemoInsight } from '../../types/analytics';

interface DemoInsightsCalloutProps {
  insights: DemoInsight[];
}

export function DemoInsightsCallout({ insights }: DemoInsightsCalloutProps) {
  if (insights.length === 0) return null;

  const getIcon = (type: DemoInsight['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'achievement':
        return <CheckCircle2 className="w-4 h-4 text-[--color-accent-lime] shrink-0" />;
      case 'opportunity':
        return <TrendingUp className="w-4 h-4 text-[--color-accent-cyan] shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />;
    }
  };

  const getBorderColor = (type: DemoInsight['type']) => {
    switch (type) {
      case 'warning':
        return 'rgba(245, 158, 11, 0.25)';
      case 'achievement':
        return 'rgba(22, 163, 74, 0.25)';
      case 'opportunity':
        return 'rgba(2, 132, 199, 0.25)';
      default:
        return 'rgba(168, 85, 247, 0.25)';
    }
  };

  return (
    <div 
      className="card-base p-5 rounded-2xl border space-y-4"
      style={{
        backgroundColor: 'var(--color-surface-1)',
        borderColor: 'var(--color-border-subtle)'
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[--color-accent-cyan]" />
          <h3 
            className="text-sm font-display font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Key Intelligence Insights & Anomalies
          </h3>
          <span 
            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'rgba(2, 132, 199, 0.1)',
              color: 'var(--color-accent-cyan)',
              border: '1px solid rgba(2, 132, 199, 0.2)'
            }}
          >
            Demo Insights
          </span>
        </div>

        <span className="text-[11px] text-[--color-text-muted] flex items-center gap-1">
          <Info className="w-3 h-3" />
          <span>Calculated dynamically from current filtered mock records</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl border flex flex-col justify-between transition-all hover:bg-[--color-surface-2]/50"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: getBorderColor(item.type)
            }}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {getIcon(item.type)}
                  <h4 
                    className="text-xs font-bold leading-snug"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {item.title}
                  </h4>
                </div>

                <span 
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 bg-[--color-surface-1] border border-[--color-border-subtle] text-[--color-text-primary]"
                >
                  {item.metricValue}
                </span>
              </div>

              <p 
                className="text-xs leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {item.observation}
              </p>
            </div>

            <div 
              className="mt-3 pt-2.5 border-t flex items-center justify-between text-xs"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              <span className="text-[10px] uppercase font-bold text-[--color-text-muted]">
                {item.metricLabel}
              </span>

              <Link
                to={item.actionUrl}
                className="font-bold text-[--color-accent-cyan] hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>{item.actionLabel}</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
