import { test, expect } from '@playwright/test';

test.describe('Tenant Authentication Flow', () => {
  test('renders login page with clean enterprise branding', async ({ page }) => {
    await page.goto('/login');

    // Title / branding verification
    await expect(page).toHaveTitle(/Operations Platform|SliceMart/i);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Business Operations Platform', { exact: true })).toBeVisible();

    // Form controls are present and accessible
    const emailInput = page.getByLabel('Email Address');
    const passwordInput = page.getByLabel('Password', { exact: true });
    const submitButton = page.getByRole('button', { name: /sign in/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('validates required fields on empty submission', async ({ page }) => {
    await page.goto('/login');

    const submitButton = page.getByRole('button', { name: /sign in/i });
    await submitButton.click();

    // Native HTML5 or UI validation check
    const emailInput = page.getByLabel('Email Address');
    await expect(emailInput).toBeFocused();
  });

  test('allows entering credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email Address').fill('owner@slicemart.com');
    await page.getByLabel('Password', { exact: true }).fill('SecurePassword123!');

    await expect(page.getByLabel('Email Address')).toHaveValue('owner@slicemart.com');
  });
});
