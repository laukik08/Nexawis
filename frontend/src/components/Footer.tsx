import { Hexagon, ArrowRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative bg-[--color-bg-base] pt-32 pb-10 overflow-hidden border-t border-[--color-border-subtle]">
      
      {/* Pre-Footer CTA */}
      <div className="container mx-auto px-6 relative z-10 mb-32">
        <div className="relative w-full rounded-[3rem] overflow-hidden p-12 md:p-24 text-center bg-[--color-surface-2] border border-[--color-border-strong] shadow-[--shadow-premium-soft]">
          <div className="absolute inset-0 bg-gradient-to-b from-[--color-accent-cyan]/10 to-transparent opacity-50" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-[--color-text-primary] mb-6 tracking-tight text-display">
              Ready to build sustainable teams?
            </h2>
            <p className="text-[--color-text-secondary] text-body mb-10 text-lg md:text-xl leading-relaxed">
              Deploy NEXAWIS internally and stop relying on guesswork. Predict burnout, maximize project success, and keep humans in the loop.
            </p>
            <button className="btn-accent px-8 py-4 rounded-full font-semibold flex items-center justify-center space-x-3 text-lg mx-auto group">
              <span>Request a Demo</span>
              <div className="bg-black/10 dark:bg-white/10 rounded-full p-1.5 transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight className="w-4 h-4 text-current" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          
          {/* Brand Column */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-[--color-text-primary] rounded-xl p-1.5 flex items-center justify-center">
                <Hexagon className="w-5 h-5 text-[--color-bg-base] fill-[--color-bg-base]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[--color-text-primary]">NEXAWIS</span>
            </div>
            <p className="text-[--color-text-secondary] text-sm leading-relaxed mb-8 pr-4">
              The premier Adaptive Workforce Intelligence Framework. Construct perfectly balanced, sustainable project teams using explainable AI.
            </p>
            <div className="flex space-x-3">
              <a href="#" aria-label="Twitter" className="w-10 h-10 rounded-full bg-[--color-surface-2] border border-[--color-border-strong] flex items-center justify-center text-[--color-text-secondary] hover:text-[--color-accent-lime] hover:border-[--color-accent-lime]/50 hover:-translate-y-1 transition-all duration-300">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="w-10 h-10 rounded-full bg-[--color-surface-2] border border-[--color-border-strong] flex items-center justify-center text-[--color-text-secondary] hover:text-[--color-accent-lime] hover:border-[--color-accent-lime]/50 hover:-translate-y-1 transition-all duration-300">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" aria-label="GitHub" className="w-10 h-10 rounded-full bg-[--color-surface-2] border border-[--color-border-strong] flex items-center justify-center text-[--color-text-secondary] hover:text-[--color-accent-lime] hover:border-[--color-accent-lime]/50 hover:-translate-y-1 transition-all duration-300">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </a>
            </div>
          </div>

          {/* Links: Product */}
          <div>
            <h4 className="text-label text-[--color-text-primary] mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-[--color-text-secondary]">
              {['Workforce Intelligence', 'AWIS Engine', 'Analytics', 'Team Formation', 'Project Intelligence'].map(link => (
                <li key={link}>
                  <a href="#" className="hover:text-[--color-text-primary] hover:translate-x-1 inline-block transition-all duration-300">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links: Platform */}
          <div>
            <h4 className="text-label text-[--color-text-primary] mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-[--color-text-secondary]">
              {['Employee Intelligence', 'Wellbeing & Safety', 'Predictive Modeling', 'Explainable AI', 'Enterprise Security'].map(link => (
                <li key={link}>
                  <a href="#" className="hover:text-[--color-text-primary] hover:translate-x-1 inline-block transition-all duration-300">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links: Resources */}
          <div>
            <h4 className="text-label text-[--color-text-primary] mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-[--color-text-secondary]">
              {['About Us', 'Contact Sales', 'Documentation', 'Privacy Policy', 'Terms of Service'].map(link => (
                <li key={link}>
                  <a href="#" className="hover:text-[--color-text-primary] hover:translate-x-1 inline-block transition-all duration-300">{link}</a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-[--color-border-subtle] text-xs text-[--color-text-muted]">
          <p>© {new Date().getFullYear()} Nexawis Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0 font-medium">
            <span>Adaptive Workforce Intelligence</span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center text-[--color-accent-lime]">
              <span className="w-1.5 h-1.5 rounded-full bg-[--color-accent-lime] mr-2 animate-pulse" />
              System Online
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
