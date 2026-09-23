import { PageHeader } from '../../components/PageHeader';

export function PrivacyPolicy() {
  return (
    <div className="pb-32">
      <PageHeader 
        title="Privacy Policy" 
        subtitle="Last Updated: October 1, 2025"
        badge="Legal"
      />
      
      <section className="py-24 container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto card-base p-10 space-y-8 text-[--color-text-secondary] leading-relaxed">
          
          <h2 className="text-2xl font-bold text-[--color-text-primary] mt-4">1. Introduction</h2>
          <p>
            Welcome to NEXAWIS. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and use our platform.
          </p>

          <h2 className="text-2xl font-bold text-[--color-text-primary] mt-12">2. Data We Collect</h2>
          <p>
            When using the AWIS engine, we process workforce metadata. This may include:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Professional profile data (skills, roles, history)</li>
            <li>Behavioral assessment metadata</li>
            <li>Project history and capacity metrics</li>
            <li>Usage data and interactions with the platform</li>
          </ul>

          <h2 className="text-2xl font-bold text-[--color-text-primary] mt-12">3. How We Use Your Data</h2>
          <p>
            We use your data solely for providing the NEXAWIS service—specifically to generate explainable team recommendations and predict workforce fatigue. We do not sell your data to third parties.
          </p>

          <h2 className="text-2xl font-bold text-[--color-text-primary] mt-12">4. Data Security</h2>
          <p>
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed.
          </p>

        </div>
      </section>
    </div>
  );
}
