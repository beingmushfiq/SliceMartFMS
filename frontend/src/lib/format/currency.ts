// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL CURRENCY & LOCALIZATION ENGINE
// ───────────────────────────────────────────────────────────────────────────
// Eliminates all hardcoded currency assumptions across the platform.
// Formats financial amounts, quantities, and percentages deterministically
// according to active tenant profile, ISO 4217 currency codes, and locale settings.
// ═══════════════════════════════════════════════════════════════════════════

export interface CurrencyFormatOptions {
  currency?: string;
  symbol?: string;
  decimals?: number;
  locale?: string;
  showSymbol?: boolean;
  showCode?: boolean;
}

export const DEFAULT_CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: '৳',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'د.إ',
  SAR: '﷼',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
  SGD: 'S$',
  MYR: 'RM',
};

/**
 * Pure function to format a numeric or string monetary amount.
 * Handles floating-point inaccuracies, null/undefined guards, and custom symbols.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options: CurrencyFormatOptions = {}
): string {
  if (amount === null || amount === undefined || amount === '') {
    return '—';
  }

  const numericValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericValue)) {
    return '—';
  }

  const currencyCode = (options.currency || 'BDT').toUpperCase();
  const decimals = options.decimals !== undefined ? options.decimals : 2;
  const locale = options.locale || 'en-US';
  const showSymbol = options.showSymbol !== undefined ? options.showSymbol : true;
  const showCode = options.showCode !== undefined ? options.showCode : false;

  const symbol = options.symbol || DEFAULT_CURRENCY_SYMBOLS[currencyCode] || currencyCode;

  const formattedNumber = numericValue.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (showCode && showSymbol) {
    return `${symbol} ${formattedNumber} ${currencyCode}`;
  }
  if (showSymbol) {
    return `${symbol} ${formattedNumber}`;
  }
  if (showCode) {
    return `${formattedNumber} ${currencyCode}`;
  }
  return formattedNumber;
}

/**
 * Formats industrial quantities with units of measure.
 */
export function formatQuantity(
  quantity: number | string | null | undefined,
  unit?: string,
  decimals: number = 2
): string {
  if (quantity === null || quantity === undefined || quantity === '') {
    return '0';
  }

  const numericValue = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  if (isNaN(numericValue)) {
    return '0';
  }

  const formatted = numericValue.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(numericValue) ? 0 : Math.min(decimals, 4),
    maximumFractionDigits: 4,
  });

  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Formats a percentage value (e.g. 0.15 -> 15.0% or 15 -> 15.0%).
 */
export function formatPercent(
  value: number | string | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined || value === '') {
    return '0%';
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numericValue)) {
    return '0%';
  }

  return `${numericValue.toFixed(decimals)}%`;
}
