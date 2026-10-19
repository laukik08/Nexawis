import { SectionLabel } from './ui/SectionLabel';
import { FadeIn } from './motion/FadeIn';

const roles = [
  {
    role: 'Project Manager',
    description:
      'Create a project, receive ranked team recommendations with predicted success scores. Accept, modify, or reject — every recommendation requires your explicit approval.',
    accent: 'var(--accent)',
  },
  {
    role: 'HR',
    description:
      'Maintain employee profiles across skills, certifications, and career development. Monitor workforce health, burnout distribution, and skill gaps across the organization.',
    accent: 'var(--accent)',
  },
  {
    role: 'Leadership',
    description:
      'Org-level dashboards showing workforce utilization, burnout trends, skill distribution, project success rates, and capacity planning — without access to individual recommendation workflows.',
    accent: 'var(--accent)',
  },
  {
    role: 'Employee',
    description:
      'Own your profile — update skills, certifications, and career aspirations. View your assignments and provide post-project feedback that improves future recommendations.',
    accent: 'var(--accent)',
  },
];

export function Roles() {
  return (
    <section id="roles" className="bg-[var(--bg-secondary)] py-20 md:py-28 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <FadeIn>
          <SectionLabel>For your team</SectionLabel>
          <h2 className="text-display-lg font-display text-[var(--text-primary)] mt-3 mb-4 max-w-2xl">
            Role-specific value,
            <br className="hidden md:block" />
            role-scoped access.
          </h2>
          <p className="text-body-lg text-[var(--text-secondary)] max-w-2xl mb-12 md:mb-16">
            Every role sees exactly what they need — no more, no less.
            Sensitive data stays scoped. Actions stay authorized.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)]">
          {roles.map((item, i) => (
            <FadeIn key={item.role} delay={0.08 * i}>
              <div className="bg-[var(--bg-secondary)] p-6 md:p-8 h-full flex flex-col">
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.accent }}
                    aria-hidden="true"
                  />
                  <h3 className="text-heading-md font-display text-[var(--text-primary)]">
                    {item.role}
                  </h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
