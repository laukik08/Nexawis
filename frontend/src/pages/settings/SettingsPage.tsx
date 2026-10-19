import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { settingsService } from '../../services/settingsService';
import type { 
  SettingsState, 
  SettingsSectionId, 
  UserProfile, 
  AccountPreferences, 
  AppearancePreferences, 
  NotificationPreferences, 
  WorkspaceSettings, 
  PrivacyPreferences 
} from '../../types/settings';
import { defaultInitialSettings } from '../../data/mockSettings';
import { SettingsHeader } from '../../components/settings/SettingsHeader';
import { SettingsNav } from '../../components/settings/SettingsNav';
import { ProfileSection } from '../../components/settings/ProfileSection';
import { AccountSection } from '../../components/settings/AccountSection';
import { AppearanceSection } from '../../components/settings/AppearanceSection';
import { NotificationsSection } from '../../components/settings/NotificationsSection';
import { WorkspaceSection } from '../../components/settings/WorkspaceSection';
import { PrivacySecuritySection } from '../../components/settings/PrivacySecuritySection';
import { DataPreferencesSection } from '../../components/settings/DataPreferencesSection';
import { ResetConfirmationModal } from '../../components/settings/ResetConfirmationModal';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function SettingsPage() {
  const { section: pathSection } = useParams<{ section?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const querySection = searchParams.get('section') || searchParams.get('tab');
  const requestedSection = (pathSection || querySection || 'profile') as SettingsSectionId;

  const validSections: SettingsSectionId[] = ['profile', 'account', 'appearance', 'notifications', 'workspace', 'privacy', 'data'];

  const [activeSection, setActiveSection] = useState<SettingsSectionId>(
    validSections.includes(requestedSection) ? requestedSection : 'profile'
  );

  // Settings state loaded from service
  const [settings, setSettings] = useState<SettingsState>(defaultInitialSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Unsaved modifications per section
  const [modifiedSections, setModifiedSections] = useState<Record<string, boolean>>({});

  // Reset modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync section with query params or path params
  useEffect(() => {
    const sec = (pathSection || searchParams.get('section') || searchParams.get('tab')) as SettingsSectionId;
    if (sec && validSections.includes(sec)) {
      setActiveSection(sec);
    }
  }, [pathSection, searchParams]);

  const handleSelectSection = (sec: SettingsSectionId) => {
    setActiveSection(sec);
    if (pathSection) {
      navigate(`/app/settings/${sec}`);
    } else {
      setSearchParams({ section: sec });
    }
  };

  // Stable memoized modification tracker that does not trigger re-renders if state hasn't changed
  const handleMarkModified = useCallback((section: string, isModified: boolean) => {
    setModifiedSections(prev => {
      if (prev[section] === isModified) return prev;
      return { ...prev, [section]: isModified };
    });
  }, []);

  const onProfileModified = useCallback((val: boolean) => handleMarkModified('profile', val), [handleMarkModified]);
  const onAccountModified = useCallback((val: boolean) => handleMarkModified('account', val), [handleMarkModified]);
  const onAppearanceModified = useCallback((val: boolean) => handleMarkModified('appearance', val), [handleMarkModified]);
  const onNotificationsModified = useCallback((val: boolean) => handleMarkModified('notifications', val), [handleMarkModified]);
  const onWorkspaceModified = useCallback((val: boolean) => handleMarkModified('workspace', val), [handleMarkModified]);
  const onPrivacyModified = useCallback((val: boolean) => handleMarkModified('privacy', val), [handleMarkModified]);

  // Load initial settings
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
      showToast('Failed to load settings configuration.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Section Save Handlers
  const handleSaveProfile = async (profile: UserProfile) => {
    setIsSaving(true);
    try {
      const res = await settingsService.updateProfile(profile);
      setSettings(prev => ({
        ...prev,
        profile: res.data,
        lastSavedAt: res.timestamp,
        inSessionModified: true
      }));
      setModifiedSections(prev => ({ ...prev, profile: false }));
      showToast('Profile details updated successfully.');
    } catch (err: any) {
      showToast(err.message || 'Error updating profile.', 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAccount = async (account: AccountPreferences) => {
    setIsSaving(true);
    try {
      const res = await settingsService.updateAccount(account);
      setSettings(prev => ({
        ...prev,
        account: res.data,
        lastSavedAt: res.timestamp,
        inSessionModified: true
      }));
      setModifiedSections(prev => ({ ...prev, account: false }));
      showToast('Account preferences saved.');
    } catch (err: any) {
      showToast(err.message || 'Error updating account preferences.', 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAppearance = async (appearance: AppearancePreferences) => {
    setIsSaving(true);
    try {
      const res = await settingsService.updateAppearance(appearance);
      setSettings(prev => ({
        ...prev,
        appearance: res.data,
        lastSavedAt: res.timestamp,
        inSessionModified: true
      }));
      setModifiedSections(prev => ({ ...prev, appearance: false }));
      showToast('Appearance settings saved.');
    } catch (err: any) {
      showToast(err.message || 'Error updating appearance.', 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async (notifications: NotificationPreferences) => {
    setIsSaving(true);
    try {
      const res = await settingsService.updateNotifications(notifications);
      setSettings(prev => ({
        ...prev,
        notifications: res.data,
        lastSavedAt: res.timestamp,
        inSessionModified: true
      }));
      setModifiedSections(prev => ({ ...prev, notifications: false }));
      showToast('Notification preferences saved.');
    } catch (err: any) {
      showToast(err.message || 'Error updating notifications.', 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWorkspace = async (workspace: WorkspaceSettings) => {
    setIsSaving(true);
    try {
      const res = await settingsService.updateWorkspace(workspace);
      setSettings(prev => ({
        ...prev,
        workspace: res.data,
        lastSavedAt: res.timestamp,
        inSessionModified: true
      }));
      setModifiedSections(prev => ({ ...prev, workspace: false }));
      showToast('Workspace configuration saved.');
    } catch (err: any) {
      showToast(err.message || 'Error updating workspace.', 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrivacy = async (privacy: PrivacyPreferences) => {
    setIsSaving(true);
    try {
      const res = await settingsService.updatePrivacy(privacy);
      setSettings(prev => ({
        ...prev,
        privacy: res.data,
        lastSavedAt: res.timestamp,
        inSessionModified: true
      }));
      setModifiedSections(prev => ({ ...prev, privacy: false }));
      showToast('Privacy preferences saved.');
    } catch (err: any) {
      showToast(err.message || 'Error updating privacy.', 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    try {
      setIsResetting(true);
      const res = await settingsService.resetToDefaults();
      setSettings(res.data);
      setModifiedSections({});
      setIsResetModalOpen(false);
      showToast('All settings restored to factory defaults.');
    } catch (err) {
      showToast('Failed to reset settings.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportJson = async () => {
    try {
      const { jsonString, filename } = await settingsService.exportSettingsJson();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Settings configuration exported successfully.');
    } catch {
      showToast('Failed to export settings.', 'error');
    }
  };

  // Has any section modified in session
  const anyModified = Object.values(modifiedSections).some(Boolean) || settings.inSessionModified;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <Loader2 className="w-8 h-8 text-[var(--color-accent-cyan)] animate-spin" />
        <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
          Loading workspace and account settings...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Container */}
      {toast && (
        <div 
          className="fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border transition-all animate-bounce"
          style={{
            backgroundColor: 'var(--color-surface-1)',
            borderColor: toast.type === 'success' ? 'var(--color-accent-lime)' : '#ef4444',
            color: 'var(--color-text-primary)'
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[var(--color-accent-lime)] shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Settings Top Header */}
      <SettingsHeader
        onResetDefaults={() => setIsResetModalOpen(true)}
        onExportJson={handleExportJson}
        isModified={anyModified}
        lastSavedAt={settings.lastSavedAt}
        isSaving={isSaving}
      />

      {/* Main Settings Responsive Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Navigation Rail */}
        <SettingsNav
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          modifiedSections={modifiedSections}
        />

        {/* Section Content Panel */}
        <main className="flex-1 min-w-0 w-full" role="tabpanel" aria-labelledby={`tab-${activeSection}`}>
          {activeSection === 'profile' && (
            <ProfileSection
              initialProfile={settings.profile}
              onSave={handleSaveProfile}
              isSaving={isSaving}
              onMarkModified={onProfileModified}
            />
          )}

          {activeSection === 'account' && (
            <AccountSection
              initialAccount={settings.account}
              onSave={handleSaveAccount}
              isSaving={isSaving}
              onMarkModified={onAccountModified}
            />
          )}

          {activeSection === 'appearance' && (
            <AppearanceSection
              initialAppearance={settings.appearance}
              onSave={handleSaveAppearance}
              isSaving={isSaving}
              onMarkModified={onAppearanceModified}
            />
          )}

          {activeSection === 'notifications' && (
            <NotificationsSection
              initialNotifications={settings.notifications}
              onSave={handleSaveNotifications}
              isSaving={isSaving}
              onMarkModified={onNotificationsModified}
            />
          )}

          {activeSection === 'workspace' && (
            <WorkspaceSection
              initialWorkspace={settings.workspace}
              onSave={handleSaveWorkspace}
              isSaving={isSaving}
              onMarkModified={onWorkspaceModified}
            />
          )}

          {activeSection === 'privacy' && (
            <PrivacySecuritySection
              initialPrivacy={settings.privacy}
              onSave={handleSavePrivacy}
              isSaving={isSaving}
              onMarkModified={onPrivacyModified}
            />
          )}

          {activeSection === 'data' && (
            <DataPreferencesSection
              currentSettings={settings}
              onResetDefaultsClick={() => setIsResetModalOpen(true)}
              onClearSessionEdits={() => setModifiedSections({})}
              isModified={anyModified}
            />
          )}
        </main>
      </div>

      {/* Reset Confirmation Dialog */}
      <ResetConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        isResetting={isResetting}
      />
    </div>
  );
}
