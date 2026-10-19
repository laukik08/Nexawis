import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'success' | 'warning' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-[var(--accent-light)] text-[var(--accent)] border-[var(--accent)]/15',
  warning: 'bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/15',
  neutral: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]',
};

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5',
        'text-xs font-medium font-mono tracking-wide',
        'rounded-full border',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
