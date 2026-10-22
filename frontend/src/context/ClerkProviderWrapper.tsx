/**
 * NEXAWIS Frontend - Clerk Provider Wrapper.
 * Configures ClerkProvider with project tokens, dynamic dark/light appearance tokens,
 * and handles missing configuration states gracefully.
 */

import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { useTheme } from './ThemeContext';
import { ShieldAlert } from 'lucide-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

interface ClerkProviderWrapperProps {
  children: React.ReactNode;
}

export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  const { theme } = useTheme();

  if (!PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Clerk Configuration Required</h1>
        <p className="text-sm text-gray-400 max-w-md mb-6">
          Missing <code className="text-cyan-400 font-mono bg-white/5 px-2 py-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> in your environment.
          Please define it in <code className="text-lime-400 font-mono bg-white/5 px-2 py-1 rounded">frontend/.env</code> to activate authentication.
        </p>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={{
        layout: {
          socialButtonsVariant: 'blockButton',
          logoPlacement: 'inside',
        },
        variables: {
          colorPrimary: isDark ? '#06b6d4' : '#0891b2',
          colorBackground: isDark ? '#0b1329' : '#ffffff',
          colorText: isDark ? '#f8fafc' : '#0f172a',
          colorTextSecondary: isDark ? '#94a3b8' : '#64748b',
          colorInputBackground: isDark ? '#111d38' : '#f8fafc',
          colorBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
          borderRadius: '1rem',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        elements: {
          card: isDark
            ? 'bg-[#0b1329]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl'
            : 'bg-white/95 backdrop-blur-2xl border border-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl',
          headerTitle: isDark ? 'text-white font-bold text-2xl' : 'text-gray-900 font-bold text-2xl',
          headerSubtitle: isDark ? 'text-slate-400' : 'text-slate-500',
          socialButtonsBlockButton: isDark
            ? 'border-white/10 hover:bg-white/5 text-white'
            : 'border-gray-200 hover:bg-gray-50 text-gray-800',
          formButtonPrimary:
            'bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-semibold shadow-md transition-all rounded-xl py-3',
          footerActionLink: 'text-cyan-400 hover:text-cyan-300 font-semibold',
          identityPreviewText: isDark ? 'text-white font-medium' : 'text-gray-900 font-medium',
          identityPreviewEditButton: 'text-cyan-400 hover:text-cyan-300',
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
