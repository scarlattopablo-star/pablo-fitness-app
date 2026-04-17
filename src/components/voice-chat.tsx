"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PhoneOff, Loader2 } from "lucide-react";

// Web Speech API types (not always in TS lib)
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
  onresult: ((e: { results: { [i: number]: { [i: number]: { transcript: string } }; length: number } }) => void) | null;
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

type CallState = "connecting" | "listening" | "processing" | "speaking" | "ended";

export default function VoiceChat({ onClose }: VoiceChatProps) {
  const [callState, setCallState] = useState<CallState>("connecting");
  const [supported, setSupported] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // endedRef is mutable — blocks ALL restarts immediately when hangup is pressed
  const endedRef = useRef(false);

  // Forward-declare so callbacks can reference each other
  const startListeningRef = useRef<() => void>(() => {});
  const sendMessageRef = useRef<(text: string) => Promise<void>>(async () => {});
  const speakRef = useRef<(text: string, onDone?: () => void) => void>(() => {});

  const getBestSpanishVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    return (
      voices.find(v => v.lang === "es-UY") ||
      voices.find(v => v.lang === "es-AR") ||
      voices.find(v => v.lang.startsWith("es") && /male|jorge|diego|pablo|miguel/i.test(v.name)) ||
      voices.find(v => v.lang.startsWith("es")) ||
      null
    );
  };

  const endCall = useCallback(() => {
    endedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
    window.speechSynthesis.cancel();
    setCallState("ended");
    setTimeout(() => onClose?.(), 600);
  }, [onClose]);

  useEffect(() => {
    // Wire up speak
    speakRef.current = (text: string, onDone?: () => void) => {
      if (endedRef.current) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-UY";
      utterance.rate = 1.05;
      utterance.pitch = 0.9;
      const voice = getBestSpanishVoice();
      if (voice) utterance.voice = voice;

      utterance.onstart = () => { if (!endedRef.current) setCallState("speaking"); };
      utterance.onend = () => {
        if (endedRef.current) return;
        setCallState("listening");
        onDone?.();
      };
      utterance.onerror = () => {
        if (endedRef.current) return;
        setCallState("listening");
        onDone?.();
      };

      // Chrome bug: synthesis cuts out after ~15s
      const keepAlive = setInterval(() => {
        if (endedRef.current) { clearInterval(keepAlive); return; }
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          clearInterval(keepAlive);
        }
      }, 10000);

      window.speechSynthesis.speak(utterance);
    };

    // Wire up sendMessage
    sendMessageRef.current = async (text: string) => {
      if (endedRef.current) return;
      setCallState("processing");
      try {
        const res = await fetch("/api/voice-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        if (endedRef.current) return;
        const data = await res.json() as { response?: string; error?: string };
        if (!res.ok || !data.response) {
          speakRef.current("Perdón, no te escuché bien. Repetí.", () => startListeningRef.current());
          return;
        }
        speakRef.current(data.response, () => startListeningRef.current());
      } catch {
        if (!endedRef.current) speakRef.current("Problema de conexión.", () => startListeningRef.current());
      }
    };

    // Wire up startListening
    startListeningRef.current = () => {
      if (endedRef.current) return;
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return;

      const recognition = new SR();
      recognitionRef.current = recognition;
      recognition.lang = "es-UY";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => { if (!endedRef.current) setCallState("listening"); };

      recognition.onresult = (event) => {
        if (endedRef.current) return;
        const text = event.results[0]?.[0]?.transcript?.trim();
        if (text) sendMessageRef.current(text);
      };

      recognition.onerror = (event) => {
        if (endedRef.current) return; // aborted by hangup — do nothing
        if (event.error === "no-speech") {
          setTimeout(() => startListeningRef.current(), 500);
        } else if (event.error === "not-allowed") {
          endedRef.current = true;
          setCallState("ended");
          setTimeout(() => onClose?.(), 600);
        }
        // "aborted" and others: ignore
      };

      recognition.onend = () => {
        // auto-stop — no action needed, onerror/onresult handle the loop
      };

      try { recognition.start(); } catch { /* already started */ }
    };
  }, [onClose]);

  useEffect(() => {
    // Load voices eagerly (async in most browsers)
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    // Short "connecting" delay then start
    const t = setTimeout(() => {
      if (endedRef.current) return;
      setCallState("listening");
      startListeningRef.current();
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    }, 1200);

    return () => {
      clearTimeout(t);
      endedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
      window.speechSynthesis.cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  if (!supported) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-end sm:items-center justify-center">
        <div className="bg-[#1a1a2e] rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-8 text-center">
          <p className="text-white font-bold mb-2">Micrófono no disponible</p>
          <p className="text-gray-400 text-sm mb-6">Necesitás Chrome en Android o Safari en iPhone.</p>
          <button onClick={onClose} className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      <div className="w-full max-w-xs flex flex-col items-center gap-8 px-6">

        {/* Avatar with pulse rings */}
        <div className="flex flex-col items-center gap-3">
          <div className={`relative w-28 h-28 rounded-full overflow-hidden border-4 transition-all duration-500 ${
            callState === "speaking"
              ? "border-emerald-400 shadow-[0_0_30px_8px_rgba(52,211,153,0.3)]"
              : callState === "listening"
              ? "border-primary shadow-[0_0_20px_4px_rgba(200,255,0,0.2)]"
              : "border-gray-600"
          }`}>
            <div className="w-full h-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
              <span className="text-black font-black text-4xl">P</span>
            </div>
            {callState === "speaking" && (
              <>
                <div className="absolute -inset-2 rounded-full border-2 border-emerald-400/40 animate-ping" />
                <div className="absolute -inset-5 rounded-full border border-emerald-400/20 animate-pulse" />
              </>
            )}
            {callState === "listening" && (
              <div className="absolute -inset-2 rounded-full border-2 border-primary/40 animate-pulse" />
            )}
          </div>

          <div className="text-center">
            <p className="text-white font-bold text-lg">Pablo</p>
            <p className="text-gray-400 text-sm">
              {callState === "connecting" && "Conectando..."}
              {callState === "listening" && "Escuchando..."}
              {callState === "processing" && "Pensando..."}
              {callState === "speaking" && "Hablando..."}
              {callState === "ended" && "Llamada finalizada"}
            </p>
          </div>
        </div>

        {/* Timer */}
        {callState !== "connecting" && callState !== "ended" && (
          <p className="text-gray-500 text-sm font-mono">{formatDuration(callDuration)}</p>
        )}

        {/* State indicators */}
        {callState === "connecting" && <Loader2 className="h-6 w-6 text-primary animate-spin" />}

        {callState === "processing" && (
          <div className="flex gap-1.5 items-center">
            {[0, 150, 300].map(delay => (
              <div key={delay} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${delay}ms` }} />
            ))}
          </div>
        )}

        {callState === "listening" && (
          <div className="flex items-center gap-2 text-primary text-sm animate-pulse">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>Hablá ahora</span>
          </div>
        )}

        {/* Hang up button */}
        <button
          onClick={endCall}
          className="w-16 h-16 bg-red-500 hover:bg-red-400 active:scale-95 rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 transition-all mt-4"
          aria-label="Colgar"
        >
          <PhoneOff className="h-7 w-7 text-white" />
        </button>
      </div>
    </div>
  );
}
