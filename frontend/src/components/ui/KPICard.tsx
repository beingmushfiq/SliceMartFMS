// ─────────────────────────────────────────────────────────────
// KPI CARD — Operational metric display with Framer Motion
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { m, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { cn } from '../../lib/utils';
import { enterBase, stagger, craft } from '../../lib/motion/tokens';

// ── Animated number counter ────────────────────────────────────
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const mv       = useMotionValue(0);
  const spring   = useSpring(mv, { stiffness: 200, damping: 30, mass: 0.5 });
  const display  = useTransform(spring, (v) => Math.round(v).toLocaleString());
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      mv.set(value);
    } else {
      mv.set(value);
    }
  }, [value, mv]);

  return <m.span className={className}>{display}</m.span>;
}

interface KPICardProps {
  label:       string;
  value:       string | number;
  subValue?:   string;
  delta?:      number;
  deltaLabel?: string;
  icon?:       React.ReactNode;
  iconColor?:  string;
  alert?:      'warning' | 'danger' | 'success';
  onClick?:    () => void;
  className?:  string;
  index?:      number;  // for stagger
}

export function KPICard({
  label, value, subValue, delta, deltaLabel, icon, iconColor, alert, onClick, className, index = 0,
}: KPICardProps) {
  const isClickable = Boolean(onClick);
  const isNumeric   = typeof value === 'number';

  const alertBorder = {
    warning: 'border-l-4 border-l-warning',
    danger:  'border-l-4 border-l-danger',
    success: 'border-l-4 border-l-success',
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...enterBase, delay: index * stagger }}
      {...(isClickable && { whileHover: { y: craft.hoverLift }, whileTap: { scale: craft.pressScale } })}
      className={cn(
        'rounded-(--card-radius) p-(--card-padding) bg-(--card-bg) border border-(--card-border) shadow-(--card-shadow)',
        alert && alertBorder[alert],
        isClickable && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      aria-label={isClickable ? `${label}: ${value}` : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-2xs font-semibold tracking-wide uppercase text-muted truncate">{label}</span>

          {isNumeric ? (
            <AnimatedNumber value={value as number} className="text-(length:--kpi-value-size) font-bold text-default tabular" />
          ) : (
            <m.span
              key={String(value)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...enterBase }}
              className="text-(length:--kpi-value-size) font-bold text-default tabular"
            >
              {value}
            </m.span>
          )}

          {subValue && (
            <span className="text-xs text-muted mt-0.5">{subValue}</span>
          )}
        </div>

        {icon && (
          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...enterBase, delay: index * stagger + 0.15 }}
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
              iconColor ?? 'bg-surface-sunken text-muted'
            )}
          >
            {icon}
          </m.div>
        )}
      </div>

      {delta !== undefined && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * stagger + 0.25 }}
          className={cn(
            'flex items-center gap-1 text-xs',
            delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-muted'
          )}
        >
          {delta > 0 ? (
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
          ) : delta < 0 ? (
            <TrendingDown className="w-3 h-3" aria-hidden="true" />
          ) : (
            <Minus className="w-3 h-3" aria-hidden="true" />
          )}
          <span>
            {delta > 0 ? '+' : ''}{delta}%
            {deltaLabel && <span className="text-muted ml-1">{deltaLabel}</span>}
          </span>
        </m.div>
      )}
    </m.div>
  );
}

// ── Progress KPI ──────────────────────────────────────────────
interface ProgressKPIProps {
  label: string;
  value: number;
  total: number;
  unit?:  string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const progressColors = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
};

export function ProgressKPI({ label, value, total, unit = 'pcs', color = 'primary' }: ProgressKPIProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted font-medium">{label}</span>
        <span className="text-xs font-semibold text-default font-mono">
          {value.toLocaleString()}<span className="text-muted ml-0.5">/{total.toLocaleString()} {unit}</span>
        </span>
      </div>
      <div className="h-(--progress-height) rounded-(--progress-radius) bg-surface-sunken overflow-hidden">
        <m.div
          className={cn('h-full rounded-(--progress-radius)', progressColors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ ...enterBase, delay: 0.1 }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${label}: ${pct}%`}
        />
      </div>
      <span className="text-xs text-muted font-mono">{pct}%</span>
    </div>
  );
}
