import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function SignUpPage() {
  return (
    <div className="min-h-screen bg-[--color-page-bg] text-[--color-text-primary] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[15%] w-[450px] h-[450px] bg-[--color-accent-lime] rounded-full blur-[140px] opacity-[0.05]" />
        <div className="absolute bottom-[10%] right-[15%] w-[450px] h-[450px] bg-[--color-accent-cyan] rounded-full blur-[140px] opacity-[0.05]" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Navigation back */}
        <div className="w-full mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors bg-[--color-surface-1] border border-[--color-border-subtle] px-3.5 py-1.5 rounded-full shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to NEXAWIS</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="NEXAWIS" className="w-8 h-8 object-contain" />
            <span className="font-bold tracking-tight text-sm">NEXAWIS</span>
          </div>
        </div>

        {/* Clerk Sign-up Component */}
        <div className="w-full flex justify-center">
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            forceRedirectUrl="/app"
          />
        </div>
      </div>
    </div>
  );
}
