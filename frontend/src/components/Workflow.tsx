import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { FilePlus2, Filter, Cpu, UserCheck, Search, Users, User, BrainCircuit, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

const steps = [
  {
    icon: FilePlus2,
    title: "01. Project Creation",
    desc: "Managers define technical requirements, priority, and required skills in the system.",
  },
  {
    icon: Filter,
    title: "02. Eligibility Filtering",
    desc: "The framework applies hard constraints for availability, mandatory skills, and leave plans.",
  },
  {
    icon: Cpu,
    title: "03. AI Recommendation",
    desc: "Burnout and Success models score all candidates across 9 dimensions to form the perfect balance.",
  },
  {
    icon: UserCheck,
    title: "04. Human Approval",
    desc: "Managers review the explainable AI recommendations and finalize the team structure.",
  }
];

export function Workflow() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start center", "end center"]
  });

  const [activeStep, setActiveStep] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.25) setActiveStep(0);
    else if (latest < 0.50) setActiveStep(1);
    else if (latest < 0.75) setActiveStep(2);
    else setActiveStep(3);
  });

  return (
    <section id="workflow" className="py-24 md:py-32 relative z-10 container mx-auto px-6 border-t border-[--color-border-subtle]">
      <div className="text-center mb-24 max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[--color-text-primary] tracking-tight text-display">How NEXAWIS Works</h2>
        <p className="text-[--color-text-secondary] text-lg text-body">A seamless, 4-step process keeping humans in the loop.</p>
      </div>

      <div ref={targetRef} className="flex flex-col lg:flex-row relative max-w-6xl mx-auto items-start gap-12">
        
        {/* Left Side: Scrolling Steps */}
        <div className="w-full lg:w-1/2 pt-10">
          {steps.map((step, i) => (
            <div 
              key={i}
              className={`mb-32 last:mb-16 transition-opacity duration-500 ${activeStep === i ? 'opacity-100' : 'opacity-30'}`}
            >
              <div className="w-12 h-12 rounded-xl bg-[--color-surface-2] flex items-center justify-center mb-6">
                <step.icon className="w-5 h-5 text-[--color-accent-lime]" />
              </div>
              <h3 className="text-3xl font-bold text-[--color-text-primary] mb-4 text-h2">{step.title}</h3>
              <p className="text-[--color-text-secondary] text-lg leading-relaxed text-body">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Right Side: Sticky Product Visualizations */}
        <div className="hidden lg:flex w-1/2 sticky top-40 h-[600px] items-center justify-center">
          <div className="relative w-full h-full card-base !p-0 overflow-hidden shadow-[--shadow-premium-soft] bg-[--color-surface-1]">
            <AnimatePresence mode="wait">
              
              {/* STATE 0: Project Input */}
              {activeStep === 0 && (
                <motion.div 
                  key="step0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 p-8 flex flex-col justify-center"
                >
                  <div className="text-label text-[--color-text-secondary] mb-6">Create New Project</div>
                  <div className="space-y-4">
                    <div className="bg-[--color-surface-2] p-4 rounded-xl border border-[--color-border-subtle]">
                      <div className="text-xs text-[--color-text-secondary] mb-2">Project Name</div>
                      <div className="font-semibold text-[--color-text-primary] text-lg">Project Phoenix (Core Infrastructure)</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[--color-surface-2] p-4 rounded-xl border border-[--color-border-subtle]">
                        <div className="text-xs text-[--color-text-secondary] mb-2">Priority</div>
                        <div className="text-[--color-accent-cyan] font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> High</div>
                      </div>
                      <div className="bg-[--color-surface-2] p-4 rounded-xl border border-[--color-border-subtle]">
                        <div className="text-xs text-[--color-text-secondary] mb-2">Required Roles</div>
                        <div className="text-[--color-text-primary] font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-[--color-text-secondary]"/> 4 Members</div>
                      </div>
                    </div>
                    <div className="bg-[--color-surface-2] p-4 rounded-xl border border-[--color-border-subtle]">
                      <div className="text-xs text-[--color-text-secondary] mb-3">Mandatory Tech Stack</div>
                      <div className="flex gap-2">
                        {['React', 'Node.js', 'AWS', 'PostgreSQL'].map(tech => (
                          <span key={tech} className="bg-[--color-bg-base] text-xs px-3 py-1 rounded-full text-[--color-text-secondary] border border-[--color-border-subtle]">{tech}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STATE 1: Eligibility Filtering */}
              {activeStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 p-8 flex flex-col justify-center"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-label text-[--color-text-secondary]">Roster Eligibility Filter</div>
                    <div className="flex items-center gap-2 text-xs text-[--color-text-secondary bg-[--color-surface-2] px-3 py-1 rounded-full"><Search className="w-3 h-3"/> Filtering 1,204 employees</div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "Sarah J.", status: "Eligible", valid: true },
                      { name: "Michael R.", status: "On Leave (Next Week)", valid: false },
                      { name: "David K.", status: "Missing Skill: AWS", valid: false },
                      { name: "Elena M.", status: "Eligible", valid: true },
                      { name: "James T.", status: "Overbooked (120%)", valid: false },
                    ].map((emp, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: emp.valid ? 1 : 0.4, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex justify-between items-center p-3 rounded-lg border ${emp.valid ? 'bg-[--color-surface-2] border-[--color-border-strong]' : 'bg-[--color-bg-base] border-[--color-border-subtle]'}`}
                      >
                        <span className={`font-semibold ${emp.valid ? 'text-[--color-text-primary]' : 'text-[--color-text-secondary] line-through'}`}>{emp.name}</span>
                        <div className={`text-xs flex items-center gap-1 ${emp.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {emp.valid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {emp.status}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STATE 2: AWIS Scoring */}
              {activeStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 p-8 flex flex-col justify-center items-center"
                >
                  <div className="text-label text-[--color-text-secondary] mb-8 w-full text-left">AWIS Engine Analysis</div>
                  
                  <div className="relative w-48 h-48 mb-8">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border border-dashed border-[--color-accent-cyan]/50 rounded-full"
                    />
                    <div className="absolute inset-2 bg-[--color-surface-2] rounded-full flex flex-col items-center justify-center border border-[--color-border-strong]">
                      <BrainCircuit className="w-8 h-8 text-[--color-accent-cyan] mb-2" />
                      <div className="text-3xl font-bold text-[--color-text-primary] text-data tracking-tighter">94.2</div>
                      <div className="text-[10px] uppercase tracking-wider text-[--color-text-secondary]">AWIS Score</div>
                    </div>
                  </div>

                  <div className="w-full space-y-4">
                    {[
                      { label: "Technical Fit", val: "98%" },
                      { label: "Domain Experience", val: "85%" },
                      { label: "Burnout Safety", val: "92%" }
                    ].map((metric, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[--color-text-secondary]">{metric.label}</span>
                          <span className="text-[--color-text-primary] font-semibold text-data">{metric.val}</span>
                        </div>
                        <div className="w-full h-1 bg-[--color-surface-2] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: metric.val }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                            className="h-full bg-[--color-accent-cyan]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STATE 3: Explainable AI & Human Approval */}
              {activeStep === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 p-8 flex flex-col justify-center"
                >
                   <div className="text-label text-emerald-400 mb-6 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Recommended Team Formed
                  </div>

                  <div className="card-elevated !p-5 mb-4 border-[--color-accent-lime]/20 shadow-[0_10px_30px_rgba(232,243,154,0.05)]">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <div className="font-semibold text-[--color-text-primary] text-lg">Team Alpha</div>
                        <div className="text-xs text-[--color-text-secondary]">4 Members Selected</div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-data text-[--color-accent-lime]">96.4</div>
                        <div className="text-[10px] uppercase text-[--color-text-secondary]">Match Score</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-[--color-surface-2] border border-[--color-border-strong] flex items-center justify-center">
                          <User className="w-4 h-4 text-[--color-text-primary]" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[--color-surface-2] p-4 rounded-xl border border-[--color-border-subtle]">
                    <div className="text-xs text-[--color-text-primary] font-semibold mb-3">Why this team?</div>
                    <div className="space-y-2">
                      {[
                        "Covers 100% of mandatory tech stack.",
                        "Average burnout risk is Low (Safe zone).",
                        "High prior collaboration history (+12% synergy)."
                      ].map((reason, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + (i * 0.1) }}
                          className="flex items-start gap-2 text-sm text-[--color-text-secondary]"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[--color-accent-cyan] shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
}
