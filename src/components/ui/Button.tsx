// ─────────────────────────────────────────────────────────────
// BUTTON — Design system button with all variants and states
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantMap: Record<ButtonVariant, string> = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  ghost:     'btn-ghost',
  success:   'btn-success',
  warning:   'btn-warning',
};

const sizeMap: Record<ButtonSize, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        variantMap[variant],
        sizeMap[size],
        fullWidth && 'w-full justify-center',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
      ) : leftIcon ? (
        <span className="w-3.5 h-3.5 shrink-0" aria-hidden="true">{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon && (
        <span className="w-3.5 h-3.5 shrink-0" aria-hidden="true">{rightIcon}</span>
      )}
    </button>
  );
}
