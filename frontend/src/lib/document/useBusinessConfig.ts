import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../auth/authStore';
import { DEFAULT_CURRENCY_SYMBOLS } from '../format/currency';

export interface BusinessConfig {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  vatNumber: string;
  tinNumber: string;
  tradeLicense: string;
  currencySymbol: string;
  currencyCode: string;
  logoUrl?: string | undefined;
  invoiceTerms: string;
  signaturePreparedBy: string;
  signatureCheckedBy: string;
  signatureAuthorized: string;
  signatureReceiver: string;
}

export const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  name: 'Enterprise Manufacturing & Operations',
  tagline: 'Multi-Facility Commercial Operations',
  address: 'Industrial Processing Zone',
  phone: '',
  email: 'billing@enterprise.com',
  website: 'www.enterprise.com',
  vatNumber: '',
  tinNumber: '',
  tradeLicense: '',
  currencySymbol: '৳',
  currencyCode: 'BDT',
  invoiceTerms:
    '1. Goods received in sound condition. Warranty claims valid within 7 days against manufacturer defect.\n2. Overdue balances beyond payment terms are subject to standard commercial finance charges.\n3. This is an authoritative computer-generated commercial document.',
  signaturePreparedBy: 'Prepared By (Billing Desk)',
  signatureCheckedBy: 'Verified By (Accounts & Audit)',
  signatureAuthorized: 'Authorized Representative',
  signatureReceiver: 'Customer Acknowledgement',
};

export function useBusinessConfig(): { config: BusinessConfig; loading: boolean } {
  const tenant = useAuthStore((state) => state.tenant);
  const tenantCurrencyCode = (tenant?.currency_code || 'BDT').toUpperCase();
  const tenantCurrencySymbol =
    (tenant as unknown as { currency_symbol?: string })?.currency_symbol ||
    DEFAULT_CURRENCY_SYMBOLS[tenantCurrencyCode] ||
    '৳';

  const [config, setConfig] = useState<BusinessConfig>(() => ({
    ...DEFAULT_BUSINESS_CONFIG,
    name: tenant?.name || DEFAULT_BUSINESS_CONFIG.name,
    logoUrl: tenant?.logo_url,
    currencySymbol: tenantCurrencySymbol,
    currencyCode: tenantCurrencyCode,
  }));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    // Attempt fetching tenant business info if available
    api
      .get<Partial<BusinessConfig>>('/settings/company')
      .then((res) => {
        if (!ignore && res.data) {
          setConfig((prev) => ({
            ...prev,
            ...res.data,
            currencySymbol: res.data.currencySymbol || tenantCurrencySymbol,
            currencyCode: res.data.currencyCode || tenantCurrencyCode,
          }));
        }
      })
      .catch(() => {
        // Fallback to default
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [tenantCurrencySymbol, tenantCurrencyCode]);

  return { config, loading };
}
