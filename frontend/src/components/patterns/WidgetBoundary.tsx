import type { ReactNode } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface WidgetBoundaryProps {
  children: ReactNode;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export function WidgetBoundary({
  children,
  title,
  onRetry,
  className = '',
}: WidgetBoundaryProps) {
  return (
    <ErrorBoundary
      level="inline"
      fallback={(_error, reset) => (
        <div
          className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-center min-h-[140px] space-y-2 ${className}`}
        >
          <div className="size-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertCircle className="size-4" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {title ? `${title} is unavailable` : 'Widget could not be loaded'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Your other workspace metrics remain unaffected.
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
              if (onRetry) onRetry();
            }}
            leftIcon={<RotateCcw className="size-3" />}
            className="text-xs text-primary hover:bg-primary/10 mt-1"
          >
            Retry
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export default WidgetBoundary;
