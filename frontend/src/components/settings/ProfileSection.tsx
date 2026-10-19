import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Briefcase, 
  Building, 
  Phone, 
  Check, 
  RotateCcw, 
  AlertCircle,
  Save,
  Sparkles
} from 'lucide-react';
import type { UserProfile } from '../../types/settings';
import { avatarPresets, departmentOptions } from '../../data/mockSettings';

interface ProfileSectionProps {
  initialProfile: UserProfile;
  onSave: (profile: UserProfile) => Promise<void>;
  isSaving: boolean;
  onMarkModified: (isModified: boolean) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  initialProfile,
  onSave,
  isSaving,
  onMarkModified
}) => {
  const [formData, setFormData] = useState<UserProfile>(initialProfile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync with initial profile if updated externally
  useEffect(() => {
    setFormData(initialProfile);
  }, [initialProfile]);

  // Compute dirty state
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialProfile);

  const prevDirtyRef = useRef<boolean>(false);
  useEffect(() => {
    if (prevDirtyRef.current !== isDirty) {
      prevDirtyRef.current = isDirty;
      onMarkModified(isDirty);
    }
  }, [isDirty, onMarkModified]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email format (e.g. user@nexawis.com).';
    }

    if (formData.phone && formData.phone.trim().length > 0) {
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Please enter a valid phone number (e.g. +1 (555) 234-8901).';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSave(formData);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to update profile.' });
    }
  };

  const handleCancel = () => {
    setFormData(initialProfile);
    setErrors({});
  };

  const handleSelectPreset = (url: string) => {
    setFormData(prev => ({ ...prev, avatarUrl: url }));
  };

  const handleClearAvatar = () => {
    setFormData(prev => ({ ...prev, avatarUrl: '' }));
  };

  // Derive initials live
  const dynamicInitials = formData.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('') || 'NX';

  return (
    <div className="space-y-6">
      {/* Section Header Card */}
      <div 
        className="card-base p-6 rounded-2xl border shadow-sm"
        style={{
          backgroundColor: 'var(--color-surface-1)',
          borderColor: 'var(--color-border-strong)'
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Profile Details
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Configure your executive identity, contact credentials, and organizational department.
            </p>
          </div>

          {isDirty && (
            <span 
              className="px-2.5 py-1 text-xs font-bold rounded-lg border shadow-xs"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: '#f59e0b',
                color: '#f59e0b'
              }}
            >
              Unsaved Changes
            </span>
          )}
        </div>

        {/* Global Alerts */}
        {errors.form && (
          <div 
            className="my-4 p-3 rounded-xl border text-xs flex items-center gap-2 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: '#ef4444',
              color: '#ef4444'
            }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {isSuccess && (
          <div 
            className="my-4 p-3 rounded-xl border text-xs flex items-center gap-2 shadow-xs"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-accent-lime)',
              color: 'var(--color-accent-lime)'
            }}
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>Profile successfully updated in active session.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Avatar Preview & Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--color-text-secondary)' }}>
              Profile Avatar & Initials Preview
            </label>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Main Avatar Graphic */}
              <div className="relative shrink-0">
                {formData.avatarUrl ? (
                  <img 
                    src={formData.avatarUrl} 
                    alt={formData.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 shadow-md"
                    style={{ borderColor: 'var(--color-accent-cyan)' }}
                  />
                ) : (
                  <div 
                    className="w-20 h-20 rounded-2xl border-2 flex items-center justify-center font-black text-2xl shadow-md"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      borderColor: 'var(--color-accent-cyan)',
                      color: 'var(--color-accent-cyan)'
                    }}
                  >
                    {dynamicInitials}
                  </div>
                )}

                <div 
                  className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shadow-xs"
                  style={{
                    backgroundColor: 'var(--color-surface-1)',
                    borderColor: 'var(--color-border-strong)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  {dynamicInitials}
                </div>
              </div>

              {/* Avatar Selector Presets */}
              <div className="flex-1 space-y-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Select Demonstration Preset Avatar:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {avatarPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer hover:scale-105 shadow-xs ${
                        formData.avatarUrl === preset.url ? 'ring-2 ring-[var(--color-accent-cyan)]' : ''
                      }`}
                      style={{
                        borderColor: formData.avatarUrl === preset.url ? 'var(--color-accent-cyan)' : 'var(--color-border-strong)'
                      }}
                      title={preset.label}
                    >
                      <img src={preset.url} alt={preset.label} className="w-10 h-10 rounded-lg object-cover" />
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleClearAvatar}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-xs hover:border-[var(--color-accent-cyan)]"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      borderColor: 'var(--color-border-strong)',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    Initials Only
                  </button>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  Avatars are simulated for demonstration. Upload endpoints can be wired to S3 / Supabase storage later.
                </p>
              </div>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: errors.name ? '#ef4444' : 'var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.name}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Business Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }));
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  placeholder="e.g. alex@nexawis.com"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: errors.email ? '#ef4444' : 'var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Job Title / Role */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Job Title & Role
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input 
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Principal Workforce Architect"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Assigned Department
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {departmentOptions.filter(d => d !== 'All').map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Phone Number */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Direct Phone Number <span className="text-[11px] font-normal" style={{ color: 'var(--color-text-muted)' }}>(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input 
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, phone: e.target.value }));
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  placeholder="e.g. +1 (555) 234-8901"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: errors.phone ? '#ef4444' : 'var(--color-border-strong)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Form Actions Toolbar */}
          <div className="flex items-center justify-between pt-4 border-t flex-wrap gap-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
              <span>In-session updates reflect immediately across topbar and profile badges.</span>
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              {isDirty && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  <span>Cancel</span>
                </button>
              )}

              <button
                type="submit"
                disabled={!isDirty || isSaving}
                className="btn-primary px-5 py-2 text-xs font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
