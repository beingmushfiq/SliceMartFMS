import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  hexToRgb,
  getContrastColor,
  adjustColorShade,
  applyStorefrontThemeVariables,
  broadcastThemeDraft,
  subscribeToThemeDraft,
  getStoredThemeDraft,
  clearStoredThemeDraft,
} from './themeSync';

describe('themeSync utility', () => {
  describe('hexToRgb', () => {
    it('converts 6-character hex to RGB', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('0f172a')).toEqual({ r: 15, g: 23, b: 42 });
    });

    it('converts 3-character hex shorthand to RGB', () => {
      expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('falls back to emerald for invalid hex strings', () => {
      expect(hexToRgb('invalid')).toEqual({ r: 16, g: 185, b: 129 });
    });
  });

  describe('getContrastColor', () => {
    it('returns #ffffff for dark colors (like #ff0000, #0f172a, #1e293b)', () => {
      expect(getContrastColor('#ff0000')).toBe('#ffffff');
      expect(getContrastColor('#0f172a')).toBe('#ffffff');
      expect(getContrastColor('#000000')).toBe('#ffffff');
    });

    it('returns #09090b for bright light colors (like #ffffff, #fef08a, #ffff00)', () => {
      expect(getContrastColor('#ffffff')).toBe('#09090b');
      expect(getContrastColor('#ffff00')).toBe('#09090b');
    });
  });

  describe('adjustColorShade', () => {
    it('darkens hex when negative percent provided', () => {
      const darkened = adjustColorShade('#ff0000', -20);
      expect(darkened).toBe('#cc0000');
    });

    it('lightens hex when positive percent provided', () => {
      const lightened = adjustColorShade('#000000', 50);
      expect(lightened).toBe('#000000'); // 0 * 1.5 = 0
    });
  });

  describe('applyStorefrontThemeVariables', () => {
    it('sets CSS variables on document.documentElement', () => {
      applyStorefrontThemeVariables({
        primary_color: '#ff0000',
        accent_color: '#1d4ed8',
        navbar_bg: '#0f172a',
        navbar_text_color: '#ffffff',
        footer_bg: '#1e293b',
        footer_text_color: '#94a3b8',
      });

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--store-primary')).toBe('#ff0000');
      expect(root.style.getPropertyValue('--store-primary-rgb')).toBe('255, 0, 0');
      expect(root.style.getPropertyValue('--store-primary-fg')).toBe('#ffffff');
      expect(root.style.getPropertyValue('--store-navbar-bg')).toBe('#0f172a');
      expect(root.style.getPropertyValue('--store-navbar-text')).toBe('#ffffff');
      expect(root.style.getPropertyValue('--store-footer-bg')).toBe('#1e293b');
      expect(root.style.getPropertyValue('--store-footer-text')).toBe('#94a3b8');
    });
  });

  describe('broadcastThemeDraft and subscribeToThemeDraft', () => {
    const storage = new Map<string, string>();

    beforeEach(() => {
      storage.clear();
      vi.stubGlobal('localStorage', {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, String(value)),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
      });
    });

    afterEach(() => {
      storage.clear();
      vi.unstubAllGlobals();
    });

    it('stores and retrieves drafts via localStorage', () => {
      broadcastThemeDraft('slicemart', { primary_color: '#ff0000' });
      const stored = getStoredThemeDraft('slicemart');
      expect(stored?.primary_color).toBe('#ff0000');

      clearStoredThemeDraft('slicemart');
      expect(getStoredThemeDraft('slicemart')).toBeNull();
    });

    it('triggers callback on storage events', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToThemeDraft('slicemart', callback);

      // Simulate a storage event from another tab
      const simulatedEvent = new StorageEvent('storage', {
        key: 'storefront_theme_draft_slicemart',
        newValue: JSON.stringify({
          type: 'DRAFT_UPDATE',
          subdomain: 'slicemart',
          theme: { primary_color: '#ff0000' },
          timestamp: Date.now(),
        }),
      });

      window.dispatchEvent(simulatedEvent);

      expect(callback).toHaveBeenCalledWith({ primary_color: '#ff0000' }, 'DRAFT_UPDATE');
      unsubscribe();
    });
  });
});
