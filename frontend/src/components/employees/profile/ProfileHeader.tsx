import type { Employee } from '../../../data/mockEmployees';
import { Mail, MessageSquare, Briefcase, Calendar, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

interface ProfileHeaderProps {
  employee: Employee;
}

export function ProfileHeader({ employee }: ProfileHeaderProps) {
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
    <div className="mb-8">
      {/* Back Link */}
      <Link 
        to="/app/employees" 
        className="inline-flex items-center space-x-2 text-sm font-bold text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Directory</span>
      </Link>

      <div className="bg-[--color-surface-1] border border-[--color-border-subtle] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        
        {/* Identity */}
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-[--color-surface-2] shadow-xl shrink-0">
            <img src={employee.avatarUrl} alt={employee.name} className="w-full h-full object-cover" />
          </div>
          
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-[--color-text-primary] tracking-tight">{employee.name}</h1>
              <span className={clsx("text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border", getStatusStyle(employee.status))}>
                {employee.status}
              </span>
            </div>
            
            <div className="text-lg text-[--color-text-secondary] font-medium mb-3">
              {employee.role}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[--color-text-muted]">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                <span>{employee.department}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{employee.experienceYears} Years Experience</span>
              </div>
              <div className="font-mono text-xs px-2 py-1 bg-[--color-surface-2] rounded border border-[--color-border-strong] text-[--color-text-secondary]">
                {employee.employeeId}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[--color-surface-2] border border-[--color-border-strong] hover:bg-[--color-border-subtle] text-[--color-text-primary] rounded-xl font-bold transition-colors shadow-sm">
            <MessageSquare className="w-4 h-4" />
            <span>Message</span>
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[--color-text-primary] text-[--color-bg-base] hover:bg-[--color-text-secondary] rounded-xl font-bold transition-colors shadow-lg shadow-[--color-text-primary]/10">
            <Mail className="w-4 h-4" />
            <span>Assign</span>
          </button>
        </div>

      </div>
    </div>
  );
}
