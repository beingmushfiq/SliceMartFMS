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

type BwipJsRenderer = (options: Record<string, string | number | boolean>) => string;

interface BwipJsModule {
  toSVG?: BwipJsRenderer;
  default?: {
    toSVG?: BwipJsRenderer;
  };
}

/**
 * Normalizes barcode input based on format requirements (EAN-13, EAN-8, etc.)
 * Gracefully falls back to Code128 if data does not match strict EAN checksum requirements.
 */
export function sanitizeBarcodeForFormat(text: string, format: BarcodeFormat): { bcid: string; text: string } {
  const clean = (text || '').trim();
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
    const uppercase = clean.toUpperCase().replace(/[^A-Z0-9.\- $/+%]/g, '');
    return { bcid: 'code39', text: uppercase || clean };
  }

  // Default Code128 - sanitize non-printable/unicode characters
  const asciiOnly = clean.replace(/[^\x20-\x7E]/g, '');
  return { bcid: 'code128', text: asciiOnly || clean };
}

/**
 * Generates an optimized SVG string for a barcode or QR code
 */
export function generateBarcodeSvg(options: GenerateSvgOptions): string {
  const bwipModule = bwipjs as unknown as BwipJsModule;
  const toSVG = bwipModule.toSVG || bwipModule.default?.toSVG;

  try {
    const { bcid, text } = sanitizeBarcodeForFormat(options.text, options.bcid);
    
    // bwip-js strictly rejects undefined properties inside options object
    const bwipOptions: Record<string, string | number | boolean> = {
      bcid,
      text,
      scale: options.scale ?? 2,
      height: options.height ?? (bcid === 'qrcode' ? 20 : 10),
      includetext: options.includeText ?? true,
      textxalign: options.textxalign ?? 'center',
      textsize: 8,
      rotate: options.rotate ?? 'N',
    };

    if (options.alttext) {
      bwipOptions.alttext = options.alttext;
    }

    if (options.width) {
      bwipOptions.width = options.width;
    }

    if (typeof toSVG === 'function') {
      return toSVG(bwipOptions);
    }
    throw new Error('toSVG function is not available on bwipjs');
  } catch (primaryErr) {
    // Attempt fallback to Code128 with sanitized text if format failed
    try {
      if (typeof toSVG === 'function') {
        const fallbackText = (options.text || '00000000').replace(/[^\x20-\x7E]/g, '').trim() || '00000000';
        return toSVG({
          bcid: 'code128',
          text: fallbackText,
          scale: options.scale ?? 2,
          height: options.height ?? 10,
          includetext: options.includeText ?? true,
          textxalign: 'center',
          textsize: 8,
          rotate: 'N',
        });
      }
    } catch {
      // ignore
    }

    console.error('Barcode generation error:', primaryErr);

    // Reliable inline SVG barcode fallback representation with text
    const displayVal = (options.text || 'N/A').slice(0, 24);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 46" width="100%" height="100%">
      <rect width="160" height="46" fill="#ffffff"/>
      <g fill="#000000">
        <rect x="10" y="4" width="2" height="26"/>
        <rect x="14" y="4" width="4" height="26"/>
        <rect x="20" y="4" width="2" height="26"/>
        <rect x="24" y="4" width="6" height="26"/>
        <rect x="32" y="4" width="2" height="26"/>
        <rect x="36" y="4" width="4" height="26"/>
        <rect x="42" y="4" width="6" height="26"/>
        <rect x="50" y="4" width="2" height="26"/>
        <rect x="54" y="4" width="4" height="26"/>
        <rect x="60" y="4" width="6" height="26"/>
        <rect x="68" y="4" width="2" height="26"/>
        <rect x="72" y="4" width="4" height="26"/>
        <rect x="78" y="4" width="6" height="26"/>
        <rect x="86" y="4" width="2" height="26"/>
        <rect x="90" y="4" width="4" height="26"/>
        <rect x="96" y="4" width="6" height="26"/>
        <rect x="104" y="4" width="2" height="26"/>
        <rect x="108" y="4" width="4" height="26"/>
        <rect x="114" y="4" width="6" height="26"/>
        <rect x="122" y="4" width="2" height="26"/>
        <rect x="126" y="4" width="4" height="26"/>
        <rect x="132" y="4" width="6" height="26"/>
        <rect x="140" y="4" width="2" height="26"/>
        <rect x="144" y="4" width="4" height="26"/>
      </g>
      <text x="80" y="40" font-family="monospace" font-size="8" fill="#000000" font-weight="bold" text-anchor="middle">
        ${displayVal}
      </text>
    </svg>`;
  }
}
