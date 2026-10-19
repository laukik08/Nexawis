import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Brain, Users, TrendingUp } from 'lucide-react';
import { OrbitalSphereBackground } from '@designcodeio/threeui';
import './Features.css';

const FeatureCard = ({ title, description, icon: Icon, spanClass, delay, has3DBackground }) => {
  return (
    <motion.div 
      className={`card-shell ${spanClass}`}
      initial={{ y: 40, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="card-core feature-card-core">
        {has3DBackground && (
          <div className="feature-3d-bg">
            <OrbitalSphereBackground color="var(--color-accent-secondary)" backgroundColor="transparent" />
          </div>
        )}
        <div className="feature-content-wrapper">
          <div className="feature-icon-wrapper">
            <Icon size={24} color="var(--color-text-primary)" strokeWidth={1.5} />
          </div>
          <h3 className="feature-title">{title}</h3>
          <p className="feature-description">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

const Features = () => {
  return (
    <section id="features" className="section-spacing container">
      <div className="features-header">
        <motion.span 
          className="eyebrow"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Intelligence Core
        </motion.span>
        <motion.h2 
          className="text-h2"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-16)' }}
        >
          Nine Dimensions of <span style={{ color: 'var(--color-text-muted)' }}>Workforce Reality.</span>
        </motion.h2>
      </div>

      <div className="grid-bento">
        <FeatureCard 
          spanClass="col-span-8"
          delay={0.1}
          icon={Brain}
          title="Predictive Burnout Modeling"
          description="We run continuous regression analysis on workload, mental fatigue, and consecutive working days to predict and prevent burnout before assigning a project."
          has3DBackground={true}
        />
        <FeatureCard 
          spanClass="col-span-4"
          delay={0.2}
          icon={TrendingUp}
          title="Success Probability"
          description="Evaluate candidate teams against project complexity and historical data to generate a confidence score for project delivery."
        />
        <FeatureCard 
          spanClass="col-span-4"
          delay={0.3}
          icon={Activity}
          title="AWIS Composite Scoring"
          description="A dynamic 9-dimension intelligence score that adapts its weights based on project criticality, duration, and innovation requirements."
        />
        <FeatureCard 
          spanClass="col-span-8"
          delay={0.4}
          icon={Users}
          title="Constraint-Optimized Construction"
          description="Generates multiple candidate teams by balancing mandatory skill coverage, seniority distribution, and fair opportunity allocation simultaneously."
        />
      </div>
    </section>
  );
};

export default Features;
