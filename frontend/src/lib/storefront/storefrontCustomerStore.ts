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

export const useStorefrontCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      token: null,
      customer: null,
      setAuth: (token, customer) => set({ token, customer }),
      logout: () => set({ token: null, customer: null }),
    }),
    {
      name: 'slicemart_storefront_customer',
    }
  )
);
