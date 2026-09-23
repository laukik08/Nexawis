import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Menu, X, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const navLinks = [
  { name: 'Intelligence', id: 'awis' },
  { name: 'AI Models', id: 'predict' },
  { name: 'Workflow', id: 'workflow' }
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
        <div className="flex items-center space-x-2 cursor-pointer group">
          <div className="transition-transform duration-300 group-hover:scale-105 rounded overflow-hidden flex items-center justify-center">
            <img src="/logo.png" alt="NEXAWIS" className="w-14 h-14 object-contain" />
          </div>
          <span className={`font-bold tracking-tight text-xl transition-opacity duration-300 text-white ${isScrolled || mobileMenuOpen ? 'opacity-100' : 'opacity-100 md:opacity-0 lg:opacity-100'}`}>
            NEXAWIS
          </span>
        </div>

        {/* Desktop Nav */}
        <div className={`hidden md:flex items-center space-x-1 px-2 py-1.5 rounded-full transition-all duration-500 ${
          isScrolled 
            ? 'bg-transparent' 
            : 'bg-[--color-surface-1]/40 backdrop-blur-md border border-[--color-border-subtle]'
        }`}>
          {navLinks.map((item) => (
            <a 
              key={item.name} 
              href={`#${item.id}`} 
              data-cursor="link"
              className="relative text-label text-[--color-text-secondary] hover:text-white px-4 py-2 rounded-full transition-colors duration-300 group overflow-hidden"
            >
              <span className="relative z-10">{item.name}</span>
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-300 ease-out pointer-events-none" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[--color-accent-lime] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>
          ))}
        </div>

        {/* Desktop CTA & Theme Toggle */}
        <div className="hidden md:flex items-center space-x-4">
          <button 
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#8db3bd] hover:text-white hover:scale-105 transition-transform duration-300 relative overflow-hidden"
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
          <button data-cursor="button" className="btn-accent px-6 py-2.5 rounded-full font-semibold text-sm flex items-center space-x-2 group">
            <span>Register</span>
            <div className="bg-black/10 dark:bg-white/10 rounded-full p-0.5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-current" />
            </div>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 text-[--color-text-primary] focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </motion.nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-[--color-bg-base]/95 backdrop-blur-2xl pt-24 px-6 pb-6 flex flex-col pointer-events-auto md:hidden"
          >
            <div className="flex flex-col space-y-4 mb-8">
              {navLinks.map((item, i) => (
                <motion.a
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={item.name}
                  href={`#${item.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl font-bold text-[--color-text-primary] py-3 border-b border-[--color-border-subtle]"
                >
                  {item.name}
                </motion.a>
              ))}
            </div>
            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="btn-accent w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2"
            >
              <span>Register</span>
              <ArrowUpRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
