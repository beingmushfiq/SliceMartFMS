// ═══════════════════════════════════════════════════════════════════════════
// FORM ELEMENTS — Input, Select, Textarea, FormGroup            §10.2, §10.3
// ───────────────────────────────────────────────────────────────────────────
// Token-only classes. All dimensions from layer 3 (--input-*), so compact
// density resizes every form element without touching this file (§2.5).
//
// Legacy defects resolved:
//   - Deleted classes: form-group, form-label, form-label-required, form-error,
//     form-helper, form-input, form-input-error, form-select, form-textarea,
//     search-wrapper, search-icon, search-input
//   - Primitive colours: text-slate-400 → text-muted
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { cn } from '../../lib/utils';

// ── Shared input classes ───────────────────────────────────────────────────
// Built from --input-* tokens (tokens.component.css §2.5).

const inputBase = cn(
  'w-full rounded-(--input-radius) border px-(--input-px)',
  'bg-(--input-bg) text-default',
  'text-(length:--input-font-size) leading-normal',
  'border-(--input-border)',
  'placeholder:text-subtle',
  'transition-token-colors',
  'focus-visible:outline-none focus-visible:border-(--input-border-focus) focus-visible:ring-focus',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

const inputError = 'border-danger focus-visible:border-danger';

// ── FormGroup ──────────────────────────────────────────────────────────────

interface FormGroupProps {
  label?: string;
  required?: boolean;
  error?: string;
  helper?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function FormGroup({ label, required, error, helper, children, className, id }: FormGroupProps) {
  return (
    <div className={cn('flex flex-col gap-(--input-label-gap)', className)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'text-sm font-medium text-default',
            required && "after:content-['*'] after:ml-0.5 after:text-danger"
          )}
        >
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-danger" role="alert">{error}</p>
      )}
      {helper && !error && (
        <p className="text-xs text-muted">{helper}</p>
      )}
    </div>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, leftElement, rightElement, className, ...props }, ref) => {
    if (leftElement || rightElement) {
      return (
        <div className="relative flex items-center">
          {leftElement && (
            <span className="absolute left-3 flex items-center text-muted pointer-events-none">
              {leftElement}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              inputBase,
              leftElement && 'pl-9',
              rightElement && 'pr-9',
              error && inputError,
              className
            )}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 flex items-center text-muted">
              {rightElement}
            </span>
          )}
        </div>
      );
    }
    return (
      <input
        ref={ref}
        className={cn(inputBase, error && inputError, className)}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// ── Select ─────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, placeholder, children, className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(inputBase, error && inputError, className)}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  )
);
Select.displayName = 'Select';

// ── Textarea ───────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(inputBase, 'min-h-24 resize-y', error && inputError, className)}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

// ── SearchInput ────────────────────────────────────────────────────────────

import { Search } from 'lucide-react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export function SearchInput({ onClear, className, ...props }: SearchInputProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="absolute left-3 size-4 text-muted pointer-events-none" aria-hidden="true" />
      <input
        className={cn(inputBase, 'pl-9', onClear && 'pr-9')}
        type="search"
        {...props}
      />
    </div>
  );
}
