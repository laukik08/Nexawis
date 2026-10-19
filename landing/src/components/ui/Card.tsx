import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ hoverable = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-elevated)] rounded-[var(--radius-lg)]',
        'border border-[var(--border-subtle)]',
        'shadow-[var(--shadow-sm)]',
        'p-6 md:p-8',
        hoverable && [
          'transition-all duration-300 ease-out',
          'hover:shadow-[var(--shadow-md)]',
          'hover:border-[var(--accent)]/20',
          'hover:-translate-y-0.5',
        ],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
