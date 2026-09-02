import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { RotateCcw, Home, ArrowLeft, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { logBoundaryError } from '../../lib/observability/logger';
import { useState, useEffect } from 'react';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  // Generate a short, friendly reference ID for support tracking via lazy state initializer
  const [referenceId] = useState(() => {
    return 'ERR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  });

  useEffect(() => {
    if (error instanceof Error) {
      logBoundaryError(error, {
        level: 'route',
        componentStack: `RouteErrorBoundary [Ref: ${referenceId}]`,
      });
    }
  }, [error, referenceId]);

  // Determine error classification
  let title = 'Something interrupted this workspace';
  let description = 'We were unable to display this section of the application. Your saved data is completely safe.';
  let is404 = false;
  let is403 = false;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'This page could not be found';
      description = 'The workspace you are looking for may have been moved, renamed, or is temporarily unavailable.';
      is404 = true;
    } else if (error.status === 403) {
      title = 'Access Restricted';
      description = 'You do not have the required role permissions to access this workspace. Please contact your organization administrator if you need access.';
      is403 = true;
    } else if (error.statusText) {
      description = error.statusText;
    }
  } else if (error instanceof Error) {
    if (error.message && !error.message.includes('null') && !error.message.includes('undefined')) {
      // If it's a domain/business error message
      description = error.message;
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="relative mb-6">
        {/* Soft decorative glow */}
        <div className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl dark:bg-primary/20" />

        {/* Abstract Emblem */}
        <div className="relative flex size-20 items-center justify-center rounded-3xl bg-linear-to-b from-slate-100 to-slate-200 p-0.5 shadow-xl dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700/60">
          <div className="flex size-full items-center justify-center rounded-[22px] bg-white dark:bg-slate-950">
            {is404 ? (
              <HelpCircle className="size-9 text-slate-500 dark:text-slate-400 drop-shadow-sm" />
            ) : is403 ? (
              <ShieldAlert className="size-9 text-amber-500 drop-shadow-sm" />
            ) : (
              <Sparkles className="size-9 text-indigo-500 dark:text-indigo-400 drop-shadow-sm" />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl font-sans">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          {description}
        </p>
      </div>

      {/* Action Toolbar */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          onClick={() => window.location.reload()}
          leftIcon={<RotateCcw className="size-4" />}
          className="shadow-md shadow-primary/20"
        >
          Try Again
        </Button>

        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="size-4" />}
        >
          Go Back
        </Button>

        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          leftIcon={<Home className="size-4" />}
        >
          Dashboard
        </Button>
      </div>

      {/* Reassurance & Support Reference Badge */}
      <div className="mt-10 flex flex-col items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1.5 font-mono">
          <span>Reference:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
            {referenceId}
          </span>
        </div>
        <span>Provide this reference code if you need assistance from technical support.</span>
      </div>
    </div>
  );
}
