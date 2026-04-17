"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PhoneOff, Phone } from "lucide-react";

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

interface Message { role: "user" | "assistant"; content: string; }
interface VoiceChatProps { onClose?: () => void; }
type Phase = "ringing" | "greeting" | "listening" | "processing" | "speaking";

const GREETING = "Hola! Cómo estás? En qué te puedo ayudar?";

export default function VoiceChat({ onClose }: VoiceChatProps) {
  const [phase, setPhase] = useState<Phase>("ringing");
  const [callDuration, setCallDuration] = useState(0);
  const [supported, setSupported] = useState(true);

  const endedRef   = useRef(false);
  const phaseRef   = useRef<Phase>("ringing");
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const historyRef = useRef<Message[]>([]); // conversation history

  const setPhaseSync = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    return () => {
      endedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
      window.speechSynthesis.cancel();
    };
  }, []);

  const getBestVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(v => v.lang === "es-UY") ||
      voices.find(v => v.lang === "es-AR") ||
      voices.find(v => v.lang.startsWith("es") && /male|jorge|diego|pablo|miguel/i.test(v.name)) ||
      voices.find(v => v.lang.startsWith("es")) ||
      null
    );
  };

  const startListeningRef = useRef<() => void>(() => {});

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (endedRef.current) return;
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-UY";
    u.rate = 1.05;
    u.pitch = 0.9;
    const voice = getBestVoice();
    if (voice) u.voice = voice;

    setPhaseSync("speaking");

    u.onend = () => { if (!endedRef.current) onDone?.(); };
    u.onerror = () => { if (!endedRef.current) onDone?.(); };

    // Chrome cuts off after ~15s without this keepalive
    const keepAlive = setInterval(() => {
      if (endedRef.current || !window.speechSynthesis.speaking) { clearInterval(keepAlive); return; }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);

    window.speechSynthesis.speak(u);
  }, []);

  const sendMessage = useCallback(async (userText: string) => {
    if (endedRef.current) return;
    setPhaseSync("processing");

    // Add user message to history
    historyRef.current = [...historyRef.current, { role: "user", content: userText }];

    try {
      const res = await fetch("/api/voice-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: historyRef.current.slice(0, -1), // history without the last user msg
        }),
      });
      if (endedRef.current) return;
      const data = await res.json() as { response?: string };
      const reply = data.response || "Perdón, no te entendí.";

      // Add assistant reply to history
      historyRef.current = [...historyRef.current, { role: "assistant", content: reply }];

      speak(reply, () => startListeningRef.current());
    } catch {
      if (!endedRef.current) speak("Problema de conexión.", () => startListeningRef.current());
    }
  }, [speak]);

  useEffect(() => {
    startListeningRef.current = () => {
      if (endedRef.current) return;
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return;

      try { recognitionRef.current?.abort(); } catch { /* ignore */ }

      const recognition = new SR();
      recognitionRef.current = recognition;
      recognition.lang = "es-UY";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => { if (!endedRef.current) setPhaseSync("listening"); };

      recognition.onresult = (event) => {
        if (endedRef.current) return;
        const text = event.results[0]?.[0]?.transcript?.trim();
        if (text) {
          sendMessage(text);
        } else {
          setTimeout(() => { if (!endedRef.current) startListeningRef.current(); }, 200);
        }
      };

      recognition.onerror = (event) => {
        if (endedRef.current || event.error === "aborted") return;
        if (event.error === "not-allowed") { endCall(); return; }
        // no-speech, network, etc — restart
        setTimeout(() => {
          if (!endedRef.current && phaseRef.current === "listening") startListeningRef.current();
        }, 300);
      };

      recognition.onend = () => {
        if (endedRef.current) return;
        // If no result came, restart listening
        if (phaseRef.current === "listening") {
          setTimeout(() => {
            if (!endedRef.current && phaseRef.current === "listening") startListeningRef.current();
          }, 200);
        }
      };

      try { recognition.start(); } catch { /* already running */ }
    };
  }, [sendMessage]);

  const endCall = useCallback(() => {
    endedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
    window.speechSynthesis.cancel();
    onClose?.();
  }, [onClose]);

  // MUST be called from a direct user tap so iOS unlocks audio
  const answerCall = () => {
    if (endedRef.current) return;
    setPhaseSync("greeting");
    timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);

    // Unlock iOS audio: queue silent utterance + greeting in same click handler
    const unlock = new SpeechSynthesisUtterance(" ");
    unlock.volume = 0.001;
    unlock.rate = 10;
    window.speechSynthesis.speak(unlock);

    const greet = new SpeechSynthesisUtterance(GREETING);
    greet.lang = "es-UY";
    greet.rate = 1.05;
    greet.pitch = 0.9;
    const voice = getBestVoice();
    if (voice) greet.voice = voice;

    // Add greeting to history so the model has context
    historyRef.current = [{ role: "assistant", content: GREETING }];

    greet.onend = () => { if (!endedRef.current) startListeningRef.current(); };
    greet.onerror = () => { if (!endedRef.current) startListeningRef.current(); };

    window.speechSynthesis.speak(greet);
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
      <div className="w-full max-w-xs flex flex-col items-center gap-8 px-6">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className={`relative w-32 h-32 rounded-full border-4 overflow-hidden transition-all duration-500 ${
            phase === "speaking"  ? "border-emerald-400 shadow-[0_0_40px_10px_rgba(52,211,153,0.2)]" :
            phase === "listening" ? "border-primary shadow-[0_0_25px_6px_rgba(200,255,0,0.15)]" :
            phase === "ringing"   ? "border-primary/60" :
            "border-gray-700"
          }`}>
            <div className="w-full h-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
              <span className="text-black font-black text-5xl">P</span>
            </div>
            {phase === "speaking" && (
              <div className="absolute -inset-3 rounded-full border-2 border-emerald-400/25 animate-ping pointer-events-none" />
            )}
            {phase === "listening" && (
              <>
                <div className="absolute -inset-2 rounded-full border border-primary/25 animate-ping pointer-events-none" />
                <div className="absolute -inset-5 rounded-full border border-primary/10 animate-pulse pointer-events-none" />
              </>
            )}
            {phase === "ringing" && (
              <div className="absolute -inset-3 rounded-full border-2 border-primary/30 animate-pulse pointer-events-none" />
            )}
          </div>

          <div className="text-center">
            <p className="text-white font-bold text-xl">Pablo</p>
            <p className="text-gray-400 text-sm">
              {phase === "ringing"    && "Llamada entrante..."}
              {phase === "greeting"   && "Hablando..."}
              {phase === "listening"  && "Escuchando..."}
              {phase === "processing" && "Pensando..."}
              {phase === "speaking"   && "Respondiendo..."}
            </p>
          </div>
        </div>

        {/* Timer */}
        {phase !== "ringing" && (
          <p className="text-gray-600 text-sm font-mono">{formatDuration(callDuration)}</p>
        )}

        {/* Processing dots */}
        {phase === "processing" && (
          <div className="flex gap-2">
            {[0, 160, 320].map(d => (
              <div key={d} className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        )}

        {/* Listening wave bars */}
        {phase === "listening" && (
          <div className="flex gap-1 items-end h-8">
            {[0.6, 1.0, 0.7, 1.0, 0.5].map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-primary"
                style={{
                  height: `${h * 28}px`,
                  animation: `pulse ${0.5 + i * 0.08}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 90}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Buttons */}
        {phase === "ringing" ? (
          <div className="flex items-end gap-16 mt-2">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={endCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-400 active:scale-90 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 transition-all"
              >
                <PhoneOff className="h-6 w-6 text-white" />
              </button>
              <span className="text-gray-500 text-xs">Rechazar</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={answerCall}
                className="w-16 h-16 bg-emerald-500 hover:bg-emerald-400 active:scale-90 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all animate-bounce"
              >
                <Phone className="h-6 w-6 text-white" />
              </button>
              <span className="text-gray-400 text-xs font-medium">Contestar</span>
            </div>
          </div>
        ) : (
          <button
            onClick={endCall}
            className="w-16 h-16 bg-red-500 hover:bg-red-400 active:scale-90 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 transition-all mt-2"
            aria-label="Colgar"
          >
            <PhoneOff className="h-7 w-7 text-white" />
          </button>
        )}

        {phase === "ringing" && (
          <p className="text-gray-700 text-xs">Asistente IA · Pablo Scarlatto</p>
        )}
      </div>
    </div>
  );
}
