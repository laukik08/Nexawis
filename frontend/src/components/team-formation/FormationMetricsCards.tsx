import { Layers, Users, Zap, HeartHandshake } from 'lucide-react';
import { useTeamFormation } from '../../context/TeamFormationContext';
import { motion } from 'framer-motion';

export function FormationMetricsCards() {
  const { kpiData } = useTeamFormation();

  if (!kpiData) return null;

  const cards = [
    {
      id: 'total_formations',
      label: 'Total Formations',
      value: kpiData.totalFormations.toString(),
      trend: kpiData.totalFormationsTrend,
      icon: Layers,
      accentGlow: 'var(--color-accent-cyan)',
      trendPositive: true
    },
    {
      id: 'teams_created',
      label: 'Teams Created',
      value: kpiData.teamsCreated.toString(),
      trend: kpiData.teamsCreatedTrend,
      icon: Users,
      accentGlow: 'var(--color-accent-lime)',
      trendPositive: true
    },
    {
      id: 'average_team_fit',
      label: 'Average Team Fit',
      value: `${kpiData.averageTeamFit}%`,
      trend: kpiData.averageTeamFitTrend,
      icon: Zap,
      accentGlow: 'var(--color-accent-cyan)',
      trendPositive: true
    },
    {
      id: 'workforce_sustainability',
      label: 'Workforce Sustainability',
      value: `${kpiData.workforceSustainability}%`,
      trend: kpiData.workforceSustainabilityTrend,
      icon: HeartHandshake,
      accentGlow: 'var(--color-accent-lime)',
      trendPositive: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
            className="card-base p-5 relative overflow-hidden group hover:border-[--color-border-strong] transition-all"
          >
            {/* Ambient Background Glow */}
            <div 
              className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-[40px] opacity-15 group-hover:opacity-25 transition-opacity"
              style={{ backgroundColor: card.accentGlow }}
            />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <span 
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {card.label}
              </span>
              <div 
                className="p-2 rounded-xl flex items-center justify-center"
                style={{ 
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border-subtle)'
                }}
              >
                <Icon className="w-4 h-4" style={{ color: 'var(--color-accent-cyan)' }} />
              </div>
            </div>

            <div className="relative z-10">
              <div 
                className="text-3xl font-display font-bold mb-2 tracking-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {card.value}
              </div>
              <div className="flex items-center space-x-2">
                <span 
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: 'rgba(22, 163, 74, 0.12)',
                    color: 'var(--color-accent-lime)',
                    border: '1px solid rgba(22, 163, 74, 0.25)'
                  }}
                >
                  {card.trend}
                </span>
                <span 
                  className="text-[10px] font-medium"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Simulated Metric
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
