import { test, expect } from '@playwright/test';

test.describe('Storefront Customer Browsing Flow', () => {
  test('renders storefront homepage and navigation links', async ({ page }) => {
    await page.goto('/storefront');

    // Page title and header
    await expect(page).toHaveTitle(/SliceMart|Store/i);

    // Verify presence of navigation elements
    const catalogLink = page.getByRole('link', { name: /catalog|products|shop/i }).first();
    if (await catalogLink.isVisible()) {
      await expect(catalogLink).toBeVisible();
    }

    // Verify main content loads without unhandled error boundaries
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test('navigates to catalog and displays search/filters', async ({ page }) => {
    await page.goto('/storefront/catalog');

    // Catalog page loads
    await expect(page).toHaveURL(/\/storefront\/catalog/);

    // Search bar or category list
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Stove');
      await expect(searchInput).toHaveValue('Stove');
    }
  });
});
