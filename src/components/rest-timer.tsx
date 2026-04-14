"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, SkipForward, Pause } from "lucide-react";

interface RestTimerProps {
  seconds: number; // total rest time in seconds
  onComplete?: () => void;
  autoStart?: boolean;
}

// Reusable AudioContext (created on first user interaction)
let audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

// Generate a short beep using Web Audio API
function playBeep(frequency = 880) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = "sine";
    gain.gain.value = 0.5;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio failed
  }
}

// Double beep for completion
function playFinishBeep() {
  playBeep(1047); // C6
  setTimeout(() => playBeep(1319), 200); // E6
  setTimeout(() => playBeep(1568), 400); // G6
}

function tryVibrate() {
  try {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  } catch {
    // Vibration not supported
  }
}

export default function RestTimer({ seconds, onComplete, autoStart = true }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(autoStart);
  const [finished, setFinished] = useState(false);

  // Initialize AudioContext on mount (user already interacted by clicking checkbox)
  useEffect(() => { getAudioCtx(); }, []);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const completeCalled = useRef(false);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!running || finished) return;

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          stop();
          setRunning(false);
          setFinished(true);
          playFinishBeep();
          tryVibrate();
          if (!completeCalled.current) {
            completeCalled.current = true;
            onComplete?.();
          }
          return 0;
        }
        // Beep at 3, 2, 1
        if (prev <= 4) playBeep();
        return prev - 1;
      });
    }, 1000);

    return stop;
  }, [running, finished, stop, onComplete]);

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
            onClick={() => setRunning(!running)}
            className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors"
          >
            {running ? <Pause className="h-3 w-3 text-accent" /> : <Play className="h-3 w-3 text-accent" />}
          </button>
          <button
            onClick={() => {
              stop();
              setFinished(true);
              if (!completeCalled.current) {
                completeCalled.current = true;
                onComplete?.();
              }
            }}
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
          className="h-full rounded-full bg-accent transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
