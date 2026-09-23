import { PageHeader } from '../../components/PageHeader';
import { Send, Mail, MapPin } from 'lucide-react';

export function Contact() {
  return (
    <div className="pb-32">
      <PageHeader 
        title="Contact Us" 
        subtitle="Have questions about deploying NEXAWIS at your organization? Our team is ready to help."
        badge="Company"
      />
      
      <section className="py-24 container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-16">
          
          <div className="w-full md:w-1/3 space-y-8">
            <div>
              <h3 className="text-xl font-bold text-[--color-text-primary] mb-6">Get in Touch</h3>
              <p className="text-[--color-text-secondary] mb-8">
                Fill out the form and our enterprise specialists will get back to you within 24 hours.
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-[--color-surface-2] border border-[--color-border-strong] flex items-center justify-center text-[--color-accent-cyan]">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[--color-text-primary]">Email</div>
                <div className="text-sm text-[--color-text-secondary]">hello@nexawis.com</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-[--color-surface-2] border border-[--color-border-strong] flex items-center justify-center text-[--color-accent-lime]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[--color-text-primary]">Headquarters</div>
                <div className="text-sm text-[--color-text-secondary]">San Francisco, CA</div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3">
            <form className="card-elevated p-8 md:p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[--color-text-primary]">Full Name</label>
                  <input type="text" className="w-full bg-[--color-surface-1] border border-[--color-border-strong] rounded-xl px-4 py-3 text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-cyan] transition-colors" placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[--color-text-primary]">Work Email</label>
                  <input type="email" className="w-full bg-[--color-surface-1] border border-[--color-border-strong] rounded-xl px-4 py-3 text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-cyan] transition-colors" placeholder="jane@company.com" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-[--color-text-primary]">Subject</label>
                <input type="text" className="w-full bg-[--color-surface-1] border border-[--color-border-strong] rounded-xl px-4 py-3 text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-cyan] transition-colors" placeholder="Enterprise Demo Request" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[--color-text-primary]">Message</label>
                <textarea rows={5} className="w-full bg-[--color-surface-1] border border-[--color-border-strong] rounded-xl px-4 py-3 text-[--color-text-primary] focus:outline-none focus:border-[--color-accent-cyan] transition-colors resize-none" placeholder="Tell us about your workforce needs..." />
              </div>
              
              <button type="button" className="btn-accent w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 group">
                <span>Send Message</span>
                <Send className="w-4 h-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

        </div>
      </section>
    </div>
  );
}
