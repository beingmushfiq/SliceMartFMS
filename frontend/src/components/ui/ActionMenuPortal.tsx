import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

export interface ActionMenuPortalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  className?: string;
  width?: number | string;
  children: React.ReactNode;
}

export function ActionMenuPortal({
  isOpen,
  open,
  onClose,
  anchorEl,
  className,
  width = '13rem', // w-52
  children,
}: ActionMenuPortalProps) {
  const isMenuOpen = isOpen ?? open ?? false;
  const [, setTick] = useState(0);

  const coords = (() => {
    if (!isMenuOpen || !anchorEl || typeof window === 'undefined') return null;
    const rect = anchorEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 260 && rect.top > 260;

    return {
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      right: Math.max(8, window.innerWidth - rect.right),
      openUp,
    };
  })();

  useEffect(() => {
    if (!isMenuOpen || !anchorEl) {
      return;
    }

    const handleScrollOrResize = () => {
      setTick((t) => (t + 1) % 1_000_000);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen, anchorEl, onClose]);

  if (!isMenuOpen || !coords) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 pointer-events-auto">
      {/* Native button backdrop to dismiss on outside click */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close menu"
        className="fixed inset-0 bg-transparent cursor-default w-full h-full border-0 p-0 m-0 outline-none"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Floating Action Menu */}
      <div
        data-action-menu
        style={{
          position: 'fixed',
          top: coords.top !== undefined ? `${coords.top}px` : undefined,
          bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
          right: `${coords.right}px`,
          width: typeof width === 'number' ? `${width}px` : width,
          zIndex: 10000,
        }}
        className={cn(
          'rounded-xl bg-surface border border-default p-1 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5 dark:ring-white/10',
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
