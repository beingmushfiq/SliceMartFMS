import React, { useState } from 'react';
import { Globe, Share2, Smartphone, Monitor } from 'lucide-react';

export interface SerpPreviewCardProps {
  title: string;
  description: string;
  urlPath: string;
  domain?: string | undefined;
  brandName?: string | undefined;
  imageUrl?: string | null | undefined;
}

export const SerpPreviewCard: React.FC<SerpPreviewCardProps> = ({
  title,
  description,
  urlPath,
  domain = 'slicemart.tech',
  brandName = 'Slice Mart',
  imageUrl,
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [tab, setTab] = useState<'google' | 'social'>('google');

  const titleLength = title.length;
  const descLength = description.length;

  const getTitleStatus = () => {
    if (titleLength === 0) return { label: 'Missing', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200' };
    if (titleLength < 30) return { label: 'Too Short', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200' };
    if (titleLength > 65) return { label: 'Truncated (>65)', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200' };
    return { label: 'Optimal (50-60)', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' };
  };

  const getDescStatus = () => {
    if (descLength === 0) return { label: 'Missing', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200' };
    if (descLength < 70) return { label: 'Too Short', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200' };
    if (descLength > 165) return { label: 'Truncated (>160)', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200' };
    return { label: 'Optimal (120-160)', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' };
  };

  const titleStatus = getTitleStatus();
  const descStatus = getDescStatus();

  const formattedUrl = `https://${domain}${urlPath.startsWith('/') ? urlPath : '/' + urlPath}`;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('google')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === 'google'
                ? 'bg-primary text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Globe className="size-3.5" />
            Google SERP Preview
          </button>
          <button
            type="button"
            onClick={() => setTab('social')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === 'social'
                ? 'bg-primary text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Share2 className="size-3.5" />
            Social & X Card Preview
          </button>
        </div>

        {tab === 'google' && (
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                deviceMode === 'desktop'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Desktop view"
            >
              <Monitor className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                deviceMode === 'mobile'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Mobile view"
            >
              <Smartphone className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Metrics Bar */}
      <div className="flex flex-wrap items-center gap-3 my-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 dark:text-zinc-400">Title:</span>
          <span className="font-mono font-semibold">{titleLength} chars</span>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${titleStatus.color}`}>
            {titleStatus.label}
          </span>
        </div>
        <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 dark:text-zinc-400">Description:</span>
          <span className="font-mono font-semibold">{descLength} chars</span>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${descStatus.color}`}>
            {descStatus.label}
          </span>
        </div>
      </div>

      {/* Preview Body */}
      {tab === 'google' ? (
        <div
          className={`p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 ${
            deviceMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
          }`}
        >
          {/* Site identity header */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="size-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {brandName.charAt(0)}
            </div>
            <div className="text-xs leading-tight">
              <span className="font-semibold text-zinc-900 dark:text-zinc-200 block">{brandName}</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate block max-w-md">{formattedUrl}</span>
            </div>
          </div>

          {/* SERP Title */}
          <h3 className="text-base sm:text-lg font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer leading-snug line-clamp-2 my-1">
            {title || 'Page Title Placeholder | ' + brandName}
          </h3>

          {/* SERP Snippet */}
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-3">
            {description || 'No meta description configured yet. Search engines will automatically generate a snippet from on-page content.'}
          </p>
        </div>
      ) : (
        <div className="max-w-md mx-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-44 object-cover border-b border-zinc-200 dark:border-zinc-800" />
          ) : (
            <div className="w-full h-36 bg-linear-to-br from-emerald-600 to-teal-800 flex items-center justify-center p-4 text-center">
              <span className="text-white font-extrabold text-sm opacity-90">{brandName} Social Card</span>
            </div>
          )}
          <div className="p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 block">
              {domain}
            </span>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1">
              {title || 'Page Title'}
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {description || 'Discover genuine factory items, wholesale pricing, and instant online tracking.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
