import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface SectionLabelProps extends HTMLAttributes<HTMLSpanElement> {
  dark?: boolean;
}

export function SectionLabel({ dark = false, className, children, ...props }: SectionLabelProps) {
  return (
    <span
      className={cn(
        'inline-block font-mono text-[11px] font-medium',
        'uppercase tracking-[0.15em]',
        dark ? 'text-[var(--text-muted-on-dark)]' : 'text-[var(--text-tertiary)]',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
