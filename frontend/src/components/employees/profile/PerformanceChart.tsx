import type { Employee } from '../../../data/mockEmployees';
import { Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../../context/ThemeContext';

interface PerformanceChartProps {
  employee: Employee;
}

export function PerformanceChart({ employee }: PerformanceChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const lineColor = isDark ? '#22d3ee' : '#0284c7'; // cyan-400 : cyan-600
  const textColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

  return (
    <div className="card-base p-6 md:p-8 flex flex-col h-full border-t-2 border-t-[--color-accent-cyan]">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-[--color-accent-cyan]" />
          <h3 className="font-bold text-[--color-text-primary]">Performance History</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-display font-bold text-[--color-text-primary]">{employee.performanceScore}</div>
          <div className="text-[10px] uppercase font-bold text-[--color-text-secondary] tracking-wider">Current Score</div>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={employee.performanceHistory} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: textColor, fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              domain={[60, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: textColor, fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--color-surface-1)', 
                borderColor: 'var(--color-border-strong)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-premium-soft)',
                color: 'var(--color-text-primary)',
                fontWeight: 'bold'
              }}
              itemStyle={{ color: 'var(--color-accent-cyan)' }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke={lineColor} 
              strokeWidth={3}
              dot={{ fill: 'var(--color-surface-1)', stroke: lineColor, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: lineColor, stroke: 'var(--color-surface-1)', strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
