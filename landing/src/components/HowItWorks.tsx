import { FadeIn } from './motion/FadeIn';
import { SectionLabel } from './ui/SectionLabel';

const steps = [
  {
    id: 1,
    label: 'Employee Intelligence',
    description: 'Skills, experience, performance, workload, collaboration — structured into a living digital profile.',
  },
  {
    id: 2,
    label: 'Project Intelligence',
    description: 'Requirements, complexity, risk, team constraints — parsed into structured matching criteria.',
  },
  {
    id: 3,
    label: 'Burnout Prediction',
    description: 'ML model scores each employee\'s burnout risk from workload, fatigue, and work patterns.',
  },
  {
    id: 4,
    label: 'AWIS Scoring',
    description: '9-dimension composite score, weighted by project type. Skills, burnout, growth, fit — all quantified.',
  },
  {
    id: 5,
    label: 'Team Recommendation',
    description: 'Multi-objective optimizer builds candidate teams. Ranked by composite AWIS and team balance.',
  },
  {
    id: 6,
    label: 'Success Prediction',
    description: 'Second ML model predicts each candidate team\'s success probability from 20+ features.',
  },
  {
    id: 7,
    label: 'Manager Approval',
    description: 'Explainable output delivered. The manager reviews, modifies, or rejects. Humans decide.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[var(--bg-secondary)] py-20 md:py-28 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <FadeIn>
          <SectionLabel>How it works</SectionLabel>
          <h2 className="text-display-lg font-display text-[var(--text-primary)] mt-3 mb-4 max-w-3xl">
            From project creation to approved team
            <span className="text-[var(--text-tertiary)]"> — </span>
            in one guided flow.
          </h2>
          <p className="text-body-lg text-[var(--text-secondary)] max-w-2xl mb-12 md:mb-16">
            Seven stages, each with defined inputs and outputs. No stage is
            skipped or hidden.
          </p>
        </FadeIn>

        {/* Pipeline — Desktop: horizontal, Mobile: vertical */}
        <div className="relative">
          {/* Desktop horizontal layout */}
          <div className="hidden lg:block">
            {/* Connecting line */}
            <div
              className="absolute top-6 left-0 right-0 h-px bg-[var(--border)]"
              aria-hidden="true"
            />
            <div className="grid grid-cols-7 gap-0">
              {steps.map((step, i) => (
                <FadeIn key={step.id} delay={0.08 * i}>
                  <div className="relative pt-0 pr-4">
                    {/* Node */}
                    <div className="relative z-10 flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full border-2 border-[var(--accent)] bg-[var(--bg-secondary)]" />
                      <span className="text-mono text-[var(--accent)]">
                        {String(step.id).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="text-caption font-display font-semibold text-[var(--text-primary)] mb-2">
                      {step.label}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* Mobile/Tablet vertical layout */}
          <div className="lg:hidden space-y-0">
            {steps.map((step, i) => (
              <FadeIn key={step.id} delay={0.06 * i}>
                <div className="flex gap-4">
                  {/* Vertical line + node */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-3 h-3 rounded-full border-2 border-[var(--accent)] bg-[var(--bg-secondary)] relative z-10" />
                    {i < steps.length - 1 && (
                      <div className="w-px flex-1 bg-[var(--border)]" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-8">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-mono text-[var(--accent)] text-xs">
                        {String(step.id).padStart(2, '0')}
                      </span>
                      <h3 className="text-caption font-display font-semibold text-[var(--text-primary)]">
                        {step.label}
                      </h3>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
