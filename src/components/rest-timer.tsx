"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, SkipForward, Pause } from "lucide-react";

interface RestTimerProps {
  seconds: number; // total rest time in seconds
  onComplete?: () => void;
  autoStart?: boolean;
}

// ── Audio engine: works on iOS Safari, Android Chrome, desktop ──
// iOS requires AudioContext to be created/resumed inside a user gesture.
// We keep a singleton and "warm it up" on mount (the user just tapped a checkbox).
let audioCtx: AudioContext | null = null;
let audioWarmedUp = false;

function getAudioCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** Must be called from a user-gesture handler (click/tap) to unlock iOS audio */
function warmUpAudio() {
  if (audioWarmedUp) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  // Resume suspended context (iOS always starts suspended)
  if (ctx.state === "suspended") ctx.resume();
  // Play a silent buffer to fully unlock the audio pipeline on iOS
  try {
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch { /* ok */ }
  audioWarmedUp = true;
}

function playBeep(frequency = 880) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  // Always try to resume (iOS can re-suspend when backgrounded)
  if (ctx.state === "suspended") ctx.resume();
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = "sine";
    gain.gain.value = 0.7; // louder for mobile
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.stop(ctx.currentTime + 0.35);
  } catch { /* ok */ }
}

function playFinishBeep() {
  const ctx = getAudioCtx();
  if (ctx?.state === "suspended") ctx.resume();
  playBeep(1047); // C6
  setTimeout(() => playBeep(1319), 200); // E6
  setTimeout(() => playBeep(1568), 400); // G6

  // Fallback: also try HTML5 Audio for devices where Web Audio is muted
  try {
    const audio = new Audio("/sounds/notification.wav");
    audio.volume = 1.0;
    audio.play().catch(() => {});
  } catch { /* ok */ }
}

function tryVibrate(pattern: number[] = [200, 100, 200]) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch { /* ok */ }
}

// ── Background-safe timer logic ──
// setInterval pauses when iOS/Android backgrounds the tab or locks the screen.
// We store the real target timestamp so when the tab comes back,
// we catch up instantly instead of running late.

export default function RestTimer({ seconds, onComplete, autoStart = true }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(autoStart);
  const [finished, setFinished] = useState(false);

  const completeCalled = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Real wall-clock target: when the timer should hit 0
  const targetEndRef = useRef<number>(0);
  // How many seconds were remaining when we last paused
  const pausedRemainingRef = useRef<number>(seconds);

  // Warm up audio on mount — this runs inside the click handler callstack
  // (user just tapped the set-complete checkbox which renders this component)
  useEffect(() => {
    warmUpAudio();
  }, []);

  // Set the target timestamp when starting
  useEffect(() => {
    if (running && !finished) {
      targetEndRef.current = Date.now() + remaining * 1000;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finishTimer = useCallback(() => {
    stop();
    setRunning(false);
    setFinished(true);
    setRemaining(0);
    playFinishBeep();
    tryVibrate([200, 100, 200, 100, 300]);
    if (!completeCalled.current) {
      completeCalled.current = true;
      onComplete?.();
    }
  }, [stop, onComplete]);

  useEffect(() => {
    if (!running || finished) return;

    // Tick at 250ms instead of 1000ms so we catch up quickly after backgrounding
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const msLeft = targetEndRef.current - now;

      if (msLeft <= 0) {
        finishTimer();
        return;
      }

      const secsLeft = Math.ceil(msLeft / 1000);
      setRemaining(prev => {
        // Only trigger beeps when crossing a second boundary
        if (secsLeft !== prev && secsLeft <= 3 && secsLeft >= 1) {
          playBeep();
          tryVibrate([150]);
        }
        return secsLeft;
      });
    }, 250);

    return stop;
  }, [running, finished, stop, finishTimer]);

  // ── Handle visibility change (tab back to foreground) ──
  // When the user returns to the app, immediately sync the timer
  useEffect(() => {
    if (!running || finished) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // Re-warm audio (iOS may have killed the context)
        warmUpAudio();
        const ctx = getAudioCtx();
        if (ctx?.state === "suspended") ctx.resume();

        const msLeft = targetEndRef.current - Date.now();
        if (msLeft <= 0) {
          finishTimer();
        } else {
          setRemaining(Math.ceil(msLeft / 1000));
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [running, finished, finishTimer]);

  // Pause / resume
  const handlePause = () => {
    if (running) {
      // Pausing: save current remaining
      pausedRemainingRef.current = remaining;
      stop();
      setRunning(false);
    } else {
      // Resuming: recalculate target from paused remaining
      targetEndRef.current = Date.now() + pausedRemainingRef.current * 1000;
      setRunning(true);
    }
  };

  const handleSkip = () => {
    stop();
    setFinished(true);
    setRemaining(0);
    if (!completeCalled.current) {
      completeCalled.current = true;
      onComplete?.();
    }
  };

  const progress = ((seconds - remaining) / seconds) * 100;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  if (finished) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-fade-in-up">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-xs font-bold text-emerald-400">Descanso completo!</span>
      </div>
    );
  }

  return (
    <div className="py-2 px-3 rounded-xl bg-accent/10 border border-accent/20 animate-fade-in-up">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-muted">Descanso</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePause}
            className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors"
          >
            {running ? <Pause className="h-3 w-3 text-accent" /> : <Play className="h-3 w-3 text-accent" />}
          </button>
          <button
            onClick={handleSkip}
            className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors"
            title="Saltar descanso"
          >
            <SkipForward className="h-3 w-3 text-accent" />
          </button>
        </div>
      </div>
      {/* Time display */}
      <div className="text-center mb-1.5">
        <span className={`text-2xl font-black tabular-nums ${remaining <= 3 ? "text-red-400 animate-pulse" : "text-accent"}`}>
          {mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-card-bg overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
