import { ArrowRight, Hexagon } from 'lucide-react';
import { motion } from 'framer-motion';

const dimensions = [
  "Skills", "Performance", "Availability", 
  "Wellbeing", "Experience", "Growth", 
  "Project Fit", "Workload", "Project Priority"
];

export function AwisRadial() {
  return (
    <section className="mb-8 relative z-10 card-base p-8 md:p-12 overflow-hidden border border-[--color-border-strong]">
      <div className="absolute inset-0 bg-gradient-to-b from-[--color-accent-cyan]/5 to-transparent pointer-events-none" />
      
      <div className="text-center mb-12 relative z-10">
        <h2 className="text-2xl font-bold text-[--color-text-primary] tracking-tight mb-2">AWIS Intelligence</h2>
        <p className="text-[--color-text-secondary]">Understand the factors influencing workforce and project decisions.</p>
      </div>

      <div className="relative w-full max-w-2xl mx-auto aspect-square md:aspect-[16/9] flex items-center justify-center min-h-[450px]">
        
        {/* Decorative background rings */}
        <div className="absolute w-[300px] h-[300px] rounded-full border border-[--color-border-subtle] opacity-50" />
        <div className="absolute w-[450px] h-[450px] rounded-full border border-[--color-border-subtle] opacity-20 border-dashed" />
        
        {/* Center Score */}
        <div className="relative z-20 flex flex-col items-center justify-center w-40 h-40 rounded-full bg-[var(--color-surface-2)] border-[4px] border-[var(--color-accent-cyan)] shadow-[0_0_40px_rgba(2,132,199,0.2)]">
          <Hexagon className="absolute inset-0 w-full h-full text-[var(--color-accent-cyan)] opacity-10 transform scale-125 stroke-[1]" />
          <span className="text-5xl font-display font-bold text-[var(--color-text-primary)] z-10 mt-2">92.4</span>
          <span className="text-[11px] uppercase tracking-widest text-[var(--color-text-secondary)] mt-1 z-10 font-bold">AWIS Score</span>
        </div>

        {/* Orbiting Dimensions */}
        {dimensions.map((dim, i) => {
          const angle = (i * (360 / dimensions.length)) * (Math.PI / 180);
          const radius = 180; // Distance from center
          
          // Calculate x and y relative to center (0,0)
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.div
              key={dim}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5, type: 'spring' }}
              className="absolute z-10 hidden md:flex"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              <div className="bg-[--color-surface-1] border border-[--color-border-strong] px-3 py-1.5 rounded-full text-xs font-bold text-[--color-text-secondary] shadow-lg whitespace-nowrap">
                {dim}
              </div>
            </motion.div>
          );
        })}
        
        {/* Mobile List Fallback */}
        <div className="absolute inset-0 z-10 flex flex-wrap content-between justify-between p-4 md:hidden pointer-events-none opacity-50">
           {dimensions.map(dim => (
             <div key={dim} className="text-[10px] border border-[--color-border-subtle] rounded px-1.5 py-0.5 m-1 bg-[--color-bg-base]">
               {dim}
             </div>
           ))}
        </div>
      </div>

      <div className="mt-8 flex justify-center relative z-10">
        <button data-cursor="button" className="flex items-center space-x-2 text-sm font-bold text-[--color-text-primary] hover:text-[--color-accent-lime] transition-colors group">
          <span>View AWIS Analysis</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </section>
  );
}
