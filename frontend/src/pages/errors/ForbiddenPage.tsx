import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="relative mb-6">
        <div className="absolute -inset-4 rounded-full bg-amber-500/10 blur-2xl dark:bg-amber-500/20" />
        <div className="relative flex size-20 items-center justify-center rounded-3xl bg-linear-to-b from-slate-100 to-slate-200 p-0.5 shadow-xl dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700/60">
          <div className="flex size-full items-center justify-center rounded-[22px] bg-white dark:bg-slate-950">
            <ShieldAlert className="size-9 text-amber-500 drop-shadow-sm" />
          </div>
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <div className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 font-mono">
          403 · Access Restricted
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl font-sans">
          Permission required
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          You do not have the required access permissions to open this workspace. Please contact your organization administrator to request access.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          onClick={() => navigate('/dashboard')}
          leftIcon={<Home className="size-4" />}
          className="shadow-md shadow-primary/20"
        >
          Return to Dashboard
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="size-4" />}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
}

export default ForbiddenPage;
