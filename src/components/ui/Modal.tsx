// ─────────────────────────────────────────────────────────────
// MODAL — Accessible dialog with confirm variant
// ─────────────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const sizeClasses = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-6xl',
};

export function Modal({ open, onClose, title, children, footer, size = 'md', className }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={cn('modal-box', sizeClasses[size], className)}>
        {/* Header */}
        <div className="modal-header">
          <h2 id="modal-title" className="text-base font-600 text-slate-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400
                       hover:bg-slate-100 hover:text-slate-600 transition-colors duration-150
                       cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'danger', loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4 items-start">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
          variant === 'danger' ? 'bg-error-50'   : 'bg-warning-50'
        )}>
          <AlertTriangle className={cn(
            'w-5 h-5',
            variant === 'danger' ? 'text-error-600' : 'text-warning-600'
          )} aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-base font-600 text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
}

// ── Drawer ────────────────────────────────────────────────────
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

const drawerWidths = {
  sm: 'w-80',
  md: 'w-[480px]',
  lg: 'w-[640px]',
};

export function Drawer({ open, onClose, title, children, footer, width = 'md' }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="drawer-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn('drawer-panel', drawerWidths[width])}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 id="drawer-title" className="text-base font-600 text-slate-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400
                       hover:bg-slate-100 hover:text-slate-600 transition-colors duration-150 cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
