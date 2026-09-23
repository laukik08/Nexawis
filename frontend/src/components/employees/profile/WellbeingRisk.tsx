import type { Employee } from '../../../data/mockEmployees';
import { ShieldAlert, Activity, Coffee } from 'lucide-react';
import clsx from 'clsx';

interface WellbeingRiskProps {
  employee: Employee;
}

export function WellbeingRisk({ employee }: WellbeingRiskProps) {
  const isHighRisk = employee.wellbeingRisk === 'High';
  const isModerateRisk = employee.wellbeingRisk === 'Moderate';
  
  const riskColor = isHighRisk 
    ? 'text-red-400' 
    : isModerateRisk 
      ? 'text-[--color-accent-cyan]' 
      : 'text-[--color-accent-lime]';

  const riskBorder = isHighRisk 
    ? 'border-red-400' 
    : isModerateRisk 
      ? 'border-[--color-accent-cyan]' 
      : 'border-[--color-accent-lime]';

  const riskBg = isHighRisk 
    ? 'bg-red-400/10' 
    : isModerateRisk 
      ? 'bg-[--color-accent-cyan]/10' 
      : 'bg-[--color-accent-lime]/10';

  return (
    <div className={`card-base p-6 md:p-8 flex flex-col h-full border-t-2 ${riskBorder}`}>
      <div className="flex items-center space-x-2 mb-6">
        <ShieldAlert className={clsx("w-5 h-5", riskColor)} />
        <h3 className="font-bold text-[--color-text-primary]">Wellbeing & Risk</h3>
      </div>
      
      <div className="flex items-center space-x-6 mb-8">
        <div className={clsx("w-20 h-20 rounded-full border-4 flex items-center justify-center shrink-0", riskBorder, riskBg)}>
          <Activity className={clsx("w-8 h-8", riskColor)} />
        </div>
        <div>
          <div className={clsx("text-2xl font-bold font-display tracking-tight mb-1", riskColor)}>
            {employee.wellbeingRisk} Risk
          </div>
          <div className="text-sm text-[--color-text-secondary]">
            {isHighRisk 
              ? 'Intervention recommended to prevent burnout.' 
              : isModerateRisk 
                ? 'Monitor workload and schedule regular check-ins.' 
                : 'Healthy workload and rest balance maintained.'}
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-auto">
        <div className="flex justify-between items-center p-3 rounded-lg bg-[--color-surface-2] border border-[--color-border-subtle]">
          <div className="flex items-center space-x-2 text-sm text-[--color-text-secondary] font-medium">
            <Coffee className="w-4 h-4 text-[--color-text-muted]" />
            <span>Consecutive Work Days</span>
          </div>
          <span className="font-bold text-[--color-text-primary] font-mono">12 Days</span>
        </div>
        
        <div className="flex justify-between items-center p-3 rounded-lg bg-[--color-surface-2] border border-[--color-border-subtle]">
          <div className="flex items-center space-x-2 text-sm text-[--color-text-secondary] font-medium">
            <Activity className="w-4 h-4 text-[--color-text-muted]" />
            <span>Fatigue Indicator</span>
          </div>
          <span className="font-bold text-[--color-text-primary] font-mono">Elevated</span>
        </div>
      </div>
    </div>
  );
}
