import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';

interface PaymentGatewaysSimulatorProps {
  bkashAppKey?: string;
  bkashSandbox?: boolean | string;
  nagadMerchantId?: string;
  sslStoreId?: string;
}

export const PaymentGatewaysSimulator: React.FC<PaymentGatewaysSimulatorProps> = ({
  bkashAppKey = '',
  bkashSandbox = true,
  nagadMerchantId = '',
  sslStoreId = '',
}) => {
  const [selectedGateway, setSelectedGateway] = useState<'bkash' | 'nagad' | 'sslcommerz'>('bkash');

  const isBkashSandbox = bkashSandbox === true || bkashSandbox === '1' || bkashSandbox === 'true';
  const hasBkash = Boolean(bkashAppKey);
  const hasNagad = Boolean(nagadMerchantId);
  const hasSsl = Boolean(sslStoreId);

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
              Customer Payment Checkout Experience Simulator
            </span>
            <span className="text-2xs text-muted block">
              Simulate checkout sheet presentation, credentials validation, and sandbox routing
            </span>
          </div>
        </div>

        {/* Gateway switch */}
        <div className="flex items-center p-0.5 rounded-lg bg-surface-sunken border border-default">
          <Button
            type="button"
            variant={selectedGateway === 'bkash' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedGateway('bkash')}
            className="text-2xs px-2.5 py-1 h-auto"
          >
            bKash Direct
          </Button>
          <Button
            type="button"
            variant={selectedGateway === 'nagad' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedGateway('nagad')}
            className="text-2xs px-2.5 py-1 h-auto"
          >
            Nagad Wallet
          </Button>
          <Button
            type="button"
            variant={selectedGateway === 'sslcommerz' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedGateway('sslcommerz')}
            className="text-2xs px-2.5 py-1 h-auto"
          >
            SSLCommerz
          </Button>
        </div>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4">
        <div className="p-4 rounded-xl border border-default bg-surface space-y-4 max-w-lg mx-auto shadow-xs">
          {/* Mock checkout header */}
          <div className="flex items-center justify-between border-b border-default pb-3">
            <div className="space-y-0.5">
              <span className="text-2xs text-muted block">Invoice Settlement #INV-2026-00482</span>
              <span className="text-sm font-bold text-default">Amount Due: ৳ 4,250.00 BDT</span>
            </div>
            <Badge
              tone={
                selectedGateway === 'bkash'
                  ? isBkashSandbox
                    ? 'warning-subtle'
                    : 'success-subtle'
                  : 'surface-sunken'
              }
              className="text-2xs"
            >
              {selectedGateway === 'bkash'
                ? isBkashSandbox
                  ? 'Sandbox Testnet'
                  : 'Production Live'
                : 'Card & MFS'}
            </Badge>
          </div>

          {/* Active Gateway Presentation */}
          {selectedGateway === 'bkash' && (
            <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-pink-600 text-white flex items-center justify-center font-bold text-xs">
                    ৳
                  </div>
                  <div>
                    <span className="text-xs font-bold text-pink-700 dark:text-pink-400 block">
                      bKash Tokenized Checkout
                    </span>
                    <span className="text-2xs text-muted block">Direct API v1.2.0-beta</span>
                  </div>
                </div>
                {hasBkash ? (
                  <span className="text-2xs text-success flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="size-3" /> Credentials Set
                  </span>
                ) : (
                  <span className="text-2xs text-warning flex items-center gap-1 font-semibold">
                    <AlertTriangle className="size-3" /> App Key Missing
                  </span>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-surface border border-default text-2xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">Merchant App Key:</span>
                  <span className="font-mono text-default">
                    {bkashAppKey ? `${bkashAppKey.slice(0, 8)}••••••••` : 'Not Configured'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Agreement Status:</span>
                  <span className="text-success font-medium">Instant 1-Click Settlement</span>
                </div>
              </div>
            </div>
          )}

          {selectedGateway === 'nagad' && (
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                    N
                  </div>
                  <div>
                    <span className="text-xs font-bold text-orange-700 dark:text-orange-400 block">
                      Nagad Payment Gateway
                    </span>
                    <span className="text-2xs text-muted block">Encrypted PGW v2</span>
                  </div>
                </div>
                {hasNagad ? (
                  <span className="text-2xs text-success flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="size-3" /> Configured
                  </span>
                ) : (
                  <span className="text-2xs text-warning flex items-center gap-1 font-semibold">
                    <AlertTriangle className="size-3" /> Merchant ID Required
                  </span>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-surface border border-default text-2xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">Merchant ID:</span>
                  <span className="font-mono text-default">{nagadMerchantId || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {selectedGateway === 'sslcommerz' && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    <CreditCard className="size-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 block">
                      SSLCommerz Multi-Bank Gateway
                    </span>
                    <span className="text-2xs text-muted block">Visa &middot; Mastercard &middot; Amex &middot; MFS</span>
                  </div>
                </div>
                {hasSsl ? (
                  <span className="text-2xs text-success flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="size-3" /> Active Store
                  </span>
                ) : (
                  <span className="text-2xs text-warning flex items-center gap-1 font-semibold">
                    <AlertTriangle className="size-3" /> Store ID Empty
                  </span>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-surface border border-default text-2xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">Store ID:</span>
                  <span className="font-mono text-default">{sslStoreId || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Secure trust seal */}
          <div className="pt-2 border-t border-default flex items-center justify-between text-2xs text-muted">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-primary" />
              PCI-DSS Tier-1 Compliant SSL Session
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Zap className="size-2.5 text-accent" /> Latency: 42ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
