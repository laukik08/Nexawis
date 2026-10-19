import { defaultInitialSettings } from '../data/mockSettings';
import type { 
  SettingsState, 
  UserProfile, 
  AccountPreferences, 
  AppearancePreferences, 
  NotificationPreferences, 
  WorkspaceSettings, 
  PrivacyPreferences,
  SettingsUpdateResult 
} from '../types/settings';

// In-memory session cache for frontend-only lifecycle
let settingsCache: SettingsState = structuredClone(defaultInitialSettings);

const simulateLatency = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms));

export const settingsService = {
  /**
   * Fetch current settings from session cache
   */
  async getSettings(): Promise<SettingsState> {
    await simulateLatency(120);
    return structuredClone(settingsCache);
  },

  /**
   * Update User Profile
   */
  async updateProfile(profile: UserProfile): Promise<SettingsUpdateResult<UserProfile>> {
    await simulateLatency(200);

    // Basic validation
    if (!profile.name.trim()) {
      throw new Error('Full Name is required.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profile.email.trim() || !emailRegex.test(profile.email)) {
      throw new Error('A valid business email address is required.');
    }

    // Auto-derive initials if not provided
    const initials = profile.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('') || 'NX';

    const updatedProfile: UserProfile = {
      ...profile,
      avatarInitials: initials
    };

    settingsCache.profile = updatedProfile;
    settingsCache.inSessionModified = true;
    settingsCache.lastSavedAt = new Date().toISOString();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexawis:profile_updated', { 
        detail: {
          name: updatedProfile.name,
          email: updatedProfile.email,
          role: updatedProfile.role,
          title: updatedProfile.title,
          department: updatedProfile.department,
          avatarUrl: updatedProfile.avatarUrl,
          avatarInitials: updatedProfile.avatarInitials
        } 
      }));
    }

    return {
      success: true,
      data: structuredClone(updatedProfile),
      message: 'Profile details updated in active session.',
      timestamp: settingsCache.lastSavedAt
    };
  },

  /**
   * Update Account Preferences (Localization, time zone, formats)
   */
  async updateAccount(account: AccountPreferences): Promise<SettingsUpdateResult<AccountPreferences>> {
    await simulateLatency(160);

    settingsCache.account = structuredClone(account);
    settingsCache.inSessionModified = true;
    settingsCache.lastSavedAt = new Date().toISOString();

    return {
      success: true,
      data: structuredClone(account),
      message: 'Account preferences updated in active session.',
      timestamp: settingsCache.lastSavedAt
    };
  },

  /**
   * Update Appearance Preferences (Theme, density, motion)
   */
  async updateAppearance(appearance: AppearancePreferences): Promise<SettingsUpdateResult<AppearancePreferences>> {
    await simulateLatency(150);

    settingsCache.appearance = structuredClone(appearance);
    settingsCache.inSessionModified = true;
    settingsCache.lastSavedAt = new Date().toISOString();

    return {
      success: true,
      data: structuredClone(appearance),
      message: 'Appearance preferences updated in active session.',
      timestamp: settingsCache.lastSavedAt
    };
  },

  /**
   * Update Notification Preferences (Toggles and groups)
   */
  async updateNotifications(notifications: NotificationPreferences): Promise<SettingsUpdateResult<NotificationPreferences>> {
    await simulateLatency(180);

    settingsCache.notifications = structuredClone(notifications);
    settingsCache.inSessionModified = true;
    settingsCache.lastSavedAt = new Date().toISOString();

    return {
      success: true,
      data: structuredClone(notifications),
      message: 'Notification preferences updated in active session.',
      timestamp: settingsCache.lastSavedAt
    };
  },

  /**
   * Update Workspace Configuration
   */
  async updateWorkspace(workspace: WorkspaceSettings): Promise<SettingsUpdateResult<WorkspaceSettings>> {
    await simulateLatency(180);

    if (!workspace.workspaceName.trim()) {
      throw new Error('Workspace Name cannot be empty.');
    }

    settingsCache.workspace = structuredClone(workspace);
    settingsCache.inSessionModified = true;
    settingsCache.lastSavedAt = new Date().toISOString();

    return {
      success: true,
      data: structuredClone(workspace),
      message: 'Workspace configuration updated in active session.',
      timestamp: settingsCache.lastSavedAt
    };
  },

  /**
   * Update Privacy & Security Preferences
   */
  async updatePrivacy(privacy: PrivacyPreferences): Promise<SettingsUpdateResult<PrivacyPreferences>> {
    await simulateLatency(150);

    settingsCache.privacy = structuredClone(privacy);
    settingsCache.inSessionModified = true;
    settingsCache.lastSavedAt = new Date().toISOString();

    return {
      success: true,
      data: structuredClone(privacy),
      message: 'Privacy & telemetry preferences updated in active session.',
      timestamp: settingsCache.lastSavedAt
    };
  },

  /**
   * Reset all settings to factory defaults
   */
  async resetToDefaults(): Promise<SettingsUpdateResult<SettingsState>> {
    await simulateLatency(250);

    settingsCache = structuredClone(defaultInitialSettings);
    settingsCache.inSessionModified = false;
    settingsCache.lastSavedAt = new Date().toISOString();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexawis:profile_updated', { 
        detail: {
          name: defaultInitialSettings.profile.name,
          email: defaultInitialSettings.profile.email,
          role: defaultInitialSettings.profile.role,
          title: defaultInitialSettings.profile.title,
          department: defaultInitialSettings.profile.department,
          avatarUrl: defaultInitialSettings.profile.avatarUrl,
          avatarInitials: defaultInitialSettings.profile.avatarInitials
        } 
      }));
    }

    return {
      success: true,
      data: structuredClone(settingsCache),
      message: 'All settings have been restored to default factory presets.',
      timestamp: settingsCache.lastSavedAt
    };
  },

  /**
   * Export settings configuration as JSON string
   */
  async exportSettingsJson(): Promise<{ jsonString: string; filename: string }> {
    await simulateLatency(100);
    const exportData = {
      product: 'NEXAWIS Workforce Intelligence',
      version: '1.0.0-demo',
      exportedAt: new Date().toISOString(),
      settings: settingsCache
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const filename = `nexawis-settings-export-${new Date().toISOString().split('T')[0]}.json`;

    return { jsonString, filename };
  }
};
