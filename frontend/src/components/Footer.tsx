import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const footerLinks = {
  product: [
    { name: 'AWIS Intelligence', href: '/product/awis-intelligence' },
    { name: '9 Dimensions', href: '/product/9-dimensions' },
    { name: 'How It Works', href: '/product/how-it-works' }
  ],
  solutions: [
    { name: 'Workforce Allocation', href: '/solutions/workforce-allocation' },
    { name: 'Team Formation', href: '/solutions/team-formation' },
    { name: 'Wellbeing', href: '/solutions/employee-wellbeing' },
    { name: 'Project Intelligence', href: '/solutions/project-intelligence' }
  ],
  resources: [
    { name: 'Documentation', href: '/resources/documentation' },
    { name: 'Research', href: '/resources/research' },
    { name: 'Insights', href: '/resources/insights' }
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' }
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookie-policy' }
  ]
};

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
            <button data-cursor="button" className="btn-accent px-8 py-4 rounded-full font-semibold flex items-center justify-center space-x-3 text-lg mx-auto group">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12 mb-20">
          
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-6 group inline-flex" data-cursor="link">
              <div className="transition-transform duration-300 group-hover:scale-105 rounded overflow-hidden flex items-center justify-center">
                <img src="/logo.png" alt="NEXAWIS" className="w-10 h-10 object-contain brightness-0 invert dark:brightness-100 dark:invert-0 opacity-90" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[--color-text-primary]">NEXAWIS</span>
            </Link>
            <p className="text-[--color-text-secondary] text-sm leading-relaxed mb-8 pr-4 max-w-sm">
              The premier Adaptive Workforce Intelligence Framework. Construct perfectly balanced, sustainable project teams using explainable AI.
            </p>
            <div className="flex space-x-3">
              <a href="#" aria-label="Twitter" className="w-10 h-10 rounded-full bg-[--color-surface-2] border border-[--color-border-strong] flex items-center justify-center text-[--color-text-secondary] hover:text-[--color-accent-lime] hover:border-[--color-accent-lime]/50 hover:-translate-y-1 transition-all duration-300">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="w-10 h-10 rounded-full bg-[--color-surface-2] border border-[--color-border-strong] flex items-center justify-center text-[--color-text-secondary] hover:text-[--color-accent-lime] hover:border-[--color-accent-lime]/50 hover:-translate-y-1 transition-all duration-300">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>

          {/* Links: Product */}
          <div className="col-span-1">
            <h4 className="text-label text-[--color-text-primary] mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-[--color-text-secondary]">
              {footerLinks.product.map(link => (
                <li key={link.name}>
                  <Link to={link.href} className="hover:text-[--color-text-primary] hover:translate-x-1 inline-block transition-all duration-300">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links: Solutions */}
          <div className="col-span-1">
            <h4 className="text-label text-[--color-text-primary] mb-6">Solutions</h4>
            <ul className="space-y-4 text-sm text-[--color-text-secondary]">
              {footerLinks.solutions.map(link => (
                <li key={link.name}>
                  <Link to={link.href} className="hover:text-[--color-text-primary] hover:translate-x-1 inline-block transition-all duration-300">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links: Resources */}
          <div className="col-span-1">
            <h4 className="text-label text-[--color-text-primary] mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-[--color-text-secondary]">
              {footerLinks.resources.map(link => (
                <li key={link.name}>
                  <Link to={link.href} className="hover:text-[--color-text-primary] hover:translate-x-1 inline-block transition-all duration-300">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links: Company & Legal */}
          <div className="col-span-1">
            <h4 className="text-label text-[--color-text-primary] mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-[--color-text-secondary] mb-8">
              {footerLinks.company.map(link => (
                <li key={link.name}>
                  <Link to={link.href} className="hover:text-[--color-text-primary] hover:translate-x-1 inline-block transition-all duration-300">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="text-label text-[--color-text-primary] mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-[--color-text-secondary]">
              {footerLinks.legal.map(link => (
                <li key={link.name}>
                  <Link to={link.href} className="hover:text-[--color-text-primary] hover:translate-x-1 inline-block transition-all duration-300">
                    {link.name}
                  </Link>
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
