import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export function CustomCursor() {
  const [cursorType, setCursorType] = useState<'default' | 'button' | 'link' | 'card'>('default');
  
  // Use MotionValues for extreme performance instead of React state for position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Springs for smooth following without layout thrashing
  const springConfig = { damping: 25, stiffness: 800, mass: 0.1 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  const ringSpringConfig = { damping: 25, stiffness: 400, mass: 0.4 };
  const ringX = useSpring(mouseX, ringSpringConfig);
  const ringY = useSpring(mouseY, ringSpringConfig);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Look for explicit data-cursor attributes first
      const cursorTarget = target.closest('[data-cursor]');
      if (cursorTarget) {
        setCursorType(cursorTarget.getAttribute('data-cursor') as 'button' | 'link' | 'card');
        return;
      }
      
      // Fallbacks based on element type or class
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.closest('button') ||
        target.classList.contains('btn-accent')
      ) {
        setCursorType('button');
      } else if (
        target.tagName.toLowerCase() === 'a' ||
        target.closest('a')
      ) {
        setCursorType('link');
      } else if (
        target.classList.contains('card-elevated') ||
        target.closest('.card-elevated') ||
        target.classList.contains('card-base') ||
        target.classList.contains('glass-card-light') ||
        target.classList.contains('glass-pill-dark')
      ) {
        // If it's just a card, it might not be interactive unless it has a cursor-pointer
        if (target.closest('.cursor-pointer')) {
          setCursorType('card');
        } else {
          setCursorType('default');
        }
      } else if (target.classList.contains('cursor-pointer') || target.closest('.cursor-pointer')) {
        setCursorType('button');
      } else {
        setCursorType('default');
      }
    };

    window.addEventListener('mousemove', updateMousePosition, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [mouseX, mouseY]);

  // Determine variants based on cursorType
  const dotVariants = {
    default: { scale: 1, backgroundColor: 'var(--color-accent-lime)' },
    button: { scale: 2.5, backgroundColor: 'var(--color-accent-lime)' },
    link: { scale: 1.5, backgroundColor: 'var(--color-accent-cyan)' },
    card: { scale: 1.2, backgroundColor: 'var(--color-accent-lime)' }
  };

  const ringVariants = {
    default: { scale: 1, opacity: 1, borderColor: 'rgba(232, 243, 154, 0.5)' },
    button: { scale: 1.5, opacity: 0, borderColor: 'rgba(232, 243, 154, 0.5)' },
    link: { scale: 0.8, opacity: 1, borderColor: 'var(--color-accent-cyan)' },
    card: { scale: 2, opacity: 0.5, borderColor: 'rgba(232, 243, 154, 0.3)' }
  };

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 -ml-2 -mt-2 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{ x: cursorX, y: cursorY, willChange: 'transform' }}
        variants={dotVariants}
        animate={cursorType}
        transition={{ type: 'spring', stiffness: 800, damping: 25, mass: 0.2 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 -ml-4 -mt-4 border rounded-full pointer-events-none z-[9998] mix-blend-difference"
        style={{ x: ringX, y: ringY, willChange: 'transform, opacity, border-color' }}
        variants={ringVariants}
        animate={cursorType}
        transition={{ type: 'spring', stiffness: 600, damping: 25, mass: 0.3 }}
      />
    </>
  );
}
