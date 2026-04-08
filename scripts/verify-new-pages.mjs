import { chromium } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'store-metadata', 'screenshots');

const BASE_URL = 'http://localhost:3099';
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

  // 1. Onboarding page
  console.log('1/5 - Onboarding slide 1...');
  await page.goto(BASE_URL + '/onboarding', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: join(outDir, 'onboarding-1.png'), fullPage: false });

  // 2. Swipe to slide 2
  console.log('2/5 - Onboarding slide 2...');
  const nextBtn = page.locator('button:has-text("Siguiente")');
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(outDir, 'onboarding-2.png'), fullPage: false });
  }

  // 3. Slide 3 (Gym Bro)
  console.log('3/5 - Onboarding slide 3 (Gym Bro)...');
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(outDir, 'onboarding-3-gymbro.png'), fullPage: false });
  }

  // 4. Registro gratis page
  console.log('4/5 - Registro gratis...');
  await page.goto(BASE_URL + '/registro-gratis', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(outDir, 'registro-gratis.png'), fullPage: false });

  // 5. Planes page with free trial card
  console.log('5/5 - Planes con trial...');
  await page.goto(BASE_URL + '/planes', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(outDir, 'planes-con-trial.png'), fullPage: false });

  await browser.close();
  console.log(`\nScreenshots guardados en: ${outDir}`);
}

main().catch(console.error);
