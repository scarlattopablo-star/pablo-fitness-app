"use client";

import confetti from "canvas-confetti";

function generateCrowdApplause(ctx: AudioContext, startTime: number, duration: number) {
  // Simulate a LARGE crowd applauding: many individual clappers at different rates
  const sampleRate = ctx.sampleRate;
  const samples = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, samples, sampleRate);
  const numClappers = 40; // 40 individual people clapping

  // Pre-generate each clapper's random rate and phase
  const clappers = Array.from({ length: numClappers }, () => ({
    rate: 3 + Math.random() * 6,       // each person claps at different speed (3-9 Hz)
    phase: Math.random() * Math.PI * 2, // random starting phase
    volume: 0.3 + Math.random() * 0.7,  // some louder than others
    pan: Math.random() * 2 - 1,         // stereo position (-1 to 1)
  }));

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      // Overall envelope: quick fade in, sustain, gentle fade out
      const fadeIn = Math.min(1, t * 3);
      const fadeOut = Math.max(0, 1 - Math.max(0, t - duration + 0.8) * 1.25);
      const envelope = fadeIn * fadeOut;

      let sample = 0;
      for (const clapper of clappers) {
        // Each clapper produces short noise bursts at their own rate
        const clapPhase = ((t * clapper.rate + clapper.phase) % 1);
        // Sharp attack, quick decay = sounds like a single clap
        const clapEnv = clapPhase < 0.08 ? Math.exp(-clapPhase * 50) : 0;
        // Noise filtered per clapper
        const noise = Math.random() * 2 - 1;
        // Apply stereo panning (simple left/right balance)
        const panGain = channel === 0
          ? Math.min(1, 1 - clapper.pan * 0.5)
          : Math.min(1, 1 + clapper.pan * 0.5);
        sample += noise * clapEnv * clapper.volume * panGain;
      }

      data[i] = sample * envelope * 0.08; // normalize
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Bandpass: real clapping is mid-high frequency (1kHz - 6kHz)
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 3000;
  filter.Q.value = 0.3;

  // Second filter for more realism
  const highShelf = ctx.createBiquadFilter();
  highShelf.type = "highshelf";
  highShelf.frequency.value = 4000;
  highShelf.gain.value = 3;

  const gain = ctx.createGain();
  gain.gain.value = 1.2;

  source.connect(filter);
  filter.connect(highShelf);
  highShelf.connect(gain);
  gain.connect(ctx.destination);
  source.start(startTime);
}

function playCelebrationSound() {
  try {
    const Ctx = window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext as typeof AudioContext;
    const ctx = new Ctx();

    // 1. Three-note ascending jingle (do-mi-sol)
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

    // 2. Crowd applause (40 people clapping, synthesized - no external file dependency)
    generateCrowdApplause(ctx, ctx.currentTime + 0.4, 2.5);

    if (navigator.vibrate) navigator.vibrate([150, 50, 150]);
  } catch { /* audio is best-effort */ }
}

const COLORS = {
  emerald: ["#10b981", "#059669", "#34d399"],
  gold: ["#d4af37", "#f59e0b", "#fbbf24"],
  all: ["#10b981", "#059669", "#34d399", "#d4af37", "#f59e0b"],
};

// Create a dedicated full-screen canvas appended directly to document.body
// This avoids stacking context issues from parent containers
function getOrCreateCanvas(): HTMLCanvasElement {
  const existingId = "confetti-celebration";
  let canvas = document.getElementById(existingId) as HTMLCanvasElement | null;
  if (canvas) return canvas;

  canvas = document.createElement("canvas");
  canvas.id = existingId;
  Object.assign(canvas.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: "2147483647", // max z-index
  });
  document.body.appendChild(canvas);
  return canvas;
}

export function triggerCelebration(type: "workout" | "pr" | "streak" | "levelup" = "workout") {
  // Play 3-note jingle + applause
  playCelebrationSound();

  // Get/create canvas and confetti instance
  const canvas = getOrCreateCanvas();
  // Force canvas dimensions to match viewport
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const fire = confetti.create(canvas, { resize: true });

  switch (type) {
    case "workout":
      // Rain of confetti from the top
      fire({
        particleCount: 150,
        spread: 180,
        origin: { y: 0, x: 0.5 },
        startVelocity: 30,
        gravity: 0.5,
        ticks: 300,
        colors: COLORS.emerald,
        scalar: 1.2,
        drift: 0.5,
      });
      // Plus a burst from the bottom
      setTimeout(() => {
        fire({
          particleCount: 80,
          spread: 80,
          origin: { y: 1, x: 0.5 },
          startVelocity: 45,
          gravity: 1,
          ticks: 200,
          colors: COLORS.emerald,
          scalar: 1.1,
        });
      }, 200);
      break;

    case "pr":
      // Two big side bursts
      fire({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.65 }, colors: COLORS.gold, ticks: 250, scalar: 1.3, startVelocity: 40 });
      fire({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.65 }, colors: COLORS.gold, ticks: 250, scalar: 1.3, startVelocity: 40 });
      break;

    case "streak":
      // Golden rain
      fire({
        particleCount: 120,
        spread: 160,
        origin: { y: 0, x: 0.5 },
        startVelocity: 25,
        gravity: 0.4,
        ticks: 300,
        colors: COLORS.gold,
        shapes: ["circle"],
        scalar: 1.0,
        drift: 1,
      });
      break;

    case "levelup": {
      // Epic continuous bursts from both sides + rain from top
      fire({
        particleCount: 200,
        spread: 180,
        origin: { y: 0, x: 0.5 },
        startVelocity: 35,
        gravity: 0.4,
        ticks: 400,
        colors: COLORS.all,
        scalar: 1.3,
        drift: 0.8,
      });
      const end = Date.now() + 2500;
      const frame = () => {
        fire({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: COLORS.all,
          ticks: 300,
          scalar: 1.4,
          startVelocity: 35,
        });
        fire({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: COLORS.all,
          ticks: 300,
          scalar: 1.4,
          startVelocity: 35,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      break;
    }
  }
}
