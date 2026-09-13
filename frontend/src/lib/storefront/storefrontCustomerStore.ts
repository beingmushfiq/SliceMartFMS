import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomerProfile {
  uuid: string;
  name: string;
  email: string | null;
  phone: string;
}

interface CustomerState {
  token: string | null;
  customer: CustomerProfile | null;
  setAuth: (token: string, customer: CustomerProfile) => void;
  logout: () => void;
}

const STORAGE_KEY = 'erp_storefront_customer';
const LEGACY_STORAGE_KEY = 'slicemart_storefront_customer';

// Migrate legacy storefront customer if exists and new key doesn't
if (typeof window !== 'undefined') {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!current && legacy) {
      localStorage.setItem(STORAGE_KEY, legacy);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access errors
  }
}

export const useStorefrontCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      token: null,
      customer: null,
      setAuth: (token, customer) => set({ token, customer }),
      logout: () => set({ token: null, customer: null }),
    }),
    {
      name: STORAGE_KEY,
    }
  )
);
