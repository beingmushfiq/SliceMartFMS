// ─────────────────────────────────────────────────────────────
// FORM COMPONENTS — Input, Select, Textarea, FormGroup
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { cn } from '../../lib/utils';

// ── FormGroup ─────────────────────────────────────────────────
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
    <div className={cn('form-group', className)}>
      {label && (
        <label
          htmlFor={id}
          className={cn('form-label', required && 'form-label-required')}
        >
          {label}
        </label>
      )}
      {children}
      {error  && <p className="form-error"   role="alert">{error}</p>}
      {helper && !error && <p className="form-helper">{helper}</p>}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────
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
            <span className="absolute left-3 flex items-center text-slate-400 pointer-events-none">
              {leftElement}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'form-input',
              leftElement  && 'pl-9',
              rightElement && 'pr-9',
              error && 'form-input-error',
              className
            )}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 flex items-center text-slate-400">
              {rightElement}
            </span>
          )}
        </div>
      );
    }
    return (
      <input
        ref={ref}
        className={cn('form-input', error && 'form-input-error', className)}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// ── Select ────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, placeholder, children, className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn('form-select', error && 'form-input-error', className)}
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

// ── Textarea ──────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn('form-textarea', error && 'form-input-error', className)}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

// ── SearchInput ────────────────────────────────────────────────
import { Search } from 'lucide-react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export function SearchInput({ onClear, className, ...props }: SearchInputProps) {
  return (
    <div className={cn('search-wrapper', className)}>
      <Search className="search-icon" aria-hidden="true" />
      <input
        className="search-input"
        type="search"
        {...props}
      />
    </div>
  );
}
