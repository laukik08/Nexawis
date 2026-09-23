import { PageHeader } from '../../components/PageHeader';

export function TermsOfService() {
  return (
    <div className="pb-32">
      <PageHeader 
        title="Terms of Service" 
        subtitle="Last Updated: October 1, 2025"
        badge="Legal"
      />
      
      <section className="py-24 container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto card-base p-10 space-y-8 text-[--color-text-secondary] leading-relaxed">
          
          <h2 className="text-2xl font-bold text-[--color-text-primary] mt-4">1. Agreement to Terms</h2>
          <p>
            By accessing or using NEXAWIS, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
          </p>

          <h2 className="text-2xl font-bold text-[--color-text-primary] mt-12">2. Enterprise Subscriptions</h2>
          <p>
            Access to the AWIS engine requires a valid enterprise subscription. You are responsible for maintaining the confidentiality of your account and password, and you agree to accept responsibility for all activities that occur under your account.
          </p>

          <h2 className="text-2xl font-bold text-[--color-text-primary] mt-12">3. Acceptable Use</h2>
          <p>
            You agree not to use the service for any unlawful purpose or to conduct any activity that infringes on the rights of others. Automated scraping or reverse-engineering of the 9 Dimensions algorithm is strictly prohibited.
          </p>

          <h2 className="text-2xl font-bold text-[--color-text-primary] mt-12">4. Limitation of Liability</h2>
          <p>
            NEXAWIS provides team formation recommendations based on available data. We do not guarantee project success, and we shall not be liable for any indirect, incidental, or consequential damages resulting from the use of our recommendations.
          </p>

        </div>
      </section>
    </div>
  );
}
