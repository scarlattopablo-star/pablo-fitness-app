"use client";

import confetti from "canvas-confetti";

function playApplause() {
  try {
    const audio = new Audio("/sounds/applause.mp3");
    audio.volume = 0.6;
    audio.play().catch(() => {});
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
  // Play applause sound
  playApplause();

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
