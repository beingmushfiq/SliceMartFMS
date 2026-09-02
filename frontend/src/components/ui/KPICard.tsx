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
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 200, damping: 30, mass: 0.5 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
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
  label: string;
  value: string | number;
  subValue?: string;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  alert?: 'warning' | 'danger' | 'success';
  onClick?: () => void;
  className?: string;
  index?: number; // for stagger
}

export function KPICard({
  label,
  value,
  subValue,
  delta,
  deltaLabel,
  icon,
  iconColor,
  alert,
  onClick,
  className,
  index = 0,
}: KPICardProps) {
  const isClickable = Boolean(onClick);
  const isNumeric = typeof value === 'number';

  const alertBorder = {
    warning: 'border-l-4 border-l-warning',
    danger: 'border-l-4 border-l-danger',
    success: 'border-l-4 border-l-success',
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...enterBase, delay: index * stagger }}
      {...(isClickable && {
        whileHover: { y: craft.hoverLift },
        whileTap: { scale: craft.pressScale },
      })}
      className={cn(
        'group relative overflow-hidden rounded-xl p-4 sm:p-5 bg-surface/90 border border-white/8 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-indigo-500/30 hover:shadow-[0_0_25px_rgba(99,102,241,0.08)]',
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
      {/* Subtle top card shimmer highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent"
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-2.5">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span
            title={label}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-tight leading-snug line-clamp-1 group-hover:text-default transition-colors"
          >
            {label}
          </span>

          {isNumeric ? (
            <AnimatedNumber
              value={value as number}
              className="text-2xl sm:text-3xl font-extrabold text-default tracking-tight tabular"
            />
          ) : (
            <m.span
              key={String(value)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...enterBase }}
              className="text-2xl sm:text-3xl font-extrabold text-default tracking-tight tabular"
            >
              {value}
            </m.span>
          )}

          {subValue && (
            <span
              className="text-[11px] text-muted font-normal leading-snug line-clamp-1 mt-0.5"
              title={subValue}
            >
              {subValue}
            </span>
          )}
        </div>

        {icon && (
          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...enterBase, delay: index * stagger + 0.15 }}
            className={cn(
              'size-8 rounded-xl flex items-center justify-center shrink-0 border border-white/8 shadow-sm transition-transform duration-200 group-hover:scale-110',
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
            'flex items-center gap-1.5 text-xs font-semibold mt-3 pt-2.5 border-t border-white/5 min-w-0',
            delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-muted'
          )}
        >
          {delta > 0 ? (
            <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          ) : delta < 0 ? (
            <TrendingDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <Minus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">
            {delta > 0 ? '+' : ''}
            {delta}%{deltaLabel && <span className="text-muted font-normal ml-1">· {deltaLabel}</span>}
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
  unit?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const progressColors = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export function ProgressKPI({
  label,
  value,
  total,
  unit = 'pcs',
  color = 'primary',
}: ProgressKPIProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted font-medium">{label}</span>
        <span className="text-xs font-semibold text-default font-mono">
          {value.toLocaleString()}
          <span className="text-muted ml-0.5">
            /{total.toLocaleString()} {unit}
          </span>
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
