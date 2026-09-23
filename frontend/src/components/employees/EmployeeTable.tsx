import type { Employee } from '../../data/mockEmployees';
import { MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import clsx from 'clsx';

interface EmployeeTableProps {
  employees: Employee[];
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  const navigate = useNavigate();

  const getStatusStyle = (status: Employee['status']) => {
    switch (status) {
      case 'Available': return 'text-[--color-accent-cyan] border-[--color-accent-cyan]/30 bg-[--color-accent-cyan]/10';
      case 'Allocated': return 'text-[--color-text-secondary] border-[--color-border-strong] bg-[--color-surface-2]';
      case 'Overloaded': return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'On Leave': return 'text-[--color-text-muted] border-[--color-border-subtle] bg-transparent';
      default: return 'text-[--color-text-secondary] border-[--color-border-strong] bg-[--color-surface-2]';
    }
  };

  const getRiskStyle = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-[--color-accent-lime]';
      case 'Moderate': return 'text-[--color-accent-cyan]';
      case 'High': return 'text-red-400 font-bold';
      default: return 'text-[--color-text-secondary]';
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    dragState.current.isDown = true;
    dragState.current.startX = e.pageX - scrollRef.current.offsetLeft;
    dragState.current.scrollLeft = scrollRef.current.scrollLeft;
  };

  const onMouseLeave = () => {
    dragState.current.isDown = false;
  };

  const onMouseUp = () => {
    dragState.current.isDown = false;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragState.current.isDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.5;
    scrollRef.current.scrollLeft = dragState.current.scrollLeft - walk;
  };

  return (
    <div 
      ref={scrollRef}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      className="hidden md:block card-base overflow-x-auto no-scrollbar active:cursor-grabbing cursor-grab"
    >
      <table className="w-full text-left border-collapse min-w-[1000px] select-none">
        <thead>
          <tr className="border-b border-[--color-border-subtle] bg-[--color-surface-2]/50">
            <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[--color-text-secondary] whitespace-nowrap">Employee</th>
            <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[--color-text-secondary] whitespace-nowrap">Role</th>
            <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[--color-text-secondary] whitespace-nowrap">Skills</th>
            <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[--color-text-secondary] whitespace-nowrap">Performance</th>
            <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[--color-text-secondary] whitespace-nowrap">Capacity</th>
            <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[--color-text-secondary] whitespace-nowrap">Wellbeing</th>
            <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[--color-text-secondary] whitespace-nowrap">Status</th>
            <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[--color-text-secondary] text-right whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[--color-border-subtle]">
          {employees.map((emp) => (
            <tr 
              key={emp.id} 
              onClick={() => navigate(`/app/employees/${emp.id}`)}
              data-cursor="link"
              className="hover:bg-[--color-surface-2]/50 transition-colors group cursor-pointer"
            >
              {/* Employee Name & Avatar */}
              <td className="py-4 px-6 whitespace-nowrap">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-[--color-surface-2] border border-[--color-border-strong]">
                    <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-[--color-text-primary] group-hover:text-[--color-accent-cyan] transition-colors">{emp.name}</div>
                    <div className="text-xs text-[--color-text-muted]">{emp.employeeId} • {emp.department}</div>
                  </div>
                </div>
              </td>
              
              {/* Role */}
              <td className="py-4 px-6 whitespace-nowrap">
                <div className="text-sm text-[--color-text-secondary] font-medium">{emp.role}</div>
                <div className="text-xs text-[--color-text-muted]">{emp.experienceYears} yrs exp</div>
              </td>

              {/* Skills Tags */}
              <td className="py-4 px-6 min-w-[200px]">
                <div className="flex flex-wrap gap-1.5">
                  {emp.skills.slice(0, 2).map(skill => (
                    <span key={skill.name} className="text-[10px] font-bold px-2 py-0.5 rounded border border-[--color-border-subtle] bg-[--color-surface-2] text-[--color-text-secondary]">
                      {skill.name}
                    </span>
                  ))}
                  {emp.skills.length > 2 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-[--color-text-muted]">
                      +{emp.skills.length - 2}
                    </span>
                  )}
                </div>
              </td>

              {/* Performance Indicator */}
              <td className="py-4 px-6">
                <div className="w-24">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold text-[var(--color-text-primary)]">{emp.performanceScore}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]">
                    <div className="h-full bg-[var(--color-text-primary)] rounded-full" style={{ width: `${emp.performanceScore}%` }} />
                  </div>
                </div>
              </td>

              {/* Capacity Indicator */}
              <td className="py-4 px-6">
                <div className="w-24">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold text-[var(--color-text-primary)]">{emp.availabilityScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]">
                    <div className="h-full bg-[var(--color-accent-lime)] rounded-full" style={{ width: `${emp.availabilityScore}%` }} />
                  </div>
                </div>
              </td>

              {/* Wellbeing */}
              <td className="py-4 px-6 whitespace-nowrap">
                <span className={clsx("text-xs font-bold flex items-center space-x-1.5", getRiskStyle(emp.wellbeingRisk))}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current" />
                  <span>{emp.wellbeingRisk}</span>
                </span>
              </td>

              {/* Status */}
              <td className="py-4 px-6 whitespace-nowrap">
                <span className={clsx("text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border", getStatusStyle(emp.status))}>
                  {emp.status}
                </span>
              </td>

              {/* Actions */}
              <td className="py-4 px-6 text-right">
                <button 
                  onClick={(e) => { e.stopPropagation(); /* handle more actions */ }}
                  className="text-[--color-text-muted] hover:text-[--color-text-primary] p-1.5 rounded-lg hover:bg-[--color-surface-2] transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 shrink-0" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
