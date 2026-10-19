import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ArrowUpDown, 
  Eye, 
  BrainCircuit, 
  ShieldCheck 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import type { WorkforceAnalyticsData } from '../../types/analytics';
import { useTheme } from '../../context/ThemeContext';

interface WorkforceTabProps {
  workforce: WorkforceAnalyticsData;
}

export function WorkforceTab({ workforce }: WorkforceTabProps) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState<'All' | 'Low' | 'Moderate' | 'High'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'performance' | 'workload' | 'availability'>('performance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const chartTheme = {
    textColor: theme === 'dark' ? '#8db3bd' : '#577682',
    tooltipBg: 'var(--color-surface-2)',
    tooltipBorder: 'var(--color-border-subtle)'
  };

  const departments = useMemo(() => {
    const list = Array.from(new Set(workforce.tableRows.map(r => r.department)));
    return ['All', ...list];
  }, [workforce.tableRows]);

  const filteredRows = useMemo(() => {
    let rows = workforce.tableRows.filter(row => {
      const matchesSearch = 
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.primarySkill.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = selectedDept === 'All' || row.department === selectedDept;
      const matchesRisk = selectedRisk === 'All' || row.wellbeingRisk === selectedRisk;

      return matchesSearch && matchesDept && matchesRisk;
    });

    rows.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'name') diff = a.name.localeCompare(b.name);
      else if (sortBy === 'performance') diff = a.performanceScore - b.performanceScore;
      else if (sortBy === 'workload') diff = a.workloadScore - b.workloadScore;
      else if (sortBy === 'availability') diff = a.availabilityScore - b.availabilityScore;

      return sortOrder === 'desc' ? -diff : diff;
    });

    return rows;
  }, [workforce.tableRows, searchQuery, selectedDept, selectedRisk, sortBy, sortOrder]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'text-[--color-accent-lime] bg-[--color-accent-lime]/10 border-[--color-accent-lime]/30';
      case 'Moderate':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'High':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  return (
    <div className="space-y-6">

      {/* Row 1: Key Macro Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Total Headcount</span>
          <div className="text-2xl font-display font-bold text-[--color-text-primary] mt-1">{workforce.totalEmployees}</div>
          <span className="text-[11px] text-[--color-accent-cyan]">100% active contributors</span>
        </div>

        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Avg Performance</span>
          <div className="text-2xl font-display font-bold text-[--color-text-primary] mt-1">{workforce.avgPerformance}/100</div>
          <span className="text-[11px] text-[--color-accent-lime]">High proficiency band</span>
        </div>

        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Avg Availability</span>
          <div className="text-2xl font-display font-bold text-[--color-text-primary] mt-1">{workforce.avgAvailability}%</div>
          <span className="text-[11px] text-[--color-text-secondary]">Available sprint capacity</span>
        </div>

        <div className="card-base p-4 rounded-xl border border-[--color-border-subtle]">
          <span className="text-[10px] font-bold uppercase text-[--color-text-muted]">Avg Workload</span>
          <div className="text-2xl font-display font-bold text-[--color-text-primary] mt-1">{workforce.avgWorkload}%</div>
          <span className="text-[11px] text-amber-400">Sustainable threshold</span>
        </div>
      </div>

      {/* Row 2: Skill Coverage & Gaps + Wellbeing Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Skill Coverage Analysis (2 cols) */}
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
                <BrainCircuit className="w-4 h-4 text-[--color-accent-cyan]" />
                <h3 
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Skill Coverage & Demand Gap Analysis
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[--color-surface-2] text-[--color-text-muted]">
                Top Technical Competencies
              </span>
            </div>
            <p className="text-xs text-[--color-text-secondary] mb-4">
              Comparing project skill requirements against qualified available employees (proficiency ≥70%).
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workforce.skillCoverage} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: chartTheme.textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="skill" type="category" width={120} tick={{ fill: chartTheme.textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: chartTheme.tooltipBg, 
                    borderColor: chartTheme.tooltipBorder,
                    borderRadius: '12px',
                    color: 'var(--color-text-primary)',
                    boxShadow: 'var(--shadow-premium-soft)'
                  }}
                  formatter={(val: any) => [`${val}% Covered`, 'Coverage Rate']}
                />
                <Bar dataKey="coveragePercent" radius={[0, 6, 6, 0]}>
                  {workforce.skillCoverage.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.coveragePercent < 80 ? '#ef4444' : entry.coveragePercent < 100 ? '#f59e0b' : '#16a34a'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-[--color-border-subtle] flex flex-wrap items-center justify-between gap-2 text-xs text-[--color-text-muted]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" /><span>Healthy (≥100%)</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /><span>Tight (80-99%)</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /><span>Deficit (&lt;80%)</span></span>
            </div>
          </div>
        </div>

        {/* Wellbeing & Burnout Risk Distribution (1 col) */}
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
                Wellbeing & Burnout Risk
              </h3>
            </div>
            <p className="text-xs text-[--color-text-secondary] mb-4">
              Behavioral workload strain classification across the active workforce.
            </p>
          </div>

          <div className="space-y-4 my-auto">
            {workforce.wellbeingDistribution.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[--color-text-primary] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-mono text-[11px] text-[--color-text-muted]">
                    {item.value} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-[--color-surface-3]">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[--color-border-subtle] text-[11px] text-[--color-text-muted]">
            Proactive indicator designed to trigger team rebalancing before crunch periods.
          </div>
        </div>

      </div>

      {/* Row 3: Employee Analytics Table */}
      <div 
        className="card-base p-6 rounded-2xl border space-y-4"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-subtle)'
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 
              className="text-base font-display font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Workforce Roster Analytics
            </h3>
            <p className="text-xs text-[--color-text-secondary]">
              Detailed performance, capacity, and wellbeing telemetry across all matching personnel.
            </p>
          </div>

          {/* Search & In-Table Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text-muted]" />
              <input
                type="text"
                placeholder="Search name, role, skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary] focus:outline-none"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary] focus:outline-none"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
              ))}
            </select>

            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl text-xs bg-[--color-surface-2] border border-[--color-border-subtle] text-[--color-text-primary] focus:outline-none"
            >
              <option value="All">All Risk Tiers</option>
              <option value="Low">Low Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
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
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-[--color-text-primary]"
                  onClick={() => toggleSort('performance')}
                >
                  <div className="flex items-center gap-1">
                    <span>Performance</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-[--color-text-primary]"
                  onClick={() => toggleSort('workload')}
                >
                  <div className="flex items-center gap-1">
                    <span>Workload</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-[--color-text-primary]"
                  onClick={() => toggleSort('availability')}
                >
                  <div className="flex items-center gap-1">
                    <span>Availability</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Wellbeing Risk</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border-subtle]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[--color-text-muted]">
                    No employees matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((emp) => (
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
                      <div className="text-[11px] text-[--color-text-muted]">{emp.department} • {emp.experienceYears}y exp</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-[--color-accent-lime]">
                      {emp.performanceScore}/100
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full bg-[--color-surface-3] overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={{
                              width: `${emp.workloadScore}%`,
                              backgroundColor: emp.workloadScore > 85 ? '#ef4444' : emp.workloadScore > 70 ? '#f59e0b' : '#16a34a'
                            }} 
                          />
                        </div>
                        <span className="font-mono text-[11px]">{emp.workloadScore}%</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {emp.availabilityScore}%
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRiskBadge(emp.wellbeingRisk)}`}>
                        {emp.wellbeingRisk}
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

        <div className="flex items-center justify-between text-xs text-[--color-text-muted]">
          <span>Showing {filteredRows.length} of {workforce.tableRows.length} employees</span>
          <span>Updated based on active global filters</span>
        </div>
      </div>

    </div>
  );
}
