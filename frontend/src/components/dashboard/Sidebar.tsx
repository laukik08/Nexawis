import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Network, 
  BarChart3, 
  FileText, 
  Settings,
  X
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const navItems = [
  { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
  { name: 'Employees', path: '/app/employees', icon: Users },
  { name: 'Projects', path: '/app/projects', icon: Briefcase },
  { name: 'Team Formation', path: '/app/teams', icon: Network },
  { name: 'Analytics', path: '/app/analytics', icon: BarChart3 },
  { name: 'Reports', path: '/app/reports', icon: FileText },
  { name: 'Settings', path: '/app/settings', icon: Settings },
];

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={clsx(
      "fixed inset-y-0 left-0 z-50 w-64 bg-[--color-surface-1] border-r border-[--color-border-subtle] flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 shadow-[--shadow-premium-soft]",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      
      {/* Sidebar Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-[--color-border-subtle]">
        <Link to="/app" className="flex items-center space-x-3 group">
          <div className="w-12 h-12 rounded overflow-hidden flex items-center justify-center">
            <img src="/logo.png" alt="NEXAWIS" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold tracking-tight text-xl text-[--color-text-primary]">NEXAWIS</span>
        </Link>
        <button 
          className="lg:hidden p-2 -mr-2 text-[--color-text-secondary] hover:text-[--color-text-primary]"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              data-cursor="link"
              onClick={() => setIsOpen(false)}
              className={clsx(
                "flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-300 group font-bold text-sm",
                isActive 
                  ? "bg-[var(--color-surface-2)] text-[var(--color-text-primary)] shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-[var(--color-border-strong)]" 
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] border border-transparent"
              )}
            >
              <item.icon className={clsx(
                "w-5 h-5 transition-colors duration-300",
                isActive ? "text-[--color-accent-cyan]" : "text-[--color-text-muted] group-hover:text-[--color-text-secondary]"
              )} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer / User Context */}
      <div className="p-4 border-t border-[--color-border-subtle]">
        <div className="bg-[--color-surface-2] rounded-xl p-4 border border-[--color-border-strong]">
          <div className="text-xs font-bold text-[--color-text-primary] mb-1">System Status</div>
          <div className="flex items-center text-xs text-[--color-accent-lime]">
            <span className="w-1.5 h-1.5 rounded-full bg-[--color-accent-lime] mr-2 animate-pulse" />
            AWIS Online
          </div>
        </div>
      </div>

    </aside>
  );
}
