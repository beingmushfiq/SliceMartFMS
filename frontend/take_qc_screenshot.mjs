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

  // 1. Stage 1: Inspections tab
  await page.goto('http://localhost:5173/qc?tab=inspections');
  await page.waitForTimeout(1500);
  const qcActionsBtn = page.locator('button:has-text("Actions")').first();
  if (await qcActionsBtn.isVisible()) {
    await qcActionsBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: 'qc_stage1_inspections.png' });

  // 2. Stage 2: Parameters tab
  await page.goto('http://localhost:5173/qc?tab=parameters');
  await page.waitForTimeout(1500);
  const paramActionsBtn = page.locator('button:has-text("Actions")').first();
  if (await paramActionsBtn.isVisible()) {
    await paramActionsBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: 'qc_stage2_parameters.png' });

  // 3. Stage 3: Rework tab
  await page.goto('http://localhost:5173/qc?tab=rework');
  await page.waitForTimeout(1500);
  const reworkActionsBtn = page.locator('button:has-text("Actions")').first();
  if (await reworkActionsBtn.isVisible()) {
    await reworkActionsBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: 'qc_stage3_rework.png' });

  // 4. Stage 4: Wastage tab
  await page.goto('http://localhost:5173/qc?tab=wastage');
  await page.waitForTimeout(1500);
  const scrapActionsBtn = page.locator('button:has-text("Actions")').first();
  if (await scrapActionsBtn.isVisible()) {
    await scrapActionsBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: 'qc_stage4_wastage.png' });

  console.log('All 4 QC stages captured successfully!');
  await browser.close();
}

main().catch(console.error);
