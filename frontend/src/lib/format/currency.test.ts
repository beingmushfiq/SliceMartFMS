import { describe, it, expect } from 'vitest';
import { formatCurrency, formatQuantity, formatPercent } from './currency';

describe('currency format utility', () => {
  it('formats BDT amounts with default symbol', () => {
    expect(formatCurrency(1500, { currency: 'BDT' })).toBe('৳ 1,500.00');
    expect(formatCurrency('25499.50', { currency: 'BDT' })).toBe('৳ 25,499.50');
  });

  it('formats USD and other currencies correctly', () => {
    expect(formatCurrency(450.75, { currency: 'USD' })).toBe('$ 450.75');
    expect(formatCurrency(1200, { currency: 'EUR' })).toBe('€ 1,200.00');
    expect(formatCurrency(8500, { currency: 'INR' })).toBe('₹ 8,500.00');
  });

  it('handles null, undefined, and empty string safely', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
    expect(formatCurrency('')).toBe('—');
    expect(formatCurrency('invalid-number')).toBe('—');
  });

  it('formats industrial quantities cleanly', () => {
    expect(formatQuantity(120, 'pcs')).toBe('120 pcs');
    expect(formatQuantity('45.2500', 'kg')).toBe('45.25 kg');
    expect(formatQuantity(null)).toBe('0');
  });

  it('formats percentage cleanly', () => {
    expect(formatPercent(15.5)).toBe('15.5%');
    expect(formatPercent('98.25', 2)).toBe('98.25%');
    expect(formatPercent(null)).toBe('0%');
  });
});
