import { chromium } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'store-metadata', 'screenshots');

const BASE_URL = 'https://pabloscarlattoentrenamientos.com';

// iPhone 14 Pro Max dimensions (for store screenshots)
const VIEWPORT = { width: 430, height: 932 };

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'es-AR',
  });

  const page = await context.newPage();

  // 1. Landing page
  console.log('1/6 - Landing page...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(outDir, '01-landing.png'), fullPage: false });

  // 2. Scroll down to plans section
  console.log('2/6 - Planes section...');
  await page.goto(BASE_URL + '/#planes', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  // Try to scroll to plans
  await page.evaluate(() => {
    const el = document.querySelector('#planes') || document.querySelector('[id*="plan"]');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, '02-planes.png'), fullPage: false });

  // 3. Results/testimonials
  console.log('3/6 - Resultados...');
  await page.evaluate(() => {
    const el = document.querySelector('#resultados') || document.querySelector('[id*="result"]');
    if (el) el.scrollIntoView({ behavior: 'instant' });
    else window.scrollTo(0, document.body.scrollHeight * 0.6);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, '03-resultados.png'), fullPage: false });

  // 4. Login page
  console.log('4/6 - Login page...');
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(outDir, '04-login.png'), fullPage: false });

  // 5. Planes page
  console.log('5/6 - Planes page...');
  await page.goto(BASE_URL + '/planes', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(outDir, '05-planes-page.png'), fullPage: false });

  // 6. Full landing (scrolled to how it works)
  console.log('6/6 - Como funciona...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const el = document.querySelector('#como-funciona') || document.querySelector('[id*="funciona"]');
    if (el) el.scrollIntoView({ behavior: 'instant' });
    else window.scrollTo(0, document.body.scrollHeight * 0.35);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, '06-como-funciona.png'), fullPage: false });

  await browser.close();
  console.log(`\nScreenshots guardados en: ${outDir}`);
}

main().catch(console.error);
