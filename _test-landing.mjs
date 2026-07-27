import { chromium } from '@playwright/test';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const consoleMsgs = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') consoleMsgs.push(`[${m.type()}] ${m.text().slice(0, 500)}`); });
page.on('pageerror', e => consoleMsgs.push(`[pageerror] ${String(e).slice(0, 500)}`));
page.on('requestfailed', r => consoleMsgs.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`));

await page.goto('http://localhost:3222/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);

// Is content visible?
const heroVisible = await page.locator('h1').first().isVisible().catch(() => false);
const heroText = await page.locator('h1').first().innerText().catch(() => 'N/A');

// Does the language selector button respond?
const langBtn = page.locator('nav button').first();
let langWorks = false;
try {
  await langBtn.click({ timeout: 3000 });
  await page.waitForTimeout(500);
  langWorks = await page.getByText('English').first().isVisible().catch(() => false);
} catch (e) { consoleMsgs.push('[clickfail] lang: ' + String(e).slice(0, 200)); }

// CTA anchor
const cta = await page.getByText('Quiero empezar ahora').first().isVisible().catch(() => false);

// Error boundary fallback showing?
const errBoundary = await page.getByText('Algo salio mal').first().isVisible().catch(() => false);
const inApp = await page.getByText('Abri en tu navegador').first().isVisible().catch(() => false);

// network still pending?
const loadState = await page.evaluate(() => document.readyState);

console.log(JSON.stringify({ heroVisible, heroText: heroText.slice(0, 80), langWorks, cta, errBoundary, inApp, loadState }, null, 2));
console.log('--- console/page errors ---');
consoleMsgs.slice(0, 30).forEach(m => console.log(m));

await page.screenshot({ path: '/tmp/claude-0/-home-user/acfd8083-8dd1-549d-bbc5-9a6f95c0b20d/scratchpad/landing.png', fullPage: false });
await browser.close();
