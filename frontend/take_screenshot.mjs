import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1000);

  // Click Admin quick role button if available, else fill credentials
  const adminBtn = page.locator('button:has-text("Admin")').first();
  if (await adminBtn.isVisible()) {
    await adminBtn.click();
    await page.waitForTimeout(500);
  }

  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  console.log('Current URL after submit:', page.url());

  // Go to production workspace
  await page.goto('http://localhost:5173/production');
  await page.waitForTimeout(2000);

  // 1. In Stage 1 (Production Plans), open Actions menu if any plan exists
  const firstActionsBtn = page.locator('button:has-text("Actions")').first();
  if (await firstActionsBtn.isVisible()) {
    await firstActionsBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'plans_actions_open.png' });
  }

  // 2. Click on Stage 2 (Production Batches) tab
  const batchesTabBtn = page.locator('button:has-text("Production Batches")').first();
  if (await batchesTabBtn.isVisible()) {
    await batchesTabBtn.click();
    await page.waitForTimeout(1500);
    const batchActionsBtn = page.locator('button:has-text("Actions")').first();
    if (await batchActionsBtn.isVisible()) {
      await batchActionsBtn.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: 'batches_actions_open.png' });
  }

  console.log('Screenshots captured successfully');
  await browser.close();
}

main().catch(console.error);
