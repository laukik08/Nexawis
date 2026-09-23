import type { Employee } from '../../data/mockEmployees';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';

interface EmployeeCardsProps {
  employees: Employee[];
}

export function EmployeeCards({ employees }: EmployeeCardsProps) {
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

  return (
    <div className="md:hidden space-y-4">
      {employees.map((emp) => (
        <div 
          key={emp.id}
          onClick={() => navigate(`/app/employees/${emp.id}`)}
          className="card-base p-5 space-y-4 hover:border-[--color-accent-cyan]/50 transition-colors cursor-pointer"
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[--color-surface-2] border border-[--color-border-strong] shrink-0">
                <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-bold text-[--color-text-primary] text-base">{emp.name}</div>
                <div className="text-xs text-[--color-text-secondary]">{emp.role}</div>
              </div>
            </div>
            <span className={clsx("text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border shrink-0", getStatusStyle(emp.status))}>
              {emp.status}
            </span>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm bg-[--color-surface-2]/50 p-3 rounded-xl border border-[--color-border-subtle]">
            <div>
              <div className="text-[--color-text-muted] text-[10px] uppercase tracking-wider font-bold mb-1">Performance</div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[--color-text-primary]">{emp.performanceScore}</span>
                <div className="w-12 h-1 bg-[--color-surface-2] rounded-full overflow-hidden border border-[--color-border-subtle]">
                  <div className="h-full bg-[--color-text-primary]" style={{ width: `${emp.performanceScore}%` }} />
                </div>
              </div>
            </div>
            <div>
              <div className="text-[--color-text-muted] text-[10px] uppercase tracking-wider font-bold mb-1">Availability</div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[--color-text-primary]">{emp.availabilityScore}%</span>
                <div className="w-12 h-1 bg-[--color-surface-2] rounded-full overflow-hidden border border-[--color-border-subtle]">
                  <div className="h-full bg-[--color-accent-lime]" style={{ width: `${emp.availabilityScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Skills (Top 3) */}
          <div>
            <div className="flex flex-wrap gap-1.5">
              {emp.skills.slice(0, 3).map(skill => (
                <span key={skill.name} className="text-[10px] font-bold px-2 py-1 rounded border border-[--color-border-subtle] bg-[--color-surface-2] text-[--color-text-secondary]">
                  {skill.name}
                </span>
              ))}
              {emp.skills.length > 3 && (
                <span className="text-[10px] font-bold px-1.5 py-1 rounded text-[--color-text-muted]">
                  +{emp.skills.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex justify-between items-center border-t border-[--color-border-subtle]">
            <div className="text-xs text-[--color-text-muted]">
              {emp.department} • {emp.experienceYears} yrs exp
            </div>
            <div className="flex items-center text-xs font-bold text-[--color-accent-cyan]">
              View Profile
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
          
        </div>
      ))}
    </div>
  );
}
