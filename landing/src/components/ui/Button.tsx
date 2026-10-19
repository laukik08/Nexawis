import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-[var(--accent)] text-white',
    'hover:bg-[var(--accent-hover)]',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--accent)]',
  ].join(' '),
  secondary: [
    'bg-transparent border border-[var(--border)]',
    'text-[var(--text-primary)]',
    'hover:bg-[var(--bg-secondary)] hover:border-[var(--text-tertiary)]',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--text-secondary)]',
    'hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
};

const variantStylesDark: Record<ButtonVariant, string> = {
  primary: variantStyles.primary,
  secondary: [
    'bg-transparent border border-[var(--border-dark)]',
    'text-[var(--text-on-dark)]',
    'hover:bg-white/5 hover:border-[var(--text-muted-on-dark)]',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--text-muted-on-dark)]',
    'hover:text-[var(--text-on-dark)] hover:bg-white/5',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm gap-1.5',
  md: 'px-6 py-2.5 text-sm gap-2',
  lg: 'px-8 py-3.5 text-base gap-2',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps & { dark?: boolean }>(
  ({ className, variant = 'primary', size = 'md', dark = false, children, ...props }, ref) => {
    const styles = dark ? variantStylesDark : variantStyles;
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'rounded-[var(--radius-md)] transition-all duration-200 ease-out',
          'focus-ring cursor-pointer',
          styles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
