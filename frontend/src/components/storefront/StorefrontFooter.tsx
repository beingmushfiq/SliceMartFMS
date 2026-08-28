import React from 'react';
import { ShieldCheck, Truck, Clock } from 'lucide-react';
import type { StorefrontConfig } from '../../types/api/storefront';

interface StorefrontFooterProps {
  config: StorefrontConfig | null;
}

export const StorefrontFooter: React.FC<StorefrontFooterProps> = ({ config }) => {
  return (
    <footer className="mt-20 border-t border-zinc-900 bg-zinc-950/60 text-zinc-400">
      {/* Value Proposition Badges */}
      <div className="border-b border-zinc-900/80 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-zinc-900 bg-zinc-900/30 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">Express Factory Delivery</h4>
                <p className="text-[11px] text-zinc-500">Directly from our central production hub</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-zinc-900 bg-zinc-900/30 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">100% Quality Guaranteed</h4>
                <p className="text-[11px] text-zinc-500">Strict factory QC inspection on every batch</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-zinc-900 bg-zinc-900/30 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">Cash on Delivery</h4>
                <p className="text-[11px] text-zinc-500">Pay safely upon receipt of your parcel</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-medium text-zinc-400 border-b border-zinc-900 pb-4">
          <a href={`/store/${config?.subdomain || 'slicemart'}`} className="hover:text-white transition-colors">
            Catalog Home
          </a>
          <a href={`/store/${config?.subdomain || 'slicemart'}/track`} className="hover:text-white transition-colors">
            Track Order
          </a>
          <a href={`/store/${config?.subdomain || 'slicemart'}/pages/about-us`} className="hover:text-white transition-colors">
            About Our Factory
          </a>
          <a href={`/store/${config?.subdomain || 'slicemart'}/pages/faq`} className="hover:text-white transition-colors">
            Help & FAQ
          </a>
          <a href={`/store/${config?.subdomain || 'slicemart'}/pages/privacy-policy`} className="hover:text-white transition-colors">
            Return & Privacy Policy
          </a>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row text-xs">
          <div>
            <span className="font-semibold text-zinc-300">{config?.name}</span>
            <span className="text-zinc-500"> — Powered by DevCenterPoint Factory SaaS</span>
          </div>
          <div className="text-[11px] text-zinc-500">
            © {new Date().getFullYear()} All rights reserved. Secure Cloud E-Commerce.
          </div>
        </div>
      </div>
    </footer>
  );
};
