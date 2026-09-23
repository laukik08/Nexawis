import { PageHeader } from '../../components/PageHeader';

export function CookiePolicy() {
  return (
    <div className="pb-32">
      <PageHeader 
        title="Cookie Policy" 
        subtitle="Last Updated: October 1, 2025"
        badge="Legal"
      />
      
      <section className="py-24 container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto card-base p-10 space-y-8 text-[--color-text-secondary] leading-relaxed">
          
          <h2 className="text-2xl font-bold text-[--color-text-primary] mt-4">1. What are cookies?</h2>
          <p>
            Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
          </p>

          <h2 className="text-2xl font-bold text-[--color-text-primary] mt-12">2. How we use cookies</h2>
          <p>
            NEXAWIS uses cookies for the following purposes:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Essential:</strong> To remember your theme preferences (Light/Dark mode) and authentication sessions.</li>
            <li><strong>Performance:</strong> To analyze how visitors use our platform, helping us optimize the AWIS visualization engines.</li>
          </ul>

          <h2 className="text-2xl font-bold text-[--color-text-primary] mt-12">3. Managing your preferences</h2>
          <p>
            You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of the NEXAWIS platform may become inaccessible or not function properly.
          </p>

        </div>
      </section>
    </div>
  );
}
