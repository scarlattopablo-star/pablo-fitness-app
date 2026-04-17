"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2, X, Phone, Volume2 } from "lucide-react";

// Web Speech API types (not always in TS lib)
type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
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

export default function VoiceChat({ onClose }: VoiceChatProps) {
  const [state, setState] = useState<"idle" | "recording" | "processing" | "playing">("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-UY";
    utterance.rate = 1.05;
    utterance.pitch = 0.9;

    // Pick a Spanish male voice if available
    const voices = window.speechSynthesis.getVoices();
    const spanish = voices.find(v => v.lang.startsWith("es") && v.name.toLowerCase().includes("male"))
      || voices.find(v => v.lang.startsWith("es"));
    if (spanish) utterance.voice = spanish;

    utterance.onstart = () => setState("playing");
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");
    window.speechSynthesis.speak(utterance);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    setState("processing");
    setTranscript(text);
    try {
      const res = await fetch("/api/voice-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json() as { response?: string; error?: string };
      if (!res.ok || !data.response) {
        setError(data.error || "Error al procesar tu mensaje");
        setState("idle");
        return;
      }
      setResponse(data.response);
      speak(data.response);
    } catch {
      setError("Error de conexión");
      setState("idle");
    }
  }, [speak]);

  const startRecording = useCallback(() => {
    setError("");
    setTranscript("");
    setResponse("");

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("Tu navegador no soporta reconocimiento de voz. Usá Chrome.");
      return;
    }

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "es-UY";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setState("recording");

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      sendMessage(text);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        setError("No se escuchó nada. Intentá de nuevo.");
      } else if (event.error === "not-allowed") {
        setError("Permiso de micrófono denegado. Habilitalo en el navegador.");
      } else {
        setError("Error al escuchar. Intentá de nuevo.");
      }
      setState("idle");
    };

    recognition.onend = () => {
      if (state === "recording") setState("idle");
    };

    recognition.start();
  }, [sendMessage, state]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setState("idle");
  };

  if (!supported) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
        <div className="bg-card-bg rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Hablar con Pablo</h3>
            {onClose && <button onClick={onClose}><X className="h-5 w-5 text-muted" /></button>}
          </div>
          <p className="text-sm text-muted text-center py-6">
            Tu navegador no soporta reconocimiento de voz.<br />
            Usá Chrome en Android o Safari en iPhone.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-card-bg rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <Phone className="h-5 w-5 text-black" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Hablar con Pablo</h3>
              <p className="text-[10px] text-muted">Asistente de voz IA</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-muted hover:text-white">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Visual feedback */}
        <div className="flex flex-col items-center py-8">
          <div className={`relative mb-6 ${state === "recording" ? "animate-pulse" : ""}`}>
            <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${
              state === "recording"
                ? "bg-red-500/20 ring-4 ring-red-500/40"
                : state === "processing"
                ? "bg-primary/20 ring-4 ring-primary/30"
                : state === "playing"
                ? "bg-emerald-500/20 ring-4 ring-emerald-500/30"
                : "bg-card-border/30"
            }`}>
              {state === "recording" && <Mic className="h-12 w-12 text-red-400" />}
              {state === "processing" && <Loader2 className="h-12 w-12 text-primary animate-spin" />}
              {state === "playing" && <Volume2 className="h-12 w-12 text-emerald-400" />}
              {state === "idle" && <Mic className="h-12 w-12 text-muted" />}
            </div>
            {state === "recording" && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" />
                <div className="absolute -inset-4 rounded-full border border-red-500/20 animate-pulse" />
              </>
            )}
          </div>

          <p className="text-sm font-medium text-center mb-2">
            {state === "idle" && "Toca el botón y hablá"}
            {state === "recording" && "Escuchando... Toca para enviar"}
            {state === "processing" && "Pablo está pensando..."}
            {state === "playing" && "Pablo está respondiendo..."}
          </p>

          {transcript && (
            <div className="w-full mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-[10px] text-primary font-bold mb-1">VOS:</p>
              <p className="text-xs text-muted">{transcript}</p>
            </div>
          )}
          {response && (
            <div className="w-full mt-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-[10px] text-emerald-400 font-bold mb-1">PABLO:</p>
              <p className="text-xs text-muted">{response}</p>
            </div>
          )}
          {error && (
            <p className="text-xs text-red-400 mt-3 text-center">{error}</p>
          )}
        </div>

        {/* Action button */}
        <div className="flex justify-center">
          {state === "idle" && (
            <button
              onClick={startRecording}
              className="w-full gradient-primary text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-lg"
            >
              <Mic className="h-6 w-6" /> Toca para hablar
            </button>
          )}
          {state === "recording" && (
            <button
              onClick={stopRecording}
              className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-lg animate-pulse"
            >
              <MicOff className="h-6 w-6" /> Listo, enviá
            </button>
          )}
          {state === "processing" && (
            <div className="w-full bg-card-border/30 text-muted font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-lg">
              <Loader2 className="h-6 w-6 animate-spin" /> Procesando...
            </div>
          )}
          {state === "playing" && (
            <button
              onClick={stopSpeaking}
              className="w-full bg-emerald-500/20 text-emerald-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-lg"
            >
              <Volume2 className="h-6 w-6" /> Reproduciendo... (toca para parar)
            </button>
          )}
        </div>

        <p className="text-[10px] text-muted text-center mt-4">
          Asistente IA — responde como Pablo 24/7
        </p>
      </div>
    </div>
  );
}
