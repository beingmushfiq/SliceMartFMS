import { useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="relative mb-6">
        <div className="absolute -inset-4 rounded-full bg-indigo-500/10 blur-2xl dark:bg-indigo-500/20" />
        <div className="relative flex size-20 items-center justify-center rounded-3xl bg-linear-to-b from-slate-100 to-slate-200 p-0.5 shadow-xl dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700/60">
          <div className="flex size-full items-center justify-center rounded-[22px] bg-white dark:bg-slate-950">
            <Compass className="size-9 text-indigo-600 dark:text-indigo-400 drop-shadow-sm" />
          </div>
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <div className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-mono">
          404 · Page Not Found
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl font-sans">
          This workspace wandered off
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          The page or record you are trying to reach may have been archived, renamed, or moved to another workspace.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          onClick={() => navigate('/dashboard')}
          leftIcon={<Home className="size-4" />}
          className="shadow-md shadow-primary/20"
        >
          Go to Dashboard
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

export default NotFoundPage;
