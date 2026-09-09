import { test, expect } from '@playwright/test';

test.describe('Platform Super Admin Portal Flow', () => {
  test('renders platform login with dedicated administrative branding', async ({ page }) => {
    await page.goto('/platform/login');

    // Administrative portal header
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/Platform/i).first()).toBeVisible();

    // Inputs for platform admin
    const emailInput = page.getByLabel(/Email/i);
    const passwordInput = page.getByLabel(/Password/i);
    const loginButton = page.getByRole('button', { name: /login|sign in/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
  });

  test('prevents access to protected platform routes without valid session', async ({ page }) => {
    await page.goto('/platform/tenants');

    // Should redirect unauthenticated requests to platform login
    await expect(page).toHaveURL(/\/platform\/login/);
  });
});
