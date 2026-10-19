import type { 
  SettingsState, 
  SettingsSectionDef 
} from '../types/settings';

export const settingsSections: SettingsSectionDef[] = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Personal details, avatar, credentials, and departmental role',
  },
  {
    id: 'account',
    label: 'Account Preferences',
    description: 'Localization, time zone, date formatting, and default landing page',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Theme customization, interface density, and motion preferences',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Project alerts, workforce warnings, and report delivery toggles',
  },
  {
    id: 'workspace',
    label: 'Workspace',
    description: 'Organization name, default scopes, and reporting baseline settings',
  },
  {
    id: 'privacy',
    label: 'Privacy & Security',
    description: 'Session telemetry, enterprise security roadmap, and legal policies',
  },
  {
    id: 'data',
    label: 'Data & Preferences',
    description: 'Export configuration, factory defaults, and session memory overview',
  }
];

export const avatarPresets: Array<{ id: string; label: string; url: string }> = [
  {
    id: 'headshot-1',
    label: 'Executive (Default)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'headshot-2',
    label: 'Professional 1',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'headshot-3',
    label: 'Professional 2',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'headshot-4',
    label: 'Professional 3',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  }
];

export const languageOptions = [
  { code: 'en-US', name: 'English (United States)', note: 'Full Interface Active' },
  { code: 'en-GB', name: 'English (United Kingdom)', note: 'Demonstration Locale' },
  { code: 'es-ES', name: 'Español (España)', note: 'Demonstration Locale' },
  { code: 'fr-FR', name: 'Français (France)', note: 'Demonstration Locale' },
  { code: 'de-DE', name: 'Deutsch (Deutschland)', note: 'Demonstration Locale' },
  { code: 'ja-JP', name: '日本語 (Japan)', note: 'Demonstration Locale' }
];

export const timezoneOptions = [
  'UTC (Coordinated Universal Time)',
  'America/New_York (EST/EDT - UTC-5)',
  'America/Chicago (CST/CDT - UTC-6)',
  'America/Denver (MST/MDT - UTC-7)',
  'America/Los_Angeles (PST/PDT - UTC-8)',
  'Europe/London (GMT/BST - UTC+0)',
  'Europe/Berlin (CET/CEST - UTC+1)',
  'Europe/Paris (CET/CEST - UTC+1)',
  'Asia/Dubai (GST - UTC+4)',
  'Asia/Kolkata (IST - UTC+5:30)',
  'Asia/Singapore (SGT - UTC+8)',
  'Asia/Tokyo (JST - UTC+9)',
  'Australia/Sydney (AEST - UTC+10)'
];

export const dateFormatOptions = [
  { value: 'YYYY-MM-DD', label: '2026-10-19 (ISO YYYY-MM-DD)', example: '2026-10-19' },
  { value: 'MM/DD/YYYY', label: '10/19/2026 (US Standard)', example: '10/19/2026' },
  { value: 'DD/MM/YYYY', label: '19/10/2026 (European Standard)', example: '19/10/2026' },
  { value: 'MMM D, YYYY', label: 'Oct 19, 2026 (Expanded Short)', example: 'Oct 19, 2026' }
];

export const defaultLandingPageOptions = [
  { 
    route: '/app', 
    label: 'Dashboard (Executive Overview)', 
    description: 'Central workforce health scores, AWIS radar overview, and live critical telemetry' 
  },
  { 
    route: '/app/employees', 
    label: 'Employees Directory', 
    description: 'Workforce directory, 9-dimension radar scores, capacity and burnout risks' 
  },
  { 
    route: '/app/projects', 
    label: 'Projects & Initiatives', 
    description: 'Active enterprise portfolio, milestones, delivery health, and staffing rosters' 
  },
  { 
    route: '/app/teams', 
    label: 'Team Formation AI', 
    description: 'Automated multi-factor team generation and synergistic compatibility' 
  },
  { 
    route: '/app/analytics', 
    label: 'Workforce Analytics', 
    description: 'Deep AWIS dimensional distributions, department heatmaps, and capacity forecasts' 
  },
  { 
    route: '/app/reports', 
    label: 'Reports Center', 
    description: 'Standardized executive briefs, compliance exports, and printable PDF digests' 
  }
];

export const departmentOptions = [
  'All',
  'Engineering',
  'Product',
  'Design',
  'Operations',
  'Data & AI',
  'People & Talent'
];

export const defaultInitialSettings: SettingsState = {
  profile: {
    name: 'Alex Rivera',
    email: 'alex@nexawis.com',
    role: 'Enterprise Administrator',
    title: 'Principal Workforce Architect',
    department: 'Data & AI',
    phone: '+1 (555) 234-8901',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    avatarInitials: 'AR'
  },
  account: {
    language: 'en-US',
    timezone: 'America/New_York (EST/EDT - UTC-5)',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12h',
    defaultLandingPage: '/app'
  },
  appearance: {
    theme: 'dark',
    density: 'comfortable',
    motion: 'full',
    highContrastBorders: true
  },
  notifications: {
    projectUpdates: {
      statusChanges: true,
      deadlines: true,
      riskThreshold: true
    },
    teamFormation: {
      optimizationComplete: true,
      recommendationsReady: true,
      balanceAlerts: true
    },
    workforceIntelligence: {
      burnoutRisk: true,
      skillScarcity: true,
      awisFluctuations: false
    },
    reports: {
      automatedGenerated: true,
      weeklyDigest: true,
      scheduledDistribution: false
    },
    productUpdates: {
      systemMaintenance: true,
      featureAnnouncements: false
    },
    deliveryChannels: {
      inAppBadge: true,
      emailDigest: true
    }
  },
  workspace: {
    workspaceName: 'NEXAWIS Global Intelligence',
    workspaceSlug: 'nexawis-corp-prod',
    defaultDepartment: 'All',
    defaultReportingPeriod: 'Quarter to Date',
    defaultProjectView: 'grid',
    preferredAnalyticsTab: 'workforce_allocation',
    defaultReportFormat: 'PDF'
  },
  privacy: {
    shareTelemetry: true,
    displayActiveSession: true,
    sessionDuration: 'Active (Session started 45m ago)',
    clientIp: '192.168.1.104 (Encrypted Local Tunnel)',
    browserDevice: 'Google Chrome 130 on Windows 11'
  },
  lastSavedAt: new Date().toISOString(),
  inSessionModified: false
};
