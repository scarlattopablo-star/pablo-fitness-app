const puppeteer = require('puppeteer');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const JAVI = 'C:/Users/acer/Desktop/javi';
const PUBLIC = path.resolve(__dirname, 'public');
const OUTPUT = 'C:/Users/acer/Desktop/Instagram Pablo';

// Photo mapping: each image is a side-by-side before|after
const photos = {
  back: '8bb7ca56-8b09-4405-9175-ade4dfaa615a.jpg',
  front: 'b0da1e5f-d637-4d7d-a3b8-b6838fe3fb37.jpg',
  side: 'ead10dfd-6ced-4d26-a425-69aaac8c816d.jpg',
};

const ffmpeg = 'C:/Users/acer/AppData/Local/Microsoft/WinGet/Links/ffmpeg';

async function main() {
  // Step 1: Crop each photo into before (left half) and after (right half)
  console.log('Cropping photos...');
  for (const [view, file] of Object.entries(photos)) {
    const src = path.join(JAVI, file);
    // Get image dimensions
    const probe = execSync(`"${ffmpeg}" -i "${src}" 2>&1 || true`, { encoding: 'utf8' });
    const match = probe.match(/(\d{3,4})x(\d{3,4})/);
    if (!match) { console.error(`Can't detect size for ${file}`); continue; }
    const w = parseInt(match[1]);
    const h = parseInt(match[2]);
    const half = Math.floor(w / 2);

    // Crop left half (before)
    execSync(`"${ffmpeg}" -y -i "${src}" -vf "crop=${half}:${h}:0:0" "${path.join(PUBLIC, `${view}-before.jpg`)}"`, { stdio: 'pipe' });
    // Crop right half (after)
    execSync(`"${ffmpeg}" -y -i "${src}" -vf "crop=${half}:${h}:${half}:0" "${path.join(PUBLIC, `${view}-after.jpg`)}"`, { stdio: 'pipe' });
    console.log(`  ${view}: ${w}x${h} -> 2x ${half}x${h}`);
  }

  // Step 2: Generate carousel slides with real photos
  console.log('Generating carousel slides...');
  const browser = await puppeteer.launch({ headless: 'new' });

  // Slide 1 (cover) - already good, just re-screenshot
  const p1 = await browser.newPage();
  await p1.setViewport({ width: 1080, height: 1080 });
  await p1.goto('file:///' + path.resolve(PUBLIC, 'instagram-carousel.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  const slides = await p1.$$('.slide');
  await slides[0].screenshot({ path: path.join(OUTPUT, 'carousel-slide-1.png'), type: 'png' });
  console.log('  Slide 1 (cover) saved');

  // Slides 2-4: inject real photos
  const slideData = [
    { idx: 1, view: 'back', label: 'espalda' },
    { idx: 2, view: 'side', label: 'perfil' },
    { idx: 3, view: 'front', label: 'frente' },
  ];

  for (const { idx, view } of slideData) {
    const slide = slides[idx];
    // Replace placeholder divs with actual images
    await p1.evaluate((slideIdx, viewName, publicPath) => {
      const allSlides = document.querySelectorAll('.slide');
      const sl = allSlides[slideIdx];
      const placeholders = sl.querySelectorAll('.placeholder');
      if (placeholders[0]) {
        const parent0 = placeholders[0].parentElement;
        placeholders[0].remove();
        const img0 = document.createElement('img');
        img0.src = `/${viewName}-before.jpg`;
        img0.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        parent0.insertBefore(img0, parent0.firstChild);
      }
      if (placeholders[1]) {
        const parent1 = placeholders[1].parentElement;
        placeholders[1].remove();
        const img1 = document.createElement('img');
        img1.src = `/${viewName}-after.jpg`;
        img1.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        parent1.insertBefore(img1, parent1.firstChild);
      }
    }, idx, view, PUBLIC);

    // Wait for images to load
    await new Promise(r => setTimeout(r, 500));
    await slide.screenshot({ path: path.join(OUTPUT, `carousel-slide-${idx + 1}.png`), type: 'png' });
    console.log(`  Slide ${idx + 1} (${view}) saved`);
  }

  // Slide 5 (CTA)
  await slides[4].screenshot({ path: path.join(OUTPUT, 'carousel-slide-5.png'), type: 'png' });
  console.log('  Slide 5 (CTA) saved');

  // Step 3: Story with real photos
  console.log('Generating story...');
  const p2 = await browser.newPage();
  await p2.setViewport({ width: 1080, height: 1920 });
  await p2.goto('file:///' + path.resolve(PUBLIC, 'instagram-story-animated.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  // Inject photos into story
  await p2.evaluate((views) => {
    const rows = document.querySelectorAll('.photo-row');
    views.forEach((view, i) => {
      const cards = rows[i].querySelectorAll('.photo-card');
      // Before card
      const ph0 = cards[0].querySelector('.placeholder');
      if (ph0) {
        ph0.remove();
        const img0 = document.createElement('img');
        img0.src = `/${view}-before.jpg`;
        img0.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0;';
        cards[0].insertBefore(img0, cards[0].firstChild);
      }
      // After card
      const ph1 = cards[1].querySelector('.placeholder');
      if (ph1) {
        ph1.remove();
        const img1 = document.createElement('img');
        img1.src = `/${view}-after.jpg`;
        img1.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0;';
        cards[1].insertBefore(img1, cards[1].firstChild);
      }
    });
  }, ['back', 'side', 'front']);

  await new Promise(r => setTimeout(r, 500));

  // Static story image
  await p2.screenshot({
    path: path.join(OUTPUT, 'story-transformacion.png'),
    type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1920 }
  });
  console.log('  Story image saved');

  // Step 4: Record video (wait for animations to play)
  console.log('Recording story video...');
  // Reload to restart animations
  await p2.goto('file:///' + path.resolve(PUBLIC, 'instagram-story-animated.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  // Re-inject photos
  await p2.evaluate((views) => {
    const rows = document.querySelectorAll('.photo-row');
    views.forEach((view, i) => {
      const cards = rows[i].querySelectorAll('.photo-card');
      const ph0 = cards[0].querySelector('.placeholder');
      if (ph0) {
        ph0.remove();
        const img0 = document.createElement('img');
        img0.src = `/${view}-before.jpg`;
        img0.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0;';
        cards[0].insertBefore(img0, cards[0].firstChild);
      }
      const ph1 = cards[1].querySelector('.placeholder');
      if (ph1) {
        ph1.remove();
        const img1 = document.createElement('img');
        img1.src = `/${view}-after.jpg`;
        img1.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0;';
        cards[1].insertBefore(img1, cards[1].firstChild);
      }
    });
  }, ['back', 'side', 'front']);

  const framesDir = path.join(PUBLIC, 'frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  const fps = 15;
  const duration = 6;
  const totalFrames = fps * duration;

  for (let i = 0; i < totalFrames; i++) {
    const frameNum = String(i).padStart(4, '0');
    await p2.screenshot({
      path: path.join(framesDir, `frame-${frameNum}.png`),
      type: 'png',
      clip: { x: 0, y: 0, width: 1080, height: 1920 }
    });
    await new Promise(r => setTimeout(r, 1000 / fps));
    if (i % 15 === 0) console.log(`  Frame ${i}/${totalFrames}`);
  }

  await browser.close();

  // Assemble video
  console.log('Assembling video...');
  const videoPath = path.join(OUTPUT, 'story-transformacion.mp4');
  execSync(`"${ffmpeg}" -y -framerate ${fps} -i "${framesDir}/frame-%04d.png" -c:v libx264 -pix_fmt yuv420p -vf "scale=1080:1920" "${videoPath}"`, { stdio: 'pipe' });
  console.log(`  Video saved: ${videoPath}`);

  // Cleanup
  fs.readdirSync(framesDir).forEach(f => fs.unlinkSync(path.join(framesDir, f)));
  fs.rmdirSync(framesDir);

  console.log('\nDone! Everything in: C:/Users/acer/Desktop/Instagram Pablo/');
}

main().catch(console.error);
