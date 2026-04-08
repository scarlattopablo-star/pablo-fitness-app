const puppeteer = require('puppeteer');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const JAVI = 'C:/Users/acer/Desktop/javi';
const PUBLIC = path.resolve(__dirname, 'public');
const OUTPUT = 'C:/Users/acer/Desktop/Instagram Pablo';
const ffmpeg = 'C:/Users/acer/AppData/Local/Microsoft/WinGet/Links/ffmpeg';

// Convert images to base64 data URIs
function imgToDataUri(filePath) {
  const buf = fs.readFileSync(filePath);
  return 'data:image/jpeg;base64,' + buf.toString('base64');
}

async function main() {
  // Crop photos
  console.log('Cropping photos...');
  const photos = {
    back: '8bb7ca56-8b09-4405-9175-ade4dfaa615a.jpg',
    front: 'b0da1e5f-d637-4d7d-a3b8-b6838fe3fb37.jpg',
    side: 'ead10dfd-6ced-4d26-a425-69aaac8c816d.jpg',
  };

  for (const [view, file] of Object.entries(photos)) {
    const src = path.join(JAVI, file);
    execSync(`"${ffmpeg}" -y -i "${src}" -vf "crop=iw/2:ih:0:0" "${path.join(PUBLIC, `${view}-before.jpg`)}"`, { stdio: 'pipe' });
    execSync(`"${ffmpeg}" -y -i "${src}" -vf "crop=iw/2:ih:iw/2:0" "${path.join(PUBLIC, `${view}-after.jpg`)}"`, { stdio: 'pipe' });
    console.log(`  ${view} cropped`);
  }

  // Load all base64
  const imgs = {};
  for (const view of ['back', 'side', 'front']) {
    imgs[`${view}-before`] = imgToDataUri(path.join(PUBLIC, `${view}-before.jpg`));
    imgs[`${view}-after`] = imgToDataUri(path.join(PUBLIC, `${view}-after.jpg`));
  }

  const browser = await puppeteer.launch({ headless: 'new' });

  // ---- CAROUSEL ----
  console.log('Generating carousel...');
  const p1 = await browser.newPage();
  await p1.setViewport({ width: 1080, height: 1080 });
  await p1.goto('file:///' + path.resolve(PUBLIC, 'instagram-carousel.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  const slides = await p1.$$('.slide');

  // Slide 1 cover
  await slides[0].screenshot({ path: path.join(OUTPUT, 'carousel-slide-1.png'), type: 'png' });
  console.log('  Slide 1 OK');

  // Slides 2-4 with photos
  const slideMap = [
    { idx: 1, view: 'back' },
    { idx: 2, view: 'side' },
    { idx: 3, view: 'front' },
  ];

  for (const { idx, view } of slideMap) {
    await p1.evaluate((slideIdx, beforeSrc, afterSrc) => {
      const sl = document.querySelectorAll('.slide')[slideIdx];
      const phs = sl.querySelectorAll('.placeholder');
      if (phs[0]) {
        const p = phs[0].parentElement;
        phs[0].outerHTML = `<img src="${beforeSrc}" style="width:100%;height:100%;object-fit:cover;">`;
      }
      if (phs[1]) {
        const p = phs[1].parentElement;
        phs[1].outerHTML = `<img src="${afterSrc}" style="width:100%;height:100%;object-fit:cover;">`;
      }
    }, idx, imgs[`${view}-before`], imgs[`${view}-after`]);

    await new Promise(r => setTimeout(r, 800));
    await slides[idx].screenshot({ path: path.join(OUTPUT, `carousel-slide-${idx + 1}.png`), type: 'png' });
    console.log(`  Slide ${idx + 1} OK`);
  }

  // Slide 5 CTA
  await slides[4].screenshot({ path: path.join(OUTPUT, 'carousel-slide-5.png'), type: 'png' });
  console.log('  Slide 5 OK');

  // ---- STORY IMAGE ----
  console.log('Generating story...');
  const p2 = await browser.newPage();
  await p2.setViewport({ width: 1080, height: 1920 });
  await p2.goto('file:///' + path.resolve(PUBLIC, 'instagram-story-animated.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  const views = ['back', 'side', 'front'];
  await p2.evaluate((viewList, imgData) => {
    const rows = document.querySelectorAll('.photo-row');
    viewList.forEach((view, i) => {
      const cards = rows[i].querySelectorAll('.photo-card');
      const ph0 = cards[0].querySelector('.placeholder');
      if (ph0) ph0.outerHTML = `<img src="${imgData[view + '-before']}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">`;
      const ph1 = cards[1].querySelector('.placeholder');
      if (ph1) ph1.outerHTML = `<img src="${imgData[view + '-after']}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">`;
    });
  }, views, imgs);

  await new Promise(r => setTimeout(r, 1000));
  await p2.screenshot({ path: path.join(OUTPUT, 'story-transformacion.png'), type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1920 } });
  console.log('  Story image OK');

  // ---- STORY VIDEO ----
  console.log('Recording video (6s)...');
  // Reload for fresh animations
  await p2.goto('file:///' + path.resolve(PUBLIC, 'instagram-story-animated.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await p2.evaluate((viewList, imgData) => {
    const rows = document.querySelectorAll('.photo-row');
    viewList.forEach((view, i) => {
      const cards = rows[i].querySelectorAll('.photo-card');
      const ph0 = cards[0].querySelector('.placeholder');
      if (ph0) ph0.outerHTML = `<img src="${imgData[view + '-before']}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">`;
      const ph1 = cards[1].querySelector('.placeholder');
      if (ph1) ph1.outerHTML = `<img src="${imgData[view + '-after']}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">`;
    });
  }, views, imgs);

  const framesDir = path.join(PUBLIC, 'frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  const fps = 12;
  const totalFrames = fps * 6;
  for (let i = 0; i < totalFrames; i++) {
    await p2.screenshot({ path: path.join(framesDir, `f${String(i).padStart(4,'0')}.png`), type: 'png', clip: { x:0,y:0,width:1080,height:1920 } });
    await new Promise(r => setTimeout(r, 1000/fps));
    if (i % 12 === 0) console.log(`  Frame ${i}/${totalFrames}`);
  }

  await browser.close();

  console.log('Assembling video...');
  execSync(`"${ffmpeg}" -y -framerate ${fps} -i "${framesDir}/f%04d.png" -c:v libx264 -pix_fmt yuv420p -vf "scale=1080:1920" "${path.join(OUTPUT, 'story-transformacion.mp4')}"`, { stdio: 'pipe' });

  // Cleanup frames
  fs.readdirSync(framesDir).forEach(f => fs.unlinkSync(path.join(framesDir, f)));
  fs.rmdirSync(framesDir);

  console.log('\nListo! Todo en: C:/Users/acer/Desktop/Instagram Pablo/');
}

main().catch(console.error);
