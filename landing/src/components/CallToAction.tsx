import { Button } from './ui/Button';
import { FadeIn } from './motion/FadeIn';

export function CallToAction() {
  return (
    <section className="bg-[var(--surface-dark)] py-20 md:py-28 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
        <FadeIn>
          <span className="inline-block font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--accent)] mb-4">
            Get started
          </span>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="text-display-lg font-display text-[var(--text-on-dark)] mb-4 max-w-2xl mx-auto">
            Stop guessing.
            <br />
            Start predicting.
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-body-lg text-[var(--text-muted-on-dark)] max-w-xl mx-auto mb-8">
            Request early access to NEXAWIS and see how intelligent,
            explainable workforce allocation changes how your organization
            builds project teams.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="primary" size="lg">
              Request Early Access
            </Button>
            <Button variant="secondary" size="lg" dark>
              Read the Documentation
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
