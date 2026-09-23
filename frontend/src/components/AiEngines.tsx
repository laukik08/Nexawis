import { motion } from 'framer-motion';
import { Network, LineChart, CheckCircle2, User, AlertTriangle, BatteryWarning, TrendingUp, TrendingDown, Target, Clock } from 'lucide-react';

export function AiEngines() {
  return (
    <section id="predict" className="py-32 relative z-10 container mx-auto px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        
        {/* Burnout Model */}
        <div className="flex flex-col lg:flex-row items-center gap-16 mb-40">
          <motion.div 
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full"
          >
            <div className="inline-flex items-center space-x-2 text-[--color-accent-lime] font-semibold mb-4 tracking-wide text-sm uppercase">
              <Network className="w-5 h-5" />
              <span>Model 01</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[--color-text-primary] leading-tight tracking-tight">
              Burnout Prediction
            </h2>
            <p className="text-[--color-text-secondary] text-lg leading-relaxed mb-8">
              Protect your workforce. Our integrated ML model analyzes weekly hours, utilization rates, and historical mental fatigue to predict and flag high burnout risks before assigning teams to high-pressure projects.
            </p>
            <ul className="space-y-4">
              {['Analyzes 10+ wellbeing features', 'Prevents chronic overallocation', 'Triggers human-in-the-loop warnings'].map((item, i) => (
                <li key={i} className="flex items-center space-x-3 text-[--color-text-primary]">
                  <CheckCircle2 className="w-5 h-5 text-[#2c5966] flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex-1 w-full flex justify-center lg:justify-end"
          >
            {/* Product UI Representation: Burnout Dashboard */}
            <div className="card-elevated w-full max-w-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" />
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[--color-surface-2] flex items-center justify-center">
                    <User className="w-5 h-5 text-[--color-text-primary]" />
                  </div>
                  <div>
                    <div className="font-semibold text-[--color-text-primary]">Alex Chen</div>
                    <div className="text-xs text-[--color-text-secondary]">Senior Developer</div>
                  </div>
                </div>
                <div className="bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 border border-rose-500/30">
                  <AlertTriangle className="w-3 h-3" />
                  <span>High Risk</span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[--color-text-secondary]">Current Workload</span>
                    <span className="font-semibold text-data text-[--color-text-primary]">115%</span>
                  </div>
                  <div className="h-2 w-full bg-[--color-surface-2] rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500 w-[60%]" />
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '40%' }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full bg-amber-500" 
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '15%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-rose-500" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="card-base !p-4 !rounded-xl">
                    <div className="text-xs text-[--color-text-secondary] mb-1 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Consecutive Days</span>
                    </div>
                    <div className="text-2xl font-bold text-data text-[--color-text-primary]">12</div>
                  </div>
                  <div className="card-base !p-4 !rounded-xl border-rose-500/30">
                    <div className="text-xs text-[--color-text-secondary] mb-1 flex items-center space-x-1">
                      <BatteryWarning className="w-3 h-3 text-rose-400" />
                      <span>Mental Fatigue</span>
                    </div>
                    <div className="text-2xl font-bold text-data text-rose-400">High</div>
                  </div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                  className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-sm text-rose-200 flex items-start space-x-2"
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                  <span>Recommendation: Immediate reassignment or mandatory leave required to prevent burnout.</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Success Model */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full"
          >
            <div className="inline-flex items-center space-x-2 text-[--color-accent-cyan] font-semibold mb-4 tracking-wide text-sm uppercase">
              <LineChart className="w-5 h-5" />
              <span>Model 02</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[--color-text-primary] leading-tight tracking-tight">
              Project Success Prediction
            </h2>
            <p className="text-[--color-text-secondary] text-lg leading-relaxed mb-8">
              Generate multiple candidate teams and rank them by predicted success. We aggregate team-level features against project complexity and risk to forecast delivery excellence.
            </p>
            <ul className="space-y-4">
              {['Aggregates team skill & experience depth', 'Evaluates against project complexity', 'Provides human-readable confidence scores'].map((item, i) => (
                <li key={i} className="flex items-center space-x-3 text-[--color-text-primary]">
                  <CheckCircle2 className="w-5 h-5 text-[--color-accent-cyan] flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex-1 w-full flex justify-center lg:justify-start"
          >
            {/* Product UI Representation: Success Prediction Dashboard */}
            <div className="card-elevated w-full max-w-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[--color-accent-cyan] rounded-full blur-[80px] opacity-20 pointer-events-none" />
              
              <div className="flex items-center space-x-2 mb-6">
                <Target className="w-5 h-5 text-[--color-accent-cyan]" />
                <h3 className="font-semibold text-[--color-text-primary]">Delivery Forecast</h3>
              </div>

              <div className="flex items-end space-x-4 mb-8">
                <div className="text-6xl font-bold text-display text-[--color-text-primary] tracking-tighter">
                  87<span className="text-3xl text-[--color-accent-cyan]">%</span>
                </div>
                <div className="text-sm text-[--color-text-secondary] mb-2 font-medium">
                  Success Probability
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-label text-[--color-text-secondary] mb-2">Key Factor Impact</div>
                
                {[
                  { label: "Skill Synergy", value: "+18%", positive: true, delay: 0.2 },
                  { label: "Domain Experience", value: "+12%", positive: true, delay: 0.4 },
                  { label: "Requirement Complexity", value: "-4%", positive: false, delay: 0.6 },
                  { label: "Burnout Risk (Mitigated)", value: "+2%", positive: true, delay: 0.8 },
                ].map((factor, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: factor.delay }}
                    className="flex items-center justify-between p-3 rounded-lg bg-[--color-surface-2] border border-[--color-border-subtle]"
                  >
                    <span className="text-sm text-[--color-text-primary]">{factor.label}</span>
                    <div className={`flex items-center space-x-1 text-sm font-semibold text-data ${factor.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {factor.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{factor.value}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
