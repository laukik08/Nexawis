import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import type { Employee } from '../../types/employee';
import { ProfileHeader } from '../../components/employees/profile/ProfileHeader';
import { IntelligenceGrid } from '../../components/employees/profile/IntelligenceGrid';
import { SkillProfile } from '../../components/employees/profile/SkillProfile';
import { PerformanceChart } from '../../components/employees/profile/PerformanceChart';
import { CapacityWorkload } from '../../components/employees/profile/CapacityWorkload';
import { WellbeingRisk } from '../../components/employees/profile/WellbeingRisk';
import { AwisInsight } from '../../components/employees/profile/AwisInsight';
import { CurrentProjects } from '../../components/employees/profile/CurrentProjects';

export function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    employeeService
      .getEmployeeById(id)
      .then((data) => {
        if (isMounted) {
          setEmployee(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = (err as { message?: string })?.message || 'Failed to load employee details.';
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-[--color-accent-cyan] animate-spin" />
        <p className="text-sm text-[--color-text-secondary] font-medium">Loading employee profile...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[50vh] text-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-red-400/10 border border-red-400/30 flex items-center justify-center text-red-400 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-[--color-text-primary] mb-2">Employee Not Found</h2>
        <p className="text-sm text-[--color-text-secondary] mb-6">
          {error || 'The employee you are looking for does not exist or you do not have permission to view their profile.'}
        </p>
        <Link
          to="/app/employees"
          className="inline-flex items-center space-x-2 btn-primary px-5 py-2.5 rounded-xl font-bold text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
      
      {/* 1. Header Area */}
      <ProfileHeader employee={employee} />

      {/* 2. Intelligence Summary Grid */}
      <IntelligenceGrid employee={employee} />

      {/* 3. Deep Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SkillProfile employee={employee} />
        <PerformanceChart employee={employee} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CapacityWorkload employee={employee} />
        <WellbeingRisk employee={employee} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AwisInsight employee={employee} />
        <CurrentProjects employee={employee} />
      </div>

    </div>
  );
}
