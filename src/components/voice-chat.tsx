"use client";

import { useState, useRef, useEffect } from "react";
import { PhoneOff, Mic, MicOff, Loader2 } from "lucide-react";

// Web Speech API types
type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((e: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

interface VoiceChatProps {
  onClose?: () => void;
}

type Phase = "idle" | "recording" | "processing" | "speaking";

export default function VoiceChat({ onClose }: VoiceChatProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [supported, setSupported] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const endedRef = useRef(false);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>("idle");

  // Keep phaseRef in sync so callbacks have fresh value without stale closure
  const setPhaseSync = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    // Pre-load voices
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();

    // Start call timer
    timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);

    return () => {
      endedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
      window.speechSynthesis.cancel();
    };
  }, []);

  /** Unlock audio synthesis — must be called from a direct user tap */
  const unlockAudio = () => {
    if (audioUnlocked) return;
    // Speak a silent utterance to unlock iOS audio context
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
    setAudioUnlocked(true);
  };

  const getBestSpanishVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(v => v.lang === "es-UY") ||
      voices.find(v => v.lang === "es-AR") ||
      voices.find(v => v.lang.startsWith("es") && /male|jorge|diego|pablo|miguel/i.test(v.name)) ||
      voices.find(v => v.lang.startsWith("es")) ||
      null
    );
  };

  const speak = (text: string) => {
    if (endedRef.current) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-UY";
    utterance.rate = 1.05;
    utterance.pitch = 0.9;
    const voice = getBestSpanishVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => { if (!endedRef.current) setPhaseSync("speaking"); };
    utterance.onend = () => { if (!endedRef.current) setPhaseSync("idle"); };
    utterance.onerror = () => { if (!endedRef.current) setPhaseSync("idle"); };

    // Chrome keepalive — cuts out at ~15s without this
    const keepAlive = setInterval(() => {
      if (endedRef.current || !window.speechSynthesis.speaking) { clearInterval(keepAlive); return; }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);

    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (text: string) => {
    if (endedRef.current || !text.trim()) { setPhaseSync("idle"); return; }
    setPhaseSync("processing");
    try {
      const res = await fetch("/api/voice-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (endedRef.current) return;
      const data = await res.json() as { response?: string };
      const reply = data.response || "Perdón, no te entendí.";
      speak(reply);
    } catch {
      if (!endedRef.current) { speak("Problema de conexión."); }
    }
  };

  const startRecording = () => {
    if (endedRef.current || phaseRef.current !== "idle") return;

    // Unlock audio on this user gesture
    unlockAudio();

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "es-UY";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => { if (!endedRef.current) setPhaseSync("recording"); };

    recognition.onresult = (event) => {
      if (endedRef.current) return;
      const text = event.results[0]?.[0]?.transcript?.trim();
      if (text) sendMessage(text);
      else setPhaseSync("idle");
    };

    recognition.onerror = (event) => {
      if (endedRef.current) return;
      if (event.error === "not-allowed") {
        endCall();
      } else {
        // no-speech, aborted, network, etc — just go back to idle
        setPhaseSync("idle");
      }
    };

    recognition.onend = () => {
      if (endedRef.current) return;
      // If still recording and no result came, go back to idle
      if (phaseRef.current === "recording") setPhaseSync("idle");
    };

    try { recognition.start(); } catch { setPhaseSync("idle"); }
  };

  const stopRecording = () => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
  };

  const endCall = () => {
    endedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
    window.speechSynthesis.cancel();
    onClose?.();
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  if (!supported) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <div className="bg-[#1a1a2e] rounded-3xl w-full max-w-sm mx-4 p-8 text-center">
          <p className="text-white font-bold mb-2">Micrófono no disponible</p>
          <p className="text-gray-400 text-sm mb-6">Necesitás Chrome en Android o Safari en iPhone.</p>
          <button onClick={onClose} className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      <div className="w-full max-w-xs flex flex-col items-center gap-10 px-6">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className={`relative w-28 h-28 rounded-full border-4 transition-all duration-500 overflow-hidden ${
            phase === "speaking" ? "border-emerald-400 shadow-[0_0_30px_8px_rgba(52,211,153,0.25)]" :
            phase === "recording" ? "border-red-400 shadow-[0_0_20px_4px_rgba(248,113,113,0.25)]" :
            phase === "processing" ? "border-primary/60" : "border-gray-700"
          }`}>
            <div className="w-full h-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
              <span className="text-black font-black text-4xl">P</span>
            </div>
            {phase === "speaking" && (
              <div className="absolute -inset-2 rounded-full border-2 border-emerald-400/30 animate-ping" />
            )}
            {phase === "recording" && (
              <div className="absolute -inset-2 rounded-full border-2 border-red-400/30 animate-pulse" />
            )}
          </div>

          <p className="text-white font-bold text-lg">Pablo</p>
          <p className="text-gray-400 text-sm min-h-[20px] text-center">
            {phase === "idle" && "Toca el mic para hablar"}
            {phase === "recording" && "Escuchando... toca para enviar"}
            {phase === "processing" && "Pensando..."}
            {phase === "speaking" && "Respondiendo..."}
          </p>
        </div>

        {/* Timer */}
        <p className="text-gray-600 text-sm font-mono -mt-4">{formatDuration(callDuration)}</p>

        {/* Processing dots */}
        {phase === "processing" && (
          <div className="flex gap-1.5 -mt-4">
            {[0, 150, 300].map(d => (
              <div key={d} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        )}

        {/* Mic button + hang up */}
        <div className="flex items-center gap-8">
          {/* Hang up */}
          <button
            onPointerDown={endCall}
            className="w-14 h-14 bg-red-500 hover:bg-red-400 active:scale-90 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 transition-all"
            aria-label="Colgar"
          >
            <PhoneOff className="h-6 w-6 text-white" />
          </button>

          {/* Mic — hold or tap to record, tap again to send */}
          {phase === "idle" || phase === "speaking" ? (
            <button
              onPointerDown={startRecording}
              className="w-20 h-20 bg-primary hover:bg-primary/80 active:scale-90 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 transition-all"
              aria-label="Hablar"
            >
              <Mic className="h-9 w-9 text-black" />
            </button>
          ) : phase === "recording" ? (
            <button
              onPointerDown={stopRecording}
              className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 transition-all animate-pulse"
              aria-label="Enviar"
            >
              <MicOff className="h-9 w-9 text-white" />
            </button>
          ) : (
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}
        </div>

        <p className="text-gray-700 text-xs text-center">
          {phase === "idle" ? "Toca el mic → hablá → toca para enviar" : ""}
        </p>

      </div>
    </div>
  );
}
