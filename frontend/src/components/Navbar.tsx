import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Menu, X, Sun, Moon, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const navLinks = [
  { 
    name: 'Product', 
    dropdown: [
      { name: 'AWIS Intelligence', href: '/product/awis-intelligence' },
      { name: '9 Dimensions', href: '/product/9-dimensions' },
      { name: 'How NEXAWIS Works', href: '/product/how-it-works' }
    ]
  },
  { 
    name: 'Solutions', 
    dropdown: [
      { name: 'Workforce Allocation', href: '/solutions/workforce-allocation' },
      { name: 'Team Formation', href: '/solutions/team-formation' },
      { name: 'Employee Wellbeing', href: '/solutions/employee-wellbeing' },
      { name: 'Project Intelligence', href: '/solutions/project-intelligence' }
    ]
  },
  { 
    name: 'Resources', 
    dropdown: [
      { name: 'Documentation', href: '/resources/documentation' },
      { name: 'Research', href: '/resources/research' },
      { name: 'Insights', href: '/resources/insights' }
    ]
  },
  { 
    name: 'Pricing', 
    href: '/pricing' 
  }
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 lg:max-w-[1550px] lg:mx-auto z-50 py-3 px-6 flex items-center justify-between pointer-events-auto transition-all duration-500 ease-out rounded-full ${
          isScrolled || mobileMenuOpen
            ? 'bg-[#0a141a]/80 backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)]' 
            : 'bg-[#0d1a20]/40 backdrop-blur-md border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.2)]'
        }`}
      >
        <Link to="/" className="flex items-center space-x-2 cursor-pointer group shrink-0">
          <div className="transition-transform duration-300 group-hover:scale-105 rounded overflow-hidden flex items-center justify-center">
            <img src="/logo.png" alt="NEXAWIS" className="w-14 h-14 object-contain" />
          </div>
          <span className={`font-bold tracking-tight text-xl transition-opacity duration-300 text-white ${isScrolled || mobileMenuOpen ? 'opacity-100' : 'opacity-100 md:opacity-0 lg:opacity-100'}`}>
            NEXAWIS
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className={`hidden lg:flex items-center space-x-1 px-4 py-2 rounded-full transition-all duration-500 ${
          isScrolled 
            ? 'bg-transparent' 
            : 'bg-white/5 backdrop-blur-md border border-white/10'
        }`}>
          {navLinks.map((item) => (
            <div key={item.name} className="relative group px-1">
              {item.dropdown ? (
                <>
                  <button data-cursor="link" className="relative text-sm font-semibold text-[#8db3bd] hover:text-white px-4 py-2 rounded-full transition-colors duration-300 group-hover:text-white flex items-center gap-1.5 overflow-hidden">
                    <span className="relative z-10">{item.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 relative z-10 transition-transform duration-300 group-hover:rotate-180" />
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-300 ease-out pointer-events-none" />
                  </button>
                  
                  {/* Dropdown Panel */}
                  <div className="absolute top-full pt-4 left-1/2 -translate-x-1/2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto w-64 z-50">
                    <div className="bg-[--color-surface-1]/95 backdrop-blur-2xl border border-[--color-border-subtle] rounded-2xl p-2.5 shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
                      {item.dropdown.map((sub, i) => (
                        <Link key={i} to={sub.href} className="block px-4 py-3 text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-surface-2] rounded-xl transition-colors font-medium">
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Link to={item.href} data-cursor="link" className="relative text-sm font-semibold text-[#8db3bd] hover:text-white px-4 py-2 rounded-full transition-colors duration-300 group overflow-hidden flex items-center">
                  <span className="relative z-10">{item.name}</span>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-300 ease-out pointer-events-none" />
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Desktop CTA & Theme Toggle */}
        <div className="hidden lg:flex items-center space-x-4 shrink-0">
          <a href="#" className="text-sm font-bold text-white hover:text-white/80 transition-colors px-2" data-cursor="link">
            Log in
          </a>
          
          <button data-cursor="button" className="btn-accent px-6 py-2.5 rounded-full font-semibold text-sm flex items-center space-x-2 group">
            <span>Get Started</span>
            <div className="bg-black/10 dark:bg-white/10 rounded-full p-0.5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-current" />
            </div>
          </button>

          <button 
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#8db3bd] hover:text-white hover:scale-105 transition-transform duration-300 relative overflow-hidden"
            data-cursor="button"
          >
            <AnimatePresence mode="wait">
              {theme === 'dark' ? (
                <motion.div
                  key="moon"
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex lg:hidden items-center gap-4">
          <button 
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          
          <button 
            className="p-2 text-white focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-[--color-bg-base]/95 backdrop-blur-3xl pt-32 px-6 pb-6 flex flex-col pointer-events-auto lg:hidden overflow-y-auto"
          >
            <div className="flex flex-col space-y-6 mb-8 flex-1">
              {navLinks.map((item, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={item.name}
                  className="border-b border-[--color-border-subtle] pb-6"
                >
                  <div className="text-xl font-bold text-[--color-text-primary] mb-4">
                    {item.name}
                  </div>
                  {item.dropdown ? (
                    <div className="flex flex-col space-y-3 pl-4 border-l-2 border-[--color-border-strong]">
                      {item.dropdown.map(sub => (
                        <Link 
                          key={sub.name} 
                          to={sub.href} 
                          onClick={() => setMobileMenuOpen(false)} 
                          className="text-[--color-text-secondary] hover:text-[--color-text-primary] text-base font-medium transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link 
                      to={item.href} 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[--color-text-secondary] hover:text-[--color-text-primary] text-base font-medium transition-colors"
                    >
                      Explore {item.name}
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col gap-4 mt-auto pt-6 border-t border-[--color-border-subtle]">
              <a href="#" className="text-center font-semibold text-[--color-text-secondary] hover:text-[--color-text-primary] py-2">
                Log in
              </a>
              <motion.button 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="btn-accent w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowUpRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
