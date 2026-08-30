import bwipjs from 'bwip-js';
import type { BarcodeFormat } from './types';

export interface GenerateSvgOptions {
  bcid: BarcodeFormat;
  text: string;
  scale?: number;
  height?: number; // in millimeters
  width?: number; // in millimeters
  includeText?: boolean;
  textxalign?: 'left' | 'center' | 'right';
  alttext?: string;
  rotate?: 'N' | 'R' | 'L' | 'I';
}

/**
 * Normalizes barcode input based on format requirements (EAN-13, EAN-8, etc.)
 * Gracefully falls back to Code128 if data does not match strict EAN checksum requirements.
 */
export function sanitizeBarcodeForFormat(text: string, format: BarcodeFormat): { bcid: string; text: string } {
  const clean = text.trim();
  if (!clean) {
    return { bcid: 'code128', text: '00000000' };
  }

  if (format === 'ean13') {
    const digitsOnly = clean.replace(/\D/g, '');
    if (digitsOnly.length === 12 || digitsOnly.length === 13) {
      return { bcid: 'ean13', text: digitsOnly };
    }
    // Fallback to Code128 if alphanumeric or wrong length
    return { bcid: 'code128', text: clean };
  }

  if (format === 'ean8') {
    const digitsOnly = clean.replace(/\D/g, '');
    if (digitsOnly.length === 7 || digitsOnly.length === 8) {
      return { bcid: 'ean8', text: digitsOnly };
    }
    return { bcid: 'code128', text: clean };
  }

  if (format === 'qrcode') {
    return { bcid: 'qrcode', text: clean };
  }

  if (format === 'upca') {
    const digitsOnly = clean.replace(/\D/g, '');
    if (digitsOnly.length === 11 || digitsOnly.length === 12) {
      return { bcid: 'upca', text: digitsOnly };
    }
    return { bcid: 'code128', text: clean };
  }

  if (format === 'code39') {
    // Code 39 allows uppercase A-Z, 0-9, and - . $ / + % SPACE
    const uppercase = clean.toUpperCase().replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g, '');
    return { bcid: 'code39', text: uppercase || clean };
  }

  // Default Code128
  return { bcid: 'code128', text: clean };
}

/**
 * Generates an optimized SVG string for a barcode or QR code
 */
export function generateBarcodeSvg(options: GenerateSvgOptions): string {
  try {
    const { bcid, text } = sanitizeBarcodeForFormat(options.text, options.bcid);
    
    // bwip-js toSVG parameters
    const svg = (bwipjs as any).toSVG({
      bcid,
      text,
      scale: options.scale ?? 2,
      height: options.height ?? (bcid === 'qrcode' ? 20 : 10),
      includetext: options.includeText ?? true,
      textxalign: options.textxalign ?? 'center',
      textsize: 8,
      alttext: options.alttext,
      rotate: options.rotate ?? 'N',
    });

    return svg;
  } catch (err) {
    console.error('Barcode generation error:', err);
    // Fallback simple SVG representation
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 40" width="100%" height="100%">
      <rect width="160" height="40" fill="#fee2e2"/>
      <text x="80" y="24" font-family="monospace" font-size="10" fill="#dc2626" text-anchor="middle">
        INVALID BARCODE
      </text>
    </svg>`;
  }
}
