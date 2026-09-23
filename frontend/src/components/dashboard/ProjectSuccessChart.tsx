import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { dashboardData } from '../../data/mockDashboard';
import { useTheme } from '../../context/ThemeContext';

export function ProjectSuccessChart() {
  const { theme } = useTheme();
  
  // Design tokens for charts
  const colors = {
    area: theme === 'dark' ? '#8db3bd' : '#14313f', // text-secondary / dark-slate
    areaFill: theme === 'dark' ? 'rgba(141, 179, 189, 0.1)' : 'rgba(20, 49, 63, 0.05)',
    grid: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    text: theme === 'dark' ? '#8db3bd' : '#577682',
    target: theme === 'dark' ? '#e8f39a' : '#14313f', // lime / teal
  };

  return (
    <div className="card-base p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-bold tracking-wider text-[--color-text-secondary] uppercase mb-1">Project Success Trend</h3>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-display font-bold text-[--color-text-primary]">94%</span>
            <span className="text-xs font-bold text-[--color-accent-lime]">+3% vs prev</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dashboardData.projectSuccessTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.area} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={colors.area} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: colors.text, fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: colors.text, fontSize: 12 }}
              domain={[60, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--color-surface-2)', 
                borderColor: 'var(--color-border-strong)',
                borderRadius: '12px',
                color: 'var(--color-text-primary)',
                boxShadow: 'var(--shadow-premium-soft)'
              }}
              itemStyle={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}
            />
            <ReferenceLine y={85} stroke={colors.target} strokeDasharray="3 3" strokeOpacity={0.5} />
            <Area 
              type="monotone" 
              dataKey="success" 
              stroke={colors.area} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#successGradient)" 
              activeDot={{ r: 6, fill: 'var(--color-bg-base)', stroke: colors.area, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
