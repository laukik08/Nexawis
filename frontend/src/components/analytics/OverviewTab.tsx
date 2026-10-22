import { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  BarChart3, 
  Cpu, 
  Sparkles,
  Info,
  BrainCircuit
} from 'lucide-react';
import type { FullAnalyticsPayload } from '../../types/analytics';
import { useTheme } from '../../context/ThemeContext';

interface OverviewTabProps {
  data: FullAnalyticsPayload;
}

export function OverviewTab({ data }: OverviewTabProps) {
  const { theme } = useTheme();
  const [distributionDimension, setDistributionDimension] = useState<'byDepartment' | 'byRole' | 'byAvailability' | 'byWorkload'>('byDepartment');

  const chartTheme = {
    textColor: theme === 'dark' ? '#8db3bd' : '#577682',
    gridColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    tooltipBg: 'var(--color-surface-2)',
    tooltipBorder: 'var(--color-border-subtle)',
    cyanArea: 'var(--color-accent-cyan)',
    limeArea: 'var(--color-accent-lime)'
  };

  const currentDistribution = data.workforceDistribution[distributionDimension] || [];
  const totalEmployeesInDistribution = currentDistribution.reduce((acc, slice) => acc + slice.value, 0);

  return (
    <div className="space-y-6">
      
      {/* Row 1: Dual Macro Trends (Workforce Intelligence Trend & Project Success Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart A: Workforce Intelligence Trend */}
        <div 
          className="card-base p-6 rounded-2xl border flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-surface-1)',
            borderColor: 'var(--color-border-subtle)'
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[--color-accent-cyan]" />
                <h3 
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Workforce Intelligence Trend (AWIS)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[--color-surface-2] text-[--color-accent-cyan]">
                Scale: 0-100
              </span>
            </div>
            <p className="text-xs text-[--color-text-secondary] mb-4">
              Composite alignment score over time based on 9 AWIS intelligence dimensions.
            </p>
          </div>

          <div className="h-64 w-full">
            {data.awisTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.awisTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="awisGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: chartTheme.textColor, fontSize: 11 }} 
                    dy={8}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: chartTheme.textColor, fontSize: 11 }}
                    domain={[70, 100]}
                  />
                  <ReferenceLine y={85} stroke="#16a34a" strokeDasharray="3 3" label={{ value: 'Target: 85', fill: '#16a34a', fontSize: 10, position: 'insideTopRight' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartTheme.tooltipBg, 
                      borderColor: chartTheme.tooltipBorder,
                      borderRadius: '12px',
                      color: 'var(--color-text-primary)',
                      boxShadow: 'var(--shadow-premium-soft)'
                    }}
                    itemStyle={{ color: 'var(--color-accent-cyan)', fontWeight: 'bold' }}
                    formatter={(val: any) => [`${val}/100`, 'AWIS Score']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#0284c7" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#awisGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl border-[--color-border-subtle]">
                <BrainCircuit className="w-8 h-8 text-[--color-text-muted] mb-2 opacity-50" />
                <span className="text-sm font-semibold text-[--color-text-primary]">Insufficient Historical Trend Data</span>
                <span className="text-xs text-[--color-text-muted] mt-1 max-w-xs">
                  No candidate AWIS evaluations recorded in the active filter timeframe.
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[--color-border-subtle] flex items-center justify-between text-xs text-[--color-text-muted]">
            <span>Active Range: {data.awisTrend.length} data periods</span>
            <span className="font-semibold text-[--color-accent-cyan]">
              Latest Index: {data.awisTrend.length > 0 ? (data.awisTrend[data.awisTrend.length - 1]?.value ?? 'N/A') : 'N/A'}
            </span>
          </div>
        </div>

        {/* Chart B: Project Performance Trend (Demo data) */}
        <div 
          className="card-base p-6 rounded-2xl border flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-surface-1)',
            borderColor: 'var(--color-border-subtle)'
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[--color-accent-lime]" />
                <h3 
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Portfolio Performance & Success Index
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[--color-surface-2] text-amber-400">
                Cohort Metric
              </span>
            </div>
            <p className="text-xs text-[--color-text-secondary] mb-4">
              Estimated project execution velocity and delivery probability across cohorts.
            </p>
          </div>

          <div className="h-64 w-full">
            {data.projectPerformanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.projectPerformanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: chartTheme.textColor, fontSize: 11 }}
                    dy={8}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: chartTheme.textColor, fontSize: 11 }}
                    domain={[70, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartTheme.tooltipBg, 
                      borderColor: chartTheme.tooltipBorder,
                      borderRadius: '12px',
                      color: 'var(--color-text-primary)',
                      boxShadow: 'var(--shadow-premium-soft)'
                    }}
                    itemStyle={{ color: 'var(--color-accent-lime)', fontWeight: 'bold' }}
                    formatter={(val: any) => [`${val}%`, 'Cohort Success Index']}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#16a34a" 
                    radius={[6, 6, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl border-[--color-border-subtle]">
                <BarChart3 className="w-8 h-8 text-[--color-text-muted] mb-2 opacity-50" />
                <span className="text-sm font-semibold text-[--color-text-primary]">Insufficient Portfolio Trend Data</span>
                <span className="text-xs text-[--color-text-muted] mt-1 max-w-xs">
                  No project execution cohorts created in the active filter timeframe.
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[--color-border-subtle] flex items-center justify-between text-xs text-[--color-text-muted]">
            <span>Portfolio Success Benchmark: &gt;88%</span>
            <span className="font-semibold text-[--color-accent-lime]">
              Current Avg: {data.projectPerformanceTrend.length > 0 ? `${data.projectPerformanceTrend[data.projectPerformanceTrend.length - 1]?.value}%` : 'N/A'}
            </span>
          </div>
        </div>

      </div>

      {/* Row 2: Distribution & Capacity (Workforce Distribution Donut & Workload Tiers) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart C: Workforce Distribution Donut (1 col) */}
        <div 
          className="card-base p-6 rounded-2xl border flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-surface-1)',
            borderColor: 'var(--color-border-subtle)'
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-400" />
                <h3 
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Workforce Distribution
                </h3>
              </div>
            </div>

            {/* Dimension Selector */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[--color-surface-2] border border-[--color-border-subtle] mb-4">
              <button
                type="button"
                onClick={() => setDistributionDimension('byDepartment')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  distributionDimension === 'byDepartment' ? 'bg-[--color-surface-1] text-[--color-text-primary] shadow-sm' : 'text-[--color-text-secondary]'
                }`}
              >
                Department
              </button>
              <button
                type="button"
                onClick={() => setDistributionDimension('byRole')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  distributionDimension === 'byRole' ? 'bg-[--color-surface-1] text-[--color-text-primary] shadow-sm' : 'text-[--color-text-secondary]'
                }`}
              >
                Role
              </button>
              <button
                type="button"
                onClick={() => setDistributionDimension('byAvailability')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  distributionDimension === 'byAvailability' ? 'bg-[--color-surface-1] text-[--color-text-primary] shadow-sm' : 'text-[--color-text-secondary]'
                }`}
              >
                Availability
              </button>
              <button
                type="button"
                onClick={() => setDistributionDimension('byWorkload')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  distributionDimension === 'byWorkload' ? 'bg-[--color-surface-1] text-[--color-text-primary] shadow-sm' : 'text-[--color-text-secondary]'
                }`}
              >
                Workload
              </button>
            </div>
          </div>

          {/* Donut Chart with Center Label */}
          <div className="relative h-52 w-full flex items-center justify-center">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <span className="text-2xl font-display font-bold text-[--color-text-primary]">
                {totalEmployeesInDistribution}
              </span>
              <span className="text-[10px] text-[--color-text-muted] uppercase tracking-wider font-semibold">
                Headcount
              </span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {currentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: chartTheme.tooltipBg, 
                    borderColor: chartTheme.tooltipBorder,
                    borderRadius: '12px',
                    color: 'var(--color-text-primary)',
                    boxShadow: 'var(--shadow-premium-soft)'
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                  formatter={(val: any) => [`${val} (${Math.round((Number(val) / (totalEmployeesInDistribution || 1)) * 100)}%)`, 'Members']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {currentDistribution.map((slice, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                  <span className="text-[--color-text-secondary] truncate">{slice.name}</span>
                </div>
                <div className="font-semibold text-[--color-text-primary] shrink-0 font-mono text-[11px]">
                  {slice.value} ({slice.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart D: Team Effectiveness (2 cols) */}
        <div 
          className="lg:col-span-2 card-base p-6 rounded-2xl border flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-surface-1)',
            borderColor: 'var(--color-border-subtle)'
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[--color-accent-cyan]" />
                <h3 
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Team Effectiveness Across Projects
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[--color-surface-2] text-[--color-text-muted]">
                Synergy Comparison
              </span>
            </div>
            <p className="text-xs text-[--color-text-secondary] mb-4">
              Comparing average team-fit scores across relevant project formations to identify roster alignment strengths.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.teamEffectiveness} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis 
                  type="number" 
                  domain={[60, 100]} 
                  tick={{ fill: chartTheme.textColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  dataKey="projectName" 
                  type="category" 
                  width={130}
                  tick={{ fill: chartTheme.textColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: chartTheme.tooltipBg, 
                    borderColor: chartTheme.tooltipBorder,
                    borderRadius: '12px',
                    color: 'var(--color-text-primary)',
                    boxShadow: 'var(--shadow-premium-soft)'
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                  formatter={(val: any) => [`${val}% Fit`, 'Team Synergy']}
                />
                <Bar 
                  dataKey="teamFit" 
                  radius={[0, 6, 6, 0]}
                  fill="#0284c7"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-[--color-border-subtle] flex items-center justify-between text-xs text-[--color-text-muted]">
            <span>Optimal Zone: &gt;90% Fit</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[--color-accent-cyan]" />
                <span>Active Formations</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Workload and Capacity Visual Breakdown (Chart E) */}
      <div 
        className="card-base p-6 rounded-2xl border"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-subtle)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <h3 
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Workload & Capacity Distribution
            </h3>
          </div>

          <span className="text-xs text-[--color-text-muted] flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>Optimal operating capacity is between 50% and 80%</span>
          </span>
        </div>

        {/* Capacity Stack Bar */}
        <div className="space-y-4">
          <div className="h-6 w-full rounded-xl overflow-hidden flex bg-[--color-surface-3] p-0.5">
            {data.workloadCapacity.map((tier) => (
              <div 
                key={tier.tier}
                style={{
                  width: `${tier.percentage}%`,
                  backgroundColor: tier.color
                }}
                className="h-full first:rounded-l-lg last:rounded-r-lg transition-all"
                title={`${tier.label}: ${tier.employeeCount} (${tier.percentage}%)`}
              />
            ))}
          </div>

          {/* Tier Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {data.workloadCapacity.map((tier) => (
              <div 
                key={tier.tier}
                className="p-4 rounded-xl border flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border-subtle)'
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[--color-text-primary] flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                      <span>{tier.label}</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[--color-surface-3] text-[--color-text-muted]">
                      {tier.rangeLabel}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-2xl font-display font-bold text-[--color-text-primary]">
                      {tier.employeeCount}
                    </span>
                    <span className="text-xs text-[--color-text-muted]">
                      ({tier.percentage}%)
                    </span>
                  </div>

                  <p className="text-[11px] text-[--color-text-secondary] leading-relaxed">
                    {tier.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
