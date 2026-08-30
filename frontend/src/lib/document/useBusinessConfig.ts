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
  name: 'SliceMart Foods & Bakery Ltd.',
  tagline: 'Artisanal Bakery & Industrial Food Processing Plant',
  address: 'Plot 42, Gulshan Industrial Zone, Tejgaon I/A, Dhaka - 1208, Bangladesh',
  phone: '+880 1800-SLICEMART / +880 2 9887766',
  email: 'invoicing@slicemart.com.bd',
  website: 'www.slicemart.com.bd',
  vatNumber: 'BIN: 001894523-0102',
  tinNumber: 'TIN: 5412-8876-0091',
  tradeLicense: 'TRAD/DNCC/012948/2026',
  currencySymbol: '৳',
  currencyCode: 'BDT',
  invoiceTerms:
    '1. Goods received in sound condition. Warranty claims valid within 7 days against manufacturer defect.\n2. Overdue balances beyond payment terms are subject to standard commercial finance charges.\n3. This is a certified computer-generated commercial document issued in accordance with NBR regulations.',
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
