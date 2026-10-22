import { 
  Menu, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  LogOut, 
  User as UserIcon, 
  ChevronDown, 
  Settings, 
  Building2, 
  Sparkles, 
  RotateCcw, 
  Check, 
  Loader2 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { demoService } from '../../services/demoService';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onMenuClick: () => void;
}

const DEMO_WORKSPACE_ID = 'd0000000-0000-0000-0000-000000000001';

export function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, workspaces, activeWorkspaceId, switchWorkspace } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const wsDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const isDemo = activeWorkspaceId === DEMO_WORKSPACE_ID || activeWs?.id === DEMO_WORKSPACE_ID;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (wsDropdownRef.current && !wsDropdownRef.current.contains(event.target as Node)) {
        setWorkspaceOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleResetDemo = async () => {
    try {
      setIsResetting(true);
      setResetMessage(null);
      await demoService.resetWorkspace();
      setResetMessage('Demo data reset successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch {
      setResetMessage('Failed to reset demo.');
      setIsResetting(false);
    }
  };

  return (
    <header className="h-20 bg-[--color-bg-base]/80 backdrop-blur-xl border-b border-[--color-border-subtle] flex items-center justify-between px-6 sticky top-0 z-30">
      
      {/* Left: Mobile Menu & Workspace Selector */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-[--color-text-secondary] hover:text-[--color-text-primary] rounded-xl hover:bg-[--color-surface-2] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Workspace Selector Dropdown */}
        <div className="relative" ref={wsDropdownRef}>
          <button
            onClick={() => setWorkspaceOpen(!workspaceOpen)}
            className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border border-[--color-border-strong] bg-[--color-surface-1] hover:bg-[--color-surface-2] transition-all duration-200 group text-left cursor-pointer shadow-sm"
            title="Switch Workspace"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              isDemo ? 'bg-[--color-accent-cyan]/15 text-[--color-accent-cyan]' : 'bg-[--color-surface-3] text-[--color-text-secondary]'
            }`}>
              {isDemo ? <Sparkles className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-xs sm:text-sm text-[--color-text-primary] max-w-[140px] sm:max-w-[200px] truncate">
                  {activeWs?.name || 'NEXAWIS Enterprise Demo'}
                </span>
                {isDemo && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[--color-accent-cyan]/15 text-[--color-accent-cyan] border border-[--color-accent-cyan]/30 uppercase tracking-wider">
                    Demo
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[--color-text-muted] capitalize">
                {activeWs?.role || 'Admin'} Workspace
              </span>
            </div>

            <ChevronDown className={`w-4 h-4 text-[--color-text-muted] transition-transform duration-200 ${workspaceOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Workspace Dropdown Panel */}
          <AnimatePresence>
            {workspaceOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 mt-2 w-72 rounded-2xl bg-[--color-surface-1] border border-[--color-border-strong] shadow-2xl py-2 z-50 overflow-hidden"
              >
                <div className="px-4 py-2 border-b border-[--color-border-subtle]">
                  <p className="text-xs font-bold text-[--color-text-primary] uppercase tracking-wider">Workspaces</p>
                  <p className="text-[11px] text-[--color-text-muted]">Select an isolated tenant partition</p>
                </div>

                <div className="py-1 max-h-56 overflow-y-auto">
                  {workspaces.map((ws) => {
                    const isCurrent = (activeWorkspaceId === ws.id) || (!activeWorkspaceId && ws.id === DEMO_WORKSPACE_ID);
                    const isWsDemo = ws.id === DEMO_WORKSPACE_ID;
                    return (
                      <button
                        key={ws.id}
                        onClick={async () => {
                          setWorkspaceOpen(false);
                          if (!isCurrent) {
                            await switchWorkspace(ws.id);
                            window.location.reload();
                          }
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-[--color-surface-2] transition-colors ${
                          isCurrent ? 'bg-[--color-surface-2]/60' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                            isWsDemo ? 'bg-[--color-accent-cyan]/15 text-[--color-accent-cyan]' : 'bg-[--color-surface-3] text-[--color-text-muted]'
                          }`}>
                            {isWsDemo ? <Sparkles className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-[--color-text-primary] truncate">{ws.name}</p>
                            <p className="text-[10px] text-[--color-text-muted] capitalize">{ws.role} Role</p>
                          </div>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-[--color-accent-cyan] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Reset Demo Action */}
                {isDemo && (
                  <div className="p-3 border-t border-[--color-border-subtle] bg-[--color-surface-2]/30">
                    <button
                      onClick={handleResetDemo}
                      disabled={isResetting}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold bg-[--color-surface-2] hover:bg-[--color-surface-3] border border-[--color-border-strong] text-[--color-text-primary] transition-all disabled:opacity-50"
                    >
                      {isResetting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[--color-accent-cyan]" />
                          <span>Resetting Demo...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 text-[--color-accent-cyan]" />
                          <span>Reset Demo Environment</span>
                        </>
                      )}
                    </button>
                    {resetMessage && (
                      <p className="text-[10px] text-center text-[--color-accent-cyan] mt-1.5 font-medium">{resetMessage}</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
