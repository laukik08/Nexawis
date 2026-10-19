import { Card } from './ui/Card';
import { SectionLabel } from './ui/SectionLabel';
import { FadeIn } from './motion/FadeIn';

const capabilities = [
  {
    title: 'Burnout Prediction',
    description:
      'Continuous burnout risk scoring from workload, fatigue, and work patterns. Flags at-risk employees before assignment — not after.',
    detail: 'Regression model · 10 input features · Continuous score output',
    span: 'lg:col-span-7',
  },
  {
    title: 'Project Success Prediction',
    description:
      'Team-level success probability using 20+ project and team features. Compare candidate teams side by side before committing resources.',
    detail: 'Regression model · Team-aggregated features · Success score per team',
    span: 'lg:col-span-5',
  },
  {
    title: 'AWIS Multi-Dimensional Scoring',
    description:
      'Nine intelligence dimensions — skill match, experience, performance, workload, burnout, collaboration, growth, availability, project compatibility — weighted dynamically by project type.',
    detail: 'Context-aware weights · Normalized 0–1 scale · Deterministic ranking',
    span: 'lg:col-span-4',
  },
  {
    title: 'Explainable AI',
    description:
      'Every recommendation includes human-readable reasons: why selected, why not, contributing factors, and confidence level. No black boxes.',
    detail: 'Per-employee + per-team explanations · Factor breakdown',
    span: 'lg:col-span-4',
  },
  {
    title: 'Human-in-the-Loop',
    description:
      'Managers review, modify, or reject every recommendation. NEXAWIS advises — humans decide. No autonomous assignment, ever.',
    detail: 'Mandatory approval gate · Modification tracking · Audit trail',
    span: 'lg:col-span-4',
  },
];

export function Capabilities() {
  return (
    <section id="capabilities" className="bg-[var(--bg-primary)] py-20 md:py-28 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <FadeIn>
          <SectionLabel>Capabilities</SectionLabel>
          <h2 className="text-display-lg font-display text-[var(--text-primary)] mt-3 mb-4 max-w-3xl">
            Two ML models. Nine scoring dimensions.
            <br className="hidden md:block" />
            One explainable recommendation.
          </h2>
          <p className="text-body-lg text-[var(--text-secondary)] max-w-2xl mb-12 md:mb-16">
            Each component is purpose-built, independently testable, and
            integrated into a single coherent pipeline.
          </p>
        </FadeIn>

        {/* Bento grid: 2 large top, 3 equal bottom */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {capabilities.map((cap, i) => (
            <FadeIn
              key={cap.title}
              delay={0.08 * i}
              className={`${cap.span} md:col-span-1 lg:${cap.span}`}
            >
              <Card hoverable className="h-full flex flex-col">
                <h3 className="text-heading-lg font-display text-[var(--text-primary)] mb-3">
                  {cap.title}
                </h3>
                <p className="text-body text-[var(--text-secondary)] mb-4 flex-1">
                  {cap.description}
                </p>
                <span className="text-mono text-[var(--text-tertiary)] mt-auto pt-4 border-t border-[var(--border-subtle)]">
                  {cap.detail}
                </span>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
