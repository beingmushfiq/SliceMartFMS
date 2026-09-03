import { useState, useEffect } from 'react';
import { api } from '../api/client';

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
  logoUrl?: string;
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
  currencySymbol: '$',
  currencyCode: 'USD',
  invoiceTerms:
    '1. Goods received in sound condition. Warranty claims valid within 7 days against manufacturer defect.\n2. Overdue balances beyond payment terms are subject to standard commercial finance charges.\n3. This is an authoritative computer-generated commercial document.',
  signaturePreparedBy: 'Prepared By (Billing Desk)',
  signatureCheckedBy: 'Verified By (Accounts & Audit)',
  signatureAuthorized: 'Authorized Representative',
  signatureReceiver: 'Customer Acknowledgement',
};

export function useBusinessConfig(): { config: BusinessConfig; loading: boolean } {
  const [config, setConfig] = useState<BusinessConfig>(DEFAULT_BUSINESS_CONFIG);
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
  }, []);

  return { config, loading };
}
