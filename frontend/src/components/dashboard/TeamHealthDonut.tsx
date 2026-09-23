import { dashboardData } from '../../data/mockDashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export function TeamHealthDonut() {
  const total = dashboardData.teamHealthDistribution.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="card-base p-6 h-full flex flex-col">
      <h3 className="text-sm font-bold tracking-wider text-[--color-text-secondary] uppercase mb-1">Team Health</h3>
      <p className="text-xs text-[--color-text-muted] mb-6">Based on burnout probability and workload</p>
      
      <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 mt-2">
          <span className="text-3xl font-display font-bold text-[--color-text-primary]">{total}</span>
          <span className="text-xs text-[--color-text-muted] uppercase tracking-wider">Employees</span>
        </div>
        
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dashboardData.teamHealthDistribution}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {dashboardData.teamHealthDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip 
              contentStyle={{ 
                backgroundColor: 'var(--color-surface-2)', 
                borderColor: 'var(--color-border-strong)',
                borderRadius: '12px',
                color: 'var(--color-text-primary)',
                boxShadow: 'var(--shadow-premium-soft)'
              }}
              itemStyle={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        {dashboardData.teamHealthDistribution.map((item, i) => (
          <div key={i} className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-[--color-text-secondary]">{item.name}</span>
            <span className="text-xs font-bold text-[--color-text-primary]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
