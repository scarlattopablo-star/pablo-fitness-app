const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });
  const filePath = 'file:///' + path.resolve(__dirname, 'public/instagram-story-gymbro.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.resolve(__dirname, 'public/instagram-story-gymbro.png'), type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1920 } });
  console.log('Screenshot saved to public/instagram-story-gymbro.png');
  await browser.close();
})();
