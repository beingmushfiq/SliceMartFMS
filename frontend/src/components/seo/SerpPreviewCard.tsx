import React, { useState } from 'react';
import { Globe, Share2, Smartphone, Monitor } from 'lucide-react';
import { cn } from '../../lib/utils';

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
    if (titleLength === 0) {
      return { label: 'Missing', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
    }
    if (titleLength < 35) {
      return { label: 'Too Short (<35)', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
    }
    if (titleLength > 65) {
      return { label: 'Truncated (>65)', color: 'text-rose-600 bg-rose-500/10 border-rose-500/20' };
    }
    return { label: 'Optimal (50-60)', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
  };

  const getDescStatus = () => {
    if (descLength === 0) {
      return { label: 'Missing', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
    }
    if (descLength < 120) {
      return { label: `Short (${descLength}/120)`, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
    }
    if (descLength > 160) {
      return { label: 'Truncated (>160)', color: 'text-rose-600 bg-rose-500/10 border-rose-500/20' };
    }
    return { label: 'Optimal (120-160)', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
  };

  const titleStatus = getTitleStatus();
  const descStatus = getDescStatus();

  const formattedUrl = `https://${domain}${urlPath.startsWith('/') ? urlPath : '/' + urlPath}`;

  return (
    <div className="rounded-2xl border border-default bg-surface p-5 shadow-xs space-y-4">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-default">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTab('google')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
              tab === 'google'
                ? 'bg-primary text-primary-fg shadow-xs'
                : 'text-muted hover:text-default hover:bg-surface-sunken'
            )}
          >
            <Globe className="size-3.5" />
            Google SERP Preview
          </button>
          <button
            type="button"
            onClick={() => setTab('social')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
              tab === 'social'
                ? 'bg-primary text-primary-fg shadow-xs'
                : 'text-muted hover:text-default hover:bg-surface-sunken'
            )}
          >
            <Share2 className="size-3.5" />
            Social & X Card
          </button>
        </div>

        {tab === 'google' && (
          <div className="flex items-center gap-1 bg-surface-sunken border border-default/60 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={cn(
                'p-1.5 rounded-md text-xs transition-colors cursor-pointer',
                deviceMode === 'desktop'
                  ? 'bg-surface text-default shadow-2xs border border-default/60'
                  : 'text-muted hover:text-default'
              )}
              title="Desktop view"
            >
              <Monitor className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={cn(
                'p-1.5 rounded-md text-xs transition-colors cursor-pointer',
                deviceMode === 'mobile'
                  ? 'bg-surface text-default shadow-2xs border border-default/60'
                  : 'text-muted hover:text-default'
              )}
              title="Mobile view"
            >
              <Smartphone className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Metrics Bar in 2-Column Clean Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-default/80 bg-surface-sunken/40 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-2xs">
            <span className="text-muted font-medium">Title Length</span>
            <span className="font-mono font-bold text-default">{titleLength} chars</span>
          </div>
          <span className={cn('inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border', titleStatus.color)}>
            {titleStatus.label}
          </span>
        </div>
        <div className="rounded-xl border border-default/80 bg-surface-sunken/40 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-2xs">
            <span className="text-muted font-medium">Meta Description</span>
            <span className="font-mono font-bold text-default">{descLength} chars</span>
          </div>
          <span className={cn('inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border', descStatus.color)}>
            {descStatus.label}
          </span>
        </div>
      </div>

      {/* Preview Body */}
      {tab === 'google' ? (
        <div
          className={cn(
            'p-4 rounded-xl bg-surface-sunken/50 border border-default transition-all',
            deviceMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
          )}
        >
          {/* Site identity header */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="size-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {brandName.charAt(0)}
            </div>
            <div className="text-xs leading-tight min-w-0">
              <span className="font-semibold text-default block truncate">{brandName}</span>
              <span className="text-[11px] text-muted truncate block max-w-md">{formattedUrl}</span>
            </div>
          </div>

          {/* SERP Title */}
          <h3 className="text-base font-semibold text-primary hover:underline cursor-pointer leading-snug line-clamp-2 my-1">
            {title || 'Page Title Placeholder | ' + brandName}
          </h3>

          {/* SERP Snippet */}
          <p className="text-xs text-muted leading-relaxed line-clamp-3">
            {description || 'No meta description configured yet. Search engines will automatically generate a snippet from on-page content.'}
          </p>
        </div>
      ) : (
        <div className="max-w-md mx-auto rounded-xl border border-default bg-surface-sunken overflow-hidden shadow-xs">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-44 object-cover border-b border-default" />
          ) : (
            <div className="w-full h-36 bg-linear-to-br from-emerald-600 to-teal-800 flex items-center justify-center p-4 text-center">
              <span className="text-white font-extrabold text-sm opacity-90">{brandName} Social Card</span>
            </div>
          )}
          <div className="p-3.5 space-y-1 bg-surface">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted block">
              {domain}
            </span>
            <h4 className="text-xs font-bold text-default line-clamp-1">
              {title || 'Page Title'}
            </h4>
            <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
              {description || 'Discover genuine factory items, wholesale pricing, and instant online tracking.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
