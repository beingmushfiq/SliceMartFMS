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
import { ChevronDown } from 'lucide-react';
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

export function FormGroup({
  label,
  required,
  error,
  helper,
  children,
  className,
  id,
}: FormGroupProps) {
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
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      {helper && !error && <p className="text-xs text-muted">{helper}</p>}
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
            <span className="absolute right-3 flex items-center text-muted">{rightElement}</span>
          )}
        </div>
      );
    }
    return <input ref={ref} className={cn(inputBase, error && inputError, className)} {...props} />;
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
    <div className="relative flex items-center w-full">
      <select
        ref={ref}
        className={cn(
          inputBase,
          'appearance-none pr-9 cursor-pointer',
          error && inputError,
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 flex items-center text-muted">
        <ChevronDown className="size-4 opacity-70" />
      </span>
    </div>
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
      <Search
        className="absolute left-3 size-4 text-muted pointer-events-none"
        aria-hidden="true"
      />
      <input className={cn(inputBase, 'pl-9', onClear && 'pr-9')} type="search" {...props} />
    </div>
  );
}

// ── CurrencyInput ──────────────────────────────────────────────────────────

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
  currencySymbol?: string;
  error?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  currencySymbol = '$',
  error,
  className,
  ...props
}: CurrencyInputProps) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 font-semibold text-xs text-muted pointer-events-none select-none">
        {currencySymbol}
      </span>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputBase, 'pl-8 text-right font-mono', error && inputError, className)}
        {...props}
      />
    </div>
  );
}

// ── QuantityInput ──────────────────────────────────────────────────────────

import { Plus, Minus } from 'lucide-react';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  className?: string;
}

export function QuantityInput({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  unit,
  disabled = false,
  className,
}: QuantityInputProps) {
  const handleDecrement = () => {
    if (disabled) return;
    const next = Math.max(min, value - step);
    onChange(next);
  };

  const handleIncrement = () => {
    if (disabled) return;
    const next = max !== undefined ? Math.min(max, value + step) : value + step;
    onChange(next);
  };

  return (
    <div className={cn('inline-flex items-center rounded-(--input-radius) border border-(--input-border) bg-(--input-bg) p-0.5', className)}>
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={handleDecrement}
        className="p-1.5 rounded text-muted hover:text-default hover:bg-surface-sunken disabled:opacity-40 transition-colors"
      >
        <Minus className="size-3.5" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        disabled={disabled}
        className="w-16 text-center text-xs font-mono bg-transparent border-none focus:outline-none text-default"
      />
      {unit && <span className="text-[10px] text-muted pr-1.5">{unit}</span>}
      <button
        type="button"
        disabled={disabled || (max !== undefined && value >= max)}
        onClick={handleIncrement}
        className="p-1.5 rounded text-muted hover:text-default hover:bg-surface-sunken disabled:opacity-40 transition-colors"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

// ── PercentageInput ────────────────────────────────────────────────────────

interface PercentageInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
  error?: boolean;
}

export function PercentageInput({
  value,
  onChange,
  error,
  className,
  ...props
}: PercentageInputProps) {
  return (
    <div className="relative flex items-center">
      <input
        type="number"
        step="0.1"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputBase, 'pr-8 text-right font-mono', error && inputError, className)}
        {...props}
      />
      <span className="absolute right-3 font-semibold text-xs text-muted pointer-events-none select-none">
        %
      </span>
    </div>
  );
}

