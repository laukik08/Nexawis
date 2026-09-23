import type { Employee } from '../../../data/mockEmployees';
import { Hexagon, Plus, Minus, BrainCircuit } from 'lucide-react';

interface AwisInsightProps {
  employee: Employee;
}

export function AwisInsight({ employee }: AwisInsightProps) {
  const { positive, negative, summary } = employee.awisInsights;

  return (
    <div className="card-base p-6 md:p-8 flex flex-col h-full bg-gradient-to-br from-[--color-surface-1] to-[--color-surface-2]">
      <div className="flex items-center space-x-2 mb-6">
        <BrainCircuit className="w-5 h-5 text-[--color-accent-cyan]" />
        <h3 className="font-bold text-[--color-text-primary]">AWIS Employee Insight</h3>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        
        {/* Core Score */}
        <div className="relative w-32 h-32 shrink-0 mx-auto lg:mx-0 flex flex-col items-center justify-center rounded-full bg-[--color-surface-1] border-[4px] border-[--color-accent-cyan] shadow-[0_0_30px_rgba(2,132,199,0.15)]">
          <Hexagon className="absolute inset-0 w-full h-full text-[--color-accent-cyan] opacity-10 transform scale-125 stroke-[1]" />
          <span className="text-4xl font-display font-bold text-[--color-text-primary] z-10">{employee.awisFitScore}</span>
          <span className="text-[10px] uppercase tracking-widest text-[--color-text-secondary] mt-1 z-10 font-bold">Fit Score</span>
        </div>

        {/* Explainability Factors */}
        <div className="flex-1 space-y-4">
          <h4 className="text-sm font-bold text-[--color-text-primary]">Why this matters</h4>
          <p className="text-sm text-[--color-text-secondary] leading-relaxed">
            {summary}
          </p>
          
          <div className="space-y-2 mt-4">
            {positive.map((point, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-0.5 bg-[--color-accent-lime]/20 text-[--color-accent-lime] rounded-full p-0.5 shrink-0">
                  <Plus className="w-3 h-3" />
                </div>
                <span className="text-xs text-[--color-text-primary]">{point}</span>
              </div>
            ))}
            {negative.map((point, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-0.5 bg-red-400/20 text-red-400 rounded-full p-0.5 shrink-0">
                  <Minus className="w-3 h-3" />
                </div>
                <span className="text-xs text-[--color-text-primary]">{point}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
