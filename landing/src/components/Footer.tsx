const footerLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Explainability', href: '#explainability' },
  { label: 'For Teams', href: '#roles' },
];

export function Footer() {
  return (
    <footer className="bg-[var(--surface-darker)] border-t border-[var(--border-dark)]">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Logo & copyright */}
          <div>
            <span className="font-display font-bold text-base tracking-tight text-[var(--text-on-dark)]">
              NEXAWIS
            </span>
            <p className="text-xs text-[var(--text-muted-on-dark)] mt-1.5">
              Adaptive Workforce Intelligence Framework
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-[var(--text-muted-on-dark)] hover:text-[var(--text-on-dark)] transition-colors focus-ring rounded-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border-dark)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-xs text-[var(--text-muted-on-dark)]">
            © {new Date().getFullYear()} NEXAWIS. All rights reserved.
          </span>
          <span className="text-mono text-[var(--text-muted-on-dark)] text-[10px] uppercase tracking-widest">
            v1.0
          </span>
        </div>
      </div>
    </footer>
  );
}
