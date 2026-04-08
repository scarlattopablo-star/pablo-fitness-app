const { chromium } = require('@playwright/test');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FRAMES_DIR = path.join(__dirname, 'tmp', 'reel-pro');
const OUTPUT = 'C:/Users/acer/Desktop/javi/reel-app-pro.mp4';
const FPS = 30;
const W = 1080;
const H = 1920;

// Scene definitions
const SCENES = [
  { img: 'app-dashboard.png', text: 'TU DASHBOARD\nPERSONALIZADO', sub: 'Macros, progreso y accesos directos', duration: 3.5 },
  { img: 'app-plan.png', text: 'RUTINA DE\nENTRENAMIENTO', sub: 'Ejercicios con GIFs animados', duration: 3.5 },
  { img: 'app-plan-scroll.png', text: 'SERIES, REPS\nY DESCANSO', sub: 'Todo calculado para tu nivel', duration: 3 },
  { img: 'app-ejercicios.png', text: 'BIBLIOTECA DE\nEJERCICIOS', sub: '+100 ejercicios con instrucciones', duration: 3 },
  { img: 'app-ranking.png', text: 'RANKING Y\nLOGROS', sub: 'Competi con otros y gana badges', duration: 3.5 },
  { img: 'app-chat.png', text: 'CHAT CON\nTU ENTRENADOR', sub: 'Mensajes directos y grupales', duration: 3 },
  { img: 'app-progreso.png', text: 'SEGUIMIENTO\nCON FOTOS', sub: 'Ve tu transformacion semana a semana', duration: 3.5 },
];

const FLASH_FRAMES = 4; // white flash transition frames

function imgToBase64(imgFile) {
  const imgPath = path.join(__dirname, 'public', 'reel-frames', imgFile);
  const data = fs.readFileSync(imgPath);
  return 'data:image/png;base64,' + data.toString('base64');
}

function createHTML(scene, phase, progress) {
  // phase: 'flash_in' | 'show' | 'flash_out'
  const flashOpacity = phase === 'flash_in' ? (1 - progress) : phase === 'flash_out' ? progress : 0;
  const imgOpacity = phase === 'flash_in' ? progress : phase === 'flash_out' ? (1 - progress) : 1;
  const textDelay = phase === 'show' ? Math.min(1, progress * 3) : phase === 'flash_in' ? 0 : 0;
  const textY = 30 * (1 - textDelay);
  const subDelay = phase === 'show' ? Math.min(1, Math.max(0, (progress * 3) - 0.5)) : 0;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; font-family: 'Outfit', sans-serif; background: #09090b; overflow: hidden; position: relative; }
  .flash { position: absolute; inset: 0; background: white; opacity: ${flashOpacity}; z-index: 100; }
  .phone { position: absolute; top: 100px; left: 50%; transform: translateX(-50%); width: 480px; height: 980px; border-radius: 50px; border: 5px solid #444; background: #1a1a1a; overflow: hidden; box-shadow: 0 30px 80px rgba(0,230,118,0.2); opacity: ${imgOpacity}; }
  .phone-img { width: 100%; height: 100%; object-fit: cover; object-position: top; border-radius: 45px; display: block; }
  .notch { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 140px; height: 28px; background: #1a1a1a; border-radius: 0 0 16px 16px; z-index: 5; }
  .text-area { position: absolute; bottom: 280px; left: 0; right: 0; text-align: center; z-index: 10; opacity: ${textDelay}; transform: translateY(${textY}px); }
  .title { font-size: 68px; font-weight: 900; color: white; line-height: 0.95; letter-spacing: -2px; text-shadow: 0 4px 30px rgba(0,0,0,0.8); }
  .title .green { background: linear-gradient(135deg, #00e676, #00c853); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .sub-area { position: absolute; bottom: 200px; left: 0; right: 0; text-align: center; z-index: 10; opacity: ${subDelay}; }
  .sub { font-size: 28px; color: rgba(255,255,255,0.6); font-weight: 600; text-shadow: 0 2px 20px rgba(0,0,0,0.8); }
  .glow { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 600px; height: 400px; background: radial-gradient(circle, rgba(0,230,118,0.08) 0%, transparent 70%); border-radius: 50%; }
  .bottom-bar { position: absolute; bottom: 80px; left: 0; right: 0; text-align: center; z-index: 10; }
  .url { font-size: 22px; color: rgba(255,255,255,0.3); font-weight: 600; }
</style></head><body>
  <div class="flash"></div>
  <div class="glow"></div>
  <div class="phone"><div class="notch"></div><img class="phone-img" src="${imgToBase64(scene.img)}" /></div>
  <div class="text-area"><div class="title">${scene.text.split('\n').map((l,i) => i === 1 ? `<span class="green">${l}</span>` : l).join('<br>')}</div></div>
  <div class="sub-area"><div class="sub">${scene.sub}</div></div>
  <div class="bottom-bar"><div class="url">@pabloscarlattoentrenamientos</div></div>
</body></html>`;
}

function createIntroHTML(progress) {
  const scale = Math.min(1, progress * 2);
  const subOp = Math.min(1, Math.max(0, (progress - 0.3) * 2));
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; font-family: 'Outfit', sans-serif; background: #09090b; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .glow { position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, rgba(0,230,118,0.12) 0%, transparent 70%); border-radius: 50%; }
  .title { font-size: 96px; font-weight: 900; line-height: 0.95; letter-spacing: -3px; color: white; text-align: center; transform: scale(${scale}); }
  .green { background: linear-gradient(135deg, #00e676, #00c853); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .sub { font-size: 32px; color: rgba(255,255,255,0.5); font-weight: 600; margin-top: 30px; opacity: ${subOp}; text-align: center; }
</style></head><body>
  <div class="glow"></div>
  <div class="title">ESTO TIENE<br><span class="green">TU APP</span><br>DE ENTRENAMIENTO</div>
  <div class="sub">Desliza para ver todo 👇</div>
</body></html>`;
}

function createOutroHTML(progress) {
  const ctaScale = Math.min(1, Math.max(0, (progress - 0.2) * 2));
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; font-family: 'Outfit', sans-serif; background: #09090b; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .glow { position: absolute; width: 700px; height: 700px; background: radial-gradient(circle, rgba(0,230,118,0.1) 0%, transparent 70%); border-radius: 50%; }
  .title { font-size: 80px; font-weight: 900; line-height: 1; color: white; text-align: center; letter-spacing: -2px; }
  .green { background: linear-gradient(135deg, #00e676, #00c853); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .cta { margin-top: 50px; background: linear-gradient(135deg, #00e676, #00c853); color: #09090b; font-size: 38px; font-weight: 900; padding: 24px 56px; border-radius: 20px; transform: scale(${ctaScale}); }
  .url { margin-top: 24px; font-size: 26px; color: rgba(255,255,255,0.4); }
  .handle { margin-top: 40px; font-size: 30px; color: rgba(255,255,255,0.6); font-weight: 700; }
</style></head><body>
  <div class="glow"></div>
  <div class="title">EMPEZA TU<br><span class="green">TRANSFORMACION</span></div>
  <div class="cta">LINK EN BIO →</div>
  <div class="url">pabloscarlattoentrenamientos.com</div>
  <div class="handle">@pabloscarlattoentrenamientos</div>
</body></html>`;
}

async function run() {
  if (fs.existsSync(FRAMES_DIR)) fs.rmSync(FRAMES_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage();
  let frameNum = 0;

  async function renderFrame(html) {
    const tmpFile = path.join(FRAMES_DIR, '_tmp.html');
    fs.writeFileSync(tmpFile, html);
    await page.goto('file:///' + tmpFile.replace(/\\/g, '/'));
    await page.waitForTimeout(50);
    const fname = path.join(FRAMES_DIR, `f_${String(frameNum++).padStart(5, '0')}.png`);
    await page.screenshot({ path: fname });
  }

  // INTRO (3s)
  console.log('Rendering intro...');
  const introFrames = 3 * FPS;
  for (let f = 0; f < introFrames; f++) {
    await renderFrame(createIntroHTML(f / introFrames));
  }

  // SCENES with flash transitions
  for (let si = 0; si < SCENES.length; si++) {
    const scene = SCENES[si];
    const showFrames = Math.round(scene.duration * FPS);
    console.log(`Scene ${si + 1}/${SCENES.length}: ${scene.text.split('\n')[0]}`);

    // Flash in (4 frames)
    for (let f = 0; f < FLASH_FRAMES; f++) {
      await renderFrame(createHTML(scene, 'flash_in', f / FLASH_FRAMES));
    }
    // Show
    for (let f = 0; f < showFrames; f++) {
      await renderFrame(createHTML(scene, 'show', f / showFrames));
    }
    // Flash out (4 frames)
    for (let f = 0; f < FLASH_FRAMES; f++) {
      await renderFrame(createHTML(scene, 'flash_out', f / FLASH_FRAMES));
    }
  }

  // OUTRO (3.5s)
  console.log('Rendering outro...');
  const outroFrames = Math.round(3.5 * FPS);
  for (let f = 0; f < outroFrames; f++) {
    await renderFrame(createOutroHTML(f / outroFrames));
  }

  await browser.close();
  console.log(`Total frames: ${frameNum}`);

  // Encode
  console.log('Encoding video...');
  execSync(`ffmpeg -y -framerate ${FPS} -i "${FRAMES_DIR}/f_%05d.png" -c:v libx264 -pix_fmt yuv420p -crf 20 -preset fast "${OUTPUT}"`, { stdio: 'inherit' });
  console.log(`Video saved to ${OUTPUT}`);

  // Cleanup
  fs.rmSync(FRAMES_DIR, { recursive: true });
  console.log('Done!');
}

run().catch(console.error);
