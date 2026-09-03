import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Globe,
  FileSpreadsheet,
  Clock,
  Building2,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

interface BrandingPreviewProps {
  logoUrl?: string;
  faviconUrl?: string;
  companyName?: string;
}

export const BrandingPreview: React.FC<BrandingPreviewProps> = ({
  logoUrl,
  faviconUrl,
  companyName = 'SliceMart Industries Ltd.',
}) => {
  const [loadedLogoUrl, setLoadedLogoUrl] = useState<string | null>(null);
  const [loadedFaviconUrl, setLoadedFaviconUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!logoUrl) return;
    let active = true;
    const img = new Image();
    img.src = logoUrl;
    img.onload = () => {
      if (active) setLoadedLogoUrl(logoUrl);
    };
    img.onerror = () => {
      if (active) setLoadedLogoUrl(null);
    };
    return () => {
      active = false;
    };
  }, [logoUrl]);

  useEffect(() => {
    if (!faviconUrl) return;
    let active = true;
    const img = new Image();
    img.src = faviconUrl;
    img.onload = () => {
      if (active) setLoadedFaviconUrl(faviconUrl);
    };
    img.onerror = () => {
      if (active) setLoadedFaviconUrl(null);
    };
    return () => {
      active = false;
    };
  }, [faviconUrl]);

  const logoValid = Boolean(logoUrl && loadedLogoUrl === logoUrl);
  const faviconValid = Boolean(faviconUrl && loadedFaviconUrl === faviconUrl);

  return (
    <div className="p-4 rounded-xl border border-default bg-surface-sunken/60 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-default flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" />
          Live Brand Assets Preview
        </span>
        <span className="text-2xs text-muted">Document Header & Web View</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Document / Header Logo Preview */}
        <div className="p-3 bg-surface border border-default rounded-lg flex items-center gap-3">
          <div className="size-12 rounded-lg border border-dashed border-default flex items-center justify-center bg-surface-sunken overflow-hidden shrink-0">
            {logoValid && logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo Preview"
                className="size-full object-contain p-1"
              />
            ) : (
              <Building2 className="size-5 text-muted" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-default truncate block">
              {companyName}
            </span>
            <span className="text-2xs text-muted block">
              {logoValid && logoUrl ? 'Custom Brand Logo Active' : 'No custom logo provided'}
            </span>
          </div>
        </div>

        {/* Favicon / Browser Tab Preview */}
        <div className="p-3 bg-surface border border-default rounded-lg flex items-center gap-3">
          <div className="size-8 rounded-md border border-default bg-surface-sunken flex items-center justify-center overflow-hidden shrink-0">
            {faviconValid && faviconUrl ? (
              <img
                src={faviconUrl}
                alt="Favicon"
                className="size-5 object-contain"
              />
            ) : (
              <span className="text-xs font-bold text-primary">S</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-2xs font-mono font-medium text-default truncate">
                {companyName}
              </span>
              <span className="text-2xs text-muted">| ERP</span>
            </div>
            <span className="text-2xs text-muted block">Browser Tab Icon</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CurrencyFormatPreviewProps {
  currencyCode?: string;
  currencySymbol?: string;
  decimalPlaces?: number | string;
  thousandSeparator?: string;
  dateFormat?: string;
  timeFormat?: string;
  timezone?: string;
}

export const CurrencyFormatPreview: React.FC<CurrencyFormatPreviewProps> = ({
  currencySymbol = '৳',
  currencyCode = 'BDT',
  decimalPlaces = 2,
  thousandSeparator = ',',
  dateFormat = 'YYYY-MM-DD',
  timeFormat = '24h',
  timezone = 'Asia/Dhaka',
}) => {
  const dec = Number(decimalPlaces) || 0;
  const sampleAmount = 145290.5;
  const parts = sampleAmount.toFixed(dec).split('.');
  const intPart = (parts[0] || '0').replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  const formattedMoney = `${currencySymbol} ${intPart}${parts[1] ? '.' + parts[1] : ''} ${currencyCode}`;

  let sampleDate = '2026-09-04';
  if (dateFormat === 'DD/MM/YYYY') sampleDate = '04/09/2026';
  else if (dateFormat === 'MM/DD/YYYY') sampleDate = '09/04/2026';
  else if (dateFormat === 'DD-MMM-YYYY') sampleDate = '04-Sep-2026';

  const sampleTime = timeFormat === '12h' ? '02:30 PM' : '14:30';

  return (
    <div className="p-4 rounded-xl border border-primary/20 bg-primary-subtle/30 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-default flex items-center gap-1.5">
          <Globe className="size-3.5 text-primary" />
          Live Formatting Simulator
        </span>
        <Badge tone="primary-subtle">Real-Time Computed</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
        <div className="p-3 bg-surface border border-default rounded-lg">
          <span className="text-2xs text-muted block font-sans">Sample Ledger Figure</span>
          <span className="text-sm font-bold text-default">{formattedMoney}</span>
        </div>

        <div className="p-3 bg-surface border border-default rounded-lg">
          <span className="text-2xs text-muted block font-sans">Timestamp & Zone Output</span>
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-muted" />
            <span className="text-xs font-semibold text-default">
              {sampleDate} {sampleTime} <span className="text-2xs text-muted font-sans font-normal">({timezone})</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DocumentPrefixPreviewProps {
  invoicePrefix?: string;
  poPrefix?: string;
  batchPrefix?: string;
  challanPrefix?: string;
  quotationPrefix?: string;
  receiptPrefix?: string;
}

export const DocumentPrefixPreview: React.FC<DocumentPrefixPreviewProps> = ({
  invoicePrefix = 'INV-',
  poPrefix = 'PO-',
  batchPrefix = 'PB-',
  challanPrefix = 'DC-',
  quotationPrefix = 'QT-',
  receiptPrefix = 'REC-',
}) => {
  const items = [
    { label: 'Commercial Invoice', sample: `${invoicePrefix}00482` },
    { label: 'Purchase Order', sample: `${poPrefix}00109` },
    { label: 'Production Batch', sample: `${batchPrefix}2026-081` },
    { label: 'Delivery Challan', sample: `${challanPrefix}00320` },
    { label: 'Sales Quotation', sample: `${quotationPrefix}00065` },
    { label: 'Receipt Voucher', sample: `${receiptPrefix}00840` },
  ];

  return (
    <div className="p-4 rounded-xl border border-default bg-surface-sunken/60 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-default flex items-center gap-1.5">
          <FileSpreadsheet className="size-3.5 text-primary" />
          Next Generated Document Serial Preview
        </span>
        <span className="text-2xs text-muted">Auto-incrementing</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {items.map((item) => (
          <div key={item.label} className="p-2.5 bg-surface border border-default rounded-lg space-y-1">
            <span className="text-2xs text-muted block truncate">{item.label}</span>
            <span className="font-mono text-xs font-bold text-primary block truncate">
              {item.sample}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
