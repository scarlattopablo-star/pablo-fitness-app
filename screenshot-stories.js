const puppeteer = require('puppeteer');
const path = require('path');

const stories = [
  { html: 'public/story-frente.html', png: 'public/story-frente.png' },
  { html: 'public/story-perfil.html', png: 'public/story-perfil.png' },
  { html: 'public/story-espalda.html', png: 'public/story-espalda.png' },
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });

  for (const story of stories) {
    const filePath = 'file:///' + path.resolve(__dirname, story.html).replace(/\\/g, '/');
    await page.goto(filePath, { waitUntil: 'networkidle0' });
    // Wait for animations to complete
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({
      path: path.resolve(__dirname, story.png),
      type: 'png',
      clip: { x: 0, y: 0, width: 1080, height: 1920 },
    });
    console.log(`Saved: ${story.png}`);
  }

  await browser.close();
  console.log('Done! 3 stories generated.');
})();
