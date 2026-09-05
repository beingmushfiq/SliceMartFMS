import React from 'react';
import { ShieldCheck, Truck, Clock, Store, MessageCircle, Phone, MapPin, Mail } from 'lucide-react';
import type { StorefrontConfig } from '../../types/api/storefront';

interface StorefrontFooterProps {
  config: StorefrontConfig | null;
}

export const StorefrontFooter: React.FC<StorefrontFooterProps> = ({ config }) => {
  const subdomain = config?.subdomain || 'slicemart';
  const whatsappNumber = config?.whatsapp_number?.replace(/[^0-9]/g, '') || '8801700000000';

  return (
    <footer className="mt-20 border-t border-zinc-800/80 bg-zinc-950/90 text-zinc-400">
      {/* Top Value Proposition Grid */}
      <div className="border-b border-zinc-900 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Truck className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Direct Factory Delivery</h4>
                <p className="text-[11px] text-zinc-400">Dispatched straight from central assembly hub</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">100% Quality Inspected</h4>
                <p className="text-[11px] text-zinc-400">Strict batch QC test on every product</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Clock className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Cash on Delivery</h4>
                <p className="text-[11px] text-zinc-400">Pay safely upon receipt of your parcel</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-column Body */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-tr from-emerald-600 to-teal-400 text-zinc-950 font-bold shadow-md">
                <Store className="size-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-extrabold text-white text-base">
                  {config?.name ?? 'SliceMart'}
                </span>
                <span className="ml-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Official Store
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              {config?.meta_description ||
                'Precision infrared cookers and high-efficiency gas stoves delivered direct-to-consumer and wholesale distribution.'}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all shadow-2xs"
              >
                <MessageCircle className="size-3.5" />
                <span>WhatsApp Live Chat</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono">
              Store Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href={`/store/${subdomain}/products`} className="hover:text-emerald-400 transition-colors">
                  Product Catalog
                </a>
              </li>
              <li>
                <a href={`/store/${subdomain}/track`} className="hover:text-emerald-400 transition-colors">
                  Track Delivery
                </a>
              </li>
              <li>
                <a href={`/store/${subdomain}/account`} className="hover:text-emerald-400 transition-colors">
                  My Orders & Profile
                </a>
              </li>
            </ul>
          </div>

          {/* Company & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono">
              Company & Help
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href={`/store/${subdomain}/pages/about-us`} className="hover:text-emerald-400 transition-colors">
                  About Our Factory
                </a>
              </li>
              <li>
                <a href={`/store/${subdomain}/pages/faq`} className="hover:text-emerald-400 transition-colors">
                  Help & FAQs
                </a>
              </li>
              <li>
                <a href={`/store/${subdomain}/pages/privacy-policy`} className="hover:text-emerald-400 transition-colors">
                  Privacy & Terms
                </a>
              </li>
            </ul>
          </div>

          {/* Factory Contacts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono">
              Factory Support
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <MapPin className="size-3.5 text-emerald-400 shrink-0" />
                <span>Central Industrial Zone, Dhaka</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-3.5 text-emerald-400 shrink-0" />
                <span>{config?.whatsapp_number || '+880 1700-000000'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-3.5 text-emerald-400 shrink-0" />
                <span>orders@{subdomain}.devcenterpoint.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Accepted Payment Badges & Copyright */}
        <div className="mt-12 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-500">
            <span>Accepted Payments:</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">bKash</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">Nagad</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">Visa / Mastercard</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">Cash on Delivery</span>
          </div>

          <div className="text-zinc-500 text-[11px]">
            © {new Date().getFullYear()} {config?.name ?? 'SliceMart'}. Powered by DevCenterPoint Factory Platform.
          </div>
        </div>
      </div>
    </footer>
  );
};
