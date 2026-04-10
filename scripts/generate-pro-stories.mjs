import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUT_DIR = join(process.cwd(), 'public', 'social-templates');
mkdirSync(OUT_DIR, { recursive: true });

// Shared CSS reset + base styles injected into every story
const BASE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  body {
    width: 1080px; height: 1920px; overflow: hidden;
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    color: #ffffff;
  }
  .story {
    width: 1080px; height: 1920px; position: relative; overflow: hidden;
  }
  .logo {
    position: absolute; top: 260px; left: 60px; height: 40px;
    filter: invert(1); z-index: 10; opacity: 0.9;
  }
  .footer {
    position: absolute; bottom: 220px; left: 0; right: 0;
    text-align: center; font-size: 22px; color: rgba(255,255,255,0.35);
    letter-spacing: 1px; z-index: 10;
  }
  .safe-content {
    position: absolute; top: 320px; left: 60px; right: 60px; bottom: 260px;
    display: flex; flex-direction: column; z-index: 5;
  }
`;

const LOGO_HTML = `<img class="logo" src="../logo-pablo.jpg" alt="Pablo Scarlatto" />`;
const FOOTER_HTML = `<div class="footer">pabloscarlattoentrenamientos.com</div>`;

function wrapStory(title, extraCSS, bodyContent) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=1080"/>
<title>${title}</title>
<style>${BASE_CSS}${extraCSS}</style>
</head>
<body>
<div class="story">
${LOGO_HTML}
${bodyContent}
${FOOTER_HTML}
</div>
</body>
</html>`;
}

// ─── STORY 1: NUEVA RUTINA ─────────────────────────────────────
const story01 = wrapStory('Nueva Rutina', `
  .story {
    background: linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.85) 100%),
      url('../images/pablo-gym2.jpg') center/cover no-repeat;
  }
  .accent-bar { width: 120px; height: 6px; background: #22c55e; border-radius: 3px; margin-bottom: 40px; }
  .headline { font-size: 76px; font-weight: 900; line-height: 1.05; letter-spacing: -1px; margin-bottom: 30px; text-transform: uppercase; }
  .subtitle { font-size: 34px; font-weight: 500; line-height: 1.4; color: rgba(255,255,255,0.85); margin-bottom: 60px; max-width: 800px; }
  .cta { font-size: 28px; font-weight: 700; color: #22c55e; letter-spacing: 2px; text-transform: uppercase; }
`, `
  <div class="safe-content" style="justify-content: center;">
    <div class="accent-bar"></div>
    <div class="headline">NUEVA RUTINA<br/>DISPONIBLE</div>
    <div class="subtitle">Entr&aacute; a la app y mir&aacute; tu plan actualizado</div>
    <div class="cta">Link en bio &uarr;</div>
  </div>
`);

// ─── STORY 2: 7 DIAS GRATIS ────────────────────────────────────
const story02 = wrapStory('7 Dias Gratis', `
  .story {
    background: linear-gradient(160deg, #09090b 0%, #0a2e1a 40%, #09090b 100%);
  }
  .big-number { font-size: 260px; font-weight: 900; color: #22c55e; line-height: 0.85; letter-spacing: -8px; }
  .big-text { font-size: 76px; font-weight: 900; text-transform: uppercase; line-height: 1.05; margin-bottom: 24px; }
  .sub { font-size: 38px; font-weight: 500; color: rgba(255,255,255,0.8); margin-bottom: 50px; }
  .btn {
    display: inline-block; background: #22c55e; color: #09090b; font-size: 32px; font-weight: 800;
    padding: 22px 60px; border-radius: 60px; text-transform: uppercase; letter-spacing: 2px;
    margin-bottom: 30px; text-align: center; align-self: center;
  }
  .urgency { font-size: 26px; color: #f97316; font-weight: 600; text-align: center; letter-spacing: 1px; }
`, `
  <div class="safe-content" style="justify-content: center; align-items: center; text-align: center;">
    <div class="big-number">7</div>
    <div class="big-text">D&Iacute;AS GRATIS</div>
    <div class="sub">Prob&aacute; la app sin tarjeta</div>
    <div class="btn">EMPEZAR AHORA</div>
    <div class="urgency">Cupos limitados</div>
  </div>
`);

// ─── STORY 3: RESULTADO REAL (Mujer) ───────────────────────────
const story03 = wrapStory('Resultado Real', `
  .story {
    background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.85) 100%),
      url('../images/transf-mujer-lateral.jpg') center/cover no-repeat;
  }
  .badge {
    display: inline-block; background: #22c55e; color: #09090b; font-size: 22px; font-weight: 800;
    padding: 10px 28px; border-radius: 30px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 40px;
  }
  .headline { font-size: 52px; font-weight: 800; line-height: 1.15; margin-bottom: 40px; max-width: 800px; }
  .stat {
    font-size: 64px; font-weight: 900; color: #22c55e; margin-top: auto; margin-bottom: 20px;
  }
  .stat-label { font-size: 28px; color: rgba(255,255,255,0.7); }
`, `
  <div class="safe-content">
    <div class="badge">RESULTADO REAL</div>
    <div class="headline">Esto es lo que pasa cuando segu&iacute;s el plan</div>
    <div class="stat">-8 kg</div>
    <div class="stat-label">en 3 meses</div>
  </div>
`);

// ─── STORY 4: TIP SENTADILLA ───────────────────────────────────
const story04 = wrapStory('Tip Sentadilla', `
  .story {
    background: linear-gradient(160deg, #09090b 0%, #0a1f12 50%, #09090b 100%);
  }
  .tag { font-size: 28px; font-weight: 700; color: #22c55e; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 12px; }
  .headline { font-size: 64px; font-weight: 900; text-transform: uppercase; margin-bottom: 10px; }
  .exercise-name { font-size: 76px; font-weight: 900; color: #22c55e; text-transform: uppercase; margin-bottom: 50px; }
  .tip-card {
    background: rgba(255,255,255,0.08); border-left: 4px solid #22c55e;
    padding: 24px 30px; margin-bottom: 18px; border-radius: 0 12px 12px 0;
    font-size: 30px; font-weight: 500; line-height: 1.35;
  }
  .tip-num { color: #22c55e; font-weight: 800; margin-right: 12px; }
`, `
  <div class="safe-content" style="justify-content: center;">
    <div class="tag">Tip del d&iacute;a</div>
    <div class="exercise-name">SENTADILLA</div>
    <div class="tip-card"><span class="tip-num">01</span> Pies al ancho de hombros</div>
    <div class="tip-card"><span class="tip-num">02</span> Rodillas siguen la punta del pie</div>
    <div class="tip-card"><span class="tip-num">03</span> Baj&aacute; hasta que el muslo est&eacute; paralelo</div>
  </div>
`);

// ─── STORY 5: QUE ENTRENASTE? ──────────────────────────────────
const story05 = wrapStory('Que Entrenaste Hoy', `
  .story {
    background: radial-gradient(ellipse at 50% 30%, #1a1a2e 0%, #09090b 70%);
  }
  .headline { font-size: 64px; font-weight: 900; text-transform: uppercase; text-align: center; margin-bottom: 20px; line-height: 1.1; }
  .hint { font-size: 28px; color: rgba(255,255,255,0.5); text-align: center; margin-bottom: 50px; }
  .options { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .opt {
    background: rgba(255,255,255,0.07); border: 2px solid rgba(255,255,255,0.15);
    border-radius: 16px; padding: 36px 20px; text-align: center;
    font-size: 32px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;
    transition: all 0.2s;
  }
  .opt:hover { background: rgba(34,197,94,0.15); border-color: #22c55e; }
  .tap-hint { font-size: 26px; color: #22c55e; text-align: center; margin-top: 40px; font-weight: 600; }
`, `
  <div class="safe-content" style="justify-content: center;">
    <div class="headline">QU&Eacute; ENTRENASTE<br/>HOY?</div>
    <div class="hint">Vot&aacute; y mir&aacute; los resultados</div>
    <div class="options">
      <div class="opt">PIERNAS</div>
      <div class="opt">PECHO</div>
      <div class="opt">ESPALDA</div>
      <div class="opt">DESCANSO</div>
    </div>
    <div class="tap-hint">Toc&aacute; tu respuesta &darr;</div>
  </div>
`);

// ─── STORY 6: FRASE ────────────────────────────────────────────
const story06 = wrapStory('Frase Motivacional', `
  .story {
    background: linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.85) 100%),
      url('../images/gym-bg.png') center/cover no-repeat;
  }
  .quote-mark { font-size: 200px; color: #22c55e; opacity: 0.3; line-height: 0.5; font-family: Georgia, serif; position: absolute; top: 400px; left: 50px; }
  .quote {
    font-size: 58px; font-weight: 800; font-style: italic; line-height: 1.25;
    max-width: 860px; margin-bottom: 50px;
  }
  .sig { font-size: 32px; font-weight: 700; color: #22c55e; letter-spacing: 1px; }
`, `
  <div class="quote-mark">&ldquo;</div>
  <div class="safe-content" style="justify-content: center;">
    <div class="quote">NO BUSQUES EXCUSAS, BUSC&Aacute; RESULTADOS</div>
    <div class="sig">&mdash; Pablo Scarlatto</div>
  </div>
`);

// ─── STORY 7: SABIAS QUE ───────────────────────────────────────
const story07 = wrapStory('Sabias Que', `
  .story {
    background: linear-gradient(180deg, #09090b 0%, #111827 50%, #09090b 100%);
  }
  .emoji-deco {
    position: absolute; font-size: 120px; opacity: 0.08; z-index: 1;
  }
  .headline { font-size: 60px; font-weight: 900; text-transform: uppercase; margin-bottom: 40px; }
  .headline span { color: #22c55e; }
  .fact {
    font-size: 40px; font-weight: 600; line-height: 1.4; max-width: 860px; margin-bottom: 50px;
  }
  .fact strong { color: #22c55e; }
  .source {
    font-size: 22px; color: rgba(255,255,255,0.4); font-style: italic;
    border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; margin-top: auto;
  }
`, `
  <div class="emoji-deco" style="top:350px; right:60px;">&#127830;</div>
  <div class="emoji-deco" style="bottom:400px; left:40px;">&#129385;</div>
  <div class="emoji-deco" style="top:700px; right:200px;">&#129360;</div>
  <div class="safe-content" style="justify-content: center;">
    <div class="headline">SAB&Iacute;AS <span>QUE...</span></div>
    <div class="fact">Tu cuerpo necesita <strong>2g de prote&iacute;na por kg</strong> de peso para ganar m&uacute;sculo</div>
    <div class="source">ISSN Position Stand, 2017</div>
  </div>
`);

// ─── STORY 8: ANTES/DESPUES (Javi) ─────────────────────────────
const story08 = wrapStory('Antes Despues Javi', `
  .story { background: #09090b; }
  .split {
    position: absolute; top: 0; bottom: 0; width: 50%;
  }
  .split-left {
    left: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.7) 100%),
      url('../javi-front.jpg') center/cover no-repeat;
  }
  .split-right {
    right: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.7) 100%),
      url('../javi-side.jpg') center/cover no-repeat;
  }
  .divider {
    position: absolute; top: 0; bottom: 0; left: 50%; width: 4px;
    background: #22c55e; z-index: 5;
  }
  .label {
    position: absolute; top: 320px; z-index: 10;
    font-size: 28px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 4px; padding: 10px 24px; border-radius: 8px;
  }
  .label-left { left: 60px; background: rgba(239,68,68,0.8); }
  .label-right { right: 60px; background: rgba(34,197,94,0.8); }
  .stats-bar {
    position: absolute; bottom: 280px; left: 60px; right: 60px;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(10px);
    border-radius: 16px; padding: 30px 40px; z-index: 10;
    display: flex; justify-content: center; gap: 40px; align-items: baseline;
  }
  .stat-big { font-size: 56px; font-weight: 900; color: #22c55e; }
  .stat-sep { font-size: 36px; color: rgba(255,255,255,0.3); }
  .stat-small { font-size: 28px; color: rgba(255,255,255,0.7); font-weight: 600; }
`, `
  <div class="split split-left"></div>
  <div class="split split-right"></div>
  <div class="divider"></div>
  <div class="label label-left">ANTES</div>
  <div class="label label-right">DESPU&Eacute;S</div>
  <div class="stats-bar">
    <span class="stat-big">-17 KG</span>
    <span class="stat-sep">|</span>
    <span class="stat-small">4 MESES</span>
  </div>
`);

// ─── STORY 9: PREGUNTAME ───────────────────────────────────────
const story09 = wrapStory('Preguntame', `
  .story {
    background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.9) 100%),
      url('../images/pablo-row.jpg') center/cover no-repeat;
  }
  .headline { font-size: 60px; font-weight: 900; text-transform: uppercase; line-height: 1.1; margin-bottom: 20px; }
  .sub { font-size: 34px; font-weight: 500; color: rgba(255,255,255,0.7); margin-bottom: 60px; }
  .fake-input {
    background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.2);
    border-radius: 16px; padding: 28px 32px; font-size: 30px;
    color: rgba(255,255,255,0.4); margin-bottom: 30px;
  }
  .respond { font-size: 28px; font-weight: 700; color: #22c55e; text-align: right; }
`, `
  <div class="safe-content" style="justify-content: center;">
    <div class="headline">PREGUNTAME LO QUE QUIERAS</div>
    <div class="sub">Sobre entrenamiento y nutrici&oacute;n</div>
    <div class="fake-input">Hac&eacute; tu pregunta...</div>
    <div class="respond">Respondo TODAS &rarr;</div>
  </div>
`);

// ─── STORY 10: MI COMIDA ───────────────────────────────────────
const story10 = wrapStory('Mi Comida de Hoy', `
  .story {
    background: linear-gradient(180deg, #09090b 0%, #111111 50%, #09090b 100%);
  }
  .headline { font-size: 56px; font-weight: 900; color: #22c55e; text-transform: uppercase; margin-bottom: 50px; }
  .meal-card {
    background: rgba(255,255,255,0.06); border-radius: 16px; padding: 28px 32px;
    margin-bottom: 18px; display: flex; align-items: baseline; gap: 20px;
  }
  .meal-time {
    font-size: 28px; font-weight: 800; color: #22c55e; min-width: 90px;
  }
  .meal-food { font-size: 30px; font-weight: 500; color: rgba(255,255,255,0.9); }
  .total {
    margin-top: 40px; text-align: center; padding: 24px;
    border-top: 2px solid rgba(34,197,94,0.3);
  }
  .total-num { font-size: 44px; font-weight: 900; }
  .total-label {
    font-size: 24px; color: #22c55e; font-weight: 700; text-transform: uppercase;
    letter-spacing: 3px; margin-top: 6px;
  }
`, `
  <div class="safe-content" style="justify-content: center;">
    <div class="headline">MI COMIDA DE HOY</div>
    <div class="meal-card">
      <span class="meal-time">7:00</span>
      <span class="meal-food">Avena + huevos + banana</span>
    </div>
    <div class="meal-card">
      <span class="meal-time">13:00</span>
      <span class="meal-food">Pollo + arroz + br&oacute;coli</span>
    </div>
    <div class="meal-card">
      <span class="meal-time">20:00</span>
      <span class="meal-food">Salm&oacute;n + batata + ensalada</span>
    </div>
    <div class="total">
      <div class="total-num">2,100 kcal</div>
      <div class="total-label">D&Eacute;FICIT</div>
    </div>
  </div>
`);

// ─── STORY 11: RUTINA EXPRESS ───────────────────────────────────
const story11 = wrapStory('Rutina Express', `
  .story {
    background: linear-gradient(160deg, #09090b 0%, #0a2e1a 50%, #09090b 100%);
  }
  .headline { font-size: 64px; font-weight: 900; text-transform: uppercase; margin-bottom: 8px; }
  .sub { font-size: 34px; font-weight: 600; color: #22c55e; margin-bottom: 50px; }
  .exercise-card {
    background: rgba(255,255,255,0.06); border-radius: 16px; padding: 30px 32px;
    margin-bottom: 18px; border-left: 5px solid #22c55e;
  }
  .ex-num { font-size: 22px; font-weight: 800; color: #22c55e; letter-spacing: 2px; margin-bottom: 8px; }
  .ex-name { font-size: 36px; font-weight: 800; margin-bottom: 8px; }
  .ex-detail { font-size: 26px; color: rgba(255,255,255,0.6); font-weight: 500; }
`, `
  <div class="safe-content" style="justify-content: center;">
    <div class="headline">RUTINA EXPRESS</div>
    <div class="sub">3 ejercicios &bull; 15 minutos</div>
    <div class="exercise-card">
      <div class="ex-num">EJERCICIO 01</div>
      <div class="ex-name">Sentadillas con salto</div>
      <div class="ex-detail">4 series &times; 12 reps</div>
    </div>
    <div class="exercise-card">
      <div class="ex-num">EJERCICIO 02</div>
      <div class="ex-name">Flexiones de brazos</div>
      <div class="ex-detail">4 series &times; 15 reps</div>
    </div>
    <div class="exercise-card">
      <div class="ex-num">EJERCICIO 03</div>
      <div class="ex-name">Plancha din&aacute;mica</div>
      <div class="ex-detail">3 series &times; 30 seg</div>
    </div>
  </div>
`);

// ─── STORY 12: TRANSFORMACION HOMBRE ────────────────────────────
const story12 = wrapStory('Transformacion Hombre', `
  .story {
    background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0.85) 100%),
      url('../images/transf-hombre-definicion.jpg') center/cover no-repeat;
  }
  .badge {
    display: inline-block; background: #22c55e; color: #09090b; font-size: 22px; font-weight: 800;
    padding: 10px 28px; border-radius: 30px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 40px;
  }
  .headline { font-size: 60px; font-weight: 900; text-transform: uppercase; line-height: 1.1; margin-bottom: 20px; }
  .stats-bar {
    margin-top: auto;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(10px);
    border-radius: 16px; padding: 24px 32px;
    display: flex; justify-content: space-around; align-items: center;
  }
  .sbar-item { text-align: center; }
  .sbar-val { font-size: 40px; font-weight: 900; color: #22c55e; }
  .sbar-lbl { font-size: 22px; color: rgba(255,255,255,0.6); margin-top: 4px; }
`, `
  <div class="safe-content">
    <div class="badge">RESULTADO</div>
    <div class="headline">DEFINICI&Oacute;N EN 4 MESES</div>
    <div class="stats-bar">
      <div class="sbar-item"><div class="sbar-val">-12 kg</div><div class="sbar-lbl">grasa</div></div>
      <div class="sbar-item"><div class="sbar-val">+3 kg</div><div class="sbar-lbl">m&uacute;sculo</div></div>
      <div class="sbar-item"><div class="sbar-val">4</div><div class="sbar-lbl">meses</div></div>
    </div>
  </div>
`);

// ─── STORY 13: ULTIMO DIA ──────────────────────────────────────
const story13 = wrapStory('Ultimo Dia', `
  .story {
    background: linear-gradient(160deg, #09090b 0%, #7f1d1d 40%, #09090b 100%);
  }
  .headline { font-size: 84px; font-weight: 900; text-transform: uppercase; line-height: 1; margin-bottom: 24px; }
  .offer { font-size: 42px; font-weight: 700; line-height: 1.3; margin-bottom: 50px; }
  .offer strong { color: #f97316; }
  .countdown {
    display: flex; justify-content: center; gap: 16px; margin-bottom: 40px;
  }
  .cd-block {
    background: rgba(239,68,68,0.2); border: 2px solid rgba(239,68,68,0.4);
    border-radius: 14px; padding: 20px 28px; text-align: center; min-width: 120px;
  }
  .cd-num { font-size: 56px; font-weight: 900; color: #ef4444; }
  .cd-lbl { font-size: 18px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
  .urgency-bar {
    text-align: center; font-size: 26px; font-weight: 700; color: #f97316;
    padding: 16px; border-top: 1px solid rgba(249,115,22,0.3);
  }
`, `
  <div class="safe-content" style="justify-content: center; align-items: center; text-align: center;">
    <div class="headline">&Uacute;LTIMO D&Iacute;A</div>
    <div class="offer"><strong>30% OFF</strong> en tu primer trimestre</div>
    <div class="countdown">
      <div class="cd-block"><div class="cd-num">23</div><div class="cd-lbl">Horas</div></div>
      <div class="cd-block"><div class="cd-num">59</div><div class="cd-lbl">Min</div></div>
      <div class="cd-block"><div class="cd-num">59</div><div class="cd-lbl">Seg</div></div>
    </div>
    <div class="urgency-bar">Oferta termina hoy &mdash; no se repite</div>
  </div>
`);

// ─── STORY 14: MUJER RESULTADO (Frente/Espalda) ────────────────
const story14 = wrapStory('Mujer Resultado', `
  .story { background: #09090b; }
  .split {
    position: absolute; top: 0; bottom: 0; width: 50%;
  }
  .split-left {
    left: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.7) 100%),
      url('../images/transf-mujer3-frente.jpg') center/cover no-repeat;
  }
  .split-right {
    right: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.7) 100%),
      url('../images/transf-mujer3-espalda.jpg') center/cover no-repeat;
  }
  .divider {
    position: absolute; top: 0; bottom: 0; left: 50%; width: 4px;
    background: #22c55e; z-index: 5;
  }
  .label {
    position: absolute; top: 320px; z-index: 10;
    font-size: 26px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 3px; padding: 10px 22px; border-radius: 8px;
    background: rgba(34,197,94,0.8); color: #09090b;
  }
  .label-left { left: 60px; }
  .label-right { right: 60px; }
  .bottom-info {
    position: absolute; bottom: 260px; left: 60px; right: 60px;
    z-index: 10; text-align: center;
  }
  .bi-headline { font-size: 50px; font-weight: 900; text-transform: uppercase; margin-bottom: 16px; }
  .bi-stats {
    font-size: 26px; color: rgba(255,255,255,0.7); font-weight: 600;
    background: rgba(0,0,0,0.6); padding: 16px 28px; border-radius: 12px;
    display: inline-block;
  }
`, `
  <div class="split split-left"></div>
  <div class="split split-right"></div>
  <div class="divider"></div>
  <div class="label label-left">FRENTE</div>
  <div class="label label-right">ESPALDA</div>
  <div class="bottom-info">
    <div class="bi-headline">TRANSFORMACI&Oacute;N COMPLETA</div>
    <div class="bi-stats">Plan Tonificaci&oacute;n &bull; 3 meses</div>
  </div>
`);

// ─── STORY 15: SEGUIME ─────────────────────────────────────────
const story15 = wrapStory('Seguime', `
  .story {
    background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.9) 100%),
      url('../images/gym-bg.png') center/cover no-repeat;
  }
  .headline { font-size: 68px; font-weight: 900; text-transform: uppercase; text-align: center; line-height: 1.1; margin-bottom: 30px; }
  .arrow {
    font-size: 80px; color: #22c55e; text-align: center; margin-bottom: 30px;
    animation: bounce 2s infinite;
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
  }
  .handle { font-size: 36px; font-weight: 700; color: #22c55e; text-align: center; margin-bottom: 24px; }
  .desc { font-size: 30px; color: rgba(255,255,255,0.7); text-align: center; max-width: 700px; align-self: center; line-height: 1.4; }
`, `
  <div class="safe-content" style="justify-content: center; align-items: center;">
    <div class="headline">SEGUIME<br/>PARA M&Aacute;S</div>
    <div class="arrow">&uarr;</div>
    <div class="handle">@pabloscarlattoentrenamientos</div>
    <div class="desc">Tips diarios de entrenamiento y nutrici&oacute;n</div>
  </div>
`);

// ─── WRITE ALL FILES ────────────────────────────────────────────
const stories = [
  story01, story02, story03, story04, story05,
  story06, story07, story08, story09, story10,
  story11, story12, story13, story14, story15,
];

stories.forEach((html, i) => {
  const num = String(i + 1).padStart(2, '0');
  const path = join(OUT_DIR, `story-pro-${num}.html`);
  writeFileSync(path, html, 'utf-8');
  console.log(`✓ story-pro-${num}.html`);
});

console.log(`\nDone! ${stories.length} stories generated in ${OUT_DIR}`);
