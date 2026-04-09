#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUT = join(process.cwd(), 'public', 'social-templates');
mkdirSync(OUT, { recursive: true });

// ── Shared style pieces ──────────────────────────────────────────────
const GREEN = '#22c55e';
const CARD_BG = '#18181b';
const CARD_BORDER = '1px solid #222';

const logo = `<img src="../logo-pablo.jpg" style="height:80px;filter:invert(1);mix-blend-mode:screen;" alt="Logo">`;

const footer = `<div style="position:absolute;bottom:24px;left:0;right:0;text-align:center;font-size:14px;color:#666;letter-spacing:2px;">Pablo Scarlatto | Entrenador Personal</div>`;

const bg = (extra = '') =>
  `background:${extra ? extra + ',' : ''} radial-gradient(ellipse at 30% 20%, rgba(34,197,94,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(34,197,94,0.08) 0%, transparent 50%), linear-gradient(180deg, #0f1210 0%, #090b09 50%, #0c0f0e 100%);`;

const bgAlt = (extra = '') =>
  `background:${extra ? extra + ',' : ''} radial-gradient(ellipse at 60% 30%, rgba(34,197,94,0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 70%, rgba(34,197,94,0.1) 0%, transparent 50%), linear-gradient(160deg, #0a0f0b 0%, #0d100d 50%, #090b09 100%);`;

const dotOverlay = `<div style="position:absolute;inset:0;background-image:radial-gradient(#fff 1px,transparent 1px);background-size:24px 24px;opacity:0.03;pointer-events:none;"></div>`;

const cornerAccents = `
<div style="position:absolute;top:20px;left:20px;width:40px;height:40px;border-top:2px solid ${GREEN};border-left:2px solid ${GREEN};opacity:0.5;"></div>
<div style="position:absolute;top:20px;right:20px;width:40px;height:40px;border-top:2px solid ${GREEN};border-right:2px solid ${GREEN};opacity:0.5;"></div>
<div style="position:absolute;bottom:60px;left:20px;width:40px;height:40px;border-bottom:2px solid ${GREEN};border-left:2px solid ${GREEN};opacity:0.5;"></div>
<div style="position:absolute;bottom:60px;right:20px;width:40px;height:40px;border-bottom:2px solid ${GREEN};border-right:2px solid ${GREEN};opacity:0.5;"></div>`;

function wrap(w, h, inner, extraBg = '') {
  const useBg = extraBg ? bg(extraBg) : bgAlt();
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{width:${w}px;height:${h}px;${useBg}font-family:'Inter',sans-serif;color:#fff;position:relative;overflow:hidden;}
</style></head><body>
${dotOverlay}
${cornerAccents}
${inner}
${footer}
</body></html>`;
}

function wrapPost(inner, extraBg) { return wrap(1080, 1080, inner, extraBg); }
function wrapTall(inner, extraBg) { return wrap(1080, 1350, inner, extraBg); }
function wrapStory(inner, extraBg) { return wrap(1080, 1920, inner, extraBg); }

// Helper: image with cover + optional overlay
function coverImg(src, extra = '') {
  return `<div style="position:absolute;inset:0;${extra}"><img src="${src}" style="width:100%;height:100%;object-fit:cover;"></div>`;
}

function imgOverlay(src, opacity = 0.7) {
  return `${coverImg(src)}<div style="position:absolute;inset:0;background:rgba(0,0,0,${opacity});"></div>`;
}

// Card helper
function card(content, style = '') {
  return `<div style="background:${CARD_BG};border:${CARD_BORDER};border-radius:12px;padding:20px;${style}">${content}</div>`;
}

// Transformation side-by-side
function transfSplit(leftSrc, rightSrc, leftLabel = 'ANTES', rightLabel = 'DESPUES') {
  return `<div style="display:flex;gap:12px;margin:20px 40px;">
  <div style="flex:1;position:relative;border-radius:12px;overflow:hidden;border:2px solid #333;">
    <img src="${leftSrc}" style="width:100%;height:400px;object-fit:cover;">
    <div style="position:absolute;bottom:0;left:0;right:0;padding:8px;background:rgba(0,0,0,0.7);text-align:center;font-weight:700;font-size:16px;color:${GREEN};">${leftLabel}</div>
  </div>
  <div style="flex:1;position:relative;border-radius:12px;overflow:hidden;border:2px solid ${GREEN};">
    <img src="${rightSrc}" style="width:100%;height:400px;object-fit:cover;">
    <div style="position:absolute;bottom:0;left:0;right:0;padding:8px;background:rgba(0,0,0,0.7);text-align:center;font-weight:700;font-size:16px;color:${GREEN};">${rightLabel}</div>
  </div>
</div>`;
}

// ── 30 POST TEMPLATES ────────────────────────────────────────────────

const posts = [];

// 1. PRESENTAMOS
posts.push({ name: '01-presentamos', html: wrapPost(`
${imgOverlay('../images/gym-bg.png', 0.65)}
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;text-align:center;">
  <div style="margin-bottom:30px;">${logo.replace('height:80px', 'height:120px')}</div>
  <div style="font-size:18px;letter-spacing:6px;color:${GREEN};margin-bottom:16px;">PRESENTAMOS</div>
  <div style="font-size:48px;font-weight:900;line-height:1.1;margin-bottom:20px;">TU ENTRENADOR<br>PERSONAL</div>
  <div style="width:60px;height:3px;background:${GREEN};margin-bottom:20px;"></div>
  <div style="font-size:18px;color:#ccc;max-width:600px;">Planes personalizados de entrenamiento y nutricion para alcanzar tus objetivos</div>
</div>
`) });

// 2. 5 RAZONES (carousel 1080x1350)
posts.push({ name: '02-5-razones-entrenador', html: wrapTall(`
<div style="position:relative;z-index:1;padding:60px 50px;">
  <div style="text-align:center;margin-bottom:10px;">${logo}</div>
  <div style="text-align:center;font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:8px;">TOP 5</div>
  <div style="text-align:center;font-size:40px;font-weight:900;line-height:1.1;margin-bottom:40px;">RAZONES PARA<br>UN ENTRENADOR<br>PERSONAL</div>
  ${[
    'Tecnica correcta = menos lesiones',
    'Rutinas adaptadas a TUS objetivos',
    'Motivacion y accountability constante',
    'Nutricion personalizada incluida',
    'Resultados reales en menos tiempo'
  ].map((t, i) => `
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
    <div style="min-width:50px;height:50px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:#000;">${i + 1}</div>
    <div style="font-size:20px;font-weight:600;">${t}</div>
  </div>`).join('')}
  <div style="margin-top:30px;text-align:center;font-size:14px;color:#888;">Desliza para mas &rarr;</div>
</div>
`) });

// 3. DETRAS DE ESCENA
posts.push({ name: '03-detras-escena', html: wrapPost(`
${imgOverlay('../images/pablo-row.jpg', 0.55)}
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;text-align:center;">
  <div style="margin-bottom:20px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:12px;">DETRAS DE ESCENA</div>
  <div style="font-size:44px;font-weight:900;line-height:1.1;margin-bottom:20px;">MI DIA<br>ENTRENANDO</div>
  <div style="font-size:18px;color:#ccc;">Cada repeticion cuenta. Cada dia suma.</div>
</div>
`) });

// 4. ESTE EJERCICIO lo haces MAL
posts.push({ name: '04-ejercicio-mal', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;text-align:center;">
  <div style="margin-bottom:20px;">${logo}</div>
  <div style="font-size:60px;margin-bottom:10px;">&#9888;</div>
  <div style="font-size:16px;letter-spacing:4px;color:#ef4444;margin-bottom:12px;">ALERTA DE TECNICA</div>
  <div style="font-size:42px;font-weight:900;line-height:1.1;margin-bottom:24px;">ESTE EJERCICIO<br><span style="color:#ef4444;">LO HACES MAL</span></div>
  <div style="display:flex;gap:20px;margin-top:10px;">
    ${card('<div style="font-size:36px;margin-bottom:8px;">&#10060;</div><div style="font-size:16px;font-weight:700;color:#ef4444;">INCORRECTO</div><div style="font-size:14px;color:#aaa;margin-top:8px;">Espalda curvada<br>Rodillas hacia dentro<br>Peso en puntas</div>', 'text-align:center;flex:1;border-color:#ef4444;')}
    ${card('<div style="font-size:36px;margin-bottom:8px;">&#9989;</div><div style="font-size:16px;font-weight:700;color:' + GREEN + ';">CORRECTO</div><div style="font-size:14px;color:#aaa;margin-top:8px;">Espalda neutra<br>Rodillas alineadas<br>Peso en talones</div>', 'text-align:center;flex:1;border-color:' + GREEN + ';')}
  </div>
</div>
`) });

// 5. TRANSFORMACION front before/after
posts.push({ name: '05-transformacion-frontal', html: wrapPost(`
<div style="position:relative;z-index:1;padding:40px 0;height:100%;display:flex;flex-direction:column;align-items:center;">
  <div style="margin-bottom:16px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:4px;">RESULTADO REAL</div>
  <div style="font-size:36px;font-weight:900;margin-bottom:16px;">TRANSFORMACION</div>
  ${transfSplit('../front-before.jpg', '../front-after.jpg')}
  <div style="margin-top:16px;font-size:16px;color:#aaa;">12 semanas de entrenamiento personalizado</div>
</div>
`) });

// 6. CALCULA TUS MACROS
posts.push({ name: '06-calcula-macros', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;text-align:center;">
  <div style="margin-bottom:20px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:8px;">NUTRICION</div>
  <div style="font-size:40px;font-weight:900;margin-bottom:30px;">CALCULA TUS<br>MACROS</div>
  <div style="display:flex;gap:16px;">
    ${['PROTEINA|180g|30%', 'CARBOS|250g|45%', 'GRASAS|65g|25%'].map(m => {
      const [n, v, p] = m.split('|');
      return `<div style="text-align:center;">
        <div style="width:120px;height:120px;border-radius:50%;border:4px solid ${GREEN};display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <div style="font-size:28px;font-weight:900;">${v}</div>
          <div style="font-size:12px;color:${GREEN};">${p}</div>
        </div>
        <div style="margin-top:10px;font-size:14px;font-weight:700;letter-spacing:1px;">${n}</div>
      </div>`;
    }).join('')}
  </div>
  <div style="margin-top:24px;font-size:14px;color:#888;">Ejemplo para hombre de 80kg en definicion</div>
</div>
`) });

// 7. RUTINA PIERNAS Y GLUTEOS (1080x1350)
posts.push({ name: '07-rutina-piernas-gluteos', html: wrapTall(`
<div style="position:relative;z-index:1;padding:50px;">
  <div style="text-align:center;margin-bottom:16px;">${logo}</div>
  <div style="text-align:center;font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:8px;">RUTINA</div>
  <div style="text-align:center;font-size:38px;font-weight:900;line-height:1.1;margin-bottom:30px;">PIERNAS &<br>GLUTEOS</div>
  ${['Hip Thrust — 4x12', 'Sentadilla Bulgara — 3x10 c/l', 'Peso Muerto Rumano — 4x10', 'Zancadas caminando — 3x12 c/l', 'Puente de Gluteo — 3x15', 'Extension de Cuadriceps — 3x12', 'Curl Femoral — 3x12'].map((ex, i) => `
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;padding:14px 18px;background:${CARD_BG};border:${CARD_BORDER};border-radius:10px;">
    <div style="min-width:36px;height:36px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;font-weight:800;color:#000;font-size:16px;">${i + 1}</div>
    <div style="font-size:18px;font-weight:600;">${ex}</div>
  </div>`).join('')}
  <div style="margin-top:20px;text-align:center;font-size:14px;color:#888;">Guarda esta rutina para tu proximo dia de piernas</div>
</div>
`) });

// 8. MI ENTRENAMIENTO DE HOY
posts.push({ name: '08-mi-entrenamiento', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;">
  <div style="margin-bottom:20px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:8px;">HOY ENTRENE</div>
  <div style="font-size:42px;font-weight:900;margin-bottom:30px;">ESPALDA & BICEPS</div>
  ${card(`
    <div style="display:flex;justify-content:space-around;margin-bottom:16px;">
      <div style="text-align:center;"><div style="font-size:28px;font-weight:900;color:${GREEN};">65</div><div style="font-size:12px;color:#888;">MINUTOS</div></div>
      <div style="text-align:center;"><div style="font-size:28px;font-weight:900;color:${GREEN};">28</div><div style="font-size:12px;color:#888;">SERIES</div></div>
      <div style="text-align:center;"><div style="font-size:28px;font-weight:900;color:${GREEN};">6</div><div style="font-size:12px;color:#888;">EJERCICIOS</div></div>
    </div>
    ${['Dominadas 4x8', 'Remo con barra 4x10', 'Jalon al pecho 3x12', 'Remo mancuerna 3x10', 'Curl barra 3x10', 'Curl martillo 3x12'].map(e => `<div style="padding:8px 0;border-bottom:1px solid #333;font-size:15px;">${e}</div>`).join('')}
  `, 'width:100%;max-width:500px;')}
</div>
`) });

// 9. 3 COMIDAS PARA GANAR MUSCULO
posts.push({ name: '09-comidas-musculo', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;">
  <div style="margin-bottom:16px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:8px;">NUTRICION</div>
  <div style="font-size:38px;font-weight:900;margin-bottom:24px;text-align:center;">3 COMIDAS PARA<br>GANAR MUSCULO</div>
  <div style="display:flex;gap:14px;width:100%;max-width:900px;">
    ${[
      ['DESAYUNO', 'Avena + whey + banana + manteca de mani', '550 kcal | 40g prot'],
      ['ALMUERZO', 'Arroz + pollo + vegetales salteados + aceite oliva', '650 kcal | 45g prot'],
      ['CENA', 'Pasta integral + carne molida + salsa tomate', '600 kcal | 42g prot']
    ].map(([t, d, k]) => card(`
      <div style="font-size:14px;font-weight:800;color:${GREEN};letter-spacing:2px;margin-bottom:10px;">${t}</div>
      <div style="font-size:15px;line-height:1.5;margin-bottom:10px;">${d}</div>
      <div style="font-size:12px;color:#888;">${k}</div>
    `, 'flex:1;')).join('')}
  </div>
</div>
`) });

// 10. Frase motivacional
posts.push({ name: '10-frase-motivacional', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-bottom:30px;">${logo}</div>
  <div style="font-size:80px;color:${GREEN};margin-bottom:20px;">&ldquo;</div>
  <div style="font-size:42px;font-weight:900;line-height:1.2;margin-bottom:20px;">EL DOLOR DE HOY<br>ES LA FUERZA<br>DE MA&Ntilde;ANA</div>
  <div style="width:60px;height:3px;background:${GREEN};margin:20px auto;"></div>
  <div style="font-size:16px;color:#888;letter-spacing:2px;">@PABLOSCARLATTO</div>
</div>
`) });

// 11. TRANSFORMACION PESO - Javi
posts.push({ name: '11-transformacion-peso', html: wrapPost(`
<div style="position:relative;z-index:1;padding:40px 0;height:100%;display:flex;flex-direction:column;align-items:center;">
  <div style="margin-bottom:12px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:4px;">TRANSFORMACION</div>
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
    <div style="font-size:48px;font-weight:900;">95 kg</div>
    <div style="font-size:36px;color:${GREEN};">&rarr;</div>
    <div style="font-size:48px;font-weight:900;color:${GREEN};">78 kg</div>
  </div>
  ${transfSplit('../javi-front.jpg', '../javi-side.jpg', 'ANTES', 'DESPUES')}
  <div style="margin-top:12px;font-size:16px;color:#aaa;">-17 kg en 5 meses de plan personalizado</div>
</div>
`) });

// 12. LO QUE NADIE TE DICE (1080x1350)
posts.push({ name: '12-verdades-grasa', html: wrapTall(`
<div style="position:relative;z-index:1;padding:50px;">
  <div style="text-align:center;margin-bottom:16px;">${logo}</div>
  <div style="text-align:center;font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:8px;">LA VERDAD</div>
  <div style="text-align:center;font-size:36px;font-weight:900;line-height:1.1;margin-bottom:32px;">LO QUE NADIE<br>TE DICE SOBRE<br><span style="color:${GREEN};">PERDER GRASA</span></div>
  ${[
    'No necesitas cardio excesivo — el deficit calorico es lo que importa',
    'Perder peso rapido = perder musculo. Paciencia.',
    'Las dietas extremas destruyen tu metabolismo',
    'El descanso es TAN importante como el entrenamiento',
    'Sin seguimiento no hay progreso real'
  ].map((t, i) => `
  <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:18px;padding:16px;background:${CARD_BG};border:${CARD_BORDER};border-radius:10px;">
    <div style="min-width:32px;height:32px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;font-weight:800;color:#000;font-size:14px;">${i + 1}</div>
    <div style="font-size:17px;line-height:1.4;">${t}</div>
  </div>`).join('')}
</div>
`) });

// 13. PREGUNTAME LO QUE QUIERAS
posts.push({ name: '13-preguntame', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-bottom:24px;">${logo}</div>
  <div style="font-size:80px;margin-bottom:16px;">&#128172;</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:12px;">Q&A TIME</div>
  <div style="font-size:44px;font-weight:900;line-height:1.1;margin-bottom:24px;">PREGUNTAME<br>LO QUE QUIERAS</div>
  <div style="font-size:18px;color:#aaa;">Nutricion, entrenamiento, suplementos...<br>Respondo todo en stories</div>
</div>
`) });

// 14. HIP THRUST PERFECTO
posts.push({ name: '14-hip-thrust-tutorial', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;">
  <div style="margin-bottom:16px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:8px;">TUTORIAL</div>
  <div style="font-size:40px;font-weight:900;margin-bottom:28px;">HIP THRUST<br>PERFECTO</div>
  <div style="width:100%;max-width:600px;">
    ${['Espalda apoyada en el banco a la altura de las escapulas', 'Pies separados al ancho de caderas, rodillas a 90 grados', 'Apreta gluteos arriba, no arquees la lumbar', 'Baja controlado, sin rebotar abajo'].map((s, i) => `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
      <div style="min-width:40px;height:40px;border:2px solid ${GREEN};border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;color:${GREEN};font-size:18px;">${i + 1}</div>
      <div style="font-size:17px;line-height:1.3;">${s}</div>
    </div>`).join('')}
  </div>
</div>
`) });

// 15. TESTIMONIO
posts.push({ name: '15-testimonio', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;text-align:center;">
  <div style="margin-bottom:20px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:16px;">TESTIMONIO</div>
  <div style="font-size:32px;color:${GREEN};margin-bottom:16px;">&starf;&starf;&starf;&starf;&starf;</div>
  ${card(`
    <div style="font-size:50px;color:${GREEN};margin-bottom:10px;">&ldquo;</div>
    <div style="font-size:20px;line-height:1.5;font-style:italic;margin-bottom:16px;">En 3 meses baje 12 kilos y gane fuerza. Pablo me enseno a comer bien y entrenar con intensidad. Mejor inversion de mi vida.</div>
    <div style="font-size:16px;color:${GREEN};font-weight:700;">— Maria L.</div>
    <div style="font-size:13px;color:#888;margin-top:4px;">Cliente desde 2024</div>
  `, 'max-width:600px;text-align:center;')}
</div>
`) });

// 16. ENCONTRA TU COMPAÑERO
posts.push({ name: '16-companero-entrenamiento', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;text-align:center;">
  <div style="margin-bottom:20px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:12px;">COMUNIDAD</div>
  <div style="font-size:40px;font-weight:900;line-height:1.1;margin-bottom:24px;">ENCONTRA TU<br>COMPA&Ntilde;ERO DE<br>ENTRENAMIENTO</div>
  <div style="display:flex;margin-bottom:20px;">
    ${[1,2,3,4,5].map((_, i) => `<div style="width:60px;height:60px;border-radius:50%;background:${GREEN};border:3px solid #000;margin-left:${i > 0 ? '-15px' : '0'};display:flex;align-items:center;justify-content:center;font-size:24px;">&#128170;</div>`).join('')}
  </div>
  <div style="font-size:18px;color:#ccc;">Unite a la comunidad. Entrena acompanado.</div>
</div>
`) });

// 17. MI PROGRESO
posts.push({ name: '17-mi-progreso', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;">
  <div style="margin-bottom:16px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:8px;">TIMELINE</div>
  <div style="font-size:40px;font-weight:900;margin-bottom:28px;">MI PROGRESO</div>
  <div style="position:relative;padding-left:40px;width:100%;max-width:500px;">
    <div style="position:absolute;left:15px;top:0;bottom:0;width:2px;background:${GREEN};"></div>
    ${[
      ['MES 1', 'Aprendi tecnica basica. Baje 3kg.'],
      ['MES 3', 'Primeros cambios visibles. +10kg en sentadilla.'],
      ['MES 6', '-12kg de grasa. Musculo visible.'],
      ['MES 12', 'Transformacion completa. Mejor forma de mi vida.']
    ].map(([m, d]) => `
    <div style="position:relative;margin-bottom:20px;">
      <div style="position:absolute;left:-33px;top:4px;width:14px;height:14px;border-radius:50%;background:${GREEN};border:3px solid #000;"></div>
      <div style="font-size:14px;font-weight:800;color:${GREEN};margin-bottom:4px;">${m}</div>
      <div style="font-size:16px;color:#ccc;">${d}</div>
    </div>`).join('')}
  </div>
</div>
`) });

// 18. QUE MUSCULO ENTRENARON HOY?
posts.push({ name: '18-encuesta-musculo', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;text-align:center;">
  <div style="margin-bottom:20px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:12px;">ENCUESTA</div>
  <div style="font-size:40px;font-weight:900;margin-bottom:28px;">QUE MUSCULO<br>ENTRENARON HOY?</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;width:100%;max-width:500px;">
    ${['PECHO', 'ESPALDA', 'PIERNAS', 'HOMBROS', 'BRAZOS', 'DESCANSO'].map(m =>
      `<div style="padding:18px;background:${CARD_BG};border:${CARD_BORDER};border-radius:10px;font-size:18px;font-weight:700;text-align:center;">${m}</div>`
    ).join('')}
  </div>
  <div style="margin-top:20px;font-size:14px;color:#888;">Comenta tu respuesta abajo</div>
</div>
`) });

// 19. 7 DIAS GRATIS
posts.push({ name: '19-prueba-gratis', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;text-align:center;">
  <div style="margin-bottom:20px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:12px;">OFERTA ESPECIAL</div>
  <div style="font-size:50px;font-weight:900;margin-bottom:8px;">7 DIAS<br><span style="color:${GREEN};">GRATIS</span></div>
  <div style="font-size:18px;color:#ccc;margin-bottom:28px;">Proba el plan completo sin compromiso</div>
  <div style="width:200px;height:380px;border-radius:30px;border:3px solid #333;background:#000;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
    <div style="font-size:14px;color:#888;text-align:center;padding:20px;">
      <div style="font-size:24px;margin-bottom:8px;">&#128241;</div>
      App de entrenamiento<br>+ Nutricion<br>+ Chat directo
    </div>
  </div>
  <div style="margin-top:20px;padding:14px 40px;background:${GREEN};border-radius:50px;font-size:18px;font-weight:800;color:#000;">EMPEZA AHORA</div>
</div>
`) });

// 20. SOMOS UNA COMUNIDAD
posts.push({ name: '20-comunidad', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;text-align:center;">
  <div style="margin-bottom:20px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:12px;">JUNTOS</div>
  <div style="font-size:44px;font-weight:900;line-height:1.1;margin-bottom:24px;">SOMOS UNA<br>COMUNIDAD</div>
  <div style="display:flex;gap:20px;margin-bottom:24px;">
    ${[['50+', 'CLIENTES'], ['1200+', 'ENTRENOS'], ['98%', 'SATISFACCION']].map(([v, l]) => `
    <div style="text-align:center;">
      <div style="font-size:36px;font-weight:900;color:${GREEN};">${v}</div>
      <div style="font-size:12px;color:#888;letter-spacing:1px;">${l}</div>
    </div>`).join('')}
  </div>
  <div style="font-size:18px;color:#ccc;">No es solo un plan. Es una familia.</div>
</div>
`) });

// 21. ERRORES DE PRINCIPIANTE
posts.push({ name: '21-errores-principiante', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;">
  <div style="margin-bottom:16px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:#ef4444;margin-bottom:8px;">EVITA ESTO</div>
  <div style="font-size:40px;font-weight:900;margin-bottom:24px;text-align:center;">ERRORES DE<br>PRINCIPIANTE</div>
  <div style="width:100%;max-width:550px;">
    ${['No calentar antes de entrenar', 'Hacer solo cardio para bajar de peso', 'Copiar rutinas de internet sin adaptarlas', 'Ignorar la nutricion', 'No descansar lo suficiente'].map(e => `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;padding:14px 18px;background:${CARD_BG};border:${CARD_BORDER};border-radius:10px;">
      <div style="font-size:24px;color:#ef4444;">&#10060;</div>
      <div style="font-size:17px;">${e}</div>
    </div>`).join('')}
  </div>
</div>
`) });

// 22. PLAN DE NUTRICION
posts.push({ name: '22-plan-nutricion', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;text-align:center;">
  <div style="margin-bottom:20px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:12px;">PERSONALIZADO</div>
  <div style="font-size:40px;font-weight:900;margin-bottom:24px;">PLAN DE<br>NUTRICION</div>
  <div style="width:220px;height:400px;border-radius:30px;border:3px solid ${GREEN};background:#000;padding:20px;text-align:left;">
    <div style="font-size:12px;color:${GREEN};font-weight:700;margin-bottom:12px;">TU PLAN DE HOY</div>
    ${['Desayuno: 450 kcal', 'Snack: 200 kcal', 'Almuerzo: 600 kcal', 'Merienda: 250 kcal', 'Cena: 500 kcal'].map(m => `
    <div style="padding:8px 0;border-bottom:1px solid #222;font-size:13px;color:#ccc;">${m}</div>`).join('')}
    <div style="margin-top:12px;text-align:center;font-size:20px;font-weight:900;color:${GREEN};">2000 kcal</div>
  </div>
</div>
`) });

// 23. NO NECESITAS SUPLEMENTOS
posts.push({ name: '23-no-suplementos', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;text-align:center;">
  <div style="margin-bottom:20px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:#ef4444;margin-bottom:12px;">OPINION IMPOPULAR</div>
  <div style="font-size:42px;font-weight:900;line-height:1.1;margin-bottom:24px;">NO NECESITAS<br><span style="color:#ef4444;">SUPLEMENTOS</span></div>
  <div style="width:60px;height:3px;background:${GREEN};margin-bottom:24px;"></div>
  <div style="font-size:18px;color:#ccc;line-height:1.6;max-width:600px;">El 90% de tus resultados vienen de<br><span style="color:${GREEN};font-weight:700;">entrenamiento + nutricion + descanso</span><br><br>Los suplementos son solo el 10% restante.<br>No te dejes vender humo.</div>
</div>
`) });

// 24. RANKING SEMANAL
posts.push({ name: '24-ranking-semanal', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;">
  <div style="margin-bottom:16px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:8px;">ESTA SEMANA</div>
  <div style="font-size:40px;font-weight:900;margin-bottom:28px;">RANKING SEMANAL</div>
  <div style="font-size:60px;margin-bottom:20px;">&#127942;</div>
  <div style="display:flex;align-items:flex-end;gap:16px;margin-bottom:24px;">
    <div style="text-align:center;">
      <div style="font-size:14px;color:#aaa;margin-bottom:8px;">2do</div>
      <div style="width:100px;height:140px;background:${CARD_BG};border:${CARD_BORDER};border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;">Maria L.</div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:14px;color:${GREEN};margin-bottom:8px;">1ero</div>
      <div style="width:100px;height:200px;background:rgba(34,197,94,0.13);border:2px solid ${GREEN};border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:${GREEN};">Javi R.</div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:14px;color:#aaa;margin-bottom:8px;">3ero</div>
      <div style="width:100px;height:100px;background:${CARD_BG};border:${CARD_BORDER};border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;">Lucas P.</div>
    </div>
  </div>
  <div style="font-size:14px;color:#888;">Basado en entrenamientos completados</div>
</div>
`) });

// 25. ANTES vs AHORA (back)
posts.push({ name: '25-antes-vs-ahora', html: wrapPost(`
<div style="position:relative;z-index:1;padding:40px 0;height:100%;display:flex;flex-direction:column;align-items:center;">
  <div style="margin-bottom:12px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:4px;">RESULTADO REAL</div>
  <div style="font-size:36px;font-weight:900;margin-bottom:16px;">ANTES vs AHORA</div>
  ${transfSplit('../back-before.jpg', '../back-after.jpg')}
  <div style="margin-top:16px;font-size:16px;color:#aaa;">La consistencia vence al talento</div>
</div>
`) });

// 26. 3 EJERCICIOS ESPALDA
posts.push({ name: '26-ejercicios-espalda', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;">
  <div style="margin-bottom:16px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:8px;">ESPALDA</div>
  <div style="font-size:40px;font-weight:900;margin-bottom:28px;">3 EJERCICIOS<br>CLAVE</div>
  ${['Remo con barra — 4x10|El rey para espalda media. Apreta escapulas.', 'Jalon al pecho — 4x12|Amplio para ancho de espalda. No tires con biceps.', 'Face pull — 3x15|Salud de hombros + postura. No lo saltees.'].map((e, i) => {
    const [title, desc] = e.split('|');
    return card(`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="min-width:36px;height:36px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;font-weight:800;color:#000;">${i + 1}</div>
        <div style="font-size:18px;font-weight:700;">${title}</div>
      </div>
      <div style="font-size:14px;color:#aaa;padding-left:48px;">${desc}</div>
    `, 'margin-bottom:14px;');
  }).join('')}
</div>
`) });

// 27. DIA EN DEFICIT CALORICO
posts.push({ name: '27-deficit-calorico', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:50px;">
  <div style="margin-bottom:16px;">${logo}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:8px;">NUTRICION</div>
  <div style="font-size:36px;font-weight:900;margin-bottom:24px;text-align:center;">DIA EN DEFICIT<br>CALORICO</div>
  <div style="position:relative;padding-left:40px;width:100%;max-width:500px;">
    <div style="position:absolute;left:15px;top:0;bottom:0;width:2px;background:${GREEN};opacity:0.3;"></div>
    ${[
      ['8:00', 'Desayuno', 'Claras + tostada integral + fruta', '350 kcal'],
      ['11:00', 'Snack', 'Yogur griego + nueces', '200 kcal'],
      ['13:30', 'Almuerzo', 'Pollo + arroz + ensalada', '500 kcal'],
      ['17:00', 'Pre-entreno', 'Banana + whey', '250 kcal'],
      ['20:00', 'Cena', 'Pescado + vegetales al horno', '400 kcal']
    ].map(([t, n, d, k]) => `
    <div style="position:relative;margin-bottom:14px;">
      <div style="position:absolute;left:-33px;top:6px;width:10px;height:10px;border-radius:50%;background:${GREEN};"></div>
      <div style="font-size:12px;color:${GREEN};font-weight:700;">${t} — ${n}</div>
      <div style="font-size:15px;">${d}</div>
      <div style="font-size:12px;color:#888;">${k}</div>
    </div>`).join('')}
  </div>
  <div style="margin-top:16px;padding:10px 24px;border:1px solid ${GREEN};border-radius:8px;font-size:16px;font-weight:700;">TOTAL: <span style="color:${GREEN};">1700 kcal</span></div>
</div>
`) });

// 28. MITO vs REALIDAD
posts.push({ name: '28-mito-realidad', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;height:100%;">
  <div style="flex:1;display:flex;">
    <div style="flex:1;position:relative;overflow:hidden;">
      <img src="../images/transf-mujer-frontal.jpg" style="width:100%;height:100%;object-fit:cover;">
      <div style="position:absolute;inset:0;background:linear-gradient(to right,rgba(0,0,0,0.3),rgba(0,0,0,0.7));"></div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px;position:relative;">
      <div style="margin-bottom:16px;">${logo}</div>
      <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:8px;">DERRIBAMOS MITOS</div>
      <div style="font-size:32px;font-weight:900;line-height:1.1;margin-bottom:20px;">MITO vs<br>REALIDAD</div>
      <div style="margin-bottom:12px;">
        <div style="font-size:14px;color:#ef4444;font-weight:700;">&#10060; MITO</div>
        <div style="font-size:15px;color:#aaa;">"Las pesas te hacen grande y masculina"</div>
      </div>
      <div>
        <div style="font-size:14px;color:${GREEN};font-weight:700;">&#9989; REALIDAD</div>
        <div style="font-size:15px;color:#aaa;">Las pesas tonifican, queman grasa y moldean tu cuerpo</div>
      </div>
    </div>
  </div>
</div>
`) });

// 29. CLIENTE DEL MES
posts.push({ name: '29-cliente-del-mes', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;height:100%;">
  <div style="flex:1;display:flex;">
    <div style="flex:1;position:relative;overflow:hidden;">
      <img src="../images/transf-hombre-musculo.jpg" style="width:100%;height:100%;object-fit:cover;">
      <div style="position:absolute;inset:0;background:linear-gradient(to right,transparent 20%,rgba(0,0,0,0.85));"></div>
    </div>
    <div style="position:absolute;right:40px;top:0;bottom:60px;width:50%;display:flex;flex-direction:column;justify-content:center;">
      <div style="margin-bottom:16px;">${logo}</div>
      <div style="font-size:60px;margin-bottom:8px;">&#127942;</div>
      <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:8px;">RECONOCIMIENTO</div>
      <div style="font-size:36px;font-weight:900;margin-bottom:20px;">CLIENTE<br>DEL MES</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        ${[['- 8 kg', 'GRASA'], ['+ 4 kg', 'MUSCULO'], ['24/24', 'ENTRENOS'], ['100%', 'ADHERENCIA']].map(([v, l]) => `
        <div style="padding:12px;background:${CARD_BG};border:${CARD_BORDER};border-radius:8px;text-align:center;">
          <div style="font-size:22px;font-weight:900;color:${GREEN};">${v}</div>
          <div style="font-size:11px;color:#888;letter-spacing:1px;">${l}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>
</div>
`) });

// 30. CTA FINAL
posts.push({ name: '30-cta-final', html: wrapPost(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-bottom:30px;">${logo.replace('height:80px', 'height:120px')}</div>
  <div style="font-size:16px;letter-spacing:4px;color:${GREEN};margin-bottom:16px;">EMPIEZA HOY</div>
  <div style="font-size:48px;font-weight:900;line-height:1.1;margin-bottom:24px;">TU<br>TRANSFORMACION<br>EMPIEZA<br><span style="color:${GREEN};">HOY</span></div>
  <div style="width:60px;height:3px;background:${GREEN};margin-bottom:24px;"></div>
  <div style="padding:16px 48px;background:${GREEN};border-radius:50px;font-size:20px;font-weight:800;color:#000;margin-bottom:16px;">LINK EN BIO</div>
  <div style="font-size:16px;color:#888;">7 dias de prueba gratis</div>
</div>
`) });

// ── 15 STORY TEMPLATES ───────────────────────────────────────────────

const stories = [];

// Story 1: NUEVA RUTINA DISPONIBLE
stories.push({ name: 'story-01', html: wrapStory(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-bottom:30px;">${logo}</div>
  <div style="font-size:80px;margin-bottom:20px;">&#128170;</div>
  <div style="font-size:18px;letter-spacing:6px;color:${GREEN};margin-bottom:16px;">NUEVA</div>
  <div style="font-size:52px;font-weight:900;line-height:1.1;margin-bottom:24px;">RUTINA<br>DISPONIBLE</div>
  <div style="width:60px;height:3px;background:${GREEN};margin-bottom:24px;"></div>
  <div style="font-size:20px;color:#ccc;margin-bottom:40px;">Piernas & Gluteos<br>actualizada en la app</div>
  <div style="padding:16px 48px;background:${GREEN};border-radius:50px;font-size:18px;font-weight:800;color:#000;">VER RUTINA</div>
</div>
`) });

// Story 2: SWIPE UP - 7 dias gratis
stories.push({ name: 'story-02', html: wrapStory(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-bottom:30px;">${logo}</div>
  <div style="font-size:18px;letter-spacing:6px;color:${GREEN};margin-bottom:12px;">OFERTA ESPECIAL</div>
  <div style="font-size:60px;font-weight:900;line-height:1.1;margin-bottom:8px;">7 DIAS</div>
  <div style="font-size:60px;font-weight:900;color:${GREEN};margin-bottom:24px;">GRATIS</div>
  <div style="font-size:20px;color:#ccc;line-height:1.6;margin-bottom:40px;">Entrenamiento personalizado<br>Plan de nutricion<br>Chat directo con Pablo</div>
  <div style="font-size:60px;">&#9757;</div>
  <div style="font-size:22px;font-weight:800;color:${GREEN};margin-top:12px;">SWIPE UP</div>
</div>
`) });

// Story 3: RESULTADO REAL
stories.push({ name: 'story-03', html: wrapStory(`
${imgOverlay('../images/transf-mujer-lateral.jpg', 0.5)}
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-top:40px;margin-bottom:30px;">${logo}</div>
  <div style="font-size:18px;letter-spacing:6px;color:${GREEN};margin-bottom:12px;">RESULTADO REAL</div>
  <div style="font-size:48px;font-weight:900;line-height:1.1;margin-bottom:16px;">TRANSFORMACION<br>COMPROBADA</div>
  <div style="flex:1;"></div>
  <div style="padding:20px;background:rgba(0,0,0,0.6);border:1px solid ${GREEN};border-radius:12px;margin-bottom:40px;">
    <div style="display:flex;gap:30px;">
      ${[['- 10 kg', 'GRASA'], ['+ 3 kg', 'MUSCULO'], ['16 sem', 'TIEMPO']].map(([v, l]) => `
      <div style="text-align:center;">
        <div style="font-size:24px;font-weight:900;color:${GREEN};">${v}</div>
        <div style="font-size:11px;color:#aaa;letter-spacing:1px;">${l}</div>
      </div>`).join('')}
    </div>
  </div>
</div>
`) });

// Story 4: TIP DEL DIA
stories.push({ name: 'story-04', html: wrapStory(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-bottom:30px;">${logo}</div>
  <div style="font-size:80px;margin-bottom:16px;">&#128161;</div>
  <div style="font-size:18px;letter-spacing:6px;color:${GREEN};margin-bottom:16px;">TIP DEL DIA</div>
  <div style="font-size:40px;font-weight:900;line-height:1.2;margin-bottom:30px;">ACTIVA EL<br>MUSCULO ANTES<br>DE CARGARLO</div>
  <div style="width:60px;height:3px;background:${GREEN};margin-bottom:30px;"></div>
  ${card(`
    <div style="font-size:18px;line-height:1.6;text-align:left;">
      <div style="color:${GREEN};font-weight:700;margin-bottom:8px;">Antes de tu primera serie pesada:</div>
      <div>1. Hace 2 series de activacion con poco peso</div>
      <div>2. Senti la contraccion del musculo objetivo</div>
      <div>3. Recien ahi subi la carga</div>
    </div>
  `, 'max-width:500px;')}
</div>
`) });

// Story 5: QUE ENTRENASTE HOY?
stories.push({ name: 'story-05', html: wrapStory(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-bottom:30px;">${logo}</div>
  <div style="font-size:18px;letter-spacing:6px;color:${GREEN};margin-bottom:16px;">ENCUESTA</div>
  <div style="font-size:48px;font-weight:900;margin-bottom:40px;">QUE ENTRENASTE<br>HOY?</div>
  <div style="width:100%;max-width:500px;display:flex;flex-direction:column;gap:16px;">
    ${['TREN SUPERIOR', 'TREN INFERIOR', 'FULL BODY', 'CARDIO', 'DESCANSO'].map(o => `
    <div style="padding:20px;background:${CARD_BG};border:${CARD_BORDER};border-radius:12px;font-size:20px;font-weight:700;">${o}</div>`).join('')}
  </div>
</div>
`) });

// Story 6: Pablo training + quote
stories.push({ name: 'story-06', html: wrapStory(`
${imgOverlay('../images/pablo-gym2.jpg', 0.6)}
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-top:40px;margin-bottom:auto;">${logo}</div>
  <div style="margin-bottom:auto;">
    <div style="font-size:60px;color:${GREEN};margin-bottom:16px;">&ldquo;</div>
    <div style="font-size:38px;font-weight:900;line-height:1.2;">LA DISCIPLINA<br>VENCE AL<br>TALENTO</div>
    <div style="width:60px;height:3px;background:${GREEN};margin:24px auto;"></div>
    <div style="font-size:16px;color:#aaa;letter-spacing:2px;">@PABLOSCARLATTO</div>
  </div>
  <div style="height:80px;"></div>
</div>
`) });

// Story 7: SABIAS QUE
stories.push({ name: 'story-07', html: wrapStory(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-bottom:30px;">${logo}</div>
  <div style="font-size:80px;margin-bottom:16px;">&#129300;</div>
  <div style="font-size:18px;letter-spacing:6px;color:${GREEN};margin-bottom:16px;">DATO NUTRICIONAL</div>
  <div style="font-size:44px;font-weight:900;margin-bottom:24px;">SABIAS QUE...</div>
  ${card(`
    <div style="font-size:20px;line-height:1.6;">
      Tu cuerpo necesita entre <span style="color:${GREEN};font-weight:800;">1.6 y 2.2g de proteina por kg</span> de peso corporal para ganar musculo de forma optima.<br><br>
      Un hombre de 80kg necesita entre <span style="color:${GREEN};font-weight:800;">128 y 176g</span> de proteina al dia.
    </div>
  `, 'max-width:500px;')}
</div>
`) });

// Story 8: ANTES/DESPUES - Javi
stories.push({ name: 'story-08', html: wrapStory(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-top:20px;margin-bottom:20px;">${logo}</div>
  <div style="font-size:18px;letter-spacing:6px;color:${GREEN};margin-bottom:8px;">CASO REAL</div>
  <div style="font-size:38px;font-weight:900;margin-bottom:16px;">ANTES / DESPUES</div>
  <div style="display:flex;gap:12px;margin:0 20px;flex:1;max-height:800px;">
    <div style="flex:1;position:relative;border-radius:16px;overflow:hidden;border:2px solid #333;">
      <img src="../javi-front.jpg" style="width:100%;height:100%;object-fit:cover;">
      <div style="position:absolute;bottom:0;left:0;right:0;padding:12px;background:rgba(0,0,0,0.7);text-align:center;">
        <div style="font-size:14px;color:#aaa;">ANTES</div>
        <div style="font-size:28px;font-weight:900;">95 kg</div>
      </div>
    </div>
    <div style="flex:1;position:relative;border-radius:16px;overflow:hidden;border:2px solid ${GREEN};">
      <img src="../javi-side.jpg" style="width:100%;height:100%;object-fit:cover;">
      <div style="position:absolute;bottom:0;left:0;right:0;padding:12px;background:rgba(0,0,0,0.7);text-align:center;">
        <div style="font-size:14px;color:${GREEN};">DESPUES</div>
        <div style="font-size:28px;font-weight:900;color:${GREEN};">78 kg</div>
      </div>
    </div>
  </div>
  <div style="margin-top:16px;font-size:16px;color:#aaa;">5 meses de plan personalizado</div>
</div>
`) });

// Story 9: PREGUNTAME
stories.push({ name: 'story-09', html: wrapStory(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-bottom:30px;">${logo}</div>
  <div style="font-size:100px;margin-bottom:20px;">&#128172;</div>
  <div style="font-size:18px;letter-spacing:6px;color:${GREEN};margin-bottom:16px;">Q&A</div>
  <div style="font-size:50px;font-weight:900;line-height:1.1;margin-bottom:30px;">PREGUNTAME</div>
  <div style="width:100%;max-width:500px;padding:24px;background:${CARD_BG};border:${CARD_BORDER};border-radius:16px;">
    <div style="font-size:18px;color:#888;">Escribi tu pregunta aca...</div>
  </div>
  <div style="margin-top:24px;font-size:16px;color:#aaa;">Nutricion, entrenamiento, suplementos, lo que sea</div>
</div>
`) });

// Story 10: MI COMIDA DE HOY
stories.push({ name: 'story-10', html: wrapStory(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-bottom:30px;">${logo}</div>
  <div style="font-size:80px;margin-bottom:16px;">&#127835;</div>
  <div style="font-size:18px;letter-spacing:6px;color:${GREEN};margin-bottom:16px;">NUTRICION</div>
  <div style="font-size:44px;font-weight:900;margin-bottom:30px;">MI COMIDA<br>DE HOY</div>
  ${card(`
    <div style="text-align:left;font-size:18px;line-height:2;">
      <div>&#127834; Arroz integral 150g</div>
      <div>&#129385; Pollo grillado 200g</div>
      <div>&#129382; Brocoli y zanahoria</div>
      <div>&#129361; Palta medio</div>
    </div>
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid #333;display:flex;justify-content:space-around;">
      <div style="text-align:center;"><div style="font-weight:800;color:${GREEN};">580</div><div style="font-size:11px;color:#888;">KCAL</div></div>
      <div style="text-align:center;"><div style="font-weight:800;color:${GREEN};">45g</div><div style="font-size:11px;color:#888;">PROT</div></div>
      <div style="text-align:center;"><div style="font-weight:800;color:${GREEN};">55g</div><div style="font-size:11px;color:#888;">CARBS</div></div>
      <div style="text-align:center;"><div style="font-weight:800;color:${GREEN};">18g</div><div style="font-size:11px;color:#888;">GRASAS</div></div>
    </div>
  `, 'max-width:500px;')}
</div>
`) });

// Story 11: RUTINA EXPRESS
stories.push({ name: 'story-11', html: wrapStory(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-bottom:30px;">${logo}</div>
  <div style="font-size:18px;letter-spacing:6px;color:${GREEN};margin-bottom:12px;">20 MINUTOS</div>
  <div style="font-size:48px;font-weight:900;margin-bottom:32px;">RUTINA<br>EXPRESS</div>
  <div style="width:100%;max-width:500px;">
    ${[
      ['Sentadilla con salto', '4 x 15 reps', '&#9201; 45s descanso'],
      ['Flexiones', '4 x 12 reps', '&#9201; 45s descanso'],
      ['Burpees', '4 x 10 reps', '&#9201; 60s descanso']
    ].map(([ex, sets, rest], i) => card(`
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="min-width:50px;height:50px;border-radius:50%;background:${GREEN};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:#000;">${i + 1}</div>
        <div style="text-align:left;">
          <div style="font-size:20px;font-weight:700;">${ex}</div>
          <div style="font-size:14px;color:#aaa;">${sets} | ${rest}</div>
        </div>
      </div>
    `, 'margin-bottom:16px;')).join('')}
  </div>
  <div style="margin-top:20px;font-size:14px;color:#888;">Sin equipamiento. Donde quieras.</div>
</div>
`) });

// Story 12: Male transformation
stories.push({ name: 'story-12', html: wrapStory(`
${imgOverlay('../images/transf-hombre-definicion.jpg', 0.45)}
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-top:40px;margin-bottom:20px;">${logo}</div>
  <div style="font-size:18px;letter-spacing:6px;color:${GREEN};margin-bottom:8px;">DEFINICION</div>
  <div style="font-size:44px;font-weight:900;margin-bottom:auto;">TRANSFORMACION<br>MASCULINA</div>
  <div style="padding:24px;background:rgba(0,0,0,0.6);border:1px solid ${GREEN};border-radius:16px;margin-bottom:40px;width:100%;max-width:500px;">
    <div style="display:flex;justify-content:space-around;">
      ${[['- 15 kg', 'GRASA'], ['+ 5 kg', 'MUSCULO'], ['20 sem', 'DURACION'], ['6', 'DIAS/SEM']].map(([v, l]) => `
      <div style="text-align:center;">
        <div style="font-size:22px;font-weight:900;color:${GREEN};">${v}</div>
        <div style="font-size:10px;color:#aaa;letter-spacing:1px;margin-top:4px;">${l}</div>
      </div>`).join('')}
    </div>
  </div>
</div>
`) });

// Story 13: ULTIMO DIA
stories.push({ name: 'story-13', html: wrapStory(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-bottom:30px;">${logo}</div>
  <div style="font-size:80px;margin-bottom:16px;">&#9200;</div>
  <div style="font-size:18px;letter-spacing:6px;color:#ef4444;margin-bottom:16px;">URGENTE</div>
  <div style="font-size:52px;font-weight:900;line-height:1.1;margin-bottom:8px;">ULTIMO<br>DIA</div>
  <div style="font-size:24px;color:${GREEN};font-weight:700;margin-bottom:24px;">7 dias gratis</div>
  <div style="width:60px;height:3px;background:#ef4444;margin-bottom:24px;"></div>
  <div style="font-size:20px;color:#ccc;line-height:1.6;margin-bottom:40px;">La oferta termina hoy a<br>medianoche. No la dejes pasar.</div>
  <div style="padding:18px 48px;background:${GREEN};border-radius:50px;font-size:20px;font-weight:800;color:#000;">ACTIVAR AHORA</div>
</div>
`) });

// Story 14: Female transformation dual
stories.push({ name: 'story-14', html: wrapStory(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-top:20px;margin-bottom:16px;">${logo}</div>
  <div style="font-size:18px;letter-spacing:6px;color:${GREEN};margin-bottom:8px;">RESULTADO REAL</div>
  <div style="font-size:38px;font-weight:900;margin-bottom:20px;">TRANSFORMACION<br>FEMENINA</div>
  <div style="display:flex;gap:12px;margin:0 20px;flex:1;max-height:900px;">
    <div style="flex:1;position:relative;border-radius:16px;overflow:hidden;border:2px solid #333;">
      <img src="../images/transf-mujer3-frente.jpg" style="width:100%;height:100%;object-fit:cover;">
      <div style="position:absolute;bottom:0;left:0;right:0;padding:12px;background:rgba(0,0,0,0.7);text-align:center;font-weight:700;">FRENTE</div>
    </div>
    <div style="flex:1;position:relative;border-radius:16px;overflow:hidden;border:2px solid ${GREEN};">
      <img src="../images/transf-mujer3-espalda.jpg" style="width:100%;height:100%;object-fit:cover;">
      <div style="position:absolute;bottom:0;left:0;right:0;padding:12px;background:rgba(0,0,0,0.7);text-align:center;font-weight:700;color:${GREEN};">ESPALDA</div>
    </div>
  </div>
  <div style="margin-top:16px;font-size:16px;color:#aaa;">12 semanas de entrenamiento + nutricion</div>
</div>
`) });

// Story 15: SEGUIME CTA
stories.push({ name: 'story-15', html: wrapStory(`
<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;text-align:center;">
  <div style="margin-bottom:40px;">${logo.replace('height:80px', 'height:120px')}</div>
  <div style="font-size:18px;letter-spacing:6px;color:${GREEN};margin-bottom:16px;">NO TE PIERDAS NADA</div>
  <div style="font-size:56px;font-weight:900;line-height:1.1;margin-bottom:30px;">SEGUIME</div>
  <div style="font-size:80px;margin-bottom:20px;">&#11015;</div>
  <div style="font-size:20px;color:#ccc;line-height:1.6;margin-bottom:30px;">Tips de entrenamiento<br>Recetas y nutricion<br>Transformaciones reales<br>Rutinas gratis</div>
  <div style="padding:18px 48px;background:${GREEN};border-radius:50px;font-size:20px;font-weight:800;color:#000;">@PABLOSCARLATTO</div>
</div>
`) });

// ── WRITE ALL FILES ──────────────────────────────────────────────────

let count = 0;
for (const p of posts) {
  const path = join(OUT, `${p.name}.html`);
  writeFileSync(path, p.html);
  count++;
  console.log(`  POST: ${p.name}.html`);
}

for (const s of stories) {
  const path = join(OUT, `${s.name}.html`);
  writeFileSync(path, s.html);
  count++;
  console.log(`  STORY: ${s.name}.html`);
}

console.log(`\nDone! Generated ${count} templates in public/social-templates/`);
console.log(`  - ${posts.length} Instagram posts`);
console.log(`  - ${stories.length} Instagram stories`);
