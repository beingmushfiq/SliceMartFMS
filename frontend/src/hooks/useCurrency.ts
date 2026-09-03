// ═══════════════════════════════════════════════════════════════════════════
// USE CURRENCY HOOK
// ───────────────────────────────────────────────────────────────────────────
// Subscribes to the authenticated tenant context and exposes dynamic currency
// formatting utilities, eliminating all hardcoded BDT assumptions.
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useMemo } from 'react';
import { useAuthStore } from '../lib/auth/authStore';
import {
  formatCurrency as formatCurrencyPure,
  formatQuantity as formatQuantityPure,
  formatPercent as formatPercentPure,
  DEFAULT_CURRENCY_SYMBOLS,
  type CurrencyFormatOptions,
} from '../lib/format/currency';

export function useCurrency() {
  const tenant = useAuthStore((state) => state.tenant);

  // Dynamic tenant-configured currency parameters
  const currencyCode = useMemo(() => {
    return (tenant?.currency_code || 'BDT').toUpperCase();
  }, [tenant?.currency_code]);

  const currencySymbol = useMemo(() => {
    return (
      (tenant as unknown as { currency_symbol?: string })?.currency_symbol ||
      DEFAULT_CURRENCY_SYMBOLS[currencyCode] ||
      currencyCode
    );
  }, [tenant, currencyCode]);

  const formatCurrency = useCallback(
    (amount: number | string | null | undefined, options?: Partial<CurrencyFormatOptions>) => {
      return formatCurrencyPure(amount, {
        currency: currencyCode,
        symbol: currencySymbol,
        ...options,
      });
    },
    [currencyCode, currencySymbol]
  );

  const formatQuantity = useCallback(
    (quantity: number | string | null | undefined, unit?: string, decimals?: number) => {
      return formatQuantityPure(quantity, unit, decimals);
    },
    []
  );

  const formatPercent = useCallback(
    (value: number | string | null | undefined, decimals?: number) => {
      return formatPercentPure(value, decimals);
    },
    []
  );

  return {
    currencyCode,
    currencySymbol,
    formatCurrency,
    formatQuantity,
    formatPercent,
  };
}
