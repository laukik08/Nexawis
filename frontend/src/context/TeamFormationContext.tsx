import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Project } from '../data/mockProjects';
import type { Employee } from '../data/mockEmployees';
import type { 
  TeamFormationConfig, 
  TeamCandidate, 
  TeamSummaryMetrics, 
  FormationHistoryItem, 
  FormationKpiData,
  FormationOptionId,
  FormationOptionDef,
  TeamAlternativeItem
} from '../types/teamFormation';
import { teamFormationService } from '../services/teamFormationService';
import { mockFormationOptions } from '../data/mockTeamFormations';

interface TeamFormationContextType {
  activeTab: 'create' | 'history';
  setActiveTab: (tab: 'create' | 'history') => void;
  currentStep: 1 | 2 | 3 | 4;
  goToStep: (step: 1 | 2 | 3 | 4) => void;
  
  projects: Project[];
  selectedProject: Project | null;
  selectProject: (project: Project) => void;
  
  config: TeamFormationConfig;
  updateConfig: (updates: Partial<TeamFormationConfig>) => void;
  
  isOptionsModalOpen: boolean;
  setIsOptionsModalOpen: (open: boolean) => void;
  formationOptions: FormationOptionDef[];
  activeFormationOption: FormationOptionDef;
  selectFormationOption: (optionId: FormationOptionId) => void;
  openCreateFormationWithOptions: () => void;
  
  isGenerating: boolean;
  generateRecommendations: () => Promise<void>;
  
  activeFormationId: string | null;
  activeFormationCode: string | null;
  alternatives: TeamAlternativeItem[];
  applyAlternative: (alternativeId: string) => void;

  candidates: TeamCandidate[];
  metrics: TeamSummaryMetrics | null;
  replaceCandidate: (oldCandidateId: string, newEmployee: Employee, role?: string) => void;
  removeCandidate: (candidateId: string) => void;
  addCandidate: (employee: Employee, role?: string) => void;
  
  saveDraft: () => Promise<FormationHistoryItem | null>;
  finalizeFormation: () => Promise<FormationHistoryItem | null>;
  resetWorkflow: () => void;
  
  kpiData: FormationKpiData | null;
  history: FormationHistoryItem[];
  isLoadingHistory: boolean;
  refreshHistory: () => Promise<void>;
  
  candidateToReplace: TeamCandidate | null;
  setCandidateToReplace: (candidate: TeamCandidate | null) => void;
  
  previewEmployee: Employee | null;
  setPreviewEmployee: (employee: Employee | null) => void;
  
  previewFormation: FormationHistoryItem | null;
  setPreviewFormation: (formation: FormationHistoryItem | null) => void;
  
  feedbackMessage: { type: 'success' | 'info' | 'error'; text: string } | null;
  clearFeedback: () => void;
}

const defaultInitialConfig: TeamFormationConfig = {
  projectId: '',
  teamSize: 4,
  formationOption: 'autonomous_ai',
  requiredSkills: [
    { skill: 'Python', minProficiency: 80, priority: 'High' },
    { skill: 'Distributed Systems', minProficiency: 75, priority: 'High' },
    { skill: 'Cloud Architecture', minProficiency: 70, priority: 'Medium' },
    { skill: 'Kubernetes', minProficiency: 70, priority: 'Medium' }
  ],
  preferredRoles: [
    'Lead AI/ML Engineer',
    'Distributed Systems Architect',
    'Cloud Infrastructure Engineer',
    'Data Pipeline & MLOps'
  ],
  skillCoverageMode: 'Balanced',
  minAvailability: 50,
  workloadTolerance: 'Balanced',
  wellbeingRiskTolerance: 'ModerateAllowed',
  performancePreference: 'Balanced',
  includeGrowthOpportunities: true
};

const TeamFormationContext = createContext<TeamFormationContextType | undefined>(undefined);

export function TeamFormationProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [config, setConfig] = useState<TeamFormationConfig>(defaultInitialConfig);
  const [isGenerating, setIsGenerating] = useState(false);

  const [candidates, setCandidates] = useState<TeamCandidate[]>([]);
  const [metrics, setMetrics] = useState<TeamSummaryMetrics | null>(null);

  const [activeFormationId, setActiveFormationId] = useState<string | null>(null);
  const [activeFormationCode, setActiveFormationCode] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<TeamAlternativeItem[]>([]);

  const [kpiData, setKpiData] = useState<FormationKpiData | null>(null);
  const [history, setHistory] = useState<FormationHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Modals state
  const [candidateToReplace, setCandidateToReplace] = useState<TeamCandidate | null>(null);
  const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null);
  const [previewFormation, setPreviewFormation] = useState<FormationHistoryItem | null>(null);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);

  const formationOptions = mockFormationOptions;
  const activeFormationOption = formationOptions.find(o => o.id === config.formationOption) || formationOptions[0];

  const selectFormationOption = async (optionId: FormationOptionId) => {
    const selected = formationOptions.find(o => o.id === optionId);
    if (selected) {
      const nextConfig: TeamFormationConfig = {
        ...config,
        formationOption: optionId,
        ...selected.configPreset
      };
      updateConfig({
        formationOption: optionId,
        ...selected.configPreset
      });
      setIsOptionsModalOpen(false);
      setActiveTab('create');
      setFeedbackMessage({
        type: 'info',
        text: `Formation strategy changed to "${selected.title}". Presets applied.`
      });

      // Advance from Step 1 to Step 2 if project is available
      if (currentStep === 1) {
        if (!selectedProject && projects.length > 0) {
          selectProject(projects[0]);
        }
        setCurrentStep(2);
      } else if (currentStep >= 3 && selectedProject) {
        // Automatically re-generate recommendations for newly selected strategy preset
        setIsGenerating(true);
        try {
          const res = await teamFormationService.generateTeamRecommendations(selectedProject, nextConfig);
          if (res.isFeasible === false) {
            setFeedbackMessage({
              type: 'error',
              text: res.feasibilityExplanation || 'Project constraints cannot be met with the current employee pool.'
            });
          }
          setCandidates(res.candidates);
          setMetrics(res.metrics);
          if (res.formationId) {
            setActiveFormationId(res.formationId);
          }
          if (res.formationCode) {
            setActiveFormationCode(res.formationCode);
          }
          if (res.alternatives) {
            setAlternatives(res.alternatives);
          }
        } catch (err) {
          console.error('Error updating recommendations for preset:', err);
        } finally {
          setIsGenerating(false);
        }
      }
    }
  };


  const openCreateFormationWithOptions = () => {
    setActiveTab('create');
    setIsOptionsModalOpen(true);
  };

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const clearFeedback = useCallback(() => setFeedbackMessage(null), []);

  // Load initial projects and KPIs
  useEffect(() => {
    async function loadData() {
      try {
        const [projList, kpis, hist] = await Promise.all([
          teamFormationService.getAvailableProjects(),
          teamFormationService.getFormationKpis(),
          teamFormationService.getFormationHistory()
        ]);
        setProjects(projList);
        setKpiData(kpis);
        setHistory(hist);

        // Pre-select first project if available
        if (projList.length > 0 && !selectedProject) {
          const first = projList[0];
          setSelectedProject(first);
          populateConfigFromProject(first);
        }
      } catch (err) {
        console.error('Error loading team formation data:', err);
      }
    }
    loadData();
  }, []);

  // Helper to sync config with project's actual requirements
  const populateConfigFromProject = (project: Project) => {
    const formattedSkills = (project.requirements || []).map(r => ({
      skill: r.skill,
      minProficiency: r.level === 'Senior' || r.level === 'Lead' ? 85 : 70,
      priority: r.priority || 'Medium'
    }));

    setConfig(prev => ({
      ...prev,
      projectId: project.id,
      teamSize: project.teamSize || 4,
      requiredSkills: formattedSkills.length > 0 ? formattedSkills : prev.requiredSkills
    }));
  };

  const selectProject = (project: Project) => {
    setSelectedProject(project);
    populateConfigFromProject(project);
  };

  const updateConfig = (updates: Partial<TeamFormationConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      // If we already have candidates and skills or teamSize changed, recalculate metrics
      if (candidates.length > 0) {
        const nextMetrics = teamFormationService.calculateTeamMetrics(candidates, next);
        setMetrics(nextMetrics);
      }
      return next;
    });
  };

  const generateRecommendations = async () => {
    if (!selectedProject) return;
    setIsGenerating(true);
    try {
      const res = await teamFormationService.generateTeamRecommendations(selectedProject, config);
      if (res.isFeasible === false) {
        setFeedbackMessage({
          type: 'error',
          text: res.feasibilityExplanation || 'Project constraints cannot be met with the current employee pool.'
        });
      }
      setCandidates(res.candidates);
      setMetrics(res.metrics);
      if (res.formationId) {
        setActiveFormationId(res.formationId);
      }
      if (res.formationCode) {
        setActiveFormationCode(res.formationCode);
      }
      if (res.alternatives) {
        setAlternatives(res.alternatives);
      }
      setCurrentStep(3);
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setFeedbackMessage({
        type: 'error',
        text: 'Failed to generate recommendations. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const applyAlternative = (alternativeId: string) => {
    const alt = alternatives.find(a => a.alternativeId === alternativeId);
    if (!alt) return;
    setCandidates(alt.members);
    setMetrics(alt.metrics);
    setFeedbackMessage({
      type: 'info',
      text: `Applied alternative strategy: "${alt.strategyLabel}". Roster updated.`
    });
  };

  const replaceCandidate = (oldCandidateId: string, newEmployee: Employee, role?: string) => {
    const assignedRole = role || newEmployee.role;
    
    // Calculate new match score
    let proficiencySum = 0;
    config.requiredSkills.forEach(req => {
      const found = newEmployee.skills.find(s => s.name.toLowerCase() === req.skill.toLowerCase());
      if (found) proficiencySum += found.proficiency;
    });
    const skillMatchPercent = config.requiredSkills.length > 0
      ? Math.min(Math.round((proficiencySum / (config.requiredSkills.length * 100)) * 100), 100)
      : Math.round(newEmployee.awisFitScore);

    const rawScore = (
      skillMatchPercent * 0.40 +
      newEmployee.availabilityScore * 0.20 +
      newEmployee.performanceScore * 0.20 +
      (100 - newEmployee.workloadScore) * 0.20
    );

    const matchScore = Math.min(Math.max(Math.round(rawScore), 55), 98);

    const newCandidate: TeamCandidate = {
      id: newEmployee.id,
      employeeId: newEmployee.employeeId,
      name: newEmployee.name,
      avatarUrl: newEmployee.avatarUrl,
      role: newEmployee.role,
      department: newEmployee.department,
      assignedRole,
      matchScore,
      skillMatchPercent,
      performanceScore: newEmployee.performanceScore,
      availabilityPercent: newEmployee.availabilityScore,
      currentWorkloadPercent: newEmployee.workloadScore,
      wellbeingRisk: newEmployee.wellbeingRisk,
      awisScore: newEmployee.awisFitScore,
      isOverride: true,
      primarySkills: newEmployee.skills.filter(s => s.isPrimary).map(s => s.name),
      allSkills: newEmployee.skills,
      whySelected: {
        summary: `User override substitution for ${assignedRole}. Adds dedicated expertise in ${newEmployee.skills[0]?.name || 'Core Domain'}.`,
        strengths: [
          `Specialized in ${newEmployee.skills.slice(0, 2).map(s => s.name).join(' & ')}`,
          `Current capacity is ${newEmployee.availabilityScore}% available`
        ],
        considerations: [
          `User manual replacement; review synergy with adjacent members`
        ]
      }
    };

    setCandidates(prev => {
      const updated = prev.map(c => c.id === oldCandidateId ? newCandidate : c);
      const nextMetrics = teamFormationService.calculateTeamMetrics(updated, config);
      setMetrics(nextMetrics);
      return updated;
    });

    setFeedbackMessage({
      type: 'info',
      text: `Replaced candidate with ${newEmployee.name}. Team metrics updated.`
    });
  };

  const removeCandidate = (candidateId: string) => {
    setCandidates(prev => {
      const updated = prev.filter(c => c.id !== candidateId);
      const nextMetrics = teamFormationService.calculateTeamMetrics(updated, config);
      setMetrics(nextMetrics);
      return updated;
    });

    setFeedbackMessage({
      type: 'info',
      text: 'Candidate removed from team roster.'
    });
  };

  const addCandidate = (employee: Employee, role?: string) => {
    if (candidates.some(c => c.id === employee.id)) {
      setFeedbackMessage({
        type: 'error',
        text: 'This candidate is already in the formation roster.'
      });
      return;
    }

    const assignedRole = role || employee.role;
    const newCandidate: TeamCandidate = {
      id: employee.id,
      employeeId: employee.employeeId,
      name: employee.name,
      avatarUrl: employee.avatarUrl,
      role: employee.role,
      department: employee.department,
      assignedRole,
      matchScore: Math.round(employee.awisFitScore),
      skillMatchPercent: Math.round(employee.performanceScore * 0.95),
      performanceScore: employee.performanceScore,
      availabilityPercent: employee.availabilityScore,
      currentWorkloadPercent: employee.workloadScore,
      wellbeingRisk: employee.wellbeingRisk,
      awisScore: employee.awisFitScore,
      isOverride: true,
      primarySkills: employee.skills.filter(s => s.isPrimary).map(s => s.name),
      allSkills: employee.skills,
      whySelected: {
        summary: `Manually added team contributor as ${assignedRole}.`,
        strengths: [
          `Brings ${employee.department} capabilities`,
          `High performance track record (${employee.performanceScore}/100)`
        ],
        considerations: ['Manual addition to roster']
      }
    };

    setCandidates(prev => {
      const updated = [...prev, newCandidate];
      const nextMetrics = teamFormationService.calculateTeamMetrics(updated, config);
      setMetrics(nextMetrics);
      return updated;
    });

    setFeedbackMessage({
      type: 'success',
      text: `Added ${employee.name} to the team.`
    });
  };

  const saveDraft = async (): Promise<FormationHistoryItem | null> => {
    if (!selectedProject || candidates.length === 0) return null;
    try {
      const draft = await teamFormationService.saveFormationDraft({
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        projectDepartment: selectedProject.department,
        teamSize: candidates.length,
        teamFitScore: metrics?.overallTeamFit || 90,
        notes: `Draft saved with ${candidates.length} members.`,
        metrics: {
          skillCoverage: metrics?.skillCoveragePercent || 90,
          workloadBalance: metrics?.workloadBalanceScore || 90,
          sustainability: metrics?.sustainabilityScore || 90,
          availabilityCoverage: metrics?.availabilityCoverageScore || 90
        },
        members: candidates.map(c => ({
          id: c.id,
          name: c.name,
          avatarUrl: c.avatarUrl,
          role: c.role,
          assignedRole: c.assignedRole,
          awisScore: c.awisScore,
          wellbeingRisk: c.wellbeingRisk,
          matchScore: c.matchScore
        }))
      });

      setHistory(prev => [draft, ...prev]);
      setFeedbackMessage({
        type: 'success',
        text: `Draft ${draft.id} saved successfully.`
      });
      return draft;
    } catch (err) {
      console.error('Error saving draft:', err);
      setFeedbackMessage({
        type: 'error',
        text: 'Failed to save draft.'
      });
      return null;
    }
  };

  const finalizeFormation = async (): Promise<FormationHistoryItem | null> => {
    if (!selectedProject || candidates.length === 0) return null;
    try {
      const finalized = await teamFormationService.finalizeFormation({
        formationId: activeFormationId || undefined,
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        projectDepartment: selectedProject.department,
        teamSize: candidates.length,
        teamFitScore: metrics?.overallTeamFit || 92,
        notes: `Finalized formation for ${selectedProject.name}. All assigned positions confirmed.`,
        metrics: {
          skillCoverage: metrics?.skillCoveragePercent || 95,
          workloadBalance: metrics?.workloadBalanceScore || 90,
          sustainability: metrics?.sustainabilityScore || 94,
          availabilityCoverage: metrics?.availabilityCoverageScore || 92
        },
        members: candidates.map(c => ({
          id: c.id,
          name: c.name,
          avatarUrl: c.avatarUrl,
          role: c.role,
          assignedRole: c.assignedRole,
          awisScore: c.awisScore,
          wellbeingRisk: c.wellbeingRisk,
          matchScore: c.matchScore
        }))
      });

      setHistory(prev => [finalized, ...prev]);
      // Update KPIs
      const nextKpis = await teamFormationService.getFormationKpis();
      setKpiData(nextKpis);

      setFeedbackMessage({
        type: 'success',
        text: `Team Formation ${finalized.id} successfully finalized!`
      });
      return finalized;
    } catch (err) {
      console.error('Error finalizing formation:', err);
      const msg = (err as { message?: string })?.message || 'Failed to finalize formation.';
      setFeedbackMessage({
        type: 'error',
        text: msg
      });
      return null;
    }
  };

  const refreshHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const hist = await teamFormationService.getFormationHistory();
      setHistory(hist);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const resetWorkflow = () => {
    setCurrentStep(1);
    setCandidates([]);
    setMetrics(null);
    setActiveFormationId(null);
    setActiveFormationCode(null);
    setAlternatives([]);
    if (projects.length > 0) {
      selectProject(projects[0]);
    }
  };

  const goToStep = (step: 1 | 2 | 3 | 4) => {
    // Basic guards
    if (step > 1 && !selectedProject) return;
    if (step > 2 && candidates.length === 0 && step !== 2) return;
    setCurrentStep(step);
  };

  return (
    <TeamFormationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentStep,
        goToStep,
        projects,
        selectedProject,
        selectProject,
        config,
        updateConfig,
        isOptionsModalOpen,
        setIsOptionsModalOpen,
        formationOptions,
        activeFormationOption,
        selectFormationOption,
        openCreateFormationWithOptions,
        isGenerating,
        generateRecommendations,
        activeFormationId,
        activeFormationCode,
        alternatives,
        applyAlternative,
        candidates,
        metrics,
        replaceCandidate,
        removeCandidate,
        addCandidate,
        saveDraft,
        finalizeFormation,
        resetWorkflow,
        kpiData,
        history,
        isLoadingHistory,
        refreshHistory,
        candidateToReplace,
        setCandidateToReplace,
        previewEmployee,
        setPreviewEmployee,
        previewFormation,
        setPreviewFormation,
        feedbackMessage,
        clearFeedback
      }}
    >
      {children}
    </TeamFormationContext.Provider>
  );
}

export function useTeamFormation() {
  const context = useContext(TeamFormationContext);
  if (!context) {
    throw new Error('useTeamFormation must be used within a TeamFormationProvider');
  }
  return context;
}
