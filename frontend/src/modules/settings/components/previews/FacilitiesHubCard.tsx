import React from 'react';
import {
  Building2,
  Factory,
  PhoneCall,
  Mail,
  MapPin,
  ExternalLink,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface FacilitiesHubCardProps {
  registeredAddress?: string;
  factoryAddress?: string;
  hotlinePhone?: string;
  supportEmail?: string;
}

export const FacilitiesHubCard: React.FC<FacilitiesHubCardProps> = ({
  registeredAddress = '',
  factoryAddress = '',
  hotlinePhone = '',
  supportEmail = '',
}) => {
  const openMaps = (address: string) => {
    if (!address) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rounded-xl border border-default bg-surface-sunken/60 overflow-hidden space-y-0 transition-all">
      {/* Simulator Top Bar */}
      <div className="px-4 py-3 bg-surface border-b border-default flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-default block">
              Operational Facilities &amp; Logistics Hub
            </span>
            <span className="text-2xs text-muted block">
              Physical node topology, receiving dock coordinates, and direct communications hotline
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-2xs text-muted">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-success animate-pulse" />
            2 Physical Nodes Active
          </span>
        </div>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4 space-y-3">
        {/* Dual-Node Topology Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
          {/* Node 1: Corporate HQ */}
          <div className="p-3.5 rounded-xl bg-surface border border-default space-y-2.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Building2 className="size-3" /> Corporate Headquarters
                </span>
                <span className="text-2xs text-muted font-mono">Node #01</span>
              </div>
              <p className="text-xs text-default leading-relaxed font-medium">
                {registeredAddress.trim() || 'No registered corporate address configured.'}
              </p>
            </div>

            <div className="pt-2 border-t border-default flex items-center justify-between gap-2">
              <span className="text-2xs text-muted">Legal Domicile &amp; Accounts</span>
              {registeredAddress && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openMaps(registeredAddress)}
                  className="text-2xs px-2 py-0.5 h-auto text-primary hover:text-primary"
                >
                  <MapPin className="size-3 mr-1" />
                  Maps
                  <ExternalLink className="size-2.5 ml-1" />
                </Button>
              )}
            </div>
          </div>

          {/* Topology link indicator for tablet/desktop */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-7 rounded-full bg-surface border border-default shadow-xs items-center justify-center text-muted pointer-events-none z-10">
            <ArrowRightLeft className="size-3.5 text-primary" />
          </div>

          {/* Node 2: Manufacturing Facility */}
          <div className="p-3.5 rounded-xl bg-surface border border-default space-y-2.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <Factory className="size-3" /> Industrial Plant &amp; Docks
                </span>
                <span className="text-2xs text-muted font-mono">Node #02</span>
              </div>
              <p className="text-xs text-default leading-relaxed font-medium">
                {factoryAddress.trim() || 'No manufacturing plant address configured.'}
              </p>
            </div>

            <div className="pt-2 border-t border-default flex items-center justify-between gap-2">
              <span className="text-2xs text-muted">Receiving &amp; Dispatch Dock</span>
              {factoryAddress && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openMaps(factoryAddress)}
                  className="text-2xs px-2 py-0.5 h-auto text-accent hover:text-accent"
                >
                  <MapPin className="size-3 mr-1" />
                  Maps
                  <ExternalLink className="size-2.5 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Operational Dispatch Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Hotline card */}
          <div className="p-3 rounded-lg bg-surface border border-default flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                <PhoneCall className="size-4" />
              </div>
              <div className="min-w-0">
                <span className="text-2xs text-muted block">24/7 Operations Hotline</span>
                <span className="font-mono text-xs font-bold text-default truncate block">
                  {hotlinePhone || '+880 —'}
                </span>
              </div>
            </div>

            {hotlinePhone && (
              <a
                href={`tel:${hotlinePhone}`}
                className="px-2.5 py-1 text-2xs font-semibold rounded-lg bg-surface-sunken hover:bg-surface-raised border border-default text-default transition-all shrink-0 inline-flex items-center gap-1"
              >
                <PhoneCall className="size-3 text-success" />
                Dial
              </a>
            )}
          </div>

          {/* Email card */}
          <div className="p-3 rounded-lg bg-surface border border-default flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Mail className="size-4" />
              </div>
              <div className="min-w-0">
                <span className="text-2xs text-muted block">Official Support &amp; Dispatch Desk</span>
                <span className="text-xs font-semibold text-default truncate block">
                  {supportEmail || 'support@company.com'}
                </span>
              </div>
            </div>

            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                className="px-2.5 py-1 text-2xs font-semibold rounded-lg bg-surface-sunken hover:bg-surface-raised border border-default text-default transition-all shrink-0 inline-flex items-center gap-1"
              >
                <Mail className="size-3 text-primary" />
                Compose
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
