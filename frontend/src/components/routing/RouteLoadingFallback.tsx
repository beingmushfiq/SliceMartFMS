import { ProgressBar } from '../ui/Feedback';

export function RouteLoadingFallback() {
  return (
    <div className="w-full py-6 space-y-4 animate-in fade-in duration-200">
      <ProgressBar label="Loading workspace..." indeterminate />
      <div className="space-y-4 pt-4">
        <div className="h-24 w-full rounded-(--card-radius) border border-(--card-border) bg-(--card-bg) p-4 skeleton-shimmer" />
        <div className="h-64 w-full rounded-(--card-radius) border border-(--card-border) bg-(--card-bg) p-4 skeleton-shimmer" />
      </div>
    </div>
  );
}

export function StorefrontRouteLoadingFallback() {
  return (
    <div className="w-full py-12 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-200">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Loading...</p>
    </div>
  );
}
