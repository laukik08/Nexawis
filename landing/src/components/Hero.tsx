import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { DotGrid } from './ui/DotGrid';
import { FadeIn } from './motion/FadeIn';

const candidates = [
  {
    name: 'Priya Sharma',
    role: 'Senior Backend Engineer',
    awis: 94.2,
    burnout: 'Low',
    burnoutVariant: 'success' as const,
    skills: ['Python', 'FastAPI', 'PostgreSQL'],
    match: 96,
  },
  {
    name: 'Marcus Chen',
    role: 'Full-Stack Developer',
    awis: 91.7,
    burnout: 'Low',
    burnoutVariant: 'success' as const,
    skills: ['React', 'Node.js', 'TypeScript'],
    match: 93,
  },
  {
    name: 'Elena Kovács',
    role: 'ML Engineer',
    awis: 88.4,
    burnout: 'Moderate',
    burnoutVariant: 'warning' as const,
    skills: ['Python', 'scikit-learn', 'MLOps'],
    match: 89,
  },
];

export function Hero() {
  return (
    <section className="relative bg-[var(--surface-dark)] overflow-hidden">
      <DotGrid />

      {/* Subtle radial gradient for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(45,122,79,0.06) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-6 md:px-8 pt-28 md:pt-36 pb-20 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left — Copy */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <FadeIn delay={0.1}>
              <span className="inline-block font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--accent)] mb-2">
                Adaptive Workforce Intelligence
              </span>
            </FadeIn>

            <FadeIn delay={0.2}>
              <h1 className="text-display-xl font-display text-[var(--text-on-dark)]">
                Workforce intelligence
                <br />
                that explains itself.
              </h1>
            </FadeIn>

            <FadeIn delay={0.3}>
              <p className="text-body-lg text-[var(--text-muted-on-dark)] max-w-xl">
                NEXAWIS evaluates employees across nine dimensions — skills,
                experience, burnout risk, collaboration, growth potential —
                then recommends project teams with predicted success scores
                and human-readable explanations. You decide. The system advises.
              </p>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="flex flex-wrap gap-3 mt-2">
                <Button variant="primary" size="lg">
                  Request Early Access
                </Button>
                <Button variant="secondary" size="lg" dark>
                  See How It Works
                </Button>
              </div>
            </FadeIn>

            <FadeIn delay={0.5}>
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/8">
                <div>
                  <span className="text-mono-lg text-[var(--accent)]">9</span>
                  <span className="block text-caption text-[var(--text-muted-on-dark)]">
                    Intelligence dimensions
                  </span>
                </div>
                <div className="w-px h-8 bg-white/10" aria-hidden="true" />
                <div>
                  <span className="text-mono-lg text-[var(--accent)]">2</span>
                  <span className="block text-caption text-[var(--text-muted-on-dark)]">
                    ML prediction models
                  </span>
                </div>
                <div className="w-px h-8 bg-white/10" aria-hidden="true" />
                <div>
                  <span className="text-mono-lg text-[var(--text-on-dark)]">100%</span>
                  <span className="block text-caption text-[var(--text-muted-on-dark)]">
                    Human approval
                  </span>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Right — AWIS Preview Artifact */}
          <div className="lg:col-span-5">
            <FadeIn delay={0.4} direction="left" distance={32}>
              <div className="bg-[var(--surface-darker)] border border-[var(--border-dark)] rounded-[var(--radius-lg)] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-[var(--border-dark)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />
                    <span className="text-caption text-[var(--text-on-dark)]">
                      Team Recommendation
                    </span>
                  </div>
                  <span className="text-mono text-[var(--text-muted-on-dark)]">
                    3 candidates ranked
                  </span>
                </div>

                {/* Candidate List */}
                <div className="divide-y divide-[var(--border-dark)]">
                  {candidates.map((candidate, i) => (
                    <div
                      key={candidate.name}
                      className="px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Rank */}
                      <span className="text-mono text-[var(--text-muted-on-dark)] w-5 text-right shrink-0">
                        {i + 1}
                      </span>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-caption text-[var(--text-on-dark)] truncate">
                            {candidate.name}
                          </span>
                          <Badge variant={candidate.burnoutVariant}>
                            {candidate.burnout}
                          </Badge>
                        </div>
                        <span className="text-xs text-[var(--text-muted-on-dark)]">
                          {candidate.role}
                        </span>
                        <div className="flex gap-1.5 mt-1.5">
                          {candidate.skills.map((skill) => (
                            <span
                              key={skill}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[var(--text-muted-on-dark)]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* AWIS Score */}
                      <div className="text-right shrink-0">
                        <span className="text-mono-lg text-[var(--accent)]">
                          {candidate.awis}
                        </span>
                        <span className="block text-[10px] font-mono text-[var(--text-muted-on-dark)] uppercase tracking-wider">
                          AWIS
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-[var(--border-dark)] bg-[var(--accent)]/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted-on-dark)]">
                      Predicted team success
                    </span>
                    <span className="text-mono text-[var(--accent)] font-semibold">
                      87.3%
                    </span>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
