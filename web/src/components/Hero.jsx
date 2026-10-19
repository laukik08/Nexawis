import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ParticleNetwork, TactileButton } from '@designcodeio/threeui';
import { ArrowUpRight, Play } from 'lucide-react';
import './Hero.css';

const Hero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <section className="hero-section">
      <div className="hero-canvas-container">
        {/* threeui ParticleNetwork for interactive 3D background */}
        <ParticleNetwork 
          color="var(--color-accent)" 
          backgroundColor="transparent"
          particleCount={200}
        />
      </div>

      <motion.div 
        className="container hero-content"
        style={{ y: y1, opacity }}
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
        >
          <span className="eyebrow hero-eyebrow">Adaptive Workforce Intelligence</span>
        </motion.div>

        <motion.h1 
          className="text-hero hero-title"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
        >
          Build Project Teams<br />
          That <span className="text-accent">Actually Succeed.</span>
        </motion.h1>

        <motion.p 
          className="text-body hero-subtitle"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
          NEXAWIS goes beyond skills matching. We evaluate 9 dimensions of intelligence—including predicted burnout and project fit—to recommend the perfect team.
        </motion.p>

        <motion.div 
          className="hero-actions"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          <TactileButton 
            text="Start Building Teams" 
            icon={<ArrowUpRight size={18} />} 
          />
          
          <button className="btn-secondary">
            <div className="play-icon-circle">
              <Play size={14} fill="currentColor" style={{ marginLeft: '2px' }} />
            </div>
            See How AWIS Works
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
