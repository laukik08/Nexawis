import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="navbar-floating"
      >
        <div className="navbar-container">
          <div className="navbar-logo">
            <span>NEXAWIS</span>
          </div>
          
          <div className="navbar-links desktop-only">
            <a href="#features">Features</a>
            <a href="#models">Intelligence</a>
            <a href="#how-it-works">Platform</a>
          </div>
          
          <div className="navbar-actions desktop-only">
            <a href="/login" className="nav-login">Sign In</a>
            <button className="btn-primary" style={{ padding: '0.375rem 0.75rem 0.375rem 1rem', fontSize: '0.875rem' }}>
              Request Access
              <span className="btn-icon-wrapper" style={{ width: '1.5rem', height: '1.5rem' }}>
                <ArrowUpRight size={14} />
              </span>
            </button>
          </div>

          <button className="mobile-menu-btn mobile-only" onClick={toggleMenu} aria-label="Toggle menu">
            {isOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="mobile-menu-overlay"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(32px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
          >
            <div className="mobile-menu-content">
              {[
                { name: 'Features', delay: 0.1 },
                { name: 'Intelligence', delay: 0.15 },
                { name: 'Platform', delay: 0.2 },
                { name: 'Sign In', delay: 0.25 }
              ].map((item, i) => (
                <motion.a 
                  key={item.name}
                  href="#"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ delay: item.delay, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  onClick={toggleMenu}
                >
                  {item.name}
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
