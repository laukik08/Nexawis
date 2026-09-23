import type { Employee } from '../../../data/mockEmployees';
import { Zap, Clock } from 'lucide-react';

interface CapacityWorkloadProps {
  employee: Employee;
}

export function CapacityWorkload({ employee }: CapacityWorkloadProps) {
  const isOverloaded = employee.workloadScore > 100;
  const utilizedPercent = Math.min(employee.workloadScore, 100);
  const overPercent = isOverloaded ? Math.min(employee.workloadScore - 100, 100) : 0;

  return (
    <div className={`card-base p-6 md:p-8 flex flex-col h-full border-t-2 ${isOverloaded ? 'border-t-red-400' : 'border-t-[--color-accent-lime]'}`}>
      <div className="flex items-center space-x-2 mb-6">
        <Zap className={`w-5 h-5 ${isOverloaded ? 'text-red-400' : 'text-[--color-accent-lime]'}`} />
        <h3 className="font-bold text-[--color-text-primary]">Capacity & Workload</h3>
      </div>
      
      <div className="flex items-end justify-between mb-2">
        <div className={`text-4xl font-display font-bold ${isOverloaded ? 'text-red-400' : 'text-[--color-text-primary]'}`}>
          {employee.workloadScore}%
        </div>
        <div className="text-sm font-bold text-[--color-text-secondary] mb-1 uppercase tracking-wider">Allocated</div>
      </div>
      
      {/* Capacity Bar */}
      <div className="h-4 w-full bg-[--color-surface-2] rounded-full overflow-hidden mb-8 flex border border-[--color-border-subtle]">
        <div className="h-full bg-[--color-accent-lime] transition-all" style={{ width: `${isOverloaded ? 100 - overPercent : utilizedPercent}%` }} />
        {isOverloaded && (
          <div className="h-full bg-red-400 transition-all" style={{ width: `${overPercent}%` }} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-auto">
        <div className="bg-[--color-surface-2] rounded-xl p-4 border border-[--color-border-subtle]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-2">
            <Clock className="w-3 h-3" />
            <span>Available</span>
          </div>
          <div className="text-xl font-bold text-[--color-text-primary]">{employee.availabilityScore}%</div>
        </div>
        <div className="bg-[--color-surface-2] rounded-xl p-4 border border-[--color-border-subtle]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-2">
            <Zap className="w-3 h-3" />
            <span>Overload</span>
          </div>
          <div className={`text-xl font-bold ${isOverloaded ? 'text-red-400' : 'text-[--color-text-primary]'}`}>
            {isOverloaded ? `${employee.workloadScore - 100}%` : '0%'}
          </div>
        </div>
      </div>
    </div>
  );
}
