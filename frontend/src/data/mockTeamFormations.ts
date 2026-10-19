import type { FormationHistoryItem, FormationKpiData, FormationOptionDef } from '../types/teamFormation';

export const mockFormationOptions: FormationOptionDef[] = [
  {
    id: 'autonomous_ai',
    title: 'Autonomous AI Optimization',
    badge: 'AWIS Flagship',
    description: 'Multi-objective intelligence balance. Simultaneously aligns skills, collaboration affinity, workload sustainability, and AWIS 9-dimensional index.',
    highlight: 'Recommended for general project sprints and balanced delivery.',
    iconName: 'sparkles',
    accentColor: 'var(--color-accent-cyan)',
    configPreset: {
      formationOption: 'autonomous_ai',
      skillCoverageMode: 'Balanced',
      workloadTolerance: 'Balanced',
      wellbeingRiskTolerance: 'ModerateAllowed',
      performancePreference: 'Balanced',
      includeGrowthOpportunities: true,
      minAvailability: 50
    }
  },
  {
    id: 'fatigue_safe',
    title: 'Fatigue-Safe & Wellness Protected',
    badge: 'Burnout Shield',
    description: 'Prioritizes employee workload sustainability. Strictly caps maximum utilization below 65%, excludes elevated stress indicators, and guarantees buffer.',
    highlight: 'Ideal for sustained marathons, post-crunch recovery, and wellness-first organizations.',
    iconName: 'shield',
    accentColor: 'var(--color-accent-lime)',
    configPreset: {
      formationOption: 'fatigue_safe',
      skillCoverageMode: 'Comprehensive',
      workloadTolerance: 'Strict',
      wellbeingRiskTolerance: 'LowOnly',
      performancePreference: 'Balanced',
      includeGrowthOpportunities: true,
      minAvailability: 60
    }
  },
  {
    id: 'high_velocity',
    title: 'High-Velocity Sprint Strike Team',
    badge: 'Rapid Execution',
    description: 'Assembles highest-throughput performers and domain specialists with proven velocity metrics. Prioritizes delivery speed and high skill mastery.',
    highlight: 'Engineered for critical release windows, hackathons, and mission-critical production blockers.',
    iconName: 'zap',
    accentColor: '#f59e0b',
    configPreset: {
      formationOption: 'high_velocity',
      skillCoverageMode: 'Essential',
      workloadTolerance: 'HighVelocity',
      wellbeingRiskTolerance: 'ModerateAllowed',
      performancePreference: 'HighPerformer',
      includeGrowthOpportunities: false,
      minAvailability: 40
    }
  },
  {
    id: 'growth_mentorship',
    title: 'Cross-Functional & Mentorship Pod',
    badge: 'Talent Development',
    description: 'Pairs senior domain leads with high-potential rising team members. Builds long-term institutional knowledge without sacrificing delivery goals.',
    highlight: 'Fosters career progression, psychological safety, and cross-department skill sharing.',
    iconName: 'users',
    accentColor: '#a855f7',
    configPreset: {
      formationOption: 'growth_mentorship',
      skillCoverageMode: 'Balanced',
      workloadTolerance: 'Balanced',
      wellbeingRiskTolerance: 'ModerateAllowed',
      performancePreference: 'GrowthFocused',
      includeGrowthOpportunities: true,
      minAvailability: 50
    }
  },
  {
    id: 'rebalance_existing',
    title: 'Re-balance Active Project Team',
    badge: 'Resource Swap',
    description: 'Detects team bottlenecks and workload over-allocation on active projects. Suggests seamless replacements to restore team equilibrium.',
    highlight: 'Best for projects experiencing delivery slowdowns or team member fatigue.',
    iconName: 'rotate',
    accentColor: '#06b6d4',
    configPreset: {
      formationOption: 'rebalance_existing',
      skillCoverageMode: 'Comprehensive',
      workloadTolerance: 'Strict',
      wellbeingRiskTolerance: 'LowOnly',
      performancePreference: 'Balanced',
      includeGrowthOpportunities: false,
      minAvailability: 50
    }
  },
  {
    id: 'custom_constraints',
    title: 'Custom Constraint-Driven Formation',
    badge: 'Full Control',
    description: 'Manual fine-tuning of all parameters, including custom skill matrices, strict proficiency bars, exact role distributions, and availability sliders.',
    highlight: 'Tailored for engineering leaders with unique project specifications.',
    iconName: 'sliders',
    accentColor: '#ec4899',
    configPreset: {
      formationOption: 'custom_constraints',
      skillCoverageMode: 'Balanced',
      workloadTolerance: 'Balanced',
      wellbeingRiskTolerance: 'ModerateAllowed',
      performancePreference: 'Balanced',
      includeGrowthOpportunities: true,
      minAvailability: 50
    }
  }
];

export const mockFormationKpiData: FormationKpiData = {
  totalFormations: 28,
  totalFormationsTrend: '+4 this month',
  teamsCreated: 24,
  teamsCreatedTrend: '92% conversion rate',
  averageTeamFit: 91.8,
  averageTeamFitTrend: '+2.4% vs benchmark',
  workforceSustainability: 94.6,
  workforceSustainabilityTrend: 'Low burnout risk index'
};

export const mockRolePresets: string[] = [
  'Team Lead / Principal',
  'Lead AI/ML Engineer',
  'Distributed Systems Architect',
  'Cloud Infrastructure Engineer',
  'Senior Full Stack Engineer',
  'Frontend UX Specialist',
  'Data Pipeline & MLOps',
  'Security & Compliance Lead',
  'Algorithm Optimization Specialist',
  'QA & Performance Automation'
];

export const mockSkillPresets: string[] = [
  'Python',
  'PyTorch',
  'Rust',
  'Distributed Systems',
  'Kubernetes',
  'Cloud Architecture',
  'React',
  'TypeScript',
  'FastAPI',
  'GraphQL',
  'Cybersecurity',
  'Data Engineering',
  'MLOps',
  'Docker',
  'CI/CD Automation'
];

export const initialFormationHistory: FormationHistoryItem[] = [
  {
    id: 'FRM-2026-081',
    projectId: 'proj-001',
    projectName: 'Quantum Core API Engine',
    projectDepartment: 'Artificial Intelligence',
    createdAt: '2026-09-12T10:30:00Z',
    updatedAt: '2026-09-12T14:45:00Z',
    teamSize: 4,
    teamFitScore: 94.5,
    status: 'Active',
    metrics: {
      skillCoverage: 100,
      workloadBalance: 92,
      sustainability: 95,
      availabilityCoverage: 94
    },
    notes: 'Primary microservices architecture team. High synergy between Sarah Chen and Marcus Vance.',
    members: [
      {
        id: 'emp_001',
        name: 'Dr. Sarah Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        role: 'Lead AI Researcher',
        assignedRole: 'Lead AI/ML Engineer',
        awisScore: 94,
        wellbeingRisk: 'Low',
        matchScore: 96
      },
      {
        id: 'emp_002',
        name: 'Marcus Vance',
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
        role: 'Senior Distributed Systems Eng',
        assignedRole: 'Distributed Systems Architect',
        awisScore: 91,
        wellbeingRisk: 'Moderate',
        matchScore: 94
      },
      {
        id: 'emp_003',
        name: 'Elena Rostova',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        role: 'Cloud Architect & SRE',
        assignedRole: 'Cloud Infrastructure Engineer',
        awisScore: 95,
        wellbeingRisk: 'Low',
        matchScore: 93
      },
      {
        id: 'emp_005',
        name: 'Aisha Patel',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'Data Science & ML Ops',
        assignedRole: 'Data Pipeline & MLOps',
        awisScore: 93,
        wellbeingRisk: 'Low',
        matchScore: 95
      }
    ]
  },
  {
    id: 'FRM-2026-074',
    projectId: 'proj-002',
    projectName: 'BioPulse Clinical Telemetry',
    projectDepartment: 'Healthcare Tech',
    createdAt: '2026-08-28T09:15:00Z',
    updatedAt: '2026-08-28T16:20:00Z',
    teamSize: 5,
    teamFitScore: 92.2,
    status: 'Finalized',
    metrics: {
      skillCoverage: 96,
      workloadBalance: 89,
      sustainability: 94,
      availabilityCoverage: 90
    },
    notes: 'Telemetry aggregation team with strict medical compliance standards.',
    members: [
      {
        id: 'emp_004',
        name: 'Devon Miller',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        role: 'Frontend Lead & UX Systems',
        assignedRole: 'Frontend UX Specialist',
        awisScore: 92,
        wellbeingRisk: 'Low',
        matchScore: 94
      },
      {
        id: 'emp_006',
        name: 'Liam O\'Connor',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'Full Stack Engineer',
        assignedRole: 'Senior Full Stack Engineer',
        awisScore: 89,
        wellbeingRisk: 'Moderate',
        matchScore: 91
      },
      {
        id: 'emp_007',
        name: 'Zoe Saldana',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        role: 'Security Engineer',
        assignedRole: 'Security & Compliance Lead',
        awisScore: 90,
        wellbeingRisk: 'Low',
        matchScore: 93
      },
      {
        id: 'emp_008',
        name: 'Kenji Sato',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        role: 'Bio-Informatics Specialist',
        assignedRole: 'Algorithm Optimization Specialist',
        awisScore: 93,
        wellbeingRisk: 'Low',
        matchScore: 91
      },
      {
        id: 'emp_003',
        name: 'Elena Rostova',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        role: 'Cloud Architect & SRE',
        assignedRole: 'Cloud Infrastructure Engineer',
        awisScore: 95,
        wellbeingRisk: 'Low',
        matchScore: 92
      }
    ]
  },
  {
    id: 'FRM-2026-068',
    projectId: 'proj-003',
    projectName: 'FinGuard Neural Fraud Detection',
    projectDepartment: 'Fintech Solutions',
    createdAt: '2026-08-14T14:00:00Z',
    updatedAt: '2026-08-14T17:30:00Z',
    teamSize: 4,
    teamFitScore: 95.1,
    status: 'Finalized',
    metrics: {
      skillCoverage: 100,
      workloadBalance: 94,
      sustainability: 96,
      availabilityCoverage: 95
    },
    notes: 'Low-latency streaming fraud pipeline for multi-currency transaction validation.',
    members: [
      {
        id: 'emp_001',
        name: 'Dr. Sarah Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        role: 'Lead AI Researcher',
        assignedRole: 'Team Lead / Principal',
        awisScore: 94,
        wellbeingRisk: 'Low',
        matchScore: 97
      },
      {
        id: 'emp_002',
        name: 'Marcus Vance',
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
        role: 'Senior Distributed Systems Eng',
        assignedRole: 'Distributed Systems Architect',
        awisScore: 91,
        wellbeingRisk: 'Moderate',
        matchScore: 95
      },
      {
        id: 'emp_007',
        name: 'Zoe Saldana',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        role: 'Security Engineer',
        assignedRole: 'Security & Compliance Lead',
        awisScore: 90,
        wellbeingRisk: 'Low',
        matchScore: 93
      },
      {
        id: 'emp_005',
        name: 'Aisha Patel',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'Data Science & ML Ops',
        assignedRole: 'Data Pipeline & MLOps',
        awisScore: 93,
        wellbeingRisk: 'Low',
        matchScore: 95
      }
    ]
  },
  {
    id: 'FRM-2026-055',
    projectId: 'proj-004',
    projectName: 'NeuroVision Edge Perception',
    projectDepartment: 'Autonomous Systems',
    createdAt: '2026-07-20T11:20:00Z',
    updatedAt: '2026-07-21T09:10:00Z',
    teamSize: 3,
    teamFitScore: 89.4,
    status: 'Draft',
    metrics: {
      skillCoverage: 88,
      workloadBalance: 86,
      sustainability: 92,
      availabilityCoverage: 88
    },
    notes: 'Draft setup awaiting final hardware vendor specification before locking roster.',
    members: [
      {
        id: 'emp_002',
        name: 'Marcus Vance',
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
        role: 'Senior Distributed Systems Eng',
        assignedRole: 'Distributed Systems Architect',
        awisScore: 91,
        wellbeingRisk: 'Moderate',
        matchScore: 92
      },
      {
        id: 'emp_008',
        name: 'Kenji Sato',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        role: 'Bio-Informatics Specialist',
        assignedRole: 'Algorithm Optimization Specialist',
        awisScore: 93,
        wellbeingRisk: 'Low',
        matchScore: 88
      },
      {
        id: 'emp_006',
        name: 'Liam O\'Connor',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'Full Stack Engineer',
        assignedRole: 'Senior Full Stack Engineer',
        awisScore: 89,
        wellbeingRisk: 'Moderate',
        matchScore: 88
      }
    ]
  },
  {
    id: 'FRM-2026-042',
    projectId: 'proj-001',
    projectName: 'Cloud Mesh Security Fabric',
    projectDepartment: 'Infrastructure',
    createdAt: '2026-06-15T08:00:00Z',
    updatedAt: '2026-06-15T12:00:00Z',
    teamSize: 3,
    teamFitScore: 93.8,
    status: 'Finalized',
    metrics: {
      skillCoverage: 100,
      workloadBalance: 91,
      sustainability: 97,
      availabilityCoverage: 96
    },
    notes: 'Multi-region mesh proxy upgrade and zero-trust perimeter enforcement.',
    members: [
      {
        id: 'emp_003',
        name: 'Elena Rostova',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        role: 'Cloud Architect & SRE',
        assignedRole: 'Team Lead / Principal',
        awisScore: 95,
        wellbeingRisk: 'Low',
        matchScore: 96
      },
      {
        id: 'emp_007',
        name: 'Zoe Saldana',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        role: 'Security Engineer',
        assignedRole: 'Security & Compliance Lead',
        awisScore: 90,
        wellbeingRisk: 'Low',
        matchScore: 94
      },
      {
        id: 'emp_002',
        name: 'Marcus Vance',
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
        role: 'Senior Distributed Systems Eng',
        assignedRole: 'Distributed Systems Architect',
        awisScore: 91,
        wellbeingRisk: 'Moderate',
        matchScore: 91
      }
    ]
  }
];
