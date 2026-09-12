import { chromium } from '@playwright/test';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log in
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'admin@slicemart.test');
  await page.fill('#password', 'password');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('Logged in successfully!');

  // Navigate to /reports
  await page.goto('http://localhost:5173/reports');
  await page.waitForLoadState('networkidle');

  // Select "Production Yield & Scrap Analysis" or first report
  console.log('Navigated to reports');

  // Click on "Print Report" button
  const printButton = page.locator('button:has-text("Print Report"), button:has-text("Print")').first();
  await printButton.waitFor({ state: 'visible', timeout: 5000 });
  await printButton.click();
  console.log('Clicked Print button');

  // Wait for PrintPreviewModal
  const modal = page.locator('header:has-text("Print Report")');
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  console.log('PrintPreviewModal is open!');

  // Click "Save PDF" or "Print Document" in PrintPreviewModal
  // Wait, let's see what happens to the DOM when `printDocument` is called!
  const printDocBtn = page.locator('button:has-text("Print Document")');
  await printDocBtn.click();

  // Wait 500ms for setTimeout in useDocumentPrint
  await page.waitForTimeout(500);

  // Now, the body should have class `printing-active` and `#print-root` should be populated!
  const hasPrintingActive = await page.evaluate(() => document.body.classList.contains('printing-active'));
  console.log('body has printing-active:', hasPrintingActive);

  // Let's generate PDF now!
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
  });

  const pdfText = pdfBuffer.toString('latin1');
  const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
  console.log('Number of pages in generated PDF:', pageMatches ? pageMatches.length : 'unknown');

  // Let's inspect what elements are visible in @media print
  const printAnalysis = await page.evaluate(() => {
    const printRoot = document.getElementById('print-root');
    const root = document.getElementById('root');
    return {
      printRootExists: !!printRoot,
      printRootDisplay: printRoot ? window.getComputedStyle(printRoot).display : null,
      printRootHeight: printRoot ? printRoot.offsetHeight : null,
      printRootScrollHeight: printRoot ? printRoot.scrollHeight : null,
      printRootChildrenCount: printRoot ? printRoot.children.length : 0,
      rootDisplay: root ? window.getComputedStyle(root).display : null,
      bodyHeight: document.body.offsetHeight,
      bodyScrollHeight: document.body.scrollHeight,
      childrenOfBody: Array.from(document.body.children).map(c => ({
        tag: c.tagName,
        id: c.id,
        className: c.className,
        display: window.getComputedStyle(c).display,
        offsetHeight: c.offsetHeight,
      })),
    };
  });
  console.log('Print Analysis:', JSON.stringify(printAnalysis, null, 2));

  await browser.close();
}

test().catch(console.error);
