import { SectionLabel } from './ui/SectionLabel';
import { Badge } from './ui/Badge';
import { FadeIn } from './motion/FadeIn';
import { NumberTicker } from './motion/NumberTicker';

const factors = [
  { label: 'Skill Intelligence', value: 0.94, bar: 94 },
  { label: 'Burnout Intelligence', value: 0.87, bar: 87 },
  { label: 'Collaboration', value: 0.91, bar: 91 },
  { label: 'Experience Intelligence', value: 0.82, bar: 82 },
  { label: 'Project Compatibility', value: 0.89, bar: 89 },
];

export function Explainability() {
  return (
    <section id="explainability" className="bg-[var(--surface-dark)] py-20 md:py-28 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left — Copy */}
          <div>
            <FadeIn>
              <SectionLabel dark>Explainability</SectionLabel>
              <h2 className="text-display-lg font-display text-[var(--text-on-dark)] mt-3 mb-4">
                Recommendations you
                <br className="hidden md:block" />
                can interrogate.
              </h2>
              <p className="text-body-lg text-[var(--text-muted-on-dark)] mb-6 max-w-lg">
                Every recommendation comes with a full explanation: which
                dimensions drove the score, what risks were flagged, why
                alternatives were excluded, and how confident the prediction is.
              </p>
              <p className="text-body text-[var(--text-muted-on-dark)] mb-8 max-w-lg">
                This isn't post-hoc rationalization. The explanation is generated
                from the same features and weights that produced the score —
                factor contributions, eligibility rule outcomes, and model
                confidence bounds.
              </p>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="flex flex-col gap-3 p-5 rounded-[var(--radius-md)] bg-white/[0.03] border border-[var(--border-dark)]">
                <span className="text-caption text-[var(--text-muted-on-dark)]">
                  Exclusion transparency
                </span>
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] mt-2 shrink-0" aria-hidden="true" />
                  <p className="text-sm text-[var(--text-muted-on-dark)]">
                    <strong className="text-[var(--text-on-dark)]">Raj Patel</strong> excluded —
                    burnout risk score 0.78 exceeds project threshold (0.65). Current
                    workload: 3 active projects, 52h/week avg.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted-on-dark)] mt-2 shrink-0" aria-hidden="true" />
                  <p className="text-sm text-[var(--text-muted-on-dark)]">
                    <strong className="text-[var(--text-on-dark)]">Anh Nguyen</strong> excluded —
                    insufficient remaining capacity (12% available,
                    minimum 30% required for high-priority projects).
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Right — Explanation Card */}
          <FadeIn delay={0.3} direction="left" distance={32}>
            <div className="bg-[var(--surface-darker)] border border-[var(--border-dark)] rounded-[var(--radius-lg)] overflow-hidden">
              {/* Card header */}
              <div className="px-6 py-4 border-b border-[var(--border-dark)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-caption text-[var(--text-on-dark)]">
                    Priya Sharma
                  </span>
                  <Badge variant="success">Selected</Badge>
                </div>
                <span className="text-xs text-[var(--text-muted-on-dark)]">
                  Senior Backend Engineer · 6 years experience
                </span>
              </div>

              {/* Score */}
              <div className="px-6 py-5 border-b border-[var(--border-dark)]">
                <div className="flex items-baseline gap-3">
                  <span className="text-mono-xl text-[var(--accent)]">
                    <NumberTicker value={92.4} decimals={1} />
                  </span>
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted-on-dark)]">
                    AWIS Score
                  </span>
                </div>
                <p className="text-sm text-[var(--text-muted-on-dark)] mt-2">
                  Strong skill match, low burnout risk, high collaboration history
                </p>
              </div>

              {/* Contributing factors */}
              <div className="px-6 py-5 border-b border-[var(--border-dark)]">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted-on-dark)] block mb-4">
                  Contributing Factors
                </span>
                <div className="space-y-3">
                  {factors.map((factor) => (
                    <div key={factor.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[var(--text-muted-on-dark)]">
                          {factor.label}
                        </span>
                        <span className="text-mono text-[var(--text-on-dark)]">
                          {factor.value.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] rounded-full transition-all duration-700"
                          style={{ width: `${factor.bar}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk & confidence */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted-on-dark)]">Burnout risk:</span>
                  <Badge variant="success">Low · 0.23</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted-on-dark)]">Confidence:</span>
                  <span className="text-mono text-[var(--accent)]">92%</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
