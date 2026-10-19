import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Explainability', href: '#explainability' },
  { label: 'For Teams', href: '#roles' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-[var(--z-sticky)]',
        'transition-all duration-300 ease-out',
        scrolled
          ? 'bg-[var(--surface-dark)]/95 backdrop-blur-md border-b border-white/5'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a
          href="#"
          className="font-display font-bold text-lg tracking-tight text-[var(--text-on-dark)] focus-ring rounded-sm"
          aria-label="NEXAWIS home"
        >
          NEXAWIS
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'px-3.5 py-2 text-sm font-medium rounded-[var(--radius-sm)]',
                'text-[var(--text-muted-on-dark)]',
                'hover:text-[var(--text-on-dark)] hover:bg-white/5',
                'transition-colors duration-200',
                'focus-ring'
              )}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="secondary" size="sm" dark>
            Sign In
          </Button>
          <Button variant="primary" size="sm">
            Request Early Access
          </Button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 text-[var(--text-on-dark)] hover:bg-white/5 rounded-[var(--radius-sm)] transition-colors focus-ring"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden fixed inset-0 top-16 bg-[var(--surface-dark)]/98 backdrop-blur-xl z-[var(--z-overlay)]"
          >
            <div className="flex flex-col px-6 pt-8 pb-6 gap-1">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                  className={cn(
                    'px-4 py-3 text-lg font-medium rounded-[var(--radius-md)]',
                    'text-[var(--text-on-dark)]',
                    'hover:bg-white/5 transition-colors',
                    'focus-ring'
                  )}
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-white/10">
                <Button variant="secondary" size="lg" dark className="w-full">
                  Sign In
                </Button>
                <Button variant="primary" size="lg" className="w-full">
                  Request Early Access
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
