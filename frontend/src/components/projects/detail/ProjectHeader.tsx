import { useState } from 'react';
import type { Project } from '../../../data/mockProjects';
import { ArrowLeft, Edit, Users, Activity, TrendingUp, Sparkles, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EditProjectModal } from '../EditProjectModal';
import { ManageTeamModal } from '../ManageTeamModal';
import clsx from 'clsx';

interface ProjectHeaderProps {
  project: Project;
  onProjectUpdate?: (updated: Project) => void;
}

export function ProjectHeader({ project, onProjectUpdate }: ProjectHeaderProps) {
  const navigate = useNavigate();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false);

  const getStatusStyle = (status: Project['status']) => {
    switch (status) {
      case 'Planning': return 'text-[--color-text-secondary] border-[--color-border-strong] bg-[--color-surface-2]';
      case 'Active': return 'text-[--color-accent-cyan] border-[--color-accent-cyan]/30 bg-[--color-accent-cyan]/10';
      case 'On Track': return 'text-[--color-accent-lime] border-[--color-accent-lime]/30 bg-[--color-accent-lime]/10';
      case 'At Risk': return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'Completed': return 'text-[--color-text-muted] border-[--color-border-subtle] bg-transparent';
      default: return 'text-[--color-text-secondary] border-[--color-border-strong] bg-[--color-surface-2]';
    }
  };

  // Derive Health Badge & Color
  const healthScore = project.intelligence?.successPrediction?.score || 80;
  const isHealthGood = project.overallRisk === 'Low' && healthScore >= 70;
  const isHealthModerate = project.overallRisk === 'Medium' || (healthScore >= 50 && healthScore < 70);

  // Derive Schedule Status
  const schedulePressure = project.intelligence?.schedulePressure ?? 50;
  const deliveryDelayRisk = project.intelligence?.deliveryDelayRisk ?? 25;
  const isScheduleTight = schedulePressure > 70 || deliveryDelayRisk > 60;

  return (
    <div className="mb-8">
      {/* Back Navigation */}
      <button 
        onClick={() => navigate('/app/projects')}
        className="flex items-center space-x-2 text-xs font-bold text-[--color-text-muted] hover:text-[--color-text-primary] transition-colors mb-6 group w-fit select-none"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Projects Directory</span>
      </button>

      {/* Main Header Area */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-[--color-text-primary] tracking-tight">
              {project.name}
            </h1>
            <span className={clsx("text-[11px] uppercase tracking-wider font-bold px-3 py-1 rounded-lg border", getStatusStyle(project.status))}>
              {project.status}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-xs font-medium text-[--color-text-secondary] flex-wrap">
            <span className="font-mono bg-[--color-surface-2] px-2 py-0.5 rounded border border-[--color-border-subtle] text-[--color-text-primary]">
              {project.projectId}
            </span>
            <div className="w-1 h-1 rounded-full bg-[--color-border-strong]" />
            <span>Department: <strong className="text-[--color-text-primary]">{project.department}</strong></span>
            <div className="w-1 h-1 rounded-full bg-[--color-border-strong]" />
            <span>Priority: <strong className={project.priority === 'Critical' ? 'text-red-400 font-bold' : 'text-[--color-text-primary]'}>{project.priority}</strong></span>
            {project.client && (
              <>
                <div className="w-1 h-1 rounded-full bg-[--color-border-strong]" />
                <span>Client: <strong className="text-[--color-text-primary]">{project.client}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setIsEditOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[--color-surface-1] border border-[--color-border-strong] text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-surface-2] transition-colors font-bold text-xs shadow-sm"
          >
            <Edit className="w-4 h-4 text-[--color-text-muted]" />
            <span>Edit Project</span>
          </button>

          <button 
            onClick={() => setIsManageTeamOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl btn-primary font-bold text-xs"
          >
            <Users className="w-4 h-4" />
            <span>Manage Team</span>
          </button>
        </div>
        
      </div>
      
      {/* KPI Row: Project Health, Progress, Team Fit, and Schedule */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        
        {/* 1. Project Health */}
        <div className="card-base p-5 rounded-2xl flex flex-col justify-between min-h-[148px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[--color-text-muted] uppercase tracking-wider">
              Project Health
            </span>
            <Activity className="w-4 h-4 text-[--color-text-muted]" />
          </div>

          <div className="flex items-center justify-between my-2">
            <span className="text-2xl font-display font-bold text-[--color-text-primary]">
              {healthScore.toFixed(0)}%
            </span>
            <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${
              isHealthGood 
                ? 'bg-[--color-accent-lime]/10 text-[--color-accent-lime] border-[--color-accent-lime]/20' 
                : isHealthModerate 
                ? 'bg-[--color-accent-cyan]/10 text-[--color-accent-cyan] border-[--color-accent-cyan]/20'
                : 'bg-red-400/10 text-red-400 border-red-400/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isHealthGood ? 'bg-[--color-accent-lime]' : isHealthModerate ? 'bg-[--color-accent-cyan]' : 'bg-red-400'
              }`} />
              <span>{isHealthGood ? 'Strong' : isHealthModerate ? 'Moderate' : 'At Risk'}</span>
            </span>
          </div>

          <div>
            <div className="w-full h-1.5 bg-[--color-surface-2] rounded-full overflow-hidden border border-[--color-border-subtle] mb-1.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isHealthGood ? 'bg-[--color-accent-lime]' : isHealthModerate ? 'bg-[--color-accent-cyan]' : 'bg-red-400'
                }`} 
                style={{ width: `${Math.min(100, Math.max(5, healthScore))}%` }} 
              />
            </div>
            <div className="text-[11px] text-[--color-text-secondary] flex items-center justify-between">
              <span>Predicted Success</span>
              <span className="font-bold text-[--color-text-primary]">{healthScore.toFixed(1)}/100</span>
            </div>
          </div>
        </div>

        {/* 2. Progress */}
        <div className="card-base p-5 rounded-2xl flex flex-col justify-between min-h-[148px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[--color-text-muted] uppercase tracking-wider">
              Progress
            </span>
            <TrendingUp className="w-4 h-4 text-[--color-text-muted]" />
          </div>

          <div className="flex items-center justify-between my-2">
            <span className="text-2xl font-display font-bold text-[--color-text-primary]">
              {project.progress}%
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${
              project.progress >= 100 
                ? 'bg-[--color-accent-lime]/10 text-[--color-accent-lime] border-[--color-accent-lime]/20'
                : 'bg-[--color-surface-2] text-[--color-text-secondary] border-[--color-border-subtle]'
            }`}>
              {project.progress >= 100 ? 'Completed' : `${100 - project.progress}% Remaining`}
            </span>
          </div>

          <div>
            <div className="w-full h-1.5 bg-[--color-surface-2] rounded-full overflow-hidden border border-[--color-border-subtle] mb-1.5">
              <div 
                className="h-full bg-[--color-accent-cyan] rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }} 
              />
            </div>
            <div className="text-[11px] text-[--color-text-secondary] flex items-center justify-between">
              <span>Execution State</span>
              <span className="font-bold text-[--color-text-primary]">{project.status}</span>
            </div>
          </div>
        </div>

        {/* 3. Team Fit */}
        <div className="card-base p-5 rounded-2xl flex flex-col justify-between min-h-[148px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[--color-text-muted] uppercase tracking-wider">
              Team Fit
            </span>
            <Sparkles className="w-4 h-4 text-[--color-text-muted]" />
          </div>

          <div className="flex items-center justify-between my-2">
            <span className="text-2xl font-display font-bold text-[--color-text-primary]">
              {project.teamFit}%
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${
              project.teamFit >= 85 
                ? 'bg-[--color-accent-lime]/10 text-[--color-accent-lime] border-[--color-accent-lime]/20'
                : project.teamFit >= 70 
                ? 'bg-[--color-accent-cyan]/10 text-[--color-accent-cyan] border-[--color-accent-cyan]/20'
                : 'bg-red-400/10 text-red-400 border-red-400/20'
            }`}>
              {project.teamFit >= 85 ? 'Optimal' : project.teamFit >= 70 ? 'Aligned' : 'Gaps Detected'}
            </span>
          </div>

          <div>
            <div className="w-full h-1.5 bg-[--color-surface-2] rounded-full overflow-hidden border border-[--color-border-subtle] mb-1.5">
              <div 
                className="h-full bg-[--color-accent-lime] rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, project.teamFit))}%` }} 
              />
            </div>
            <div className="text-[11px] text-[--color-text-secondary] flex items-center justify-between">
              <span>AWIS Alignment</span>
              <span className="font-bold text-[--color-text-primary]">{project.currentTeam.length}/{project.teamSize} Staffed</span>
            </div>
          </div>
        </div>

        {/* 4. Schedule */}
        <div className="card-base p-5 rounded-2xl flex flex-col justify-between min-h-[148px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[--color-text-muted] uppercase tracking-wider">
              Schedule
            </span>
            <Calendar className="w-4 h-4 text-[--color-text-muted]" />
          </div>

          <div className="flex items-center justify-between my-2">
            <span className="text-base sm:text-lg font-display font-bold text-[--color-text-primary] truncate">
              {new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${
              isScheduleTight 
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                : 'bg-[--color-accent-lime]/10 text-[--color-accent-lime] border-[--color-accent-lime]/20'
            }`}>
              {isScheduleTight ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>Tight</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-[--color-accent-lime]" />
                  <span>On Track</span>
                </>
              )}
            </span>
          </div>

          <div>
            <div className="w-full h-1.5 bg-[--color-surface-2] rounded-full overflow-hidden border border-[--color-border-subtle] mb-1.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isScheduleTight ? 'bg-amber-500' : 'bg-[--color-accent-lime]'
                }`} 
                style={{ width: `${Math.min(100, Math.max(10, 100 - deliveryDelayRisk))}%` }} 
              />
            </div>
            <div className="text-[11px] text-[--color-text-secondary] flex items-center justify-between">
              <span>Delivery Risk</span>
              <span className="font-bold text-[--color-text-primary]">{deliveryDelayRisk}% delay risk</span>
            </div>
          </div>
        </div>

      </div>

      {/* Edit Modal */}
      <EditProjectModal 
        isOpen={isEditOpen}
        project={project}
        onClose={() => setIsEditOpen(false)}
        onSuccess={(updated) => onProjectUpdate?.(updated)}
      />

      {/* Manage Team Modal */}
      <ManageTeamModal 
        isOpen={isManageTeamOpen}
        project={project}
        onClose={() => setIsManageTeamOpen(false)}
      />
    </div>
  );
}
