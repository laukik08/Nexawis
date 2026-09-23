import { motion, type Variants } from 'framer-motion';
import { ArrowUpRight, BrainCircuit, Activity, ShieldCheck, FileCheck2, Lightbulb, Play, GitBranch, CheckCircle2, User, Database } from 'lucide-react';
import { StatsCard } from './StatsCard';

export function Hero() {
  // Blur-to-sharp line-by-line reveal for heading
  const headingVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const lineVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { type: "spring", stiffness: 80, damping: 20 }
    }
  };

  return (
    <div className="relative min-h-[900px] lg:min-h-screen pt-32 lg:pt-40 pb-20 flex flex-col items-center justify-center overflow-hidden w-full">
        
        {/* 
          DEEP TEAL HERO BACKGROUND
          Static deep teal gradient that fades to transparent so the background color transition works perfectly.
        */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d1a20] via-[#12242c] to-transparent" />
          
          {/* Ambient Teal Glow */}
          <motion.div 
            animate={{ x: ["-5%", "5%", "-5%"], y: ["-5%", "5%", "-5%"] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-[60vw] h-[60vw] md:w-[800px] md:h-[800px] bg-[#1a3845] rounded-full blur-[120px] opacity-40" 
          />
        </div>

        <div className="container mx-auto px-6 relative z-10 w-full max-w-7xl">
        
        {/* 2-COLUMN LAYOUT DESKTOP / STACKED MOBILE */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8 mb-24 lg:mb-32">
          
          {/* LEFT: TEXT & CTA */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left pt-10">
            
            {/* Top Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="card-base !p-1.5 !rounded-full inline-flex items-center space-x-3 mb-8 cursor-default"
            >
              <div className="bg-[--color-surface-2] p-1.5 rounded-full">
                <Lightbulb className="w-3.5 h-3.5 text-[--color-accent-lime]" />
              </div>
              <span className="text-label pr-4 text-[--color-text-secondary]">NEXAWIS Intelligence Engine</span>
            </motion.div>

            {/* Blur-to-Sharp Headline */}
            <motion.h1 
              variants={headingVariants}
              initial="hidden"
              animate="visible"
              className="text-display text-5xl md:text-6xl lg:text-6xl text-white mb-6"
            >
              <motion.div variants={lineVariants} className="overflow-hidden pb-1">
                Build Adaptive &
              </motion.div>
              <motion.div variants={lineVariants} className="overflow-hidden pb-1 text-force-muted">
                Intelligence-Backed
              </motion.div>
              <motion.div variants={lineVariants} className="overflow-hidden pb-1">
                Teams Across Org
              </motion.div>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-body text-lg md:text-xl text-force-muted max-w-xl mb-12"
            >
              Get stable delivery by forming perfectly balanced teams. Predict burnout, optimize workload, and build for sustainable success with transparent AI.
            </motion.p>

            {/* CTA Group */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <button className="w-full sm:w-auto btn-accent px-6 py-3.5 rounded-full font-semibold flex items-center justify-center space-x-3 group relative overflow-hidden">
                <span className="relative z-10">Start Building</span>
                <div className="bg-[--color-surface-1] rounded-full p-1.5 relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-[--color-accent-lime]" />
                </div>
                {/* Subtle highlight overlay on hover */}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </button>
              
              <button className="w-full sm:w-auto card-base !bg-[#0d1a20]/40 !border-white/10 !py-3.5 !px-6 !rounded-full font-semibold text-white text-sm hover:bg-[#12242c] hover:border-white/20 transition-all flex items-center justify-center space-x-2 group">
                <Play className="w-4 h-4 text-force-muted group-hover:text-[--color-accent-cyan] transition-colors" />
                <span>Explore AWIS Model</span>
              </button>
            </motion.div>
          </div>

          {/* RIGHT: PRODUCT VISUALIZATION */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, type: "spring" }}
            className="w-full lg:w-1/2 relative h-[500px] lg:h-[600px] flex items-center justify-center"
          >
            {/* 
              Abstract visualization representing:
              Employee Data -> AWIS Engine -> Recommended Team 
            */}
            
            {/* Central Node: AWIS Engine */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute z-30 w-32 h-32 rounded-3xl card-elevated !p-0 flex flex-col items-center justify-center border-[--color-accent-cyan]/30 shadow-[--shadow-premium-glow]"
            >
              <BrainCircuit className="w-10 h-10 text-[--color-accent-cyan] mb-2" />
              <span className="text-label text-[--color-text-primary]">AWIS CORE</span>
            </motion.div>

            {/* Input Node 1: Employee Data */}
            <motion.div 
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-10 left-0 md:left-10 z-20 w-48 card-base !p-4 border-[--color-border-subtle] opacity-80 backdrop-blur-md"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[--color-surface-2] flex items-center justify-center">
                  <User className="w-4 h-4 text-[--color-text-primary]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[--color-text-primary]">Skill Vector</div>
                  <div className="text-[10px] text-[--color-text-secondary]">Python, React, AWS</div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-[--color-surface-2] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 1.5, delay: 1 }}
                  className="h-full bg-[--color-accent-lime]"
                />
              </div>
            </motion.div>

            {/* Input Node 2: Burnout Risk */}
            <motion.div 
              animate={{ y: [5, -5, 5] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-10 left-0 md:left-5 z-20 w-48 card-base !p-4 border-[--color-border-subtle] opacity-80 backdrop-blur-md"
            >
              <div className="flex items-center space-x-3 mb-2">
                <Activity className="w-4 h-4 text-[--color-text-secondary]" />
                <span className="text-xs font-medium text-[--color-text-secondary]">Burnout Prediction</span>
              </div>
              <div className="text-xl text-data text-[--color-text-primary] mb-1">Low Risk</div>
              <div className="flex space-x-1">
                <div className="h-1 w-full bg-[--color-accent-cyan] rounded-full" />
                <div className="h-1 w-full bg-[--color-accent-cyan] rounded-full opacity-50" />
                <div className="h-1 w-full bg-[--color-surface-2] rounded-full" />
              </div>
            </motion.div>

            {/* Output Node: Team Formation */}
            <motion.div 
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute top-1/2 -translate-y-1/2 right-0 z-20 w-56 card-elevated !p-5 border-[--color-accent-lime]/20 shadow-[0_10px_40px_rgba(232,243,154,0.1)] backdrop-blur-xl"
            >
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-[--color-accent-lime]" />
                <span className="text-xs font-semibold tracking-wider text-[--color-accent-lime]">TEAM ASSIGNED</span>
              </div>
              <div className="space-y-3">
                {[
                  { role: "Lead Engineer", match: "98%" },
                  { role: "Product Manager", match: "94%" },
                  { role: "Data Scientist", match: "91%" }
                ].map((member, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-[--color-border-subtle] pb-2 last:border-0 last:pb-0">
                    <span className="text-sm text-[--color-text-secondary]">{member.role}</span>
                    <span className="text-sm font-semibold text-data text-[--color-text-primary]">{member.match}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Connection Lines (Abstract SVG Paths) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ filter: 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.3))' }}>
              <motion.path 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 2, delay: 0.5 }}
                d="M 120 120 Q 250 150 250 250" 
                fill="none" 
                stroke="var(--color-accent-cyan)" 
                strokeWidth="2" 
                strokeDasharray="4 4"
              />
              <motion.path 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 2, delay: 0.8 }}
                d="M 120 400 Q 250 350 250 250" 
                fill="none" 
                stroke="var(--color-accent-cyan)" 
                strokeWidth="2" 
                strokeDasharray="4 4"
              />
              <motion.path 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 2, delay: 1.5 }}
                d="M 380 250 L 500 250" 
                fill="none" 
                stroke="var(--color-accent-lime)" 
                strokeWidth="2" 
                className="hidden lg:block"
              />
            </svg>

          </motion.div>
        </div>

        {/* METRICS SECTION */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="text-label mb-6 border-b border-white/10 dark:border-[--color-border-subtle] pb-4 flex items-center justify-between"
        >
          <span className="text-force-muted">System Metrics</span>
          <span className="flex items-center space-x-2 text-[--color-accent-cyan]">
            <span className="w-2 h-2 rounded-full bg-[--color-accent-cyan] animate-pulse" />
            <span>Live Data</span>
          </span>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full relative z-20">
          <StatsCard 
            title="Employees Analyzed" 
            numericValue={150}
            suffix="K+"
            icon={<Database className="w-5 h-5" />}
            delay={0.4}
          />
          <StatsCard 
            title="Team Match Rate" 
            numericValue={98.5}
            decimals={1}
            suffix="%"
            icon={<GitBranch className="w-5 h-5" />}
            delay={0.5}
          />
          <StatsCard 
            title="Hours Optimized" 
            numericValue={12.5}
            decimals={1}
            suffix="M+"
            icon={<ShieldCheck className="w-5 h-5" />}
            delay={0.6}
          />
          <StatsCard 
            title="Explainable AI" 
            numericValue={100}
            suffix="%"
            icon={<FileCheck2 className="w-5 h-5" />}
            delay={0.7}
          />
        </div>
      </div>
    </div>
  );
}
