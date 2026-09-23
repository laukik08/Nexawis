import { useParams } from 'react-router-dom';
import { mockEmployees } from '../../data/mockEmployees';
import { ProfileHeader } from '../../components/employees/profile/ProfileHeader';
import { IntelligenceGrid } from '../../components/employees/profile/IntelligenceGrid';
import { SkillProfile } from '../../components/employees/profile/SkillProfile';
import { PerformanceChart } from '../../components/employees/profile/PerformanceChart';
import { CapacityWorkload } from '../../components/employees/profile/CapacityWorkload';
import { WellbeingRisk } from '../../components/employees/profile/WellbeingRisk';
import { AwisInsight } from '../../components/employees/profile/AwisInsight';
import { CurrentProjects } from '../../components/employees/profile/CurrentProjects';

export function EmployeeProfile() {
  const { id } = useParams();
  
  // Simulated data fetch
  const employee = mockEmployees.find(emp => emp.id === id);

  if (!employee) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold text-[--color-text-primary] mb-2">Employee Not Found</h2>
        <p className="text-[--color-text-secondary]">The employee you are looking for does not exist or you do not have permission to view their profile.</p>
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
