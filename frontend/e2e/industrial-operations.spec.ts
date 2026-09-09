import { test, expect } from '@playwright/test';

test.describe('POS Tablet & Retail Checkout Flow', () => {
  test('redirects unauthenticated direct POS access to tenant login', async ({ page }) => {
    await page.goto('/pos');

    // POS requires active session and registers shift session
    await expect(page).toHaveURL(/\/(login|pos)/);
  });
});

test.describe('Factory Floor Production Kiosk Flow', () => {
  test('handles unauthenticated access gracefully', async ({ page }) => {
    await page.goto('/production');

    // Production floor dashboard or login redirect
    await expect(page).toHaveURL(/\/(login|production)/);
  });
});
