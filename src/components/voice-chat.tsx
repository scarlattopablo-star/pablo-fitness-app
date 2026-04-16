"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, X, Phone, Volume2 } from "lucide-react";

interface VoiceChatProps {
  onClose?: () => void;
}

export default function VoiceChat({ onClose }: VoiceChatProps) {
  const [state, setState] = useState<"idle" | "recording" | "processing" | "playing">("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError("");
      setTranscript("");
      setResponse("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await sendAudio(blob);
      };

      mediaRecorder.start();
      setState("recording");
    } catch {
      setError("No se pudo acceder al microfono. Verifica los permisos.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setState("processing");
    }
  }, []);

  const sendAudio = async (blob: Blob) => {
    setState("processing");
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const res = await fetch("/api/voice-chat", { method: "POST", body: formData });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Error procesando audio");
        setState("idle");
        return;
      }

      // Get text from headers
      const userText = decodeURIComponent(res.headers.get("X-Transcript") || "");
      const botText = decodeURIComponent(res.headers.get("X-Response-Text") || "");
      setTranscript(userText);
      setResponse(botText);

      // Play audio response
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setState("playing");
      audio.onended = () => {
        setState("idle");
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setState("idle");
        setError("Error reproduciendo audio");
      };

      await audio.play();
    } catch {
      setError("Error de conexion");
      setState("idle");
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setState("idle");
  };

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
          {/* Animated mic circle */}
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

            {/* Recording pulse rings */}
            {state === "recording" && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" />
                <div className="absolute -inset-4 rounded-full border border-red-500/20 animate-pulse" />
              </>
            )}
          </div>

          {/* Status text */}
          <p className="text-sm font-medium text-center mb-2">
            {state === "idle" && "Toca el boton para hablar"}
            {state === "recording" && "Escuchando... Toca para enviar"}
            {state === "processing" && "Pablo esta pensando..."}
            {state === "playing" && "Pablo esta respondiendo..."}
          </p>

          {/* Transcript */}
          {transcript && (
            <div className="w-full mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-[10px] text-primary font-bold mb-1">VOS:</p>
              <p className="text-xs text-muted">{transcript}</p>
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="w-full mt-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-[10px] text-emerald-400 font-bold mb-1">PABLO:</p>
              <p className="text-xs text-muted">{response}</p>
            </div>
          )}

          {/* Error */}
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
              <Mic className="h-6 w-6" /> Mantene para hablar
            </button>
          )}
          {state === "recording" && (
            <button
              onClick={stopRecording}
              className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-lg animate-pulse"
            >
              <MicOff className="h-6 w-6" /> Soltar para enviar
            </button>
          )}
          {state === "processing" && (
            <div className="w-full bg-card-border/30 text-muted font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-lg">
              <Loader2 className="h-6 w-6 animate-spin" /> Procesando...
            </div>
          )}
          {state === "playing" && (
            <button
              onClick={stopAudio}
              className="w-full bg-emerald-500/20 text-emerald-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-lg"
            >
              <Volume2 className="h-6 w-6" /> Reproduciendo...
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
