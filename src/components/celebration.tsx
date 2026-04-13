"use client";

import confetti from "canvas-confetti";

function playSound(type: "workout" | "pr" | "streak" | "levelup") {
  try {
    const Ctx = window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext as typeof AudioContext;
    const ctx = new Ctx();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.value = 0.25;

    if (type === "levelup") {
      // Ascending arpeggio
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.connect(gain);
        osc.frequency.value = freq;
        osc.type = "sine";
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.15);
      });
    } else if (type === "pr") {
      // Triumphant double tone
      [660, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.connect(gain);
        osc.frequency.value = freq;
        osc.type = "triangle";
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.2);
      });
    } else {
      // Simple success chime
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.frequency.value = 880;
      osc.type = "sine";
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    }

    if (navigator.vibrate) navigator.vibrate(type === "levelup" ? [100, 50, 100, 50, 200] : [150]);
  } catch { /* audio is best-effort */ }
}

const COLORS = {
  emerald: ["#10b981", "#059669", "#34d399"],
  gold: ["#d4af37", "#f59e0b", "#fbbf24"],
  all: ["#10b981", "#059669", "#34d399", "#d4af37", "#f59e0b"],
};

export function triggerCelebration(type: "workout" | "pr" | "streak" | "levelup" = "workout") {
  playSound(type);

  switch (type) {
    case "workout":
      // Quick burst from bottom center
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.9 },
        colors: COLORS.emerald,
      });
      break;

    case "pr":
      // Two side bursts
      confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0 }, colors: COLORS.gold });
      confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1 }, colors: COLORS.gold });
      break;

    case "streak":
      // Fire emoji style - upward burst
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.7 },
        colors: COLORS.gold,
        shapes: ["circle"],
      });
      break;

    case "levelup":
      // Big celebration - multiple bursts
      const end = Date.now() + 1500;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: COLORS.all,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: COLORS.all,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      break;
  }
}
