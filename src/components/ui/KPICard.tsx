// ─────────────────────────────────────────────────────────────
// KPI CARD — Operational metric display with Framer Motion
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { cn } from '../../lib/utils';

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

  return <motion.span className={className}>{display}</motion.span>;
}

interface KPICardProps {
  label:       string;
  value:       string | number;
  subValue?:   string;
  delta?:      number;
  deltaLabel?: string;
  icon?:       React.ReactNode;
  iconColor?:  string;
  alert?:      'warning' | 'error' | 'success';
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
    warning: 'border-l-4 border-l-warning-500',
    error:   'border-l-4 border-l-error-500',
    success: 'border-l-4 border-l-success-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={isClickable ? { y: -2, boxShadow: '0 8px 24px -4px rgb(0 0 0 / 0.1)' } : undefined}
      whileTap={isClickable ? { scale: 0.985 } : undefined}
      className={cn(
        'kpi-card',
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
          <span className="kpi-label truncate">{label}</span>

          {isNumeric ? (
            <AnimatedNumber value={value as number} className="kpi-value" />
          ) : (
            <motion.span
              key={String(value)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="kpi-value"
            >
              {value}
            </motion.span>
          )}

          {subValue && (
            <span className="text-xs text-slate-400 font-400 mt-0.5">{subValue}</span>
          )}
        </div>

        {icon && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.06 + 0.15, type: 'spring', stiffness: 300, damping: 20 }}
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
              iconColor ?? 'bg-slate-100 text-slate-400'
            )}
          >
            {icon}
          </motion.div>
        )}
      </div>

      {delta !== undefined && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.06 + 0.25 }}
          className={cn(
            'flex items-center gap-1 text-xs',
            delta > 0 ? 'kpi-delta-up' : delta < 0 ? 'kpi-delta-down' : 'text-slate-400'
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
            {deltaLabel && <span className="text-slate-400 font-400 ml-1">{deltaLabel}</span>}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Progress KPI ──────────────────────────────────────────────
interface ProgressKPIProps {
  label: string;
  value: number;
  total: number;
  unit?:  string;
  color?: 'blue' | 'green' | 'amber' | 'red';
}

const progressColors = {
  blue:  'bg-blue-500',
  green: 'bg-success-500',
  amber: 'bg-warning-500',
  red:   'bg-error-500',
};

export function ProgressKPI({ label, value, total, unit = 'pcs', color = 'blue' }: ProgressKPIProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-500">{label}</span>
        <span className="text-xs font-600 text-slate-900 font-mono">
          {value.toLocaleString()}<span className="text-slate-400 font-400 ml-0.5">/{total.toLocaleString()} {unit}</span>
        </span>
      </div>
      <div className="progress-bar">
        <motion.div
          className={cn('progress-fill', progressColors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${label}: ${pct}%`}
        />
      </div>
      <span className="text-xs text-slate-400 font-mono">{pct}%</span>
    </div>
  );
}
