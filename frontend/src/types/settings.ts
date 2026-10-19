/**
 * NEXAWIS Settings Module - TypeScript Type Definitions
 * Structured for enterprise frontend simulation and future API integration.
 */

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  title: string;
  department: string;
  phone?: string;
  avatarUrl?: string;
  avatarInitials: string;
}

export interface AccountPreferences {
  language: string; // e.g. 'en-US'
  timezone: string; // e.g. 'America/New_York'
  dateFormat: string; // e.g. 'YYYY-MM-DD'
  timeFormat: '12h' | '24h';
  defaultLandingPage: string; // e.g. '/app'
}

export interface AppearancePreferences {
  theme: 'light' | 'dark' | 'system';
  density: 'comfortable' | 'compact';
  motion: 'full' | 'reduced';
  highContrastBorders: boolean;
}

export interface ProjectNotificationSettings {
  statusChanges: boolean;
  deadlines: boolean;
  riskThreshold: boolean;
}

export interface TeamFormationNotificationSettings {
  optimizationComplete: boolean;
  recommendationsReady: boolean;
  balanceAlerts: boolean;
}

export interface WorkforceNotificationSettings {
  burnoutRisk: boolean;
  skillScarcity: boolean;
  awisFluctuations: boolean;
}

export interface ReportsNotificationSettings {
  automatedGenerated: boolean;
  weeklyDigest: boolean;
  scheduledDistribution: boolean;
}

export interface ProductNotificationSettings {
  systemMaintenance: boolean;
  featureAnnouncements: boolean;
}

export interface DeliveryChannelSettings {
  inAppBadge: boolean;
  emailDigest: boolean;
}

export interface NotificationPreferences {
  projectUpdates: ProjectNotificationSettings;
  teamFormation: TeamFormationNotificationSettings;
  workforceIntelligence: WorkforceNotificationSettings;
  reports: ReportsNotificationSettings;
  productUpdates: ProductNotificationSettings;
  deliveryChannels: DeliveryChannelSettings;
}

export interface WorkspaceSettings {
  workspaceName: string;
  workspaceSlug: string;
  defaultDepartment: string;
  defaultReportingPeriod: string;
  defaultProjectView: 'grid' | 'table';
  preferredAnalyticsTab: string;
  defaultReportFormat: 'PDF' | 'CSV';
}

export interface PrivacyPreferences {
  shareTelemetry: boolean;
  displayActiveSession: boolean;
  sessionDuration: string;
  clientIp: string;
  browserDevice: string;
}

export interface SettingsState {
  profile: UserProfile;
  account: AccountPreferences;
  appearance: AppearancePreferences;
  notifications: NotificationPreferences;
  workspace: WorkspaceSettings;
  privacy: PrivacyPreferences;
  lastSavedAt?: string;
  inSessionModified: boolean;
}

export type SettingsSectionId = 
  | 'profile' 
  | 'account' 
  | 'appearance' 
  | 'notifications' 
  | 'workspace' 
  | 'privacy' 
  | 'data';

export interface SettingsSectionDef {
  id: SettingsSectionId;
  label: string;
  description: string;
  badge?: string;
}

export interface SettingsUpdateResult<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}
