const { chromium } = require('@playwright/test');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FRAMES_DIR = path.join(__dirname, 'tmp', 'reel-frames');
const OUTPUT = 'C:/Users/acer/Desktop/javi/reel-app-demo.mp4';
const FPS = 30;

// Scenes: each scene is a URL + duration in seconds + scroll animation
const SCENES = [
  // Intro: static image
  { type: 'static', src: 'reel-app-demo.html', duration: 2.5 },
  // App screens with scroll
  { type: 'url', url: 'https://pabloscarlattoentrenamientos.com/', duration: 3, scrollTo: 500 },
  { type: 'url', url: 'https://pabloscarlattoentrenamientos.com/planes', duration: 2.5, scrollTo: 400 },
  { type: 'url', url: 'https://pabloscarlattoentrenamientos.com/planes/quema-grasa', duration: 2.5, scrollTo: 600 },
  // Outro: static
  { type: 'static', src: 'instagram-story-venta.html', duration: 3 },
];

async function run() {
  // Clean frames dir
  if (fs.existsSync(FRAMES_DIR)) fs.rmSync(FRAMES_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  let frameNum = 0;

  for (let si = 0; si < SCENES.length; si++) {
    const scene = SCENES[si];
    const totalFrames = Math.round(scene.duration * FPS);
    console.log(`Scene ${si + 1}/${SCENES.length}: ${totalFrames} frames`);

    if (scene.type === 'static') {
      const page = await ctx.newPage();
      await page.setViewportSize({ width: 1080, height: 1920 });
      await page.goto(`file:///${__dirname.replace(/\\/g, '/')}/public/${scene.src}`);
      await page.waitForTimeout(500);
      const screenshot = await page.screenshot();
      await page.close();

      // Same frame repeated
      for (let f = 0; f < totalFrames; f++) {
        const fname = path.join(FRAMES_DIR, `frame_${String(frameNum++).padStart(5, '0')}.png`);
        fs.writeFileSync(fname, screenshot);
      }
    } else {
      const page = await ctx.newPage();
      await page.goto(scene.url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);

      const scrollTotal = scene.scrollTo || 0;

      for (let f = 0; f < totalFrames; f++) {
        // Smooth scroll
        if (scrollTotal > 0) {
          const scrollY = Math.round((f / totalFrames) * scrollTotal);
          await page.evaluate((y) => window.scrollTo({ top: y }), scrollY);
          await page.waitForTimeout(10);
        }

        const fname = path.join(FRAMES_DIR, `frame_${String(frameNum++).padStart(5, '0')}.png`);
        await page.screenshot({ path: fname });
      }
      await page.close();
    }
  }

  await browser.close();
  console.log(`Total frames: ${frameNum}`);

  // Combine with ffmpeg
  console.log('Encoding video...');
  const cmd = `ffmpeg -y -framerate ${FPS} -i "${FRAMES_DIR}/frame_%05d.png" -c:v libx264 -pix_fmt yuv420p -crf 23 -preset fast -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" "${OUTPUT}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log(`Video saved to ${OUTPUT}`);
}

run().catch(console.error);
