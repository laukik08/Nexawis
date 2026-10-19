import { Menu, Search, Bell, Sun, Moon, LogOut, User as UserIcon, ChevronDown, Settings } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="h-20 bg-[--color-bg-base]/80 backdrop-blur-xl border-b border-[--color-border-subtle] flex items-center justify-between px-6 sticky top-0 z-30">
      
      {/* Left: Mobile Menu & Contextual Title (if needed) */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-[--color-text-secondary] hover:text-[--color-text-primary] rounded-xl hover:bg-[--color-surface-2] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Placeholder for page title context, can be passed via props later */}
        {/* <h1 className="text-xl font-bold text-[--color-text-primary] hidden sm:block">Dashboard</h1> */}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-3 sm:space-x-5">
        
        {/* Search */}
        <div className="hidden md:flex items-center bg-[--color-surface-2] border border-[--color-border-strong] rounded-full px-4 py-2 focus-within:border-[--color-accent-cyan] focus-within:ring-1 focus-within:ring-[--color-accent-cyan]/50 transition-all">
          <Search className="w-4 h-4 text-[--color-text-muted] mr-2" />
          <input 
            type="text" 
            placeholder="Search employees, projects..." 
            className="bg-transparent border-none outline-none text-sm text-[--color-text-primary] placeholder-[--color-text-muted] w-48 lg:w-64"
          />
        </div>
        <button className="md:hidden p-2 text-[--color-text-secondary] hover:text-[--color-text-primary] rounded-full hover:bg-[--color-surface-2] transition-colors">
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-[--color-text-secondary] hover:text-[--color-text-primary] rounded-full hover:bg-[--color-surface-2] transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-400 border-2 border-[--color-bg-base]" />
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-[--color-text-secondary] hover:text-[--color-text-primary] rounded-full hover:bg-[--color-surface-2] transition-colors relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {theme === 'dark' ? (
              <motion.div key="moon" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                <Moon className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div key="sun" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                <Sun className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* User Profile - Attached and Routed to Profile in Settings */}
        <div className="relative flex items-center" ref={dropdownRef}>
          {/* Main Profile Icon & Name Button -> Navigates directly to Profile in Settings */}
          <button 
            onClick={() => navigate('/app/settings?section=profile')}
            className="flex items-center space-x-2.5 p-1 rounded-full border border-transparent hover:border-[--color-border-strong] hover:bg-[--color-surface-2] transition-colors pl-1 pr-2 cursor-pointer group"
            title="Open Profile in Settings"
          >
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user?.name || "Profile"} 
                className="w-8 h-8 rounded-full object-cover border border-[--color-border-subtle] group-hover:border-[var(--color-accent-cyan)] transition-colors"
              />
            ) : (
              <div 
                className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-colors shadow-xs"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-accent-cyan)',
                  color: 'var(--color-accent-cyan)'
                }}
              >
                {user?.avatarInitials || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'AR')}
              </div>
            )}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[--color-text-primary] max-w-[120px] truncate group-hover:text-[var(--color-accent-cyan)] transition-colors">
                {user?.name || "Alex Rivera"}
              </span>
              <span className="text-[10px] text-[--color-text-muted] max-w-[120px] truncate leading-tight">
                {user?.title || "Workforce Architect"}
              </span>
            </div>
          </button>

          {/* Dropdown Chevron Trigger */}
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="p-1 rounded-full text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-surface-2] transition-colors cursor-pointer ml-0.5"
            title="Profile & account options"
            aria-label="Toggle user options menu"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-64 bg-[var(--color-surface-1)] shadow-xl border border-[var(--color-border-strong)] rounded-2xl py-2 z-50 origin-top-right overflow-hidden top-full"
              >
                {/* Header Card -> Routes to Profile in Settings */}
                <div 
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/app/settings?section=profile');
                  }}
                  className="px-4 py-3 border-b border-[--color-border-subtle] mb-1 bg-[--color-surface-2]/60 cursor-pointer hover:bg-[--color-surface-2] transition-colors group"
                  title="Click to view and edit Profile in Settings"
                >
                  <div className="flex items-center gap-2.5">
                    {user?.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt={user?.name || "Profile"} 
                        className="w-9 h-9 rounded-xl object-cover border border-[--color-border-subtle]"
                      />
                    ) : (
                      <div 
                        className="w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs"
                        style={{
                          backgroundColor: 'var(--color-surface-2)',
                          borderColor: 'var(--color-accent-cyan)',
                          color: 'var(--color-accent-cyan)'
                        }}
                      >
                        {user?.avatarInitials || 'AR'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-[--color-text-primary] truncate group-hover:text-[var(--color-accent-cyan)] transition-colors">
                        {user?.name || "Alex Rivera"}
                      </div>
                      <div className="text-[11px] text-[--color-text-secondary] truncate">
                        {user?.title || "Principal Workforce Architect"}
                      </div>
                      <div className="text-[10px] text-[--color-text-muted] truncate font-mono mt-0.5">
                        {user?.email || "alex@nexawis.com"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] font-semibold text-[var(--color-accent-cyan)] flex items-center gap-1">
                    <span>Manage Profile in Settings</span>
                    <span>→</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/app/settings?section=profile');
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-surface-2] flex items-center transition-colors cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 mr-3 text-[var(--color-accent-cyan)]" />
                  <span>Profile Settings</span>
                </button>
                <button 
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/app/settings?section=account');
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-surface-2] flex items-center transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-3 text-purple-400" />
                  <span>Account Preferences</span>
                </button>
                
                <div className="h-px bg-[--color-border-subtle] my-1" />
                
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 flex items-center transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
}
