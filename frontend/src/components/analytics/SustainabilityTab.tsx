import { 
  ShieldCheck, 
  HeartPulse, 
  Zap, 
  Scale, 
  Activity, 
  ArrowRight,
  Eye 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SustainabilityAnalyticsData } from '../../types/analytics';

interface SustainabilityTabProps {
  sustainability: SustainabilityAnalyticsData;
}

export function SustainabilityTab({ sustainability }: SustainabilityTabProps) {
  return (
    <div className="space-y-6">

      {/* Row 1: Sustainability Macro KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Workforce Sustainability</span>
          <div className="text-2xl font-display font-bold text-[--color-accent-lime] mt-1">
            {sustainability.sustainabilityIndex}/100
          </div>
          <span className="text-[11px] text-[--color-accent-lime]">Healthy operational tier</span>
        </div>

        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Overallocated Headcount</span>
          <div className="text-2xl font-display font-bold text-amber-400 mt-1">
            {sustainability.overallocatedCount} Members
          </div>
          <span className="text-[11px] text-[--color-text-muted]">{sustainability.overallocatedPercent}% of workforce (&gt;85% load)</span>
        </div>

        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Elevated Burnout Risk</span>
          <div className="text-2xl font-display font-bold text-red-400 mt-1">
            {sustainability.highBurnoutRiskCount} Members
          </div>
          <span className="text-[11px] text-red-400/80">Requires load rebalancing</span>
        </div>

        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Workload Variance</span>
          <div className="text-2xl font-display font-bold text-[--color-text-primary] mt-1">
            ±{sustainability.workloadVariance}%
          </div>
          <span className="text-[11px] text-[--color-text-secondary]">Low inter-team disparity</span>
        </div>
      </div>

      {/* Metric Definitions & Educational Clarifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="p-4 rounded-xl border space-y-2"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border-subtle)'
          }}
        >
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[--color-accent-cyan]" />
            <h4 className="text-xs font-bold text-[--color-text-primary]">
              Utilization vs Workload Balance
            </h4>
          </div>
          <p className="text-[11px] text-[--color-text-secondary] leading-relaxed">
            <strong>Workforce Utilization</strong> represents aggregate billing capacity in use across all teams. <strong>Workload Balance</strong> measures whether that load is distributed evenly across contributors or concentrated into dangerous single-point bottlenecks.
          </p>
        </div>

        <div 
          className="p-4 rounded-xl border space-y-2"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border-subtle)'
          }}
        >
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-[--color-accent-lime]" />
            <h4 className="text-xs font-bold text-[--color-text-primary]">
              Burnout Risk Telemetry
            </h4>
          </div>
          <p className="text-[11px] text-[--color-text-secondary] leading-relaxed">
            Burnout Risk is an algorithmic operational proxy combining sustained consecutive overload, concurrent project context switching, and low recovery buffer. <em>It does not constitute a medical or psychological diagnosis.</em>
          </p>
        </div>

        <div 
          className="p-4 rounded-xl border space-y-2"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border-subtle)'
          }}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold text-[--color-text-primary]">
              Capacity Headroom Buffer
            </h4>
          </div>
          <p className="text-[11px] text-[--color-text-secondary] leading-relaxed">
            High-performing engineering teams maintain 15-20% unallocated headroom. This buffer absorbs production incidents, supports code reviews, and prevents unplanned crunch cascades.
          </p>
        </div>
      </div>

      {/* Row 2: Department Sustainability Matrix & Workload Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department Workload & Wellbeing Matrix */}
        <div 
          className="card-base p-6 rounded-2xl border flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-surface-1)',
            borderColor: 'var(--color-border-subtle)'
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-[--color-accent-cyan]" />
              <h3 
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Department Strain & Wellbeing Matrix
              </h3>
            </div>
            <p className="text-xs text-[--color-text-secondary] mb-4">
              Comparing average workload utilization and risk counts across departments.
            </p>
          </div>

          <div className="space-y-4 my-auto">
            {sustainability.departmentBurnoutRisks.map((dept) => (
              <div 
                key={dept.department}
                className="p-3.5 rounded-xl border space-y-2"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border-subtle)'
                }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[--color-text-primary]">{dept.department}</span>
                  <span className="font-mono text-[11px] font-semibold text-[--color-text-secondary]">
                    Avg Load: <span className={dept.avgWorkload > 80 ? 'text-amber-400' : 'text-[--color-accent-lime]'}>{dept.avgWorkload}%</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-[--color-accent-lime]/10 text-[--color-accent-lime] border border-[--color-accent-lime]/25">
                    {dept.low} Low Risk
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/25">
                    {dept.moderate} Moderate
                  </span>
                  {dept.high > 0 && (
                    <span className="px-2 py-0.5 rounded bg-red-400/10 text-red-400 border border-red-400/25">
                      {dept.high} High Strain
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[--color-border-subtle] text-xs text-[--color-text-muted]">
            Proactive rebalancing recommended for departments averaging &gt;75% workload.
          </div>
        </div>

        {/* Capacity Buffer Tiers */}
        <div 
          className="card-base p-6 rounded-2xl border flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-surface-1)',
            borderColor: 'var(--color-border-subtle)'
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-[--color-accent-lime]" />
              <h3 
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Capacity Health Tiers
              </h3>
            </div>
            <p className="text-xs text-[--color-text-secondary] mb-4">
              Workforce distribution across sustainable operational boundaries.
            </p>
          </div>

          <div className="space-y-4 my-auto">
            {sustainability.workloadTiers.map((tier) => (
              <div key={tier.tier} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[--color-text-primary] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                    <span>{tier.label} ({tier.rangeLabel})</span>
                  </span>
                  <span className="font-mono text-[11px] text-[--color-text-muted]">
                    {tier.employeeCount} ({tier.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-[--color-surface-3]">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${tier.percentage}%`,
                      backgroundColor: tier.color
                    }}
                  />
                </div>
                <p className="text-[10px] text-[--color-text-muted]">{tier.description}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[--color-border-subtle] text-xs text-[--color-text-muted]">
            NEXAWIS automatically penalizes high-strain assignments in Team Formation.
          </div>
        </div>

      </div>

      {/* Row 3: At-Risk Workforce Rebalance Recommendations */}
      <div 
        className="card-base p-6 rounded-2xl border space-y-4"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-subtle)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 
              className="text-base font-display font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Priority Workforce Rebalancing Registry
            </h3>
            <p className="text-xs text-[--color-text-secondary]">
              Personnel currently operating with elevated workload or multiple concurrent sprint allocations.
            </p>
          </div>

          <Link
            to="/app/teams"
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Open Re-balance Mode</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[--color-border-subtle]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr 
                className="border-b text-[10px] uppercase font-bold tracking-wider"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text-muted)'
                }}
              >
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4">Workload %</th>
                <th className="py-3 px-4">Active Projects</th>
                <th className="py-3 px-4">Wellbeing Risk</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border-subtle]">
              {sustainability.atRiskEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[--color-accent-lime]">
                    ✨ Excellent: No employees currently operate above safe threshold limits.
                  </td>
                </tr>
              ) : (
                sustainability.atRiskEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[--color-surface-2]/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={emp.avatarUrl} 
                          alt={emp.name} 
                          className="w-8 h-8 rounded-full object-cover border border-[--color-border-subtle]" 
                        />
                        <div>
                          <div className="font-bold text-[--color-text-primary]">{emp.name}</div>
                          <span className="text-[10px] font-mono text-[--color-text-muted]">{emp.employeeId}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-[--color-text-primary]">{emp.role}</div>
                      <div className="text-[11px] text-[--color-text-muted]">{emp.department}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full bg-[--color-surface-3] overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={{
                              width: `${emp.workloadScore}%`,
                              backgroundColor: emp.workloadScore > 85 ? '#ef4444' : '#f59e0b'
                            }} 
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-red-400">{emp.workloadScore}%</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {emp.activeProjectsCount} Project(s)
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-red-400 bg-red-400/10 border-red-400/30">
                        {emp.wellbeingRisk} Strain
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/app/employees/${emp.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[--color-surface-2] text-[--color-accent-cyan] font-bold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
