import { FadeIn } from './motion/FadeIn';
import { SectionLabel } from './ui/SectionLabel';

const problems = [
  {
    number: '01',
    title: 'Staffing by gut feel',
    description:
      'Managers rely on familiarity, availability, and spreadsheets. High-potential employees get overlooked. Poor-fit assignments repeat. Nobody can explain why a team was assembled the way it was.',
  },
  {
    number: '02',
    title: 'No burnout visibility',
    description:
      'Workload accumulates invisibly until someone breaks. By then the project is at risk, the employee is disengaged, and recovery takes months. Reactive, never preventive.',
  },
  {
    number: '03',
    title: 'No explanation, no trust',
    description:
      'When AI does get involved, it\'s a black box. "The system recommended this team" isn\'t an answer. Without transparency into why, there\'s no accountability and no learning.',
  },
];

export function Problem() {
  return (
    <section className="bg-[var(--bg-primary)] py-20 md:py-28 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <FadeIn>
          <SectionLabel>The problem</SectionLabel>
          <h2 className="text-display-lg font-display text-[var(--text-primary)] mt-3 mb-4 max-w-2xl">
            Manual staffing fails predictably.
          </h2>
          <p className="text-body-lg text-[var(--text-secondary)] max-w-2xl mb-12 md:mb-16">
            Most organizations still form project teams the same way they did
            a decade ago — matching names to skill lists, hoping availability
            means readiness.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--border)]">
          {problems.map((problem, i) => (
            <FadeIn key={problem.number} delay={0.1 * i}>
              <div className="bg-[var(--bg-primary)] p-6 md:p-8 lg:p-10 h-full">
                <span className="text-mono text-[var(--text-tertiary)] mb-4 block">
                  {problem.number}
                </span>
                <h3 className="text-heading-lg font-display text-[var(--text-primary)] mb-3">
                  {problem.title}
                </h3>
                <p className="text-body text-[var(--text-secondary)] leading-relaxed">
                  {problem.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
