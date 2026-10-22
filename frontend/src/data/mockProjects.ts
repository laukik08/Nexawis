export type {
  ProjectRequirement,
  ProjectTeamMember,
  ProjectMilestone,
  ProjectRisk,
  ProjectIntelligence,
  ProjectAwisFit,
  ProjectCapacity,
  Project,
  CreateProjectInput,
  ProjectListResponse,
  ProjectStatsResponse,
  ProjectFilterParams,
} from '../types/project';

import type { Project } from '../types/project';

export const mockProjects: Project[] = [
  {
    id: 'prj-1',
    projectId: 'PRJ-2024-081',
    name: 'Apollo Quantum Core',
    description: 'Next-generation core banking replacement with distributed ledger capabilities and real-time settlement engine.',
    department: 'Engineering',
    client: 'Global FinCorp',
    projectManager: 'Sarah Jenkins',
    status: 'Active',
    priority: 'Critical',
    complexity: 'High',
    teamSize: 12,
    progress: 45,
    overallRisk: 'High',
    teamFit: 82,
    startDate: '2024-01-15',
    deadline: '2024-11-30',
    
    intelligence: {
      priorityScore: 98,
      complexityScore: 95,
      requirementStability: 60,
      technicalRisk: 85,
      schedulePressure: 90,
      clientEngagement: 75,
      innovationIndex: 92,
      scopeChange: 40,
      budgetVariance: 15,
      deliveryDelayRisk: 65,
      successPrediction: {
        score: 72.5,
        trend: 'down',
        positiveFactors: [
          'Strong core team technical skills',
          'High client engagement at executive level',
          'Sufficient budget allocation'
        ],
        negativeFactors: [
          'Extreme schedule pressure',
          'High technical complexity',
          'Unstable regulatory requirements'
        ]
      }
    },
    
    requirements: [
      { skill: 'Rust', priority: 'High', level: 'Expert' },
      { skill: 'Distributed Systems', priority: 'High', level: 'Expert' },
      { skill: 'Kafka', priority: 'Medium', level: 'Advanced' },
      { skill: 'Financial Compliance', priority: 'High', level: 'Advanced' }
    ],
    
    currentTeam: [
      {
        id: 'emp-1',
        name: 'Alex Chen',
        avatarUrl: 'https://i.pravatar.cc/150?u=emp-1',
        role: 'Lead Architect',
        primarySkill: 'Rust',
        allocationPercent: 100,
        performanceScore: 95,
        teamFit: 98,
        wellbeingRisk: 'Moderate'
      },
      {
        id: 'emp-2',
        name: 'Maria Garcia',
        avatarUrl: 'https://i.pravatar.cc/150?u=emp-2',
        role: 'Senior Backend',
        primarySkill: 'Kafka',
        allocationPercent: 80,
        performanceScore: 88,
        teamFit: 90,
        wellbeingRisk: 'Low'
      },
      {
        id: 'emp-3',
        name: 'James Wilson',
        avatarUrl: 'https://i.pravatar.cc/150?u=emp-3',
        role: 'DevOps Engineer',
        primarySkill: 'Kubernetes',
        allocationPercent: 120,
        performanceScore: 92,
        teamFit: 85,
        wellbeingRisk: 'High'
      }
    ],
    
    milestones: [
      { id: 'm1', name: 'Architecture Review', status: 'Completed', date: '2024-02-28' },
      { id: 'm2', name: 'Core Engine Alpha', status: 'Completed', date: '2024-05-15' },
      { id: 'm3', name: 'Integration Beta', status: 'Current', date: '2024-08-01' },
      { id: 'm4', name: 'Security Audit', status: 'Upcoming', date: '2024-09-15' },
      { id: 'm5', name: 'Production Launch', status: 'Upcoming', date: '2024-11-30' }
    ],
    
    risks: [
      { category: 'Technical Risk', level: 'High', description: 'Novel consensus algorithm scaling issues', trend: 'up' },
      { category: 'Schedule Pressure', level: 'High', description: 'Client mandated hard deadline for Q4', trend: 'stable' },
      { category: 'Scope Change', level: 'Medium', description: 'Regulatory updates required new compliance module', trend: 'down' }
    ],
    
    awisFit: {
      overallScore: 82.4,
      skillsMatch: 95,
      availabilityMatch: 65,
      experienceMatch: 90,
      workloadBalance: 45,
      wellbeingImpact: 60,
      insights: [
        'Team has excellent technical coverage for core requirements.',
        'Significant burnout risk detected for infrastructure roles.',
        'Schedule pressure is causing workload imbalances.'
      ],
      explanation: {
        positives: [
          'Perfect match for Rust and Distributed Systems requirements.',
          'Seniority levels align perfectly with project complexity.'
        ],
        concerns: [
          'DevOps resources are currently overloaded (>120%).',
          'Missing dedicated compliance engineering coverage.'
        ]
      }
    },
    
    capacity: {
      totalRequired: 480, // hours/week
      allocated: 420,
      available: 0,
      overloadedMembers: 3,
      balancedMembers: 8
    }
  },
  {
    id: 'prj-2',
    projectId: 'PRJ-2024-102',
    name: 'Nexus Healthcare Portal',
    description: 'Patient-facing telemedicine and records portal with strict HIPAA compliance requirements.',
    department: 'Product',
    client: 'Nexus Health',
    projectManager: 'David Kim',
    status: 'On Track',
    priority: 'High',
    complexity: 'Medium',
    teamSize: 8,
    progress: 75,
    overallRisk: 'Low',
    teamFit: 94,
    startDate: '2024-03-01',
    deadline: '2024-10-15',
    
    intelligence: {
      priorityScore: 85,
      complexityScore: 70,
      requirementStability: 90,
      technicalRisk: 40,
      schedulePressure: 50,
      clientEngagement: 85,
      innovationIndex: 65,
      scopeChange: 15,
      budgetVariance: 5,
      deliveryDelayRisk: 20,
      successPrediction: {
        score: 91.2,
        trend: 'up',
        positiveFactors: [
          'Highly stable requirements',
          'Excellent team fit and capacity',
          'Low technical risk'
        ],
        negativeFactors: [
          'Strict compliance testing bottleneck'
        ]
      }
    },
    
    requirements: [
      { skill: 'React', priority: 'High', level: 'Advanced' },
      { skill: 'Node.js', priority: 'High', level: 'Advanced' },
      { skill: 'Healthcare IT', priority: 'High', level: 'Expert' },
      { skill: 'UI/UX Design', priority: 'Medium', level: 'Advanced' }
    ],
    
    currentTeam: [
      {
        id: 'emp-4',
        name: 'Emma Thompson',
        avatarUrl: 'https://i.pravatar.cc/150?u=emp-4',
        role: 'Frontend Lead',
        primarySkill: 'React',
        allocationPercent: 100,
        performanceScore: 92,
        teamFit: 96,
        wellbeingRisk: 'Low'
      },
      {
        id: 'emp-5',
        name: 'Raj Patel',
        avatarUrl: 'https://i.pravatar.cc/150?u=emp-5',
        role: 'Backend Engineer',
        primarySkill: 'Node.js',
        allocationPercent: 100,
        performanceScore: 89,
        teamFit: 92,
        wellbeingRisk: 'Low'
      }
    ],
    
    milestones: [
      { id: 'm1', name: 'Design System', status: 'Completed', date: '2024-04-15' },
      { id: 'm2', name: 'Core Infrastructure', status: 'Completed', date: '2024-06-01' },
      { id: 'm3', name: 'Patient App Beta', status: 'Completed', date: '2024-07-20' },
      { id: 'm4', name: 'Compliance Certification', status: 'Current', date: '2024-09-01' },
      { id: 'm5', name: 'Go Live', status: 'Upcoming', date: '2024-10-15' }
    ],
    
    risks: [
      { category: 'Requirement Stability', level: 'Low', description: 'Requirements locked, no major changes', trend: 'stable' },
      { category: 'Schedule Pressure', level: 'Medium', description: 'Comfortable buffer for compliance testing', trend: 'down' }
    ],
    
    awisFit: {
      overallScore: 94.5,
      skillsMatch: 95,
      availabilityMatch: 95,
      experienceMatch: 90,
      workloadBalance: 95,
      wellbeingImpact: 90,
      insights: [
        'Team is optimally balanced for this project phase.',
        'Zero burnout risk detected across the project team.',
        'Healthcare IT expertise requirement fully satisfied.'
      ],
      explanation: {
        positives: [
          'Excellent allocation balance across all members.',
          'Strong domain expertise in Healthcare IT.'
        ],
        concerns: [
          'Single point of failure on compliance expertise.'
        ]
      }
    },
    
    capacity: {
      totalRequired: 320,
      allocated: 320,
      available: 40,
      overloadedMembers: 0,
      balancedMembers: 8
    }
  },
  {
    id: 'prj-3',
    projectId: 'PRJ-2024-055',
    name: 'Global Supply Chain AI',
    description: 'Predictive analytics engine for supply chain optimization using machine learning.',
    department: 'Data Science',
    client: 'LogisTech Intl',
    projectManager: 'Marcus Johnson',
    status: 'At Risk',
    priority: 'Critical',
    complexity: 'High',
    teamSize: 6,
    progress: 30,
    overallRisk: 'High',
    teamFit: 65,
    startDate: '2024-05-01',
    deadline: '2024-12-31',
    
    intelligence: {
      priorityScore: 95,
      complexityScore: 90,
      requirementStability: 40,
      technicalRisk: 95,
      schedulePressure: 85,
      clientEngagement: 60,
      innovationIndex: 98,
      scopeChange: 75,
      budgetVariance: 25,
      deliveryDelayRisk: 85,
      successPrediction: {
        score: 55.4,
        trend: 'down',
        positiveFactors: [
          'High innovation potential',
          'Strong baseline data models'
        ],
        negativeFactors: [
          'Severe skill gaps in team',
          'Frequent scope changes by client',
          'High technical uncertainty'
        ]
      }
    },
    
    requirements: [
      { skill: 'Python', priority: 'High', level: 'Expert' },
      { skill: 'Machine Learning', priority: 'High', level: 'Expert' },
      { skill: 'Data Engineering', priority: 'High', level: 'Advanced' },
      { skill: 'Supply Chain Domain', priority: 'Medium', level: 'Advanced' }
    ],
    
    currentTeam: [
      {
        id: 'emp-6',
        name: 'Dr. Lin Wei',
        avatarUrl: 'https://i.pravatar.cc/150?u=emp-6',
        role: 'Lead Data Scientist',
        primarySkill: 'Machine Learning',
        allocationPercent: 100,
        performanceScore: 98,
        teamFit: 95,
        wellbeingRisk: 'Moderate'
      },
      {
        id: 'emp-7',
        name: 'Tom Baker',
        avatarUrl: 'https://i.pravatar.cc/150?u=emp-7',
        role: 'Data Engineer',
        primarySkill: 'Python',
        allocationPercent: 150,
        performanceScore: 85,
        teamFit: 70,
        wellbeingRisk: 'High'
      }
    ],
    
    milestones: [
      { id: 'm1', name: 'Data Pipeline Setup', status: 'Completed', date: '2024-06-15' },
      { id: 'm2', name: 'Model Training Alpha', status: 'Current', date: '2024-08-30' },
      { id: 'm3', name: 'Integration Testing', status: 'Upcoming', date: '2024-10-15' },
      { id: 'm4', name: 'Pilot Launch', status: 'Upcoming', date: '2024-12-31' }
    ],
    
    risks: [
      { category: 'Technical Risk', level: 'High', description: 'Data quality from client APIs is extremely poor', trend: 'up' },
      { category: 'Scope Change', level: 'High', description: 'Client repeatedly adding new optimization parameters', trend: 'up' },
      { category: 'Resource Risk', level: 'High', description: 'Missing critical Data Engineering capacity', trend: 'stable' }
    ],
    
    awisFit: {
      overallScore: 65.2,
      skillsMatch: 70,
      availabilityMatch: 40,
      experienceMatch: 85,
      workloadBalance: 30,
      wellbeingImpact: 45,
      insights: [
        'Critical capacity shortage in Data Engineering.',
        'High burnout risk for existing data engineering staff.',
        'Team lacks sufficient supply chain domain expertise.'
      ],
      explanation: {
        positives: [
          'Excellent lead data scientist fit and performance.'
        ],
        concerns: [
          'Data Engineer allocation is at 150%.',
          'Missing 2 full-time equivalent roles based on requirements.',
          'Domain expertise requirement is unmet.'
        ]
      }
    },
    
    capacity: {
      totalRequired: 240,
      allocated: 140,
      available: 0,
      overloadedMembers: 2,
      balancedMembers: 2
    }
  },
  {
    id: 'prj-4',
    projectId: 'PRJ-2024-115',
    name: 'Internal Tools Modernization',
    description: 'Upgrading legacy internal CRM and HR systems to modern React/Node stack.',
    department: 'Internal IT',
    projectManager: 'Elena Rostova',
    status: 'Planning',
    priority: 'Low',
    complexity: 'Low',
    teamSize: 4,
    progress: 5,
    overallRisk: 'Low',
    teamFit: 88,
    startDate: '2024-09-01',
    deadline: '2025-02-28',
    
    intelligence: {
      priorityScore: 30,
      complexityScore: 40,
      requirementStability: 85,
      technicalRisk: 20,
      schedulePressure: 15,
      clientEngagement: 90,
      innovationIndex: 30,
      scopeChange: 20,
      budgetVariance: 0,
      deliveryDelayRisk: 10,
      successPrediction: {
        score: 95.0,
        trend: 'stable',
        positiveFactors: [
          'Low complexity project',
          'No schedule pressure',
          'Internal stakeholders highly aligned'
        ],
        negativeFactors: [
          'Risk of resource reallocation to higher priority projects'
        ]
      }
    },
    
    requirements: [
      { skill: 'React', priority: 'Medium', level: 'Intermediate' },
      { skill: 'Node.js', priority: 'Medium', level: 'Intermediate' },
      { skill: 'Legacy Migration', priority: 'Low', level: 'Intermediate' }
    ],
    
    currentTeam: [
      {
        id: 'emp-8',
        name: 'Kevin Smith',
        avatarUrl: 'https://i.pravatar.cc/150?u=emp-8',
        role: 'Full Stack Developer',
        primarySkill: 'React',
        allocationPercent: 50,
        performanceScore: 82,
        teamFit: 90,
        wellbeingRisk: 'Low'
      }
    ],
    
    milestones: [
      { id: 'm1', name: 'Requirements Gathering', status: 'Current', date: '2024-09-15' },
      { id: 'm2', name: 'Architecture Design', status: 'Upcoming', date: '2024-10-15' },
      { id: 'm3', name: 'CRM Migration', status: 'Upcoming', date: '2024-12-15' },
      { id: 'm4', name: 'HR System Migration', status: 'Upcoming', date: '2025-02-15' }
    ],
    
    risks: [
      { category: 'Resource Risk', level: 'Medium', description: 'Team members often pulled for critical production bugs', trend: 'stable' }
    ],
    
    awisFit: {
      overallScore: 88.5,
      skillsMatch: 90,
      availabilityMatch: 95,
      experienceMatch: 85,
      workloadBalance: 90,
      wellbeingImpact: 95,
      insights: [
        'Good project for intermediate developers to grow skills.',
        'Low pressure environment allows for partial allocations.'
      ],
      explanation: {
        positives: [
          'Skills match perfectly with available intermediate developers.'
        ],
        concerns: [
          'Project needs 2 more part-time developers to start development phase.'
        ]
      }
    },
    
    capacity: {
      totalRequired: 160,
      allocated: 80,
      available: 80,
      overloadedMembers: 0,
      balancedMembers: 2
    }
  }
];
