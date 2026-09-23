import { useAuth } from '../../context/AuthContext';
import { KpiCards } from '../../components/dashboard/KpiCards';
import { ProjectSuccessChart } from '../../components/dashboard/ProjectSuccessChart';
import { TeamHealthDonut } from '../../components/dashboard/TeamHealthDonut';
import { WorkforceIntelligence } from '../../components/dashboard/WorkforceIntelligence';
import { AwisRadial } from '../../components/dashboard/AwisRadial';
import { ActiveProjects } from '../../components/dashboard/ActiveProjects';
import { InsightsRecommendation } from '../../components/dashboard/InsightsRecommendation';
import { motion } from 'framer-motion';
import { RotateCw } from 'lucide-react';

export function DashboardIndex() {
  const { user } = useAuth();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="pb-12"
    >
      
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[--color-text-primary] tracking-tight mb-2">
            Good morning, {user?.name || 'Alex'}
          </h1>
          <p className="text-[--color-text-secondary]">Here's what's happening across your workforce and projects.</p>
        </div>
        
        <div className="flex items-center space-x-3 self-start md:self-auto">
          <div className="bg-[--color-surface-2] border border-[--color-border-strong] px-4 py-2 rounded-lg text-sm text-[--color-text-secondary] font-medium">
            Last 30 days
          </div>
          <button className="p-2 rounded-lg bg-[--color-surface-2] border border-[--color-border-strong] text-[--color-text-secondary] hover:text-[--color-text-primary] hover:border-[--color-border-subtle] transition-all">
            <RotateCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 1. KPI Cards */}
      <div className="mb-8">
        <KpiCards />
      </div>

      {/* 2. Project Success & Team Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <div className="lg:col-span-2">
          <ProjectSuccessChart />
        </div>
        <div className="lg:col-span-1">
          <TeamHealthDonut />
        </div>
      </div>

      {/* 3. Workforce Intelligence */}
      <div className="mb-12">
        <WorkforceIntelligence />
      </div>

      {/* 4. AWIS Intelligence */}
      <div className="mb-12">
        <AwisRadial />
      </div>

      {/* 5. Active Projects */}
      <div className="mb-12">
        <ActiveProjects />
      </div>

      {/* 6. AI Recommendation & Insights */}
      <div>
        <InsightsRecommendation />
      </div>

    </motion.div>
  );
}
