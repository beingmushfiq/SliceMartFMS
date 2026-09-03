/**
 * Document Formatting Utilities
 */

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertLessThanThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    str += ONES[n] + ' ';
  }
  return str.trim();
}

/**
 * Converts a numeric amount to formal words in South Asian numbering (Crore, Lakh, Thousand) or Western.
 * Standard for ERP invoices (e.g., "Twenty-Five Thousand Four Hundred Fifty Taka Only").
 */
export function numberToWords(amount: number | string, currencyUnit = 'Taka', subUnit = 'Paisa'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) return `Zero ${currencyUnit} Only`;

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let words = '';

  // South Asian scale: Crore (1,00,00,000), Lakh (1,00,000), Thousand (1,000)
  let remaining = integerPart;

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;

  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;

  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;

  const hundred = remaining;

  if (crore > 0) {
    words += convertLessThanThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    words += convertLessThanThousand(hundred) + ' ';
  }

  words = words.trim() + ` ${currencyUnit}`;

  if (decimalPart > 0) {
    words += ` and ${convertLessThanThousand(decimalPart)} ${subUnit}`;
  }

  return words + ' Only';
}

/**
 * Formats a currency string with commas and decimals
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currencySymbol = '$',
  decimals = 2
): string {
  if (value === null || value === undefined || value === '') return `${currencySymbol}0.00`;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return `${currencySymbol}0.00`;

  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${currencySymbol}${formatted}`;
}

/**
 * Formats date into readable format: 30 Aug 2026, 04:30 PM
 */
export function formatDocumentDate(
  dateString?: string | null,
  includeTime = false
): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const dateFormatted = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (!includeTime) return dateFormatted;

    const timeFormatted = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return `${dateFormatted} at ${timeFormatted}`;
  } catch {
    return dateString;
  }
}
