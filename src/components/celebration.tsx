"use client";

import confetti from "canvas-confetti";

function playSound(type: "workout" | "pr" | "streak" | "levelup") {
  try {
    const Ctx = window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext as typeof AudioContext;
    const ctx = new Ctx();

    if (type === "levelup") {
      // Epic ascending power-up chord (C-E-G-C)
      const notes = [261, 329, 392, 523, 659];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = i < 3 ? "triangle" : "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.6);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.6);
      });
    } else if (type === "pr") {
      // Triumphant fanfare (two rising chords)
      [[440, 554, 659], [523, 659, 784]].forEach((chord, ci) => {
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = "triangle";
          gain.gain.setValueAtTime(0, ctx.currentTime + ci * 0.25);
          gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + ci * 0.25 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ci * 0.25 + 0.5);
          osc.start(ctx.currentTime + ci * 0.25);
          osc.stop(ctx.currentTime + ci * 0.25 + 0.5);
        });
      });
    } else {
      // Workout complete - bright success jingle (3-note ascending)
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "triangle";
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.4);
      });
    }

    if (navigator.vibrate) navigator.vibrate(type === "levelup" ? [100, 50, 100, 50, 200] : [150, 50, 150]);
  } catch { /* audio is best-effort */ }
}

const COLORS = {
  emerald: ["#10b981", "#059669", "#34d399"],
  gold: ["#d4af37", "#f59e0b", "#fbbf24"],
  all: ["#10b981", "#059669", "#34d399", "#d4af37", "#f59e0b"],
};

// Ensure confetti canvas is on top of everything
function getConfettiCanvas(): HTMLCanvasElement {
  let canvas = document.getElementById("celebration-canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "celebration-canvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "99999";
    document.body.appendChild(canvas);
  }
  return canvas;
}

export function triggerCelebration(type: "workout" | "pr" | "streak" | "levelup" = "workout") {
  playSound(type);

  const canvas = getConfettiCanvas();
  const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });

  switch (type) {
    case "workout":
      // Big burst from bottom
      myConfetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.95, x: 0.5 },
        colors: COLORS.emerald,
        ticks: 200,
        gravity: 0.8,
        scalar: 1.2,
      });
      break;

    case "pr":
      // Two side bursts
      myConfetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: COLORS.gold, ticks: 200, scalar: 1.2 });
      myConfetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: COLORS.gold, ticks: 200, scalar: 1.2 });
      break;

    case "streak":
      // Upward burst with circles
      myConfetti({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.8, x: 0.5 },
        colors: COLORS.gold,
        shapes: ["circle"],
        ticks: 200,
        gravity: 0.6,
        scalar: 1.1,
      });
      break;

    case "levelup": {
      // Epic continuous bursts from both sides
      const end = Date.now() + 2000;
      const frame = () => {
        myConfetti({
          particleCount: 4,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.65 },
          colors: COLORS.all,
          ticks: 300,
          scalar: 1.3,
        });
        myConfetti({
          particleCount: 4,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.65 },
          colors: COLORS.all,
          ticks: 300,
          scalar: 1.3,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      break;
    }
  }
}
