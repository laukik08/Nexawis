import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectService } from '../services/projectService';
import type {
  Project,
  ProjectTeamMember,
  CreateProjectInput,
} from '../types/project';

export type { CreateProjectInput };

export interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
  getProject: (id: string) => Project | undefined;
  createProject: (input: CreateProjectInput) => Promise<{ success: boolean; error?: string; project?: Project }>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<{ success: boolean; error?: string; project?: Project }>;
  deleteProject: (id: string) => Promise<{ success: boolean; error?: string }>;
  addTeamMember: (projectId: string, member: ProjectTeamMember) => Promise<{ success: boolean; error?: string }>;
  removeTeamMember: (projectId: string, memberId: string) => Promise<{ success: boolean; error?: string }>;
  resetToDefault: () => void;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectService.getProjects({ pageSize: 100 });
      setProjects(res.items);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to load projects from server.';
      setError(msg);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const getProject = (id: string): Project | undefined => {
    return projects.find(p => p.id === id || p.projectId === id);
  };

  const createProject = async (
    input: CreateProjectInput
  ): Promise<{ success: boolean; error?: string; project?: Project }> => {
    if (!input.name.trim()) {
      return { success: false, error: 'Project name is required' };
    }
    if (!input.department) {
      return { success: false, error: 'Department is required' };
    }
    if (!input.startDate || !input.deadline) {
      return { success: false, error: 'Start date and deadline are required' };
    }
    if (new Date(input.deadline) < new Date(input.startDate)) {
      return { success: false, error: 'Deadline cannot be before start date' };
    }

    try {
      const created = await projectService.createProject(input);
      setProjects(prev => [created, ...prev]);
      return { success: true, project: created };
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to create project';
      return { success: false, error: msg };
    }
  };

  const updateProject = async (
    id: string,
    updates: Partial<Project>
  ): Promise<{ success: boolean; error?: string; project?: Project }> => {
    try {
      const updated = await projectService.updateProject(id, updates);
      setProjects(prev => prev.map(p => (p.id === id || p.projectId === id ? updated : p)));
      return { success: true, project: updated };
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to update project';
      return { success: false, error: msg };
    }
  };

  const deleteProject = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await projectService.archiveProject(id);
      setProjects(prev => prev.filter(p => p.id !== id && p.projectId !== id));
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to archive project';
      return { success: false, error: msg };
    }
  };

  const addTeamMember = async (
    projectId: string,
    member: ProjectTeamMember
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = await projectService.addTeamMember(projectId, {
        id: member.id,
        role: member.role,
        allocationPercent: member.allocationPercent,
        teamFit: member.teamFit,
      });
      setProjects(prev => prev.map(p => (p.id === projectId || p.projectId === projectId ? updated : p)));
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to add team member';
      return { success: false, error: msg };
    }
  };

  const removeTeamMember = async (
    projectId: string,
    memberId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = await projectService.removeTeamMember(projectId, memberId);
      setProjects(prev => prev.map(p => (p.id === projectId || p.projectId === projectId ? updated : p)));
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to remove team member';
      return { success: false, error: msg };
    }
  };

  const resetToDefault = () => {
    fetchProjects();
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        loading,
        error,
        refreshProjects: fetchProjects,
        getProject,
        createProject,
        updateProject,
        deleteProject,
        addTeamMember,
        removeTeamMember,
        resetToDefault,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
}
