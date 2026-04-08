const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  // --- CAROUSEL: 5 slides at 1080x1080 ---
  const carouselPage = await browser.newPage();
  await carouselPage.setViewport({ width: 1080, height: 1080 });
  const carouselPath = 'file:///' + path.resolve(__dirname, 'public/instagram-carousel.html').replace(/\\/g, '/');
  await carouselPage.goto(carouselPath, { waitUntil: 'networkidle0' });

  // Get all slides
  const slides = await carouselPage.$$('.slide');
  for (let i = 0; i < slides.length; i++) {
    // Scroll slide into view and screenshot it
    await slides[i].screenshot({
      path: path.resolve(__dirname, `public/carousel-slide-${i + 1}.png`),
      type: 'png',
    });
    console.log(`Saved carousel-slide-${i + 1}.png`);
  }

  // --- STORY: 1080x1920 ---
  const storyPage = await browser.newPage();
  await storyPage.setViewport({ width: 1080, height: 1920 });
  const storyPath = 'file:///' + path.resolve(__dirname, 'public/instagram-story-transformacion.html').replace(/\\/g, '/');
  await storyPage.goto(storyPath, { waitUntil: 'networkidle0' });
  await storyPage.screenshot({
    path: path.resolve(__dirname, 'public/story-transformacion.png'),
    type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1920 }
  });
  console.log('Saved story-transformacion.png');

  await browser.close();
  console.log('Done! All images saved to public/');
})();
