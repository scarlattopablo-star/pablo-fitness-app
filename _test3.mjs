import { chromium } from '@playwright/test';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
page.on('pageerror', e => errs.push('[pageerror] ' + String(e).slice(0, 300)));
page.on('console', m => { if (m.type() === 'error') errs.push('[console] ' + m.text().slice(0, 300)); });

await page.goto('http://localhost:3223/', { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(4500);
const out = {};

// 1. Cookie banner Aceptar
const cookieBtn = page.getByRole('button', { name: 'Aceptar' });
if (await cookieBtn.isVisible().catch(() => false)) {
  await cookieBtn.click();
  await page.waitForTimeout(300);
  out.cookieAccept = !(await cookieBtn.isVisible().catch(() => false));
} else out.cookieAccept = 'not shown';

// 2. Mobile language selector (visible one)
const mobileLang = page.locator('nav .md\\:hidden button').first();
await mobileLang.click({ timeout: 5000 });
await page.waitForTimeout(400);
out.langDropdown = await page.getByText('English').first().isVisible().catch(() => false);
if (out.langDropdown) {
  await page.getByText('English').first().click();
  await page.waitForTimeout(400);
  out.langSwitch = await page.getByText('Log In').first().isVisible().catch(() => false);
  // switch back
  await mobileLang.click(); await page.getByText('Español').first().click();
}

// 3. CTA hero anchor scrolls to offer
await page.getByText('Quiero empezar ahora').first().click();
await page.waitForTimeout(800);
out.ctaScrolled = await page.evaluate(() => window.scrollY > 500);

// 4. "Reservar mi lugar" navigates
await page.getByText('Reservar mi lugar').first().click();
await page.waitForURL('**/planes/reto-transformacion**', { timeout: 8000 }).catch(() => {});
out.reservarNav = page.url();
await page.waitForTimeout(2500);
out.retoPageHasContent = (await page.locator('body').innerText()).length > 200;

// 5. /planes page
await page.goto('http://localhost:3223/planes', { waitUntil: 'load' });
await page.waitForTimeout(2500);
out.planesContent = (await page.locator('body').innerText()).slice(0, 120).replace(/\n/g, ' | ');

// 6. login page + form interactive
await page.goto('http://localhost:3223/login', { waitUntil: 'load' });
await page.waitForTimeout(2000);
const emailInput = page.locator('input[type="email"], input[name="email"]').first();
out.loginInputVisible = await emailInput.isVisible().catch(() => false);
if (out.loginInputVisible) { await emailInput.fill('test@test.com'); out.loginInputWorks = (await emailInput.inputValue()) === 'test@test.com'; }

console.log(JSON.stringify(out, null, 2));
console.log('--- errors ---'); errs.slice(0, 15).forEach(e => console.log(e));
await browser.close();
