const puppeteer = require('puppeteer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

(async () => {
  const framesDir = path.resolve(__dirname, 'public/frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });

  const storyPath = 'file:///' + path.resolve(__dirname, 'public/instagram-story-animated.html').replace(/\\/g, '/');
  await page.goto(storyPath, { waitUntil: 'networkidle0' });

  // Capture 6 seconds at 15fps = 90 frames
  const fps = 15;
  const duration = 6;
  const totalFrames = fps * duration;

  console.log(`Recording ${totalFrames} frames at ${fps}fps...`);

  for (let i = 0; i < totalFrames; i++) {
    const frameNum = String(i).padStart(4, '0');
    await page.screenshot({
      path: path.join(framesDir, `frame-${frameNum}.png`),
      type: 'png',
      clip: { x: 0, y: 0, width: 1080, height: 1920 }
    });
    // Wait for next frame timing
    await new Promise(r => setTimeout(r, 1000 / fps));
    if (i % 15 === 0) console.log(`  Frame ${i}/${totalFrames}`);
  }

  console.log('All frames captured. Assembling video with ffmpeg...');
  await browser.close();

  // Use ffmpeg to assemble frames into mp4
  const outputPath = path.resolve(__dirname, 'public/story-transformacion.mp4');
  const ffmpegCmd = `ffmpeg -y -framerate ${fps} -i "${framesDir}/frame-%04d.png" -c:v libx264 -pix_fmt yuv420p -vf "scale=1080:1920" "${outputPath}"`;

  exec(ffmpegCmd, (error, stdout, stderr) => {
    if (error) {
      console.error('ffmpeg error:', error.message);
      console.log('If ffmpeg is not installed, install it with: winget install ffmpeg');
      // Fallback: create animated GIF instead
      console.log('Trying GIF fallback...');
      const gifPath = path.resolve(__dirname, 'public/story-transformacion.gif');
      const gifCmd = `ffmpeg -y -framerate ${fps} -i "${framesDir}/frame-%04d.png" -vf "scale=540:960,fps=10" -loop 0 "${gifPath}"`;
      exec(gifCmd, (err2) => {
        if (err2) {
          console.log('ffmpeg not available. Frames saved in public/frames/ - use any video editor to assemble.');
        } else {
          console.log(`GIF saved: ${gifPath}`);
        }
      });
      return;
    }
    console.log(`Video saved: ${outputPath}`);
    // Cleanup frames
    fs.readdirSync(framesDir).forEach(f => fs.unlinkSync(path.join(framesDir, f)));
    fs.rmdirSync(framesDir);
    console.log('Frames cleaned up. Done!');
  });
})();
