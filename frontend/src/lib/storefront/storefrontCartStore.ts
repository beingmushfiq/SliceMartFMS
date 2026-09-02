import { create } from 'zustand';
import { api } from '../api/client';
import { isApiError } from '../api/errors';
import type { StorefrontCart } from '../../types/api/storefront';

interface StorefrontCartState {
  cart: StorefrontCart | null;
  isDrawerOpen: boolean;
  loading: boolean;
  sessionToken: string;
  subdomain: string;
  setSubdomain: (subdomain: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity: number, variantId?: number) => Promise<void>;
  updateQuantity: (itemId: number | string, quantity: number) => Promise<void>;
  removeItem: (itemId: number | string) => Promise<void>;
  applyCoupon: (code: string) => Promise<string | null>;
  removeCoupon: () => Promise<void>;
  clearCart: () => void;
}

const STORAGE_SESSION_KEY = 'storefront_cart_session';

function getOrGenerateSessionToken(): string {
  let token = localStorage.getItem(STORAGE_SESSION_KEY);
  if (!token) {
    token = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_SESSION_KEY, token);
  }
  return token;
}

export const useStorefrontCartStore = create<StorefrontCartState>((set, get) => ({
  cart: null,
  isDrawerOpen: false,
  loading: false,
  sessionToken: getOrGenerateSessionToken(),
  subdomain: 'slicemart',

  setSubdomain: (subdomain: string) => {
    set({ subdomain });
  },

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),

  fetchCart: async () => {
    const { subdomain, sessionToken } = get();
    set({ loading: true });
    try {
      const response = await api.get<StorefrontCart>('/storefront/cart', {
        headers: {
          'X-Storefront-Subdomain': subdomain,
          'X-Cart-Session': sessionToken,
        },
      });
      set({ cart: response.data });
    } catch {
      // Best-effort
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (productId: number, quantity: number, variantId?: number) => {
    const { subdomain, sessionToken } = get();
    set({ loading: true });
    try {
      const response = await api.post<StorefrontCart>(
        '/storefront/cart/items',
        {
          product_id: productId,
          quantity,
          variant_id: variantId || null,
        },
        {
          headers: {
            'X-Storefront-Subdomain': subdomain,
            'X-Cart-Session': sessionToken,
          },
        }
      );
      set({ cart: response.data, isDrawerOpen: true });
    } catch (err) {
      console.error('Failed to add item to cart', err);
    } finally {
      set({ loading: false });
    }
  },

  updateQuantity: async (itemId: number | string, quantity: number) => {
    const { subdomain, sessionToken } = get();
    set({ loading: true });
    try {
      const response = await api.put<StorefrontCart>(
        `/storefront/cart/items/${itemId}`,
        { quantity },
        {
          headers: {
            'X-Storefront-Subdomain': subdomain,
            'X-Cart-Session': sessionToken,
          },
        }
      );
      set({ cart: response.data });
    } catch (err) {
      console.error('Failed to update quantity', err);
    } finally {
      set({ loading: false });
    }
  },

  removeItem: async (itemId: number | string) => {
    const { subdomain, sessionToken } = get();
    set({ loading: true });
    try {
      const response = await api.delete<StorefrontCart>(`/storefront/cart/items/${itemId}`, {
        headers: {
          'X-Storefront-Subdomain': subdomain,
          'X-Cart-Session': sessionToken,
        },
      });
      set({ cart: response.data });
    } catch (err) {
      console.error('Failed to remove item', err);
    } finally {
      set({ loading: false });
    }
  },

  applyCoupon: async (code: string) => {
    const { subdomain, sessionToken } = get();
    set({ loading: true });
    try {
      const response = await api.post<StorefrontCart>(
        '/storefront/cart/coupon',
        { code },
        {
          headers: {
            'X-Storefront-Subdomain': subdomain,
            'X-Cart-Session': sessionToken,
          },
        }
      );
      set({ cart: response.data });
      return null;
    } catch (err) {
      if (isApiError(err)) {
        return err.message;
      }
      if (err instanceof Error) {
        return err.message;
      }
      return 'Failed to apply coupon';
    } finally {
      set({ loading: false });
    }
  },

  removeCoupon: async () => {
    const { subdomain, sessionToken } = get();
    set({ loading: true });
    try {
      const response = await api.delete<StorefrontCart>('/storefront/cart/coupon', {
        headers: {
          'X-Storefront-Subdomain': subdomain,
          'X-Cart-Session': sessionToken,
        },
      });
      set({ cart: response.data });
    } catch (err) {
      console.error('Failed to remove coupon', err);
    } finally {
      set({ loading: false });
    }
  },

  clearCart: () => {
    set({ cart: null });
    localStorage.removeItem(STORAGE_SESSION_KEY);
    set({ sessionToken: getOrGenerateSessionToken() });
  },
}));
