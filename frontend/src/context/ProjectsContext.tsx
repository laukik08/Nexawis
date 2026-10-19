import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockProjects, type Project, type ProjectTeamMember, type ProjectRequirement, type ProjectMilestone, type ProjectRisk } from '../data/mockProjects';

const STORAGE_KEY = 'nexawis_projects_v2';

export interface CreateProjectInput {
  name: string;
  description: string;
  department: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Planning' | 'Active' | 'On Track' | 'At Risk' | 'Completed';
  startDate: string;
  deadline: string;
  requirements: ProjectRequirement[];
  teamSize: number;
  complexity: 'High' | 'Medium' | 'Low';
  client?: string;
  projectManager?: string;
}

export interface ProjectsContextType {
  projects: Project[];
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
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore JSON parse error
    }
    return mockProjects;
  });

  // Save to localStorage whenever projects state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Failed to save projects to localStorage:', e);
    }
  }, [projects]);

  const getProject = (id: string) => {
    return projects.find(p => p.id === id || p.projectId === id);
  };

  const createProject = async (input: CreateProjectInput): Promise<{ success: boolean; error?: string; project?: Project }> => {
    // Artificial brief delay to simulate network call & prevent duplicate clicks
    await new Promise(resolve => setTimeout(resolve, 350));

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

    const uniqueNum = Math.floor(100 + Math.random() * 900);
    const newId = `prj-${Date.now().toString().slice(-6)}`;
    const newProjectId = `PRJ-${new Date().getFullYear()}-${uniqueNum}`;

    // Risk mapping based on priority & complexity
    const overallRisk: 'Low' | 'Medium' | 'High' = 
      input.priority === 'Critical' || input.complexity === 'High' ? 'High' :
      input.priority === 'High' || input.complexity === 'Medium' ? 'Medium' : 'Low';

    const defaultMilestones: ProjectMilestone[] = [
      { id: `m-${Date.now()}-1`, name: 'Discovery & Requirements Lock', status: 'Completed', date: input.startDate },
      { id: `m-${Date.now()}-2`, name: 'Architecture & System Design', status: 'Current', date: input.startDate },
      { id: `m-${Date.now()}-3`, name: 'Core Feature Development', status: 'Upcoming', date: input.deadline },
      { id: `m-${Date.now()}-4`, name: 'Final Validation & Deployment', status: 'Upcoming', date: input.deadline }
    ];

    const defaultRisks: ProjectRisk[] = [
      {
        category: 'Scope & Requirements',
        level: overallRisk,
        description: 'Initial scope baseline defined. Continuous AWIS alignment active.',
        trend: 'stable'
      }
    ];

    const newProject: Project = {
      id: newId,
      projectId: newProjectId,
      name: input.name.trim(),
      description: input.description.trim() || 'No project description provided.',
      department: input.department,
      client: input.client?.trim() || undefined,
      projectManager: input.projectManager?.trim() || undefined,
      status: input.status,
      priority: input.priority,
      complexity: input.complexity,
      teamSize: Number(input.teamSize) || 1,
      progress: input.status === 'Completed' ? 100 : input.status === 'Planning' ? 0 : 15,
      overallRisk,
      teamFit: 85,
      startDate: input.startDate,
      deadline: input.deadline,
      
      requirements: input.requirements && input.requirements.length > 0 ? input.requirements : [
        { skill: 'Core Engineering', priority: 'High', level: 'Intermediate' }
      ],
      currentTeam: [],
      milestones: defaultMilestones,
      risks: defaultRisks,
      
      intelligence: {
        priorityScore: input.priority === 'Critical' ? 95 : input.priority === 'High' ? 80 : 50,
        complexityScore: input.complexity === 'High' ? 88 : input.complexity === 'Medium' ? 65 : 40,
        requirementStability: 80,
        technicalRisk: input.complexity === 'High' ? 75 : 40,
        schedulePressure: input.priority === 'Critical' ? 85 : 50,
        clientEngagement: 80,
        innovationIndex: 70,
        scopeChange: 20,
        budgetVariance: 5,
        deliveryDelayRisk: overallRisk === 'High' ? 65 : 25,
        successPrediction: {
          score: overallRisk === 'High' ? 70.0 : 88.5,
          trend: 'stable',
          positiveFactors: [
            'Clear project timeline and defined requirements',
            'Strong leadership and cross-functional backing'
          ],
          negativeFactors: overallRisk === 'High' ? [
            'Tight milestone timeline requires vigilant resource monitoring'
          ] : []
        }
      },
      
      awisFit: {
        overallScore: 84.0,
        skillsMatch: 85,
        availabilityMatch: 80,
        experienceMatch: 88,
        workloadBalance: 82,
        wellbeingImpact: 85,
        insights: [
          'Project initial baseline formed. Ready for workforce allocation.'
        ],
        explanation: {
          positives: [
            'Well-structured workforce requirements defined for this department'
          ],
          concerns: [
            'Team members need to be assigned to meet the target team size'
          ]
        }
      },
      
      capacity: {
        totalRequired: (Number(input.teamSize) || 1) * 40,
        allocated: 0,
        available: (Number(input.teamSize) || 1) * 40,
        overloadedMembers: 0,
        balancedMembers: 0
      }
    };

    setProjects(prev => [newProject, ...prev]);
    return { success: true, project: newProject };
  };

  const updateProject = async (id: string, updates: Partial<Project>): Promise<{ success: boolean; error?: string; project?: Project }> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    let updatedProject: Project | undefined;

    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx === -1) return prev;

      const existing = prev[idx];
      
      // Validate dates if modified
      const newStart = updates.startDate ?? existing.startDate;
      const newDeadline = updates.deadline ?? existing.deadline;
      if (new Date(newDeadline) < new Date(newStart)) {
        throw new Error('Deadline cannot be before start date');
      }

      updatedProject = {
        ...existing,
        ...updates,
        // Update capacity total if teamSize changed
        capacity: updates.teamSize !== undefined ? {
          ...existing.capacity,
          totalRequired: updates.teamSize * 40,
          available: Math.max(0, (updates.teamSize * 40) - existing.capacity.allocated)
        } : existing.capacity
      };

      const copy = [...prev];
      copy[idx] = updatedProject;
      return copy;
    });

    if (!updatedProject) {
      return { success: false, error: 'Project not found' };
    }

    return { success: true, project: updatedProject };
  };

  const deleteProject = async (id: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 250));
    setProjects(prev => prev.filter(p => p.id !== id));
    return { success: true };
  };

  const addTeamMember = async (projectId: string, member: ProjectTeamMember): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    let errorMsg: string | undefined;

    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === projectId);
      if (idx === -1) {
        errorMsg = 'Project not found';
        return prev;
      }

      const prj = prev[idx];
      // Check duplicate
      const exists = prj.currentTeam.some(m => m.id === member.id || m.name.toLowerCase() === member.name.toLowerCase());
      if (exists) {
        errorMsg = `${member.name} is already assigned to this project.`;
        return prev;
      }

      const updatedTeam = [...prj.currentTeam, member];
      const hoursAllocated = Math.round((member.allocationPercent / 100) * 40);
      const newAllocated = prj.capacity.allocated + hoursAllocated;
      const overloaded = updatedTeam.filter(m => m.allocationPercent > 100).length;
      const balanced = updatedTeam.filter(m => m.allocationPercent <= 100).length;

      const updatedPrj: Project = {
        ...prj,
        currentTeam: updatedTeam,
        teamSize: Math.max(prj.teamSize, updatedTeam.length),
        capacity: {
          ...prj.capacity,
          allocated: newAllocated,
          available: Math.max(0, prj.capacity.totalRequired - newAllocated),
          overloadedMembers: overloaded,
          balancedMembers: balanced
        }
      };

      const copy = [...prev];
      copy[idx] = updatedPrj;
      return copy;
    });

    if (errorMsg) {
      return { success: false, error: errorMsg };
    }
    return { success: true };
  };

  const removeTeamMember = async (projectId: string, memberId: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 250));

    let errorMsg: string | undefined;

    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === projectId);
      if (idx === -1) {
        errorMsg = 'Project not found';
        return prev;
      }

      const prj = prev[idx];
      const memberToRemove = prj.currentTeam.find(m => m.id === memberId);
      if (!memberToRemove) {
        errorMsg = 'Team member not found on this project';
        return prev;
      }

      const updatedTeam = prj.currentTeam.filter(m => m.id !== memberId);
      const hoursRemoved = Math.round((memberToRemove.allocationPercent / 100) * 40);
      const newAllocated = Math.max(0, prj.capacity.allocated - hoursRemoved);
      const overloaded = updatedTeam.filter(m => m.allocationPercent > 100).length;
      const balanced = updatedTeam.filter(m => m.allocationPercent <= 100).length;

      const updatedPrj: Project = {
        ...prj,
        currentTeam: updatedTeam,
        capacity: {
          ...prj.capacity,
          allocated: newAllocated,
          available: Math.max(0, prj.capacity.totalRequired - newAllocated),
          overloadedMembers: overloaded,
          balancedMembers: balanced
        }
      };

      const copy = [...prev];
      copy[idx] = updatedPrj;
      return copy;
    });

    if (errorMsg) {
      return { success: false, error: errorMsg };
    }
    return { success: true };
  };

  const resetToDefault = () => {
    setProjects(mockProjects);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
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
