import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../../context/ProjectsContext';
import { ProjectHeader } from '../../components/projects/detail/ProjectHeader';
import { ProjectOverview } from '../../components/projects/detail/ProjectOverview';
import { ProjectTimeline } from '../../components/projects/detail/ProjectTimeline';
import { ProjectIntelligence } from '../../components/projects/detail/ProjectIntelligence';
import { ProjectTeam } from '../../components/projects/detail/ProjectTeam';
import { ProjectAwis } from '../../components/projects/detail/ProjectAwis';
import { useEffect } from 'react';
import { FolderX, ArrowLeft } from 'lucide-react';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject } = useProjects();
  
  const project = getProject(id || '');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!project) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-14 h-14 rounded-2xl bg-[--color-surface-2] flex items-center justify-center text-[--color-text-muted] mb-4">
          <FolderX className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-display font-bold text-[--color-text-primary] mb-2">
          Project Not Found
        </h2>
        <p className="text-xs text-[--color-text-secondary] max-w-md mb-6">
          The requested project record could not be found in the current workspace directory. It may have been deleted or moved.
        </p>
        <button 
          onClick={() => navigate('/app/projects')}
          className="inline-flex items-center space-x-2 px-5 py-2.5 btn-primary rounded-xl font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Projects Directory</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ProjectHeader project={project} />
      
      <div className="space-y-10">
        <ProjectOverview project={project} />
        <ProjectTimeline project={project} />
        <ProjectIntelligence project={project} />
        <ProjectTeam project={project} />
        <ProjectAwis project={project} />
      </div>
    </div>
  );
}
