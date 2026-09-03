import React, { useState, useEffect } from 'react';
import { Building2, Globe, ExternalLink, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface BrandAssetFieldProps {
  label: string;
  settingKey: string;
  value: string | unknown;
  onChange: (val: string) => void;
  description?: string;
}

export const BrandAssetField: React.FC<BrandAssetFieldProps> = ({
  label,
  settingKey,
  value,
  onChange,
  description,
}) => {
  const url = typeof value === 'string' ? value : '';
  const isFavicon = settingKey.includes('favicon');
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let active = true;
    const img = new Image();
    img.src = url;
    img.onload = () => {
      if (active) setLoadedUrl(url);
    };
    img.onerror = () => {
      if (active) setLoadedUrl(null);
    };
    return () => {
      active = false;
    };
  }, [url]);

  const isValid = Boolean(url && loadedUrl === url);

  return (
    <div className="p-4 rounded-xl border border-default bg-surface space-y-3">
      <div>
        <span className="text-xs font-bold text-default block">{label}</span>
        <span className="font-mono text-2xs text-muted block">{settingKey}</span>
        {description && <p className="text-2xs text-muted mt-0.5">{description}</p>}
      </div>

      <div className="flex items-center gap-3.5">
        {/* Visual Thumbnail Box */}
        <div
          className={cn(
            'rounded-xl border border-dashed border-default bg-surface-sunken flex items-center justify-center overflow-hidden shrink-0 transition-colors',
            isFavicon ? 'size-12' : 'h-12 w-24'
          )}
        >
          {isValid && url ? (
            <img
              src={url}
              alt="Asset Preview"
              className="size-full object-contain p-1"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted">
              {isFavicon ? (
                <Globe className="size-5" />
              ) : (
                <Building2 className="size-5" />
              )}
            </div>
          )}
        </div>

        {/* Input & Helper */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="relative flex items-center">
            <input
              type="url"
              value={url}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              placeholder={isFavicon ? 'https://.../favicon.png' : 'https://.../brand-logo.png'}
              className="w-full bg-surface-sunken border border-default rounded-xl px-3 py-2 text-xs text-default placeholder:text-subtle pr-16 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono transition-all"
            />

            <div className="absolute right-2 flex items-center gap-1">
              {url && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onChange('');
                    }}
                    className="p-1 text-muted hover:text-default rounded"
                    title="Clear asset"
                  >
                    <X className="size-3.5" />
                  </button>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-muted hover:text-primary rounded"
                    title="Open image in new tab"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-2xs text-muted">
            <span className="flex items-center gap-1">
              <ImageIcon className="size-3 text-primary" />
              {isFavicon ? 'Recommended: 64×64 PNG/ICO' : 'Recommended: SVG or 512×512 PNG'}
            </span>
            {!isValid && url && <span className="text-danger font-medium">Failed to load URL</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
