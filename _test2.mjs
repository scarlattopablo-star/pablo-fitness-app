import { chromium } from '@playwright/test';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));

await page.goto('http://localhost:3222/', { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(5000);

const info = await page.evaluate(() => {
  const btn = document.querySelector('nav button');
  if (!btn) return { found: false };
  const r = btn.getBoundingClientRect();
  const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  const top = document.elementFromPoint(cx, cy);
  const chain = [];
  let el = top;
  while (el && chain.length < 6) {
    chain.push(el.tagName + '.' + String(el.className).slice(0, 80));
    el = el.parentElement;
  }
  return {
    found: true,
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    topAtPoint: top ? top.tagName + '.' + String(top.className).slice(0, 120) : null,
    containsBtn: top === btn || btn.contains(top),
    chain,
  };
});
console.log(JSON.stringify(info, null, 2));

// Try clicking via dispatchEvent to see if React handler is attached at all
const reactWorks = await page.evaluate(() => {
  const btn = document.querySelector('nav button');
  btn?.click();
  return new Promise(res => setTimeout(() => {
    res(!!document.evaluate("//*[contains(text(),'English')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue);
  }, 400));
});
console.log('React handler fired (dropdown opened):', reactWorks);

await browser.close();
