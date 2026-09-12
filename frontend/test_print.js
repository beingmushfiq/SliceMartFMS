import { chromium } from '@playwright/test';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const response = await page.goto('http://localhost:5173/reports', { timeout: 5000 });
    console.log('Page loaded, status:', response?.status());
  } catch (err) {
    console.log('Could not load localhost:5173:', err.message);
  }

  await browser.close();
}

test();
