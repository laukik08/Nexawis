import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { 
  Code2, 
  Briefcase, 
  TrendingUp, 
  CalendarCheck, 
  Gauge, 
  HeartPulse, 
  Users, 
  GraduationCap, 
  Target,
  BrainCircuit,
  User,
  Activity,
  CheckCircle2,
  Cpu
} from 'lucide-react';

const dimensions = [
  { icon: Code2, title: "Skill", desc: "Mandatory & preferred skill coverage", color: "text-[--color-accent-lime]", glow: "shadow-[#e8f39a]/30" },
  { icon: Briefcase, title: "Experience", desc: "Domain & leadership history", color: "text-[--color-accent-cyan]", glow: "shadow-[#22d3ee]/30" },
  { icon: TrendingUp, title: "Performance", desc: "Historical delivery consistency", color: "text-[--color-text-primary]", glow: "shadow-[--color-border-strong]" },
  { icon: CalendarCheck, title: "Availability", desc: "Current capacity & leave plans", color: "text-[--color-accent-lime]", glow: "shadow-[#e8f39a]/30" },
  { icon: Gauge, title: "Workload", desc: "Overtime & utilization limits", color: "text-[--color-text-primary]", glow: "shadow-[--color-border-strong]" },
  { icon: HeartPulse, title: "Burnout", desc: "Predicted mental fatigue risk", color: "text-emerald-400", glow: "shadow-emerald-400/30" },
  { icon: Users, title: "Collaboration", desc: "Cross-functional synergy", color: "text-[--color-accent-lime]", glow: "shadow-[#e8f39a]/30" },
  { icon: GraduationCap, title: "Learning", desc: "Upskilling opportunities", color: "text-[--color-accent-cyan]", glow: "shadow-[#22d3ee]/30" },
  { icon: Target, title: "Project Fit", desc: "Alignment with project priority", color: "text-[--color-text-primary]", glow: "shadow-[--color-border-strong]" }
];

export function AwisGrid() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Switch logic with 'Analyzing' micro-state
  const switchDimension = (idx: number) => {
    if (idx === activeIdx || isAnalyzing) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setActiveIdx(idx);
      setIsAnalyzing(false);
    }, 300);
  };

  // Autoplay
  useEffect(() => {
    if (isHovered || isAnalyzing) return;
    const timer = setInterval(() => {
      switchDimension((activeIdx + 1) % dimensions.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [activeIdx, isHovered, isAnalyzing]);

  // Section Headers Animation
  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  // Render the specific visual block for the active dimension
  const renderVisualization = (idx: number) => {
    switch(idx) {
      case 0: // Skill
        return (
          <div className="space-y-4">
            {['React / Next.js', 'Python / Django', 'AWS Infrastructure', 'System Design'].map((skill, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-[--color-text-primary]">{skill}</span>
                  <span className="font-semibold text-[--color-accent-lime] text-data">{[95, 88, 92, 85][i]}%</span>
                </div>
                <div className="h-2 w-full bg-[--color-surface-1] rounded-full overflow-hidden border border-[--color-border-subtle]">
                  <motion.div initial={{width:0}} animate={{width:`${[95, 88, 92, 85][i]}%`}} transition={{duration:1, delay:0.2}} className="h-full bg-[--color-accent-lime]" />
                </div>
              </div>
            ))}
          </div>
        );
      case 1: // Experience
        return (
          <div className="flex flex-col h-full justify-center space-y-6">
            <div className="flex items-center space-x-4">
              <div className="text-5xl font-bold text-data text-[--color-text-primary]">8.5<span className="text-xl text-[--color-text-secondary] ml-1">yrs</span></div>
              <div className="text-sm text-[--color-text-secondary] font-semibold uppercase tracking-wider">Domain<br/>Expertise</div>
            </div>
            <div className="relative border-l-2 border-[--color-border-strong] ml-4 pl-6 py-2 space-y-6">
              <div className="relative">
                <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-[--color-accent-cyan] shadow-[0_0_10px_var(--color-accent-cyan)]" />
                <div className="text-sm font-semibold text-[--color-text-primary]">Senior Engineer</div>
                <div className="text-xs text-[--color-text-secondary]">3 Years · Current</div>
              </div>
              <div className="relative">
                <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-[--color-surface-1] border border-[--color-border-strong]" />
                <div className="text-sm font-semibold text-[--color-text-primary]">Mid-Level Engineer</div>
                <div className="text-xs text-[--color-text-secondary]">5.5 Years</div>
              </div>
            </div>
          </div>
        );
      case 2: // Performance
        return (
          <div className="h-full flex flex-col justify-end space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs text-[--color-text-secondary] font-semibold uppercase tracking-wider mb-1">Velocity Score</div>
                <div className="text-5xl font-bold text-data text-[--color-text-primary]">98<span className="text-2xl text-[--color-text-secondary]">%</span></div>
              </div>
              <div className="text-sm text-[--color-text-primary] flex items-center bg-[--color-surface-1] px-3 py-1.5 rounded-full border border-[--color-border-subtle]">
                <TrendingUp className="w-4 h-4 mr-2 text-emerald-400"/>
                <span className="font-semibold text-data">+2.4%</span>
              </div>
            </div>
            <div className="flex items-end space-x-2 h-32 pt-6">
              {[60, 75, 80, 85, 90, 88, 95, 98].map((val, i) => (
                <div key={i} className="flex-1 bg-[--color-surface-1] border border-b-0 border-[--color-border-subtle] rounded-t-sm relative group overflow-hidden">
                  <motion.div initial={{height:0}} animate={{height:`${val}%`}} transition={{duration:0.8, delay:i*0.05}} className="absolute bottom-0 left-0 right-0 bg-[--color-accent-cyan] opacity-40 group-hover:opacity-80 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        );
      case 3: // Availability
        return (
          <div className="flex flex-col h-full justify-center space-y-4">
             <div className="text-sm font-semibold text-[--color-text-secondary] mb-2 uppercase tracking-wider">Upcoming Capacity (Q3)</div>
             <div className="grid grid-cols-5 gap-2">
              {Array.from({length: 15}).map((_, i) => {
                 const isAvailable = i !== 3 && i !== 7 && i !== 8 && i !== 14;
                 return (
                   <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:i*0.03}} key={i} className={`h-12 rounded-lg flex items-center justify-center ${isAvailable ? 'bg-[--color-accent-lime]/10 border border-[--color-accent-lime]/30' : 'bg-[--color-surface-1] border border-[--color-border-subtle] opacity-50'}`}>
                      {isAvailable && <CalendarCheck className="w-5 h-5 text-[--color-accent-lime]" />}
                   </motion.div>
                 )
              })}
            </div>
          </div>
        );
      case 4: // Workload
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" fill="none" stroke="var(--color-surface-1)" strokeWidth="12" />
                <motion.circle cx="80" cy="80" r="70" fill="none" stroke="var(--color-text-primary)" strokeWidth="12" strokeDasharray="440" initial={{strokeDashoffset: 440}} animate={{strokeDashoffset: 440 - (440 * 0.72)}} transition={{duration: 1.5, ease: "easeOut", delay:0.2}} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-data text-[--color-text-primary]">72%</span>
                <span className="text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wider mt-1">Utilized</span>
              </div>
            </div>
            <div className="mt-6 text-sm text-[--color-text-secondary] text-center max-w-[200px] leading-relaxed">
              Optimal bandwidth available for new assignments.
            </div>
          </div>
        );
      case 5: // Burnout
        return (
          <div className="flex flex-col space-y-6 h-full justify-center">
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                <HeartPulse className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Low Risk</div>
                <div className="text-sm text-[--color-text-secondary]">Cognitive load is perfectly stable</div>
              </div>
            </div>
            <div className="space-y-3 p-4 bg-[--color-surface-1] rounded-xl border border-[--color-border-subtle]">
              {[
                { label: 'Meeting Fatigue', val: '12%', status: 'Healthy' },
                { label: 'Context Switching', val: '18%', status: 'Healthy' },
                { label: 'After-hours Work', val: '0%', status: 'Optimal' }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-[--color-border-subtle] pb-2 last:border-0 last:pb-0">
                  <span className="text-[--color-text-primary] font-medium">{item.label}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[--color-text-secondary] text-data">{item.val}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 6: // Collaboration
        return (
          <div className="relative h-full min-h-[250px] flex items-center justify-center">
            <motion.div animate={{rotate:360}} transition={{duration:30, repeat:Infinity, ease:"linear"}} className="absolute inset-0 rounded-full border border-[--color-border-strong] border-dashed opacity-50" />
            <motion.div animate={{rotate:-360}} transition={{duration:40, repeat:Infinity, ease:"linear"}} className="absolute inset-10 rounded-full border border-[--color-border-subtle] border-dashed opacity-30" />
            <div className="w-16 h-16 rounded-full bg-[--color-surface-1] border-2 border-[--color-accent-lime] flex items-center justify-center z-10 shadow-[0_0_20px_var(--color-accent-lime)]">
              <Users className="w-6 h-6 text-[--color-text-primary]" />
            </div>
            {[0, 72, 144, 216, 288].map((deg, i) => (
              <motion.div key={i} initial={{opacity:0, scale:0}} animate={{opacity:1, scale:1}} transition={{delay:0.2 + (i*0.1)}} className="absolute w-12 h-12 rounded-full bg-[--color-surface-2] border border-[--color-border-strong] flex items-center justify-center z-20" style={{ transform: `rotate(${deg}deg) translateY(-100px) rotate(-${deg}deg)` }}>
                <User className="w-5 h-5 text-[--color-text-primary]" />
              </motion.div>
            ))}
          </div>
        );
      case 7: // Learning
        return (
          <div className="flex flex-col h-full justify-center space-y-6">
            <div>
              <div className="text-4xl font-bold text-[--color-text-primary] tracking-tight mb-2">High Trajectory</div>
              <p className="text-sm text-[--color-text-secondary] leading-relaxed">Strong proven propensity to adapt to new frameworks and expand domain knowledge.</p>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Completed: Advanced Cloud Arch', icon: CheckCircle2, color: 'text-[--color-accent-lime]' },
                { title: 'In Progress: AI/ML Fundamentals', icon: Activity, color: 'text-[--color-accent-cyan]' }
              ].map((course, i) => (
                <motion.div initial={{x:-20, opacity:0}} animate={{x:0, opacity:1}} transition={{delay:0.2 + (i*0.1)}} key={i} className="flex items-center space-x-4 p-4 rounded-xl bg-[--color-surface-1] border border-[--color-border-subtle]">
                  <course.icon className={`w-5 h-5 ${course.color}`} />
                  <span className="text-sm font-semibold text-[--color-text-primary]">{course.title}</span>
                </motion.div>
              ))}
            </div>
          </div>
        );
      case 8: // Project Fit
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-36 h-36 rounded-full border-8 border-[--color-surface-1] flex items-center justify-center relative shadow-[0_0_40px_rgba(0,0,0,0.05)] dark:shadow-[0_0_40px_rgba(255,255,255,0.02)] mb-8">
              <motion.div initial={{scale:0, rotate:-90}} animate={{scale:1, rotate:0}} transition={{type:"spring", bounce:0.5, duration:1}} className="absolute inset-[-8px] rounded-full border-8 border-[--color-text-primary] border-t-[--color-accent-cyan] border-r-[--color-accent-lime] border-b-transparent border-l-transparent" />
              <Target className="w-10 h-10 text-[--color-text-primary]" />
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-data text-[--color-text-primary]">94.2<span className="text-2xl text-[--color-text-secondary]">%</span></div>
              <div className="text-sm font-semibold uppercase tracking-wider text-[--color-text-secondary] mt-2">Overall Match Score</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section id="awis" className="py-24 md:py-32 relative z-10 container mx-auto px-4 md:px-6 overflow-hidden">
      
      {/* Background radial glow specifically for this section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[--color-accent-cyan] rounded-full blur-[150px] opacity-[0.03] pointer-events-none" />

      {/* Section Header */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-3xl mx-auto text-center mb-16 relative z-10"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 text-[--color-accent-lime] font-semibold mb-6 tracking-wide text-sm uppercase">
          <BrainCircuit className="w-5 h-5" />
          <span>Workforce Intelligence Explorer</span>
        </motion.div>
        <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-display text-[--color-text-primary]">
          9-Dimensional Intelligence
        </motion.h2>
        <motion.p variants={itemVariants} className="text-[--color-text-secondary] text-lg text-body leading-relaxed max-w-2xl mx-auto">
          NEXAWIS moves beyond simple skill-matching. Our engine evaluates employees across 9 critical vectors to construct perfectly balanced, sustainable teams.
        </motion.p>
      </motion.div>

      {/* Interactive Explorer Container */}
      <div 
        className="max-w-5xl mx-auto relative z-10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
      >
        {/* Navigation Layer (Horizontal Tabs) */}
        <div className="flex overflow-x-auto space-x-2 mb-6 pb-4 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {dimensions.map((dim, i) => (
            <button
              key={i}
              onClick={() => switchDimension(i)}
              className={`relative px-4 py-3 rounded-2xl flex items-center space-x-2 flex-shrink-0 transition-colors duration-300 ${activeIdx === i ? 'text-[--color-text-primary]' : 'text-[--color-text-secondary] hover:bg-[--color-surface-2]'}`}
            >
              {activeIdx === i && (
                <motion.div
                  layoutId="activeNavBackground"
                  className="absolute inset-0 bg-[--color-surface-2] border border-[--color-border-strong] rounded-2xl z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <dim.icon className={`w-4 h-4 relative z-10 ${activeIdx === i ? dim.color : ''}`} />
              <span className="relative z-10 font-semibold text-sm whitespace-nowrap">{dim.title}</span>
            </button>
          ))}
        </div>

        {/* Active Panel */}
        <div className="card-elevated relative min-h-[500px] md:min-h-[400px] overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Context (Title & Desc) */}
          <div className="w-full md:w-5/12 p-2 md:pr-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-[--color-border-subtle] mb-6 md:mb-0 pb-6 md:pb-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-[--color-bg-base] border border-[--color-border-strong] shadow-[--shadow-premium-soft]`}>
                  {(() => {
                    const Icon = dimensions[activeIdx].icon;
                    return <Icon className={`w-6 h-6 ${dimensions[activeIdx].color}`} />;
                  })()}
                </div>
                <h3 className="text-3xl font-bold text-[--color-text-primary] mb-4 text-display">
                  {dimensions[activeIdx].title}
                </h3>
                <p className="text-[--color-text-secondary] text-lg leading-relaxed mb-6">
                  {dimensions[activeIdx].desc}
                </p>
                
                <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[--color-text-secondary] bg-[--color-surface-1] px-3 py-1.5 rounded-full border border-[--color-border-subtle]">
                  <Cpu className="w-3 h-3" />
                  <span>AWIS Engine Active</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Visualization Area */}
          <div className="w-full md:w-7/12 relative flex items-center justify-center md:pl-8 min-h-[300px]">
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center space-y-4 w-full h-full absolute inset-0"
                >
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <BrainCircuit className="w-8 h-8 text-[--color-text-muted]" />
                  </motion.div>
                  <span className="text-sm font-semibold text-[--color-text-secondary] uppercase tracking-widest animate-pulse">
                    Analyzing Data...
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key={`viz-${activeIdx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full h-full flex flex-col justify-center relative"
                >
                  {renderVisualization(activeIdx)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

    </section>
  );
}
