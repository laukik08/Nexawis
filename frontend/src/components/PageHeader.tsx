import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
}

export function PageHeader({ title, subtitle, badge }: PageHeaderProps) {
  return (
    <div className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-6 flex flex-col items-center justify-center text-center overflow-hidden border-b border-[--color-border-subtle]">
      <div className="absolute inset-0 bg-gradient-to-b from-[--color-surface-2] to-transparent opacity-50 z-0" />
      
      <div className="relative z-10 max-w-4xl mx-auto">
        {badge && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-[--color-border-strong] bg-[--color-surface-2] text-sm text-[--color-text-secondary] mb-8 font-medium shadow-[--shadow-premium-soft]"
          >
            <span className="w-2 h-2 rounded-full bg-[--color-accent-lime] animate-pulse" />
            <span>{badge}</span>
          </motion.div>
        )}
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-[--color-text-primary] mb-8 tracking-tight text-display"
        >
          {title}
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-[--color-text-secondary] text-body leading-relaxed max-w-3xl mx-auto"
        >
          {subtitle}
        </motion.p>
      </div>
    </div>
  );
}
