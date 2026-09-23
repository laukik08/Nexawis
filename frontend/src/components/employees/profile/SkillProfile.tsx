import type { Employee } from '../../../data/mockEmployees';
import { Layers } from 'lucide-react';

interface SkillProfileProps {
  employee: Employee;
}

export function SkillProfile({ employee }: SkillProfileProps) {
  const primarySkills = employee.skills.filter(s => s.isPrimary);
  const secondarySkills = employee.skills.filter(s => !s.isPrimary);

  return (
    <div className="card-base p-6 md:p-8 flex flex-col h-full">
      <div className="flex items-center space-x-2 mb-6">
        <Layers className="w-5 h-5 text-[--color-accent-cyan]" />
        <h3 className="font-bold text-[--color-text-primary]">Skills & Capabilities</h3>
      </div>
      
      <div className="space-y-6 flex-1">
        
        {/* Primary Skills */}
        <div>
          <h4 className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-4">Primary Proficiencies</h4>
          <div className="space-y-4">
            {primarySkills.map((skill) => (
              <div key={skill.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-bold text-[--color-text-primary]">{skill.name}</span>
                  <span className="font-mono text-[--color-text-secondary] text-xs">{skill.proficiency}%</span>
                </div>
                <div className="h-2 w-full bg-[--color-surface-2] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[--color-accent-cyan] rounded-full"
                    style={{ width: `${skill.proficiency}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary Skills */}
        {secondarySkills.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-4">Secondary Skills</h4>
            <div className="space-y-4">
              {secondarySkills.map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-[--color-text-secondary]">{skill.name}</span>
                    <span className="font-mono text-[--color-text-muted] text-xs">{skill.proficiency}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[--color-surface-2] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[--color-text-primary] rounded-full opacity-60"
                      style={{ width: `${skill.proficiency}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
