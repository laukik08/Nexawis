import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { useRef, useEffect } from 'react';

interface StatsCardProps {
  title: string;
  numericValue: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  icon: React.ReactNode;
  delay?: number;
}

export function StatsCard({ title, numericValue, suffix = '', prefix = '', decimals = 0, icon, delay = 0 }: StatsCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  // Spring animation for the number counter
  const springValue = useSpring(0, {
    stiffness: 50,
    damping: 20,
    mass: 1,
    restDelta: 0.001
  });

  // Start the animation when in view
  useEffect(() => {
    if (isInView) {
      // Add delay via timeout to match the card entrance animation
      const timer = setTimeout(() => {
        springValue.set(numericValue);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [isInView, numericValue, springValue, delay]);

  // Format the number for display
  const displayValue = useTransform(springValue, (current) => {
    return prefix + current.toFixed(decimals) + suffix;
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay, type: "spring", stiffness: 80, damping: 20 }}
      className="card-base !bg-[--color-surface-1]/60 backdrop-blur-xl border border-white/20 dark:border-[--color-border-subtle] p-6 flex flex-col items-start justify-between h-full w-full relative overflow-hidden group cursor-pointer hover:border-white/40 dark:hover:border-[--color-border-strong]"
    >
      {/* Subtle hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[--color-surface-2]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="w-10 h-10 rounded-full bg-[--color-surface-2] border border-[--color-border-subtle] flex items-center justify-center text-[--color-accent-lime] mb-4 relative z-10 group-hover:scale-110 group-hover:text-[--color-accent-cyan] transition-all duration-300">
        {icon}
      </div>
      
      <div className="relative z-10">
        <motion.div className="text-3xl font-bold text-display text-[--color-text-primary] mb-1 tracking-tight drop-shadow-sm">
          {displayValue}
        </motion.div>
        <div className="text-label text-[--color-text-secondary] group-hover:text-[--color-text-primary] transition-colors duration-300">
          {title}
        </div>
      </div>
    </motion.div>
  );
}
