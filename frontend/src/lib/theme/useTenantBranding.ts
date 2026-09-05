import { useState, useEffect } from 'react';
import { api } from '../api/client';

export interface TenantBranding {
  companyName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  loading: boolean;
}

export function useTenantBranding(): TenantBranding {
  const [companyName, setCompanyName] = useState<string>(() => {
    try {
      return localStorage.getItem('company_name') || 'SliceMart ERP';
    } catch {
      return 'SliceMart ERP';
    }
  });

  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem('brand_logo_url') || null;
    } catch {
      return null;
    }
  });

  const [faviconUrl, setFaviconUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem('brand_favicon_url') || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Sync favicon with document head
  useEffect(() => {
    if (faviconUrl && typeof document !== 'undefined') {
      let iconLink = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.rel = 'icon';
        document.head.appendChild(iconLink);
      }
      iconLink.href = faviconUrl;
    }
  }, [faviconUrl]);

  // Fetch latest branding from public branding endpoint
  useEffect(() => {
    let ignore = false;

    api
      .get<{ name?: string; logo_url?: string | null; favicon_url?: string | null }>('/auth/branding')
      .then((res) => {
        if (ignore) return;
        const data = res.data;
        if (data) {
          if (data.name) {
            setCompanyName(data.name);
            try {
              localStorage.setItem('company_name', data.name);
            } catch {}
          }
          if (data.logo_url) {
            setLogoUrl(data.logo_url);
            try {
              localStorage.setItem('brand_logo_url', data.logo_url);
            } catch {}
          }
          if (data.favicon_url) {
            setFaviconUrl(data.favicon_url);
            try {
              localStorage.setItem('brand_favicon_url', data.favicon_url);
            } catch {}
          }
        }
      })
      .catch(() => {
        // Fallback gracefully to localStorage or defaults
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { companyName, logoUrl, faviconUrl, loading };
}
