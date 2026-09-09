import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Building2,
  Receipt,
  Monitor,
  ShoppingBag,
  Globe,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface BrandAssetsStudioProps {
  logoUrl?: string;
  faviconUrl?: string;
  companyName?: string;
}

export const BrandAssetsStudio: React.FC<BrandAssetsStudioProps> = ({
  logoUrl = '',
  faviconUrl = '',
  companyName = 'Enterprise Industrial Ltd.',
}) => {
  const [activeContext, setActiveContext] = useState<'invoice' | 'pos' | 'storefront'>('invoice');
  const [loadedLogo, setLoadedLogo] = useState<string | null>(null);
  const [loadedFavicon, setLoadedFavicon] = useState<string | null>(null);

  useEffect(() => {
    if (!logoUrl) return;
    let active = true;
    const img = new Image();
    img.src = logoUrl;
    img.onload = () => {
      if (active) setLoadedLogo(logoUrl);
    };
    img.onerror = () => {
      if (active) setLoadedLogo(null);
    };
    return () => {
      active = false;
    };
  }, [logoUrl]);

  useEffect(() => {
    if (!faviconUrl) return;
    let active = true;
    const img = new Image();
    img.src = faviconUrl;
    img.onload = () => {
      if (active) setLoadedFavicon(faviconUrl);
    };
    img.onerror = () => {
      if (active) setLoadedFavicon(null);
    };
    return () => {
      active = false;
    };
  }, [faviconUrl]);

  const hasValidLogo = Boolean(logoUrl && loadedLogo === logoUrl);
  const hasValidFavicon = Boolean(faviconUrl && loadedFavicon === faviconUrl);

  return (
    <div className="rounded-xl border border-default bg-surface-sunken/60 overflow-hidden space-y-0 transition-all">
      {/* Top Bar */}
      <div className="px-4 py-3 bg-surface border-b border-default flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-default block">
              Omni-Channel Brand Asset Simulator
            </span>
            <span className="text-2xs text-muted block">
              Instant verification of logo scale, contrast, and clarity across operational channels
            </span>
          </div>
        </div>

        {/* Context switch */}
        <div className="flex items-center p-0.5 rounded-lg bg-surface-sunken border border-default">
          <Button
            type="button"
            variant={activeContext === 'invoice' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveContext('invoice')}
            className="text-2xs px-2.5 py-1 h-auto"
          >
            <Receipt className="size-3 mr-1" />
            Print Invoice
          </Button>
          <Button
            type="button"
            variant={activeContext === 'pos' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveContext('pos')}
            className="text-2xs px-2.5 py-1 h-auto"
          >
            <Monitor className="size-3 mr-1" />
            POS Terminal
          </Button>
          <Button
            type="button"
            variant={activeContext === 'storefront' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveContext('storefront')}
            className="text-2xs px-2.5 py-1 h-auto"
          >
            <ShoppingBag className="size-3 mr-1" />
            Web Storefront
          </Button>
        </div>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4">
        {activeContext === 'invoice' && (
          <div className="p-5 rounded-xl border border-default bg-surface space-y-4">
            <div className="flex items-center justify-between border-b border-default pb-3">
              <span className="text-2xs font-mono uppercase tracking-wider text-muted">
                Document Masthead Specimen &middot; 300 DPI Monochrome Contrast
              </span>
              <span className="text-2xs text-success font-medium">B&amp;W Invert Ready</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-14 rounded-lg border border-default bg-surface-sunken flex items-center justify-center p-1 overflow-hidden shrink-0">
                  {hasValidLogo ? (
                    <img src={logoUrl} alt="Logo" className="size-full object-contain filter grayscale" />
                  ) : (
                    <Building2 className="size-7 text-muted" />
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-default tracking-tight">
                    {companyName}
                  </h4>
                  <p className="text-2xs text-muted">
                    TAX INVOICE &middot; MUSHAK 6.3 &middot; DELIVERY CHALLAN
                  </p>
                </div>
              </div>

              <div className="text-right font-mono text-2xs text-muted">
                <p>DOC: INV-2026-00482</p>
                <p>DATE: 2026-09-10</p>
              </div>
            </div>
          </div>
        )}

        {activeContext === 'pos' && (
          <div className="p-4 rounded-xl border border-default bg-surface space-y-3">
            <div className="flex items-center justify-between border-b border-default pb-2">
              <span className="text-2xs font-mono uppercase tracking-wider text-muted">
                POS Register Topbar Shell
              </span>
              <span className="text-2xs font-medium text-primary">Station #01 &middot; Active</span>
            </div>

            <div className="p-3 rounded-lg bg-surface-sunken border border-default flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-md bg-surface border border-default flex items-center justify-center p-0.5 overflow-hidden">
                  {hasValidLogo ? (
                    <img src={logoUrl} alt="Logo" className="size-full object-contain" />
                  ) : (
                    <Building2 className="size-4 text-primary" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-default block">{companyName}</span>
                  <span className="text-2xs text-muted block">Express Checkout Station</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-2xs font-mono bg-success/10 text-success border border-success/20">
                  Drawer Balanced
                </span>
              </div>
            </div>
          </div>
        )}

        {activeContext === 'storefront' && (
          <div className="space-y-3">
            {/* Browser Tab Preview */}
            <div className="px-3 py-2 rounded-t-lg bg-surface-sunken border border-default border-b-0 flex items-center gap-2 max-w-xs">
              <div className="size-4 rounded-sm bg-surface border border-default flex items-center justify-center overflow-hidden shrink-0">
                {hasValidFavicon ? (
                  <img src={faviconUrl} alt="Favicon" className="size-full object-contain" />
                ) : (
                  <Globe className="size-2.5 text-primary" />
                )}
              </div>
              <span className="text-2xs font-medium text-default truncate">
                {companyName} &middot; Official Online Store
              </span>
            </div>

            {/* Storefront Header Preview */}
            <div className="p-3 rounded-xl border border-default bg-surface flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-surface-sunken border border-default flex items-center justify-center p-1 overflow-hidden shrink-0">
                  {hasValidLogo ? (
                    <img src={logoUrl} alt="Logo" className="size-full object-contain" />
                  ) : (
                    <ImageIcon className="size-5 text-muted" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-default block">{companyName}</span>
                  <span className="text-2xs text-muted block">Customer Storefront Navigation</span>
                </div>
              </div>

              <span className="text-2xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                Cart (0)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
