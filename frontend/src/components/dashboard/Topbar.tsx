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

        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 p-1 rounded-full border border-transparent hover:border-[--color-border-strong] hover:bg-[--color-surface-2] transition-colors pl-1 pr-3 group"
          >
            <img 
              src={user?.avatarUrl || "https://ui-avatars.com/api/?name=User&background=random"} 
              alt="Profile" 
              className="w-8 h-8 rounded-full border border-[--color-border-subtle]"
            />
            <ChevronDown className="w-4 h-4 text-[--color-text-secondary] group-hover:text-[--color-text-primary] transition-colors" />
          </button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-[var(--color-surface-1)] shadow-xl border border-[var(--color-border-strong)] rounded-2xl py-2 z-50 origin-top-right overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-[--color-border-subtle] mb-1 bg-[--color-surface-2]/50">
                  <div className="font-bold text-[--color-text-primary] truncate">{user?.name || "User"}</div>
                  <div className="text-xs text-[--color-text-secondary] truncate">{user?.email || "user@example.com"}</div>
                </div>
                
                <button className="w-full text-left px-4 py-2 text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-surface-2] flex items-center transition-colors">
                  <UserIcon className="w-4 h-4 mr-3" />
                  Profile
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-surface-2] flex items-center transition-colors">
                  <Settings className="w-4 h-4 mr-3" />
                  Account Settings
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
